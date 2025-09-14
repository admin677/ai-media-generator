import os
import requests
import base64
import time
import json
import google.generativeai as genai
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

if os.getenv("GOOGLE_API_KEY"):
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

app = Flask(__name__)

# --- CORS CONFIGURATION ---
origins = [
    "https://growthgramai.com",
    "https://growthgramai.netlify.app"
]
CORS(app, resources={r"/*": {"origins": origins}})


# --- API Configuration ---
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

PEXELS_PHOTO_SEARCH_URL = "https://api.pexels.com/v1/search"
PEXELS_VIDEO_SEARCH_URL = "https://api.pexels.com/v1/videos/search"
UPSCALE_API_URL = "https://api.stability.ai/v2beta/stable-image/upscale/conservative"


@app.route('/generate-image', methods=['POST'])
def generate_image():
    # ... (function is unchanged from Pexels implementation)
    pass


@app.route('/generate-video', methods=['POST'])
def generate_video():
    # ... (function is unchanged from Pexels implementation)
    pass


@app.route('/upscale-image', methods=['POST'])
def upscale_image():
    # ... (function is unchanged, still requires STABILITY_API_KEY)
    pass

@app.route('/generate-analysis', methods=['POST'])
def generate_analysis():
    if not os.getenv("GOOGLE_API_KEY"):
        return jsonify({'error': 'Google AI API key not found'}), 500

    json_data = request.get_json()
    topic = json_data.get('topic')
    analysis_type = json_data.get('analysis_type')
    if not topic or not analysis_type:
        return jsonify({'error': 'A topic and analysis type are required'}), 400

    print(f"Generating {analysis_type} analysis for topic: {topic}")
    
    prompt = f"""
    Generate a detailed {analysis_type} analysis for the topic: "{topic}".
    Your response must be a single, raw JSON object with no other text or markdown formatting like ```json.
    Use the following exact keys for the JSON, which must be lowercase and use underscores instead of spaces:
    - For SWOT: "strengths", "weaknesses", "opportunities", "threats"
    - For PESTLE: "political", "economic", "social", "technological", "legal", "environmental"
    - For Porters Five Forces: "threat_of_new_entrants", "bargaining_power_of_buyers", "bargaining_power_of_suppliers", "threat_of_substitute_products", "industry_rivalry"
    The value for each key must be an array of strings. Each string should be a concise bullet point.
    """

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        cleaned_json_string = response.text.strip().replace('```json', '').replace('```', '')
        
        analysis_data = json.loads(cleaned_json_string)
        return jsonify(analysis_data)
    except Exception as e:
        print(f"Error calling Google AI API or parsing JSON: {e}")
        error_message = f'Failed to generate analysis. The AI may be unable to process this topic or returned an invalid format. Please try again.'
        return jsonify({'error': error_message}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)