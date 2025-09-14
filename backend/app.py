import os
import requests
import base64
import time
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app)

# --- API Configuration ---
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY") # New Pexels Key

VIDEO_API_URL_START = "https://api.stability.ai/v2beta/image-to-video"
VIDEO_API_URL_RESULT = "https://api.stability.ai/v2beta/image-to-video/result"
UPSCALE_API_URL = "https://api.stability.ai/v2beta/stable-image/upscale/conservative"
PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search" # New Pexels URL


@app.route('/generate-image', methods=['POST'])
def generate_image():
    # This function now searches Pexels for a free stock photo
    json_data = request.get_json()
    prompt = json_data.get('prompt')
    if not prompt: return jsonify({'error': 'Prompt is required'}), 400
    if not PEXELS_API_KEY: return jsonify({'error': 'Pexels API key not found'}), 500
    
    print(f"Searching for image with prompt: {prompt}")
    try:
        response = requests.get(
            PEXELS_SEARCH_URL,
            headers={"Authorization": PEXELS_API_KEY},
            params={"query": prompt, "per_page": 1, "orientation": "landscape"}
        )
        response.raise_for_status()
        data = response.json()
        
        if data['photos']:
            # If photos are found, return the URL of the first one
            image_url = data['photos'][0]['src']['large2x']
            return jsonify({'image_url': image_url})
        else:
            # If no photos are found for the prompt
            return jsonify({'error': 'No images found for that prompt. Try a different search term.'}), 404

    except requests.exceptions.RequestException as e:
        print(f"Error calling Pexels API: {e}")
        return jsonify({'error': 'Failed to search for image from API.'}), 500


@app.route('/generate-video', methods=['POST'])
def generate_video():
    if not STABILITY_API_KEY: return jsonify({'error': 'API key not found'}), 500
    if 'image' not in request.files: return jsonify({'error': 'No image file provided'}), 400
    
    image_file = request.files['image']
    print(f"Received image file for video generation: {image_file.filename}")
    try:
        print("Starting video generation job...")
        response = requests.post(
            VIDEO_API_URL_START,
            headers={"Authorization": f"Bearer {STABILITY_API_KEY}", "Accept": "application/json"},
            files={"image": image_file},
            data={"seed": 0, "cfg_scale": 2.5, "motion_bucket_id": 40}
        )
        response.raise_for_status()
        job_id = response.json().get('id')
        print(f"Job started with ID: {job_id}")

        print("Polling for video result...")
        for _ in range(30):
            time.sleep(5)
            poll_response = requests.get(
                f"{VIDEO_API_URL_RESULT}/{job_id}",
                headers={"Authorization": f"Bearer {STABILITY_API_KEY}", "Accept": "video/mp4"}
            )
            if poll_response.status_code == 200:
                print("Video generation complete.")
                video_data = poll_response.content
                video_b64 = base64.b64encode(video_data).decode('utf-8')
                return jsonify({'video_b64': video_b64})
            elif poll_response.status_code != 202:
                error_info = poll_response.text
                print(f"Polling failed with status {poll_response.status_code}: {error_info}")
                raise requests.exceptions.RequestException(f"Generation failed: {error_info}")
            print("Job is still in progress...")
        return jsonify({'error': 'Video generation timed out after polling.'}), 504
    except requests.exceptions.RequestException as e:
        print(f"Error during video generation process: {e}")
        return jsonify({'error': f"An error occurred: {e}"}), 500


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