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
    
    const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";

    // --- Menu & Modal Logic ---
    const openMenu = () => {
        sideMenu.classList.add('open');
        overlay.classList.add('visible');
    };
    const closeMenu = () => {
        sideMenu.classList.remove('open');
        if (!imprintModal.classList.contains('visible')) {
             overlay.classList.remove('visible');
        }
    };
    hamburgerBtn.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);

    const openModal = () => {
        imprintModal.classList.add('visible');
        overlay.classList.add('visible');
    };
    const closeModal = () => {
        imprintModal.classList.remove('visible');
        if (!sideMenu.classList.contains('open')) {
            overlay.classList.remove('visible');
        }
    };
    imprintLink.addEventListener('click', (e) => { e.preventDefault(); closeMenu(); openModal(); });
    closeModalBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', () => { closeMenu(); closeModal(); });

    loginLink.addEventListener('click', (e) => { e.preventDefault(); alert('Login functionality is coming soon!'); });

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

    // --- Image Generation ---
    generateImgBtn.addEventListener("click", async () => { /* ... existing image logic ... */ });

    // --- Video Generation ---
    imageUpload.addEventListener('change', () => {
        uploadFilename.textContent = imageUpload.files.length > 0 ? imageUpload.files[0].name : 'Choose an image...';
    });
    generateVidBtn.addEventListener('click', async () => { /* ... existing video logic ... */ });

    // --- Helper Function ---
    function setLoading(type, isLoading) { /* ... existing setLoading logic ... */ }
});