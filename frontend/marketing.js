document.addEventListener('DOMContentLoaded', () => {
    const swotBtn = document.getElementById('swot-btn');
    const pestleBtn = document.getElementById('pestle-btn');
    const swotPanel = document.getElementById('swot-panel');
    const pestlePanel = document.getElementById('pestle-panel');

    swotBtn.addEventListener('click', () => {
        swotPanel.classList.remove('hidden');
        pestlePanel.classList.add('hidden');
        swotBtn.classList.add('active');
        pestleBtn.classList.remove('active');
    });

    pestleBtn.addEventListener('click', () => {
        pestlePanel.classList.remove('hidden');
        swotPanel.classList.add('hidden');
        pestleBtn.classList.add('active');
        swotBtn.classList.remove('active');
    });
});