document.addEventListener('DOMContentLoaded', () => {
    const topicInput = document.getElementById('topic-input');
    const generateBtn = document.getElementById('generate-personas-btn');
    const spinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const personasGrid = document.getElementById('personas-grid');

    const BACKEND_URL = "https://my-ai-generator-backend.onrender.com";

    generateBtn.addEventListener('click', async () => {
        const topic = topicInput.value;
        if (!topic) {
            alert('Please describe your product or business.');
            return;
        }

        spinner.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        personasGrid.innerHTML = ''; // Clear previous results

        try {
            const response = await fetch(`${BACKEND_URL}/generate-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic, analysis_type: "Customer Personas" }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'An unknown error occurred.');
            }

            const data = await response.json();
            
            if (data.personas && Array.isArray(data.personas)) {
                data.personas.forEach(persona => {
                    const card = document.createElement('div');
                    card.className = 'persona-card';

                    let content = `<h2>${persona.name || 'N/A'}</h2>`;
                    content += `<p>${persona.bio || ''}</p>`;
                    content += `<h3>Demographics</h3><p>${persona.demographics || 'N/A'}</p>`;
                    content += `<h3>Goals</h3><ul>${(persona.goals || []).map(g => `<li>${g}</li>`).join('')}</ul>`;
                    content += `<h3>Frustrations</h3><ul>${(persona.frustrations || []).map(f => `<li>${f}</li>`).join('')}</ul>`;
                    
                    card.innerHTML = content;
                    personasGrid.appendChild(card);
                });
            }

        } catch (error) {
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.classList.remove('hidden');
            console.error('Persona generation failed:', error);
        } finally {
            spinner.classList.add('hidden');
        }
    });
});