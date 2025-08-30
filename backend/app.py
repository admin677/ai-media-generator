import os
import requests
import base64
import io
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# --- API Configuration ---
# Get the API key from environment variables
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
# The API endpoint for a popular Stable Diffusion model on Hugging Face
API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"

# Define the route for our image generation endpoint
@app.route('/generate-image', methods=['POST'])
def generate_image():
    """
    This function handles the image generation request.
    It receives a prompt, calls the Hugging Face Inference API,
    and returns the generated image.
    """
    json_data = request.get_json()
    prompt = json_data.get('prompt')

    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    if not HUGGINGFACE_API_TOKEN:
        return jsonify({'error': 'Hugging Face API token not found'}), 500

    print(f"Generating image for prompt: {prompt}")

    try:
        # --- Call the Hugging Face API ---
        # The API expects the token in the "Authorization" header, prefixed with "Bearer "
        headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}
        
        # Send the request. The input is a simple JSON with the prompt.
        response = requests.post(API_URL, headers=headers, json={"inputs": prompt})

        # Raise an exception if the API call was not successful
        response.raise_for_status()

        # The Hugging Face API returns the raw image data (binary), not a JSON object.
        # We need to encode this binary data into a base64 string for the frontend.
        image_bytes = response.content
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        return jsonify({'image_b64': image_b64})

    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API: {e}")
        # The error response from Hugging Face might contain useful info in its text body
        error_details = e.response.text if e.response else "No response from server"
        return jsonify({'error': f'Failed to generate image from API. Details: {error_details}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)