document.addEventListener('DOMContentLoaded', function() {
    const divider = document.getElementById('divider');
    const divider2 = document.getElementById('divider2');
    const container = document.getElementById('container');
    const panel1 = document.getElementById('panel1');
    const panel2 = document.getElementById('panel2');
    const panel3 = document.getElementById('panel3');

    let isResizing = false;
    let startX = 0;
    let startWidthPanel1 = 0;
    let startWidthPanel2 = 0;
    let startWidthPanel3 = 0;

        divider.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection while resizing
            isResizing = 'panel1-panel2';
            startX = e.clientX;
            startWidthPanel1 = panel1.offsetWidth;
            startWidthPanel2 = panel2.offsetWidth;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        divider2.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection while resizing
            isResizing = 'panel2-panel3';
            startX = e.clientX;
            startWidthPanel2 = panel2.offsetWidth;
            startWidthPanel3 = panel3.offsetWidth;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        function handleMouseMove(e) {
            if (!isResizing) return;

            const dx = e.clientX - startX;
            const containerWidth = container.offsetWidth;

            if (isResizing === 'panel1-panel2') {
                const newWidthPanel1 = startWidthPanel1 + dx;
                const newWidthPanel2 = startWidthPanel2 - dx;

                const panel1Percentage = (newWidthPanel1 / containerWidth) * 100;
                const panel2Percentage = (newWidthPanel2 / containerWidth) * 100;

                if (panel1Percentage > 10 && panel2Percentage > 10) {
                    panel1.style.flexBasis = `${panel1Percentage}%`;
                    panel2.style.flexBasis = `${panel2Percentage}%`;
                }
            } else if (isResizing === 'panel2-panel3') {
                const newWidthPanel2 = startWidthPanel2 + dx;
                const newWidthPanel3 = startWidthPanel3 - dx;

                const panel2Percentage = (newWidthPanel2 / containerWidth) * 100;
                const panel3Percentage = (newWidthPanel3 / containerWidth) * 100;

                if (panel2Percentage > 10 && panel3Percentage > 10) {
                    panel2.style.flexBasis = `${panel2Percentage}%`;
                    panel3.style.flexBasis = `${panel3Percentage}%`;
                }
            }
        }

        function handleMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
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

                addMessage(aiMessage, 'assistant');
            } catch (error) {
                console.error('Error:', error);
                settingsError.textContent = 'Error calling the API. Please check your settings and try again.';
            }
        }
    }

    function createMessageElement(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        const iconElement = document.createElement('div');
        iconElement.classList.add('message-icon');
        iconElement.textContent = sender === 'user' ? 'Me:' : 'AI:';

        const textElement = document.createElement('div');
        textElement.classList.add('message-text');

        const renderedMessage = renderMessageText(message);
        textElement.innerHTML = renderedMessage;

        messageContent.appendChild(iconElement);
        messageContent.appendChild(textElement);
        messageElement.appendChild(messageContent);

        return { messageElement, textElement };
    }

    function addMessage(message, sender) {
        const { messageElement, textElement } = createMessageElement(message, sender);
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
        return message.replace(/\\\(/g, '\\\\(')
                         .replace(/\\\)/g, '\\\\)')
                         .replace(/\\\[/g, '\\\\[')
                         .replace(/\\\]/g, '\\\\]')
                         .replace(/\\\$/g, '\\\\$');
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
            const { messageElement, textElement } = createMessageElement(msg.rawContent, msg.role);
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
