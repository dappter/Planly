from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
import google.api_core.exceptions

app = Flask(__name__)
CORS(app)

load_dotenv()  # Carrega o arquivo .env

api_key = os.getenv("API_KEY")

if not api_key:
    raise Exception("A variável de ambiente API_KEY não está definida!")

# Configure sua API Key diretamente, sem sobrescrever os.environ
genai.configure(api_key=api_key)

modelo = genai.GenerativeModel("gemini-2.0-flash")

@app.route('/gerar', methods=['POST'])
def gerar_plano():
    data = request.json
    rotina = data.get("rotina", "")
    interesse = data.get("interesse", "")

    if not rotina.strip() or not interesse.strip():
        return jsonify({"erro": "Dados incompletos"}), 400

    prompt = f"""
    Crie um plano de estudos personalizado com base na seguinte rotina:
    {rotina}

    O usuário deseja estudar: {interesse}

    Distribua o conteúdo ao longo da semana, respeite os horários livres, inclua pausas, revisão e estratégias de aprendizado.
    """

    try:
        resposta = modelo.generate_content(prompt)
        return jsonify({"resultado": resposta.text})
    except google.api_core.exceptions.GoogleAPIError as e:
        print("Erro na API Gemini:", e)
        return jsonify({"erro": "Erro na API Gemini. Tente novamente mais tarde."}), 500
    except Exception as e:
        print("Erro interno:", e)
        return jsonify({"erro": "Erro interno no servidor."}), 500
    
@app.route('/analisar', methods=['POST'])
def analisar_rotina():
    data = request.json
    rotina = data.get("rotina", "")
    interesse = data.get("interesse", "")

    if not rotina.strip() or not interesse.strip():
        return jsonify({"erro": "Dados incompletos"}), 400

    prompt = f"""
    Analise a seguinte rotina de estudos:
    {rotina}

    O usuário deseja estudar: {interesse}

    Avalie se a rotina é equilibrada, se há tempo suficiente para descanso,
    e sugira melhorias baseadas em boas práticas de produtividade e aprendizado.
    """

    try:
        resposta = modelo.generate_content(prompt)
        return jsonify({"resultado": resposta.text})
    except google.api_core.exceptions.GoogleAPIError as e:
        print("Erro na API Gemini:", e)
        return jsonify({"erro": "Erro na API Gemini. Tente novamente mais tarde."}), 500
    except Exception as e:
        print("Erro interno:", e)
        return jsonify({"erro": "Erro interno no servidor."}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)