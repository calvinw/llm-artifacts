document.addEventListener('DOMContentLoaded', function() {
    const modelSelect = document.getElementById('model');
    const defaultModel = 'openai/gpt-4o-mini';
    let modelsData = {};

    // Fetch and populate models
    async function fetchModels() {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/models", {
                headers: {
                    "HTTP-Referer": window.location.href,
                    "X-Title": "Web Chat App"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            modelsData = data.data.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {});
            populateModelDropdown(data.data);
            displayModelInfo(defaultModel);
        } catch (error) {
            console.error('Error fetching models:', error);
            const settingsError = document.getElementById('settingsError');
            if (settingsError) {
                settingsError.textContent = 'Error fetching models. Please check your API key and try again.';
            }
        }
    }

    function populateModelDropdown(models) {
        const specifiedModels = [
            "openai/gpt-4o-mini",
            "openai/gpt-4o",
            "openai/gpt-3.5-turbo",
            "openai/gpt-4-turbo",
            "anthropic/claude-3-haiku",
            "anthropic/claude-3.5-sonnet",
            "google/gemini-pro-1.5",
            "google/gemini-flash-1.5",
            "mistralai/mistral-large",
            "mistralai/mistral-medium",
            "meta-llama/llama-3-70b-instruct",
            "meta-llama/llama-3-8b-instruct:free",
            "microsoft/wizardlm-2-8x22b",
            "nousresearch/hermes-3-llama-3.1-405b:free"
        ];

        // Clear existing options
        modelSelect.innerHTML = '<option value="">Select a model</option>';

        // Add specified models first
        specifiedModels.forEach(modelId => {
            if (models.some(m => m.id === modelId)) {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = modelId;
                modelSelect.appendChild(option);
            }
        });

        // Add remaining models
        models.forEach(model => {
            if (!specifiedModels.includes(model.id)) {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.id;
                modelSelect.appendChild(option);
            }
        });

        // Set default model
        modelSelect.value = defaultModel;
    }

    function displayModelInfo(modelId) {
        const model = modelsData[modelId];
        if (!model) return;

        const modelInfoDiv = document.getElementById('modelInfo');
        if (!modelInfoDiv) {
            console.error('Model info div not found');
            return;
        }

        const promptPrice = parseFloat(model.pricing.prompt) * 1000;
        const completionPrice = parseFloat(model.pricing.completion) * 1000;

        modelInfoDiv.innerHTML = `
            <h3>${model.id}</h3>
            <p><strong>Description:</strong> ${model.description || 'No description available.'}</p>
            <p><strong>Pricing:</strong> $${promptPrice.toFixed(4)}/$${completionPrice.toFixed(4)} per 1k tokens</p>
        `;
    }

    // Event listener for model selection change
    modelSelect.addEventListener('change', function() {
        displayModelInfo(this.value);
    });

    // Call fetchModels when the page loads
    fetchModels();
});
