import os
import requests
import base64
import time
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)

# --- CORS CONFIGURATION ---
origins = [
    "https://growthgramai.com",
    "https://growthgramai.netlify.app",
    "http://127.0.0.1:5500"
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
    
    print(f"Searching for image with prompt: {prompt}")
    try:
        response = requests.get(
            PEXELS_PHOTO_SEARCH_URL,
            headers={"Authorization": PEXELS_API_KEY},
            params={"query": prompt, "per_page": 1, "orientation": "landscape"}
        )
        response.raise_for_status()
        data = response.json()
        
        if data['photos']:
            image_url = data['photos'][0]['src']['large2x']
            return jsonify({'image_url': image_url})
        else:
            return jsonify({'error': 'No images found for that prompt. Try a different search term.'}), 404
    except requests.exceptions.RequestException as e:
        print(f"Error calling Pexels API: {e}")
        return jsonify({'error': 'Failed to search for image from API.'}), 500


@app.route('/generate-video', methods=['POST'])
def generate_video():
    json_data = request.get_json()
    prompt = json_data.get('prompt')
    if not prompt: return jsonify({'error': 'Prompt is required'}), 400
    if not PEXELS_API_KEY: return jsonify({'error': 'Pexels API key not found'}), 500

    print(f"Searching for video with prompt: {prompt}")
    try:
        response = requests.get(
            PEXELS_VIDEO_SEARCH_URL,
            headers={"Authorization": PEXELS_API_KEY},
            params={"query": prompt, "per_page": 1, "orientation": "landscape"}
        )
        response.raise_for_status()
        data = response.json()

        if data['videos']:
            video_files = data['videos'][0]['video_files']
            video_url = next((vid['link'] for vid in video_files if vid.get('quality') == 'hd'), None)
            if not video_url:
                video_url = video_files[0]['link']
            return jsonify({'video_url': video_url})
        else:
            return jsonify({'error': 'No videos found for that prompt. Try a different search term.'}), 404
    except requests.exceptions.RequestException as e:
        print(f"Error calling Pexels Video API: {e}")
        return jsonify({'error': 'Failed to search for video from API.'}), 500


@app.route('/upscale-image', methods=['POST'])
def upscale_image():
    if not STABILITY_API_KEY: return jsonify({'error': 'API key not found'}), 500
    if 'image' not in request.files: return jsonify({'error': 'No image file provided'}), 400
    if 'prompt' not in request.form: return jsonify({'error': 'No prompt provided'}), 400

    image_file = request.files['image']
    prompt = request.form['prompt']
    
    print(f"Received image and prompt for upscaling: {prompt}")
    try:
        response = requests.post(
            UPSCALE_API_URL,
            headers={"Authorization": f"Bearer {STABILITY_API_KEY}", "Accept": "image/*"},
            files={"image": image_file},
            data={"prompt": prompt, "output_format": "png"}
        )
        response.raise_for_status()
        image_data = response.content
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        return jsonify({'image_b64': image_b64})
    except requests.exceptions.RequestException as e:
        print(f"Error during image upscaling process: {e}")
        error_details = e.response.text if e.response else "An unknown error occurred"
        return jsonify({'error': f"An error occurred: {error_details}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)