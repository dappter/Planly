from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
from google import genai

# Configuração
app = Flask(__name__, static_folder='docs')
CORS(app, resources={r"/*": {"origins": [
    "https://dappter.github.io",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]}})

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

    try:
        resposta = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return jsonify({"resultado": resposta.text})
    except Exception as e:
        return jsonify({"erro": f"Erro na API Gemini: {str(e)}"}), 500


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


# ===== INICIALIZAÇÃO =====

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    print(f"\n🚀 Servidor Planly iniciado!")
    print(f"📍 Acesse: http://localhost:{port}")
    print(f"🔐 Autenticação: Firebase (frontend)")
    print(f"🤖 API Gemini: {'✅ Ativa' if client else '❌ Desabilitada'}\n")
    app.run(host="127.0.0.1", port=port, debug=False)
