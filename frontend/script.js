// --- Theme Switcher Logic ---
// ... (Your existing theme switcher code remains unchanged) ...


// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const imageModeBtn = document.getElementById('image-mode-btn');
    const videoModeBtn = document.getElementById('video-mode-btn');
    const imagePanel = document.getElementById('image-generator-panel');
    const videoPanel = document.getElementById('video-generator-panel');
    
    // Image Generation Elements
    const promptInput = document.getElementById("prompt-input");
    const generateImgBtn = document.getElementById("generate-img-btn");
    const resultImage = document.getElementById("result-image");
    const loadingSpinnerImg = document.getElementById("loading-spinner-img");

    // Video Generation Elements
    const imageUpload = document.getElementById("image-upload");
    const uploadFilename = document.getElementById("upload-filename");
    const generateVidBtn = document.getElementById("generate-vid-btn");
    const resultVideo = document.getElementById("result-video");
    const loadingSpinnerVid = document.getElementById("loading-spinner-vid");

    const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";

    // --- Tab Switching Logic ---
    imageModeBtn.addEventListener('click', () => {
        imagePanel.classList.remove('hidden');
        videoPanel.classList.add('hidden');
        imageModeBtn.classList.add('active');
        videoModeBtn.classList.remove('active');
    });

    videoModeBtn.addEventListener('click', () => {
        videoPanel.classList.remove('hidden');
        imagePanel.classList.add('hidden');
        videoModeBtn.classList.add('active');
        imageModeBtn.classList.remove('active');
    });

    // --- Image Generation Logic ---
    generateImgBtn.addEventListener("click", async () => { /* ... existing image generation logic ... */ });
    
    // --- Video Generation Logic ---
    imageUpload.addEventListener('change', () => {
        if (imageUpload.files.length > 0) {
            uploadFilename.textContent = imageUpload.files[0].name;
        } else {
            uploadFilename.textContent = 'Choose an image...';
        }
    });

    generateVidBtn.addEventListener('click', async () => {
        if (imageUpload.files.length === 0) {
            alert('Please choose an image file first.');
            return;
        }

        setLoading('vid', true);

        const formData = new FormData();
        formData.append('image', imageUpload.files[0]);

        try {
            const response = await fetch(`${BACKEND_URL}/generate-video`, {
                method: 'POST',
                body: formData, // No 'Content-Type' header needed, browser sets it for FormData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const videoDataUrl = `data:video/mp4;base64,${data.video_b64}`;
            
            resultVideo.src = videoDataUrl;
            resultVideo.style.display = 'block';

        } catch (error) {
            console.error("Error generating video:", error);
            alert(`Failed to generate video. Error: ${error.message}`);
        } finally {
            setLoading('vid', false);
        }
    });

    // --- Helper Functions ---
    function setLoading(type, isLoading) {
        const btn = type === 'img' ? generateImgBtn : generateVidBtn;
        const spinner = type === 'img' ? loadingSpinnerImg : loadingSpinnerVid;
        const resultEl = type === 'img' ? resultImage : resultVideo;

        btn.disabled = isLoading;
        if (isLoading) {
            spinner.classList.remove("hidden");
            resultEl.style.display = "none";
        } else {
            spinner.classList.add("hidden");
        }
    }
});