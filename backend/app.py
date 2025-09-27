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
# STABILITY_API_KEY has been removed.
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# --- MODIFIED: Reverted to Pexels Photo Search URL ---
PEXELS_PHOTO_SEARCH_URL = "https://api.pexels.com/v1/search"
PEXELS_VIDEO_SEARCH_URL = "https://api.pexels.com/v1/videos/search"


# --- MODIFIED: This endpoint now searches Pexels for images ---
@app.route('/generate-image', methods=['POST'])
def generate_image():
    json_data = request.get_json()
    prompt = json_data.get('prompt')
    if not prompt: return jsonify({'error': 'Prompt is required'}), 400
    if not PEXELS_API_KEY: return jsonify({'error': 'Pexels API key not found'}), 500
    
    print(f"Searching for images with prompt: {prompt}")
    try:
        response = requests.get(
            PEXELS_PHOTO_SEARCH_URL,
            headers={"Authorization": PEXELS_API_KEY},
            params={"query": prompt, "per_page": 9, "orientation": "landscape"}
        )
        response.raise_for_status()
        data = response.json()
        
        if data['photos']:
            # Returning URLs as per the original Pexels functionality
            image_urls = [photo['src']['large'] for photo in data['photos']]
            return jsonify({'image_urls': image_urls})
        else:
            return jsonify({'error': 'No images found for that prompt.'}), 404
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to search for image from API.'}), 500


# --- UNCHANGED: This endpoint uses Gemini to enhance Pexels search ---
@app.route('/generate-video', methods=['POST'])
def generate_video():
    json_data = request.get_json()
    user_prompt = json_data.get('prompt')
    if not user_prompt: return jsonify({'error': 'Prompt is required'}), 400
    if not PEXELS_API_KEY: return jsonify({'error': 'Pexels API key not found'}), 500
    if not os.getenv("GOOGLE_API_KEY"): return jsonify({'error': 'Google AI API key not found'}), 500

    # STEP 1: Use Gemini to brainstorm better search queries
    print(f"Generating search queries with Gemini for: {user_prompt}")
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        query_generation_prompt = f"""
        Based on the topic "{user_prompt}", generate 3 alternative, descriptive search queries for a stock video website like Pexels.
        Your response must be a single, raw JSON object with a single key "queries" which holds an array of strings. 
        Do not include any other text or markdown formatting like ```json.
        Example: For the topic "business growth", your output should be: {{"queries": ["corporate success montage", "data visualization graph rising", "team celebrating in office"]}}
        """
        response = model.generate_content(query_generation_prompt)
        
        cleaned_json_string = response.text.strip().replace('```json', '').replace('```', '')
        search_queries = json.loads(cleaned_json_string).get("queries", [user_prompt])
        if user_prompt not in search_queries:
            search_queries.append(user_prompt)
        print(f"Generated queries: {search_queries}")
    except Exception as e:
        print(f"Error calling Google AI API or parsing JSON: {e}")
        search_queries = [user_prompt]

    # STEP 2: Search Pexels with the new queries until a video is found
    for query in search_queries:
        print(f"Searching for video with query: {query}")
        try:
            response = requests.get(
                PEXELS_VIDEO_SEARCH_URL,
                headers={"Authorization": PEXELS_API_KEY},
                params={"query": query, "per_page": 1, "orientation": "landscape"}
            )
            response.raise_for_status()
            data = response.json()

            if data['videos']:
                video_files = data['videos'][0]['video_files']
                video_url = next((vid['link'] for vid in video_files if vid.get('quality') == 'hd'), video_files[0]['link'])
                return jsonify({'video_url': video_url})
            
        except requests.exceptions.RequestException as e:
            print(f"Pexels API error for query '{query}': {e}")
            return jsonify({'error': 'Failed to search for video from API.'}), 500
            
    return jsonify({'error': 'No videos found for that topic.'}), 404


# --- REMOVED: The '/upscale-image' endpoint has been deleted ---


# --- UNCHANGED: This endpoint uses Gemini for text analysis ---
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
        model = genai.GenerativeModel('gemini-2.5-flash')
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