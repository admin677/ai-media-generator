// --- Theme Switcher Logic ---
const themeSwitcher = document.getElementById('theme-switcher');
const body = document.body;
themeSwitcher.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
}

// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    // --- Element Selectors ---
    const imageModeBtn = document.getElementById('image-mode-btn');
    const videoModeBtn = document.getElementById('video-mode-btn');
    const imagePanel = document.getElementById('image-generator-panel');
    const videoPanel = document.getElementById('video-generator-panel');
    const promptInput = document.getElementById("prompt-input");
    const generateImgBtn = document.getElementById("generate-img-btn");
    const resultImage = document.getElementById("result-image");
    const loadingSpinnerImg = document.getElementById("loading-spinner-img");
    const imageUpload = document.getElementById("image-upload");
    const uploadFilename = document.getElementById("upload-filename");
    const generateVidBtn = document.getElementById("generate-vid-btn");
    const resultVideo = document.getElementById("result-video");
    const loadingSpinnerVid = document.getElementById("loading-spinner-vid");
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sideMenu = document.getElementById('side-menu');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const overlay = document.getElementById('overlay');
    const imprintLink = document.getElementById('imprint-link');
    const imprintModal = document.getElementById('imprint-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const loginLink = document.getElementById('login-link');
    const historyLink = document.getElementById('history-link');
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyGrid = document.getElementById('history-grid');
    const noHistoryMessage = document.getElementById('no-history-message');
    
    const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";

    // --- Menu & Modal Logic ---
    const openMenu = () => { sideMenu.classList.add('open'); overlay.classList.add('visible'); };
    const closeMenu = () => { sideMenu.classList.remove('open'); checkOverlay(); };
    hamburgerBtn.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);

    const openModal = (modal) => { modal.classList.add('visible'); overlay.classList.add('visible'); };
    const closeModal = (modal) => { modal.classList.remove('visible'); checkOverlay(); };
    
    imprintLink.addEventListener('click', (e) => { e.preventDefault(); closeMenu(); openModal(imprintModal); });
    closeModalBtn.addEventListener('click', () => closeModal(imprintModal));
    
    historyLink.addEventListener('click', (e) => { e.preventDefault(); closeMenu(); loadHistory(); openModal(historyModal); });
    closeHistoryBtn.addEventListener('click', () => closeModal(historyModal));

    overlay.addEventListener('click', () => { closeMenu(); closeModal(imprintModal); closeModal(historyModal); });
    
    function checkOverlay() {
        if (!sideMenu.classList.contains('open') && !imprintModal.classList.contains('visible') && !historyModal.classList.contains('visible')) {
            overlay.classList.remove('visible');
        }
    }
    
    // Placeholder - this link now goes directly to auth.html
    // loginLink.addEventListener('click', (e) => { e.preventDefault(); alert('Login functionality is coming soon!'); });

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

    // --- History Functions ---
    const getHistory = () => JSON.parse(localStorage.getItem('generationHistory')) || [];
    const saveToHistory = (item) => {
        let history = getHistory();
        history.unshift(item);
        if (history.length > 20) { history = history.slice(0, 20); }
        localStorage.setItem('generationHistory', JSON.stringify(history));
    };
    const loadHistory = () => {
        historyGrid.innerHTML = '';
        const history = getHistory();
        const placeholder = document.getElementById('no-history-message');

        if (history.length === 0) {
            if (placeholder) placeholder.style.display = 'block';
        } else {
            if (placeholder) placeholder.style.display = 'none';
            history.forEach(item => {
                const historyItemDiv = document.createElement('div');
                historyItemDiv.className = 'history-item';
                let mediaElement;
                if (item.type === 'image') {
                    mediaElement = document.createElement('img');
                    mediaElement.src = `data:image/png;base64,${item.resultData}`;
                } else {
                    mediaElement = document.createElement('video');
                    mediaElement.src = `data:video/mp4;base64,${item.resultData}`;
                }
                historyItemDiv.addEventListener('click', () => {
                    if (item.type === 'image') {
                        imageModeBtn.click();
                        resultImage.src = mediaElement.src;
                        resultImage.style.display = 'block';
                    } else {
                        videoModeBtn.click();
                        resultVideo.src = mediaElement.src;
                        resultVideo.style.display = 'block';
                    }
                    closeModal(historyModal);
                });
                historyItemDiv.appendChild(mediaElement);
                historyGrid.appendChild(historyItemDiv);
            });
        }
    };

    // --- Image Generation ---
    generateImgBtn.addEventListener("click", async () => {
        if (!auth.currentUser) {
            alert("Please log in to generate images.");
            window.location.href = 'auth.html';
            return;
        }
        const prompt = promptInput.value;
        if (!prompt) { alert("Please enter a prompt!"); return; }
        setLoading('img', true);
        try {
            const response = await fetch(`${BACKEND_URL}/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            resultImage.src = `data:image/png;base64,${data.image_b64}`;
            resultImage.style.display = "block";
            saveToHistory({ type: 'image', prompt: prompt, resultData: data.image_b64, timestamp: new Date().toISOString() });
        } catch (error) {
            console.error("Error generating image:", error);
            alert(`Failed to generate image. Error: ${error.message}`);
        } finally {
            setLoading('img', false);
        }
    });

    // --- Video Generation ---
    imageUpload.addEventListener('change', () => {
        uploadFilename.textContent = imageUpload.files.length > 0 ? imageUpload.files[0].name : 'Choose an image...';
    });
    generateVidBtn.addEventListener('click', async () => {
        if (!auth.currentUser) {
            alert("Please log in to generate videos.");
            window.location.href = 'auth.html';
            return;
        }
        if (imageUpload.files.length === 0) { alert('Please choose an image file first.'); return; }
        setLoading('vid', true);
        const formData = new FormData();
        formData.append('image', imageUpload.files[0]);
        try {
            const response = await fetch(`${BACKEND_URL}/generate-video`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            resultVideo.src = `data:video/mp4;base64,${data.video_b64}`;
            resultVideo.style.display = 'block';
            saveToHistory({ type: 'video', sourceImageName: imageUpload.files[0].name, resultData: data.video_b64, timestamp: new Date().toISOString() });
        } catch (error) {
            console.error("Error generating video:", error);
            alert(`Failed to generate video. Error: ${error.message}`);
        } finally {
            setLoading('vid', false);
        }
    });

    // --- Helper Function ---
    function setLoading(type, isLoading) {
        const btn = type === 'img' ? generateImgBtn : generateVidBtn;
        const spinner = type === 'img' ? loadingSpinnerImg : loadingSpinnerVid;
        const resultEl = type === 'img' ? resultImage : resultVideo;
        if (btn && spinner && resultEl) {
            btn.disabled = isLoading;
            if (isLoading) {
                spinner.classList.remove("hidden");
                resultEl.style.display = "none";
            } else {
                spinner.classList.add("hidden");
            }
        }
    }
});