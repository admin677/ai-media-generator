document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tool-tab');
    const panels = document.querySelectorAll('.analysis-panel');
    const topicInput = document.getElementById('topic-input');
    const generateBtn = document.getElementById('generate-analysis-btn');
    const spinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');

    const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";
    let activeAnalysisType = 'SWOT'; // Default

    // Tab switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAnalysisType = tab.dataset.type;

            panels.forEach(panel => {
                const panelId = panel.id.split('-')[0].toUpperCase();
                const activeId = activeAnalysisType.split("'")[0].toUpperCase();
                if (panelId === activeId) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        });
    });

    // Generate button logic
    generateBtn.addEventListener('click', async () => {
        const topic = topicInput.value;
        if (!topic) {
            alert('Please enter a topic for analysis.');
            return;
        }

        spinner.classList.remove('hidden');
        errorMessage.classList.add('hidden');
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
            populateTables(data);

        } catch (error) {
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.classList.remove('hidden');
            console.error('Analysis generation failed:', error);
        } finally {
            spinner.classList.add('hidden');
        }
    });

    function populateTables(data) {
        // This function populates all tables, but only the active one will be visible
        
        // SWOT Data
        populateList('swot-strengths', data.strengths || data.Strengths);
        populateList('swot-weaknesses', data.weaknesses || data.Weaknesses);
        populateList('swot-opportunities', data.opportunities || data.Opportunities);
        populateList('swot-threats', data.threats || data.Threats);
        
        // PESTLE Data
        populateList('pestle-political', data.political || data.Political);
        populateList('pestle-economic', data.economic || data.Economic);
        populateList('pestle-social', data.social || data.Social);
        populateList('pestle-technological', data.technological || data.Technological);
        populateList('pestle-legal', data.legal || data.Legal);
        populateList('pestle-environmental', data.environmental || data.Environmental);

        // Porter's Five Forces Data
        populateList('porters-new-entrants', data['threat_of_new_entrants'] || data["Threat of New Entrants"]);
        populateList('porters-buyer-power', data['bargaining_power_of_buyers'] || data["Bargaining Power of Buyers"]);
        populateList('porters-supplier-power', data['bargaining_power_of_suppliers'] || data["Bargaining Power of Suppliers"]);
        populateList('porters-substitutes', data['threat_of_substitute_products'] || data["Threat of Substitute Products"]);
        populateList('porters-rivalry', data['industry_rivalry'] || data["Industry Rivalry"]);
    }

    function populateList(ulId, items) {
        const ul = document.getElementById(ulId);
        if (ul && items && Array.isArray(items)) {
            ul.innerHTML = '';
            items.forEach(text => {
                const li = document.createElement('li');
                li.textContent = text;
                ul.appendChild(li);
            });
        }
    }
    
    function clearAllLists() {
        const allLists = document.querySelectorAll('.analysis-grid ul');
        allLists.forEach(ul => ul.innerHTML = '');
    }
});