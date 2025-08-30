// Get references to the HTML elements we'll be working with
const promptInput = document.getElementById("prompt-input");
const generateBtn = document.getElementById("generate-btn");
const resultImage = document.getElementById("result-image");
const loadingSpinner = document.getElementById("loading-spinner");

// The URL of our backend server. Make sure the port matches the one in app.py
const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";

// Add an event listener for the 'click' event on the generate button
generateBtn.addEventListener("click", async () => {
    // Get the prompt text from the input field
    const prompt = promptInput.value;
    if (!prompt) {
        alert("Please enter a prompt!");
        return;
    }

    // --- Start the generation process ---
    setLoading(true);

    try {
        // Make a POST request to our backend's /generate-image endpoint
        const response = await fetch(`${BACKEND_URL}/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON response from the server
        const data = await response.json();

        // The image data is a base64 string. We need to format it
        // so it can be used in an 'src' attribute for an <img> tag.
        const imageDataUrl = `data:image/png;base64,${data.image_b64}`;

        // Set the source of the image element to display the new image
        resultImage.src = imageDataUrl;
        resultImage.style.display = "block"; // Make the image visible

    } catch (error) {
        // Log any errors and show an alert to the user
        console.error("Error generating image:", error);
        alert("Failed to generate image. Please check the console for details.");
    } finally {
        // --- End the generation process ---
        setLoading(false);
    }
});

// A helper function to manage the loading state
function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true; // Disable the button
        loadingSpinner.classList.remove("hidden"); // Show the spinner
        resultImage.style.display = "none"; // Hide the old image
    } else {
        generateBtn.disabled = false; // Re-enable the button
        loadingSpinner.classList.add("hidden"); // Hide the spinner
    }
}