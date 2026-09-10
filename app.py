from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
import re
from concurrent.futures import ThreadPoolExecutor
from google import genai
from google.genai import types

# Configuração
app = Flask(__name__, static_folder='docs')
app.config['MAX_CONTENT_LENGTH'] = 15 * 1024 * 1024  # 15MB
CORS(app, resources={r"/*": {"origins": [
    "https://dappter.github.io",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://planly-api.onrender.com",
    r"https://.*\.onrender\.com",
]}})


@app.errorhandler(413)
def arquivo_muito_grande(e):
    return jsonify({"erro": "Arquivo muito grande. O limite é 15MB."}), 413

load_dotenv()
api_key = os.getenv("API_KEY")

if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None
    print("⚠️  API_KEY não configurada - funcionalidades de IA desabilitadas")


# ===== ROTAS PRINCIPAIS =====

@app.route('/')
def index():
    return send_from_directory('docs', 'index.html')


@app.route('/assets/js/firebase-config.js')
def serve_firebase_config():
    firebase_key = os.getenv("FIREBASE_API_KEY")
    file_path = os.path.join('docs', 'assets', 'js', 'firebase-config.js')
    if firebase_key and os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace('__FIREBASE_API_KEY__', firebase_key)
        return app.response_class(content, mimetype='application/javascript')
    return send_from_directory('docs', 'assets/js/firebase-config.js')


@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('docs', filename)


# ===== ROTAS GEMINI AI =====

@app.route('/gerar', methods=['POST'])
def gerar_plano():
    if not client:
        return jsonify({"erro": "API Gemini não configurada"}), 500
        
    data = request.json
    rotina = data.get("rotina", "")
    interesse = data.get("interesse", "")

    if not rotina.strip() or not interesse.strip():
        return jsonify({"erro": "Dados incompletos"}), 400

    prompt = f"""
    Crie um plano de estudos CONCISO e DIRETO para: {interesse}
    
    Rotina disponível: {rotina}
    
    FORMATO OBRIGATÓRIO:
    📅 Segunda a Sexta
    [Horário] - [Atividade específica]
    
    📅 Fim de Semana
    [Horário] - [Atividade específica]
    
    ⚡ Dicas Rápidas
    - [Dica 1]
    - [Dica 2]
    - [Dica 3]
    
    REGRAS:
    - Máximo 5 linhas por seção
    - Seja objetivo e prático
    - Use emojis para facilitar leitura
    - Sem textos longos ou explicações desnecessárias
    - NÃO USE MARKDOWN (sem **, ##, __, *, `, etc)
    - Texto simples apenas
    """

    # As duas chamadas à IA usam apenas os mesmos rotina/interesse (não dependem
    # uma da outra), então rodam em paralelo em vez de dobrar a latência do request.
    with ThreadPoolExecutor(max_workers=2) as executor:
        plano_future = executor.submit(
            client.models.generate_content,
            model='gemini-2.5-flash',
            contents=prompt,
        )
        sugestoes_future = executor.submit(gerar_sugestoes_tarefas, rotina, interesse)

        try:
            resposta = plano_future.result()
        except Exception as e:
            return jsonify({"erro": f"Erro na API Gemini: {str(e)}"}), 500

        tarefas_sugeridas = sugestoes_future.result()

    return jsonify({"resultado": resposta.text, "tarefas_sugeridas": tarefas_sugeridas})


PRIORIDADES_VALIDAS = {"baixa", "media", "alta"}
HORARIO_REGEX = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def sanitizar_sugestoes(sugestoes):
    """Reduz cada sugestão da IA a um formato seguro e previsível antes de
    devolver ao cliente — a IA não é uma fonte confiável de tipos/valores,
    então cada campo é validado ou recebe um valor padrão."""
    if not isinstance(sugestoes, list):
        return []

    sanitizadas = []
    for item in sugestoes:
        if not isinstance(item, dict):
            continue

        title = str(item.get("title", "")).strip()[:120]
        if not title:
            continue

        if item.get("type") == "habito":
            goal_minutes = item.get("goalMinutes")
            if not isinstance(goal_minutes, (int, float)) or not (5 <= goal_minutes <= 480):
                goal_minutes = 30

            ideal_time = item.get("idealTime")
            if not isinstance(ideal_time, str) or not HORARIO_REGEX.match(ideal_time):
                ideal_time = "09:00"

            sanitizadas.append({
                "type": "habito",
                "title": title,
                "goalMinutes": int(goal_minutes),
                "idealTime": ideal_time,
            })
        else:
            priority = item.get("priority")
            if priority not in PRIORIDADES_VALIDAS:
                priority = "media"

            sanitizadas.append({
                "type": "tarefa",
                "title": title,
                "priority": priority,
                "deadline": "",
            })

    return sanitizadas


def gerar_sugestoes_tarefas(rotina, interesse):
    """Pede à IA uma lista de tarefas/hábitos sugeridos a partir da rotina/interesse.
    Nunca lança exceção: retorna [] se a IA falhar ou responder algo inválido."""
    prompt = f"""
    Com base neste plano de estudos para "{interesse}" (rotina disponível: {rotina}),
    gere de 3 a 6 sugestões de tarefas e hábitos concretos para o usuário adicionar
    ao seu gerenciador de tarefas.

    Responda APENAS com um JSON válido (sem markdown, sem texto extra), no formato:
    [
      {{"type": "tarefa", "title": "...", "priority": "baixa|media|alta", "deadline": ""}},
      {{"type": "habito", "title": "...", "goalMinutes": 30, "idealTime": "08:00"}}
    ]

    Regras:
    - "type" é sempre "tarefa" ou "habito"
    - "priority" só aparece em tarefas (baixa, media ou alta)
    - "goalMinutes" e "idealTime" só aparecem em hábitos
    - "title" deve ser curto e específico (ex: "Revisar capítulo 3 de {interesse}")
    - Não inclua nenhum texto fora do array JSON
    """
    try:
        resposta = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        return sanitizar_sugestoes(json.loads(resposta.text))
    except Exception:
        return []


@app.route('/analisar', methods=['POST'])
def analisar_rotina():
    if not client:
        return jsonify({"erro": "API Gemini não configurada"}), 500
        
    data = request.json
    rotina = data.get("rotina", "")
    interesse = data.get("interesse", "")

    if not rotina.strip() or not interesse.strip():
        return jsonify({"erro": "Dados incompletos"}), 400

    prompt = f"""
    Analise esta rotina de forma CONCISA para estudar: {interesse}
    
    Rotina atual: {rotina}
    
    FORMATO OBRIGATÓRIO:
    ✅ Pontos Fortes
    - [Ponto 1]
    - [Ponto 2]
    
    ⚠️ Pontos de Atenção
    - [Ponto 1]
    - [Ponto 2]
    
    💡 Sugestões Práticas
    - [Sugestão 1]
    - [Sugestão 2]
    - [Sugestão 3]
    
    REGRAS:
    - Máximo 3 itens por seção
    - Seja direto e objetivo
    - Use emojis
    - Sem textos longos
    - NÃO USE MARKDOWN (sem **, ##, __, *, `, etc)
    - Texto simples apenas
    """

    try:
        resposta = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return jsonify({"resultado": resposta.text})
    except Exception as e:
        return jsonify({"erro": f"Erro na API Gemini: {str(e)}"}), 500


MATERIAL_MAX_BYTES = 15 * 1024 * 1024  # 15MB


@app.route('/analisar-material', methods=['POST'])
def analisar_material():
    if not client:
        return jsonify({"erro": "API Gemini não configurada"}), 500

    arquivo = request.files.get('arquivo')
    if not arquivo or not arquivo.filename:
        return jsonify({"erro": "Nenhum arquivo enviado"}), 400

    if not arquivo.filename.lower().endswith('.pdf'):
        return jsonify({"erro": "Apenas arquivos PDF são aceitos"}), 400

    pdf_bytes = arquivo.read()
    if not pdf_bytes:
        return jsonify({"erro": "Arquivo vazio ou inválido"}), 400
    if len(pdf_bytes) > MATERIAL_MAX_BYTES:
        return jsonify({"erro": "Arquivo muito grande. O limite é 15MB."}), 400

    contexto = request.form.get("contexto", "").strip()

    prompt = f"""
    Analise o conteúdo do PDF em anexo (material de aula/estudo{f' sobre {contexto}' if contexto else ''})
    e gere um material de estudo completo baseado estritamente nesse conteúdo.

    Responda APENAS com um JSON válido (sem markdown, sem texto fora do JSON), no formato:
    {{
      "resumo_plano": "resumo organizado do conteúdo e um plano de estudo sugerido, em texto simples com quebras de linha",
      "questoes": [
        {{"pergunta": "...", "alternativas": ["...", "...", "...", "..."], "resposta_correta": 0, "explicacao": "..."}}
      ],
      "flashcards": [
        {{"frente": "...", "verso": "..."}}
      ],
      "tarefas_sugeridas": [
        {{"type": "tarefa", "title": "Revisar ...", "priority": "media", "deadline": ""}},
        {{"type": "habito", "title": "Revisar flashcards de ...", "goalMinutes": 20, "idealTime": "19:00"}}
      ]
    }}

    Regras:
    - Gere entre 5 e 10 questões de múltipla escolha (4 alternativas cada); "resposta_correta" é o índice (0 a 3) da alternativa certa.
    - Gere entre 8 e 15 flashcards com os conceitos mais importantes.
    - Gere de 3 a 6 tarefas/hábitos de revisão, seguindo as mesmas regras de "type" usadas no plano de estudos (tarefa tem priority; habito tem goalMinutes e idealTime).
    - Não inclua nenhum texto fora do objeto JSON.
    """

    try:
        resposta = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=pdf_bytes, mime_type='application/pdf'),
                prompt,
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        resultado = json.loads(resposta.text)
    except json.JSONDecodeError:
        return jsonify({"erro": "A IA retornou um formato inesperado. Tente novamente."}), 500
    except Exception as e:
        return jsonify({"erro": f"Erro na API Gemini: {str(e)}"}), 500

    if not isinstance(resultado, dict):
        return jsonify({"erro": "A IA retornou um formato inesperado. Tente novamente."}), 500

    resultado.setdefault("resumo_plano", "")
    resultado.setdefault("questoes", [])
    resultado.setdefault("flashcards", [])
    resultado["tarefas_sugeridas"] = sanitizar_sugestoes(resultado.get("tarefas_sugeridas"))

    return jsonify(resultado)


# ===== INICIALIZAÇÃO =====

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"\n🚀 Servidor Planly iniciado!")
    print(f"📍 Acesse: http://localhost:{port}")
    print(f"🔐 Autenticação: Firebase (frontend)")
    print(f"🤖 API Gemini: {'✅ Ativa' if client else '❌ Desabilitada'}\n")
    app.run(host=host, port=port, debug=False)
