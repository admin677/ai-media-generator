import os
import requests
import base64
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
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")

# This is the UPDATED line with the correct, newer model
API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"

# Define the route for our image generation endpoint
@app.route('/generate-image', methods=['POST'])
def generate_image():
    """
    This function handles the image generation request.
    It receives a prompt from the frontend, calls the Stability AI API,
    and returns the generated image.
    """
    # Get the JSON data from the request body
    json_data = request.get_json()
    prompt = json_data.get('prompt')

    # Check if a prompt was provided
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    # Check if the API key is available
    if not STABILITY_API_KEY:
        return jsonify({'error': 'API key not found'}), 500

    print(f"Generating image for prompt: {prompt}")

    try:
        # --- Call the Stability AI API ---
        response = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {STABILITY_API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            json={
                "text_prompts": [
                    {"text": prompt}
                ],
                "cfg_scale": 7,
                "height": 1024,
                "width": 1024,
                "samples": 1,
                "steps": 30,
            },
        )

        # Raise an exception if the API call was not successful
        response.raise_for_status()

        # Get the response data
        data = response.json()

        # The image is returned as a base64 encoded string.
        image_b64 = data["artifacts"][0]["base64"]
        
        # Return the image data in a JSON response
        return jsonify({'image_b64': image_b64})

    except requests.exceptions.RequestException as e:
        # Handle potential API errors
        print(f"Error calling Stability AI API: {e}")
        return jsonify({'error': 'Failed to generate image from API'}), 500

# This allows the script to be run directly
if __name__ == '__main__':
    # Runs the Flask app on localhost, port 5001
    app.run(debug=True, port=5001)