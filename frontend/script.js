// --- Theme Switcher Logic ---
const themeSwitcher = document.getElementById('theme-switcher');
const body = document.body;
if (themeSwitcher) {
    themeSwitcher.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
}

// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const imageModeBtn = document.getElementById('image-mode-btn');
    const videoModeBtn = document.getElementById('video-mode-btn');
    const imagePanel = document.getElementById('image-generator-panel');
    const videoPanel = document.getElementById('video-generator-panel');
    const promptInput = document.getElementById("prompt-input");
    const generateImgBtn = document.getElementById("generate-img-btn");
    const resultAreaImg = document.getElementById("result-area-img");
    const loadingSpinnerImg = document.getElementById("loading-spinner-img");
    const promptInputVid = document.getElementById("prompt-input-vid");
    const generateVidBtn = document.getElementById("generate-vid-btn");
    const resultVideo = document.getElementById("result-video");
    const loadingSpinnerVid = document.getElementById("loading-spinner-vid");
    
    const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";

    // --- Tab Switching Logic ---
    if (imageModeBtn && videoModeBtn && imagePanel && videoPanel) {
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
    }

    // --- Image Search ---
    if (generateImgBtn) {
        generateImgBtn.addEventListener("click", async () => {
            const prompt = promptInput.value;
            if (!prompt) { alert("Please enter a search term!"); return; }
            setLoading('img', true);
            resultAreaImg.innerHTML = ''; // Clear previous results
            
            try {
                const response = await fetch(`${BACKEND_URL}/generate-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                
                if (data.image_urls && data.image_urls.length > 0) {
                    data.image_urls.forEach(url => {
                        const img = document.createElement('img');
                        img.src = url;
                        img.className = 'result-thumbnail';
                        resultAreaImg.appendChild(img);
                    });
                } else {
                     resultAreaImg.textContent = 'No images found.';
                }
            } catch (error) {
                console.error("Error fetching image:", error);
                alert(`Failed to get image. Error: ${error.message}`);
                resultAreaImg.textContent = `Error: ${error.message}`;
            } finally {
                setLoading('img', false);
            }
        });
    }

    // --- Video Search ---
    if (generateVidBtn) {
        generateVidBtn.addEventListener('click', async () => {
            const prompt = promptInputVid.value;
            if (!prompt) { alert('Please enter a search term!'); return; }
            setLoading('vid', true);
            try {
                const response = await fetch(`${BACKEND_URL}/generate-video`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                resultVideo.src = data.video_url;
                resultVideo.style.display = 'block';
            } catch (error) {
                console.error("Error fetching video:", error);
                alert(`Failed to get video. Error: ${error.message}`);
            } finally {
                setLoading('vid', false);
            }
        });
    }

    // --- Helper Function ---
    function setLoading(type, isLoading) {
        const btn = type === 'img' ? generateImgBtn : generateVidBtn;
        const spinner = type === 'img' ? loadingSpinnerImg : loadingSpinnerVid;
        // The result area for images is now the grid container itself
        const resultEl = type === 'img' ? resultAreaImg : resultVideo;
        
        if (btn && spinner) {
            btn.disabled = isLoading;
            if(isLoading) {
                spinner.classList.remove('hidden');
                resultAreaImg.appendChild(spinner); // Put spinner in grid
            } else {
                 if (resultAreaImg.contains(spinner)) {
                    resultAreaImg.removeChild(spinner);
                }
            }
        }
    }
});