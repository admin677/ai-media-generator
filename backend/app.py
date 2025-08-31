import os
import requests
import base64
import time
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# --- API Configuration ---
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
IMAGE_API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
VIDEO_API_URL_START = "https://api.stability.ai/v2beta/image-to-video"
VIDEO_API_URL_RESULT = "https://api.stability.ai/v2beta/image-to-video/result"


# --- IMAGE GENERATION ENDPOINT (Existing Code) ---
@app.route('/generate-image', methods=['POST'])
def generate_image():
    # ... (Your existing image generation code remains unchanged) ...
    json_data = request.get_json()
    prompt = json_data.get('prompt')

    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    if not STABILITY_API_KEY:
        return jsonify({'error': 'API key not found'}), 500

    print(f"Generating image for prompt: {prompt}")

    try:
        response = requests.post(
            IMAGE_API_URL,
            headers={
                "Authorization": f"Bearer {STABILITY_API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            json={ "text_prompts": [{"text": prompt}], "cfg_scale": 7, "height": 1024, "width": 1024, "samples": 1, "steps": 30 },
        )
        response.raise_for_status()
        data = response.json()
        image_b64 = data["artifacts"][0]["base64"]
        return jsonify({'image_b64': image_b64})

    except requests.exceptions.RequestException as e:
        print(f"Error calling Stability AI API: {e}")
        return jsonify({'error': 'Failed to generate image from API'}), 500


# --- VIDEO GENERATION ENDPOINT (New Code) ---
@app.route('/generate-video', methods=['POST'])
def generate_video():
    """
    Handles image-to-video generation.
    Accepts an uploaded image file and returns a generated video.
    """
    if not STABILITY_API_KEY:
        return jsonify({'error': 'API key not found'}), 500

    # 1. Check for the uploaded image file
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']

    print(f"Received image file for video generation: {image_file.filename}")

    try:
        # 2. Start the video generation job
        print("Starting video generation job...")
        response = requests.post(
            VIDEO_API_URL_START,
            headers={"Authorization": f"Bearer {STABILITY_API_KEY}"},
            files={"image": image_file},
            data={"seed": 0, "cfg_scale": 2.5, "motion_bucket_id": 40}
        )
        response.raise_for_status()
        
        job_id = response.json().get('id')
        print(f"Job started with ID: {job_id}")

        # 3. Poll for the result
        print("Polling for video result...")
        for _ in range(20):  # Poll up to 20 times (e.g., 20 * 5s = 100s total wait)
            time.sleep(5) # Wait for 5 seconds between checks
            
            poll_response = requests.get(
                f"{VIDEO_API_URL_RESULT}/{job_id}",
                headers={"Authorization": f"Bearer {STABILITY_API_KEY}"}
            )

            if poll_response.status_code == 200:
                # If status is 200, the video is ready
                print("Video generation complete.")
                video_data = poll_response.content
                video_b64 = base64.b64encode(video_data).decode('utf-8')
                return jsonify({'video_b64': video_b64})
            
            elif poll_response.status_code != 202:
                # If status is not 202 (in-progress), an error occurred
                error_info = poll_response.json()
                print(f"Polling failed with status {poll_response.status_code}: {error_info}")
                raise requests.exceptions.RequestException(f"Generation failed: {error_info.get('errors', ['Unknown error'])[0]}")

            print("Job is still in progress...")

        return jsonify({'error': 'Video generation timed out after polling.'}), 504

    except requests.exceptions.RequestException as e:
        print(f"Error during video generation process: {e}")
        return jsonify({'error': f"An error occurred: {e}"}), 500


# This allows the script to be run directly
if __name__ == '__main__':
    app.run(debug=True, port=5001)