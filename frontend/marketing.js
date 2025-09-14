document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tool-tab');
    const panels = document.querySelectorAll('.analysis-panel');
    const topicInput = document.getElementById('topic-input');
    const generateBtn = document.getElementById('generate-analysis-btn');
    const spinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const downloadBtn = document.getElementById('download-btn');
    const analysisContainer = document.getElementById('analysis-container');
    const watermark = document.getElementById('watermark');

    const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";
    let activeAnalysisType = 'SWOT';

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAnalysisType = tab.dataset.type;

            panels.forEach(panel => {
                const panelType = panel.id.split('-')[0].toUpperCase();
                const activeType = activeAnalysisType.split(' ')[0].toUpperCase();
                panel.classList.toggle('hidden', panelType !== activeType);
            });
        });
    });

    generateBtn.addEventListener('click', async () => {
        const topic = topicInput.value;
        if (!topic) {
            alert('Please enter a topic for analysis.');
            return;
        }

        spinner.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        downloadBtn.classList.add('hidden');
        clearAllLists();

        try {
            const response = await fetch(`${BACKEND_URL}/generate-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic, analysis_type: activeAnalysisType }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'An unknown error occurred.');
            }
            const data = await response.json();
            populateTables(data, activeAnalysisType);
            downloadBtn.classList.remove('hidden');
        } catch (error) {
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.classList.remove('hidden');
            console.error('Analysis generation failed:', error);
        } finally {
            spinner.classList.add('hidden');
        }
    });

    downloadBtn.addEventListener('click', () => {
        const activePanel = document.querySelector('.analysis-panel:not(.hidden)');
        if (!activePanel) return;
        
        watermark.classList.remove('hidden');

        html2canvas(activePanel, {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-color') || '#f8f9fa',
            onclone: (doc) => {
                const clonedWatermark = doc.getElementById('watermark');
                if(clonedWatermark) clonedWatermark.classList.remove('hidden');
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${activeAnalysisType}_Analysis_${topicInput.value}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            watermark.classList.add('hidden');
        });
    });

    function populateTables(data, type) {
        if (type === 'SWOT') {
            populateList('swot-strengths', data.strengths);
            populateList('swot-weaknesses', data.weaknesses);
            populateList('swot-opportunities', data.opportunities);
            populateList('swot-threats', data.threats);
        } else if (type === 'PESTLE') {
            populateList('pestle-political', data.political);
            populateList('pestle-economic', data.economic);
            populateList('pestle-social', data.social);
            populateList('pestle-technological', data.technological);
            populateList('pestle-legal', data.legal);
            populateList('pestle-environmental', data.environmental);
        } else if (type === 'Porters Five Forces') {
            populateList('porters-new-entrants', data.threat_of_new_entrants);
            populateList('porters-buyer-power', data.bargaining_power_of_buyers);
            populateList('porters-supplier-power', data.bargaining_power_of_suppliers);
            populateList('porters-substitutes', data.threat_of_substitute_products);
            populateList('porters-rivalry', data.industry_rivalry);
        }
    }

    function populateList(ulId, items) {
        const ul = document.getElementById(ulId);
        if (!ul) return;
        ul.innerHTML = '';
        if (items && Array.isArray(items) && items.length > 0) {
            items.forEach(text => {
                const li = document.createElement('li');
                li.textContent = text;
                ul.appendChild(li);
            });
        } else {
            ul.innerHTML = '<li>No data generated for this category.</li>';
        }
    }
    
    function clearAllLists() {
        document.querySelectorAll('.analysis-grid ul').forEach(ul => ul.innerHTML = '');
    }
});