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
    json_data = request.get_json()
    prompt = json_data.get('prompt')
    if not prompt: return jsonify({'error': 'Prompt is required'}), 400
    if not PEXELS_API_KEY: return jsonify({'error': 'Pexels API key not found'}), 500
    try:
        response = requests.get(
            PEXELS_PHOTO_SEARCH_URL,
            headers={"Authorization": PEXELS_API_KEY},
            params={"query": prompt, "per_page": 9, "orientation": "landscape"}
        )
        response.raise_for_status()
        data = response.json()
        if data['photos']:
            image_urls = [photo['src']['large'] for photo in data['photos']]
            return jsonify({'image_urls': image_urls})
        else:
            return jsonify({'error': 'No images found for that prompt.'}), 404
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to search for image from API.'}), 500


@app.route('/generate-video', methods=['POST'])
def generate_video():
    if not STABILITY_API_KEY: return jsonify({'error': 'API key not found'}), 500
    if 'image' not in request.files: return jsonify({'error': 'No image file provided'}), 400
    image_file = request.files['image']
    try:
        response = requests.post(
            "https://api.stability.ai/v2/generation/image-to-video",
            headers={"Authorization": f"Bearer {STABILITY_API_KEY}", "Accept": "application/json"},
            files={"image": image_file}, data={"seed": 0}
        )
        response.raise_for_status()
        job_id = response.json().get('id')
        for _ in range(30):
            time.sleep(5)
            poll_response = requests.get(
                f"https://api.stability.ai/v2/generation/image-to-video/result/{job_id}",
                headers={"Authorization": f"Bearer {STABILITY_API_KEY}", "Accept": "video/mp4"}
            )
            if poll_response.status_code == 200:
                video_data = poll_response.content
                video_b64 = base64.b64encode(video_data).decode('utf-8')
                return jsonify({'video_b64': video_b64})
            elif poll_response.status_code != 202:
                raise requests.exceptions.RequestException(f"Generation failed: {poll_response.text}")
        return jsonify({'error': 'Video generation timed out.'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f"An error occurred: {e}"}), 500


@app.route('/upscale-image', methods=['POST'])
def upscale_image():
    if not STABILITY_API_KEY: return jsonify({'error': 'API key not found'}), 500
    if 'image' not in request.files: return jsonify({'error': 'No image file provided'}), 400
    if 'prompt' not in request.form: return jsonify({'error': 'No prompt provided'}), 400
    try:
        image_file = request.files['image']
        prompt = request.form['prompt']
        response = requests.post(
            UPSCALE_API_URL,
            headers={"Authorization": f"Bearer {STABILITY_API_KEY}", "Accept": "image/*"},
            files={"image": image_file}, data={"prompt": prompt, "output_format": "png"}
        )
        response.raise_for_status()
        image_data = response.content
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        return jsonify({'image_b64': image_b64})
    except requests.exceptions.RequestException as e:
        error_details = e.response.text if e.response else "An unknown error occurred"
        return jsonify({'error': f"An error occurred: {error_details}"}), 500

@app.route('/generate-analysis', methods=['POST'])
def generate_analysis():
    if not os.getenv("GOOGLE_API_KEY"): return jsonify({'error': 'Google AI API key not found'}), 500
    json_data = request.get_json()
    topic, analysis_type = json_data.get('topic'), json_data.get('analysis_type')
    if not topic or not analysis_type: return jsonify({'error': 'A topic and analysis type are required'}), 400
    
    prompt = f"Generate a detailed {analysis_type} analysis for: \"{topic}\". Return ONLY a raw JSON object."
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        analysis_data = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
        return jsonify(analysis_data)
    except Exception as e:
        print(f"Error calling Google AI API: {e}")
        return jsonify({'error': f'Failed to generate analysis. The AI may be unable to process this topic. Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)