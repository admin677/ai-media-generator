document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById("image-upload");
    const uploadFilename = document.getElementById("upload-filename");
    const promptInput = document.getElementById("prompt-input");
    const upscaleBtn = document.getElementById("upscale-btn");
    const resultImage = document.getElementById("result-image");
    const loadingSpinner = document.getElementById("loading-spinner");

    const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";

    imageUpload.addEventListener('change', () => {
        if (imageUpload.files.length > 0) {
            uploadFilename.textContent = imageUpload.files[0].name;
        } else {
            uploadFilename.textContent = 'Choose an image to upscale...';
        }
    });

    upscaleBtn.addEventListener('click', async () => {
        if (imageUpload.files.length === 0) {
            alert('Please choose an image file first.');
            return;
        }
        if (!promptInput.value) {
            alert('Please provide a prompt to guide the upscaler.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('image', imageUpload.files[0]);
        formData.append('prompt', promptInput.value);

        try {
            const response = await fetch(`${BACKEND_URL}/upscale-image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            resultImage.src = `data:image/png;base64,${data.image_b64}`;
            resultImage.style.display = 'block';

        } catch (error) {
            console.error("Error upscaling image:", error);
            alert(`Failed to upscale image. Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        upscaleBtn.disabled = isLoading;
        loadingSpinner.classList.toggle("hidden", !isLoading);
        if (isLoading) {
            resultImage.style.display = "none";
        }
    }
});