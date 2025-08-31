// --- Theme Switcher Logic ---
const themeSwitcher = document.getElementById('theme-switcher');
const body = document.body;

// On button click, toggle the 'dark-theme' class on the body
themeSwitcher.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    
    // Save the user's preference to localStorage
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// On page load, apply the saved theme from localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
}
// --- End of Theme Switcher Logic ---


// --- Image Generator Logic ---
const promptInput = document.getElementById("prompt-input");
const generateBtn = document.getElementById("generate-btn");
const resultImage = document.getElementById("result-image");
const loadingSpinner = document.getElementById("loading-spinner");

// This is the backend server we deployed on Render
const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";

// Main function to handle the generate button click
generateBtn.addEventListener("click", async () => {
    const prompt = promptInput.value;
    if (!prompt) {
        alert("Please enter a prompt!");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`${BACKEND_URL}/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        // If the server response is not "OK" (e.g., status 500), handle the error
        if (!response.ok) {
            // Try to get a specific error message from the backend, or use a default
            const errorData = await response.json().catch(() => ({ error: 'The server returned an error.' }));
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Format the base64 image data for display
        const imageDataUrl = `data:image/png;base64,${data.image_b64}`;
        
        // Set the image source and make it visible
        resultImage.src = imageDataUrl;
        resultImage.style.display = "block";

    } catch (error) {
        console.error("Error generating image:", error);
        alert(`Failed to generate image. Error: ${error.message}`);
    } finally {
        setLoading(false);
    }
});

/**
 * Manages the UI loading state.
 * @param {boolean} isLoading - True if loading should start, false if it should end.
 */
function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    if (isLoading) {
        loadingSpinner.classList.remove("hidden");
        // Hide the previous image while a new one is generating
        resultImage.style.display = "none";
    } else {
        // When loading is finished, just hide the spinner.
        // The image will be made visible only on success in the try block.
        loadingSpinner.classList.add("hidden");
    }
}