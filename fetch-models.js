
document.addEventListener('DOMContentLoaded', function() {

    const modelSelect = document.getElementById('model');
    const defaultModel = 'openai/gpt-4o-mini';

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
            populateModelDropdown(data.data);
        } catch (error) {
            console.error('Error fetching models:', error);
            settingsError.textContent = 'Error fetching models. Please check your API key and try again.';
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

    // Call fetchModels when the page loads
    fetchModels();
})
