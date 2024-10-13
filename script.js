document.addEventListener('DOMContentLoaded', function() {
    let isDragging = false;
    let startX, startWidth1, startWidth2, divider;

    document.querySelectorAll('.divider').forEach(div => {
        div.addEventListener('mousedown', function(e) {
            isDragging = true;
            divider = e.target;
            startX = e.clientX;

            const prevPanel = divider.previousElementSibling;
            const nextPanel = divider.nextElementSibling;

            startWidth1 = prevPanel.offsetWidth;
            startWidth2 = nextPanel.offsetWidth;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });

    function onMouseMove(e) {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const prevPanel = divider.previousElementSibling;
        const nextPanel = divider.nextElementSibling;

        const newWidth1 = startWidth1 + dx;
        const newWidth2 = startWidth2 - dx;

        if (newWidth1 > 50 && newWidth2 > 50) {
            prevPanel.style.width = `${newWidth1}px`;
            nextPanel.style.width = `${newWidth2}px`;
        }
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const chatButton = document.getElementById('chatButton');
    const apiKeyInput = document.getElementById('apiKey');
    const modelInput = document.getElementById('model');
    const settingsError = document.getElementById('settingsError');
    const renderModeRadios = document.querySelectorAll('input[name="renderMode"]');

    const clearChatButton = document.getElementById('clearChatButton');
    const systemPromptInput = document.getElementById('systemPrompt');

    let messageHistory = [];

    // Set default values
    const defaultApiKey = '';
    const defaultModel = 'openai/gpt-4o-mini';

    if (!apiKeyInput.value) {
        apiKeyInput.value = defaultApiKey;
    }

    if (!modelInput.value) {
        modelInput.value = defaultModel;
    }

    let renderMode = 'markdown';

    renderModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            renderMode = this.value;
            rerenderMessages();
        });
    });

    chatButton.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    clearChatButton.addEventListener('click', clearChatMessages);

    function clearChatMessages() {
        chatContainer.innerHTML = '';
        messageHistory = [];
    }

    async function sendMessage() {
        let userMessage = chatInput.value.trim();
        if (userMessage) {
            if (!apiKeyInput.value.trim() || !modelInput.value.trim()) {
                settingsError.textContent = 'Please enter API key and model in the settings panel.';
                return;
            }

            addMessage(userMessage, 'user');

            let currentMessageHistory = [];

            const systemPrompt = systemPromptInput.value.trim();
            if (systemPrompt) {
                currentMessageHistory.push({ role: "system", content: systemPrompt });
            }

            currentMessageHistory.push({ role: "user", content: userMessage });
            currentMessageHistory = currentMessageHistory.concat(
                messageHistory.map(msg => ({ role: msg.role, content: msg.rawContent }))
            );

            chatInput.value = '';

            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKeyInput.value.trim()}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": modelInput.value.trim(),
                        "messages": currentMessageHistory,
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                let aiMessage = data.choices[0].message.content;

                addMessage(aiMessage, 'bot');
            } catch (error) {
                console.error('Error:', error);
                settingsError.textContent = 'Error calling the API. Please check your settings and try again.';
            }
        }
    }

    function addMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        const iconElement = document.createElement('div');
        iconElement.classList.add('message-icon');
        iconElement.textContent = sender === 'user' ? 'Human:' : 'AI:';

        const textElement = document.createElement('div');
        textElement.classList.add('message-text');

        const renderedMessage = renderMessageText(message);
        textElement.innerHTML = renderedMessage;

        messageContent.appendChild(iconElement);
        messageContent.appendChild(textElement);
        messageElement.appendChild(messageContent);

        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        messageHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            rawContent: message
        });

        if (renderMode === 'markdown') {
            MathJax.typesetPromise([textElement]).catch((err) => console.error(err.message));
        }
    }

    function preprocessMessageForMath(message) {
        message = message.replace(/\\\(/g, '\\\\(').replace(/\\\)/g, '\\\\)');
        message = message.replace(/\\\[/g, '\\\\[').replace(/\\\]/g, '\\\\]');
        return message;
    }

    function renderMessageText(message) {
        if (renderMode === 'text') {
            return escapeHtml(message).replace(/\n/g, '<br>');
        } else {
            const markedOptions = { breaks: true, gfm: true };
            const processedMessage = preprocessMessageForMath(message);
            let renderedMessage = marked.parse(processedMessage, markedOptions);
            return renderedMessage;
        }
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function rerenderMessages() {
        chatContainer.innerHTML = '';
        messageHistory.forEach((msg) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message');
            messageElement.classList.add(msg.role === 'user' ? 'user-message' : 'bot-message');

            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');

            const iconElement = document.createElement('div');
            iconElement.classList.add('message-icon');
            iconElement.textContent = msg.role === 'user' ? 'Human:' : 'AI:';

            const textElement = document.createElement('div');
            textElement.classList.add('message-text');

            const renderedMessage = renderMessageText(msg.rawContent);
            textElement.innerHTML = renderedMessage;

            messageContent.appendChild(iconElement);
            messageContent.appendChild(textElement);
            messageElement.appendChild(messageContent);

            chatContainer.appendChild(messageElement);

            if (renderMode === 'markdown') {
                MathJax.typesetPromise([textElement]).catch((err) => console.error(err.message));
            }
        });
    }

    window.addEventListener('load', function () {
        MathJax.startup.promise.then(() => {
            MathJax.typesetPromise().catch((err) => console.error(err.message));
        });
    });
});
