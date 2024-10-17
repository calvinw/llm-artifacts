document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const chatButton = document.getElementById('chatButton');
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('model');
    const settingsError = document.getElementById('settingsError');
    const renderModeRadios = document.querySelectorAll('input[name="renderMode"]');
    const clearChatButton = document.getElementById('clearChatButton');
    const systemPromptInput = document.getElementById('systemPrompt');
    const artifactContainer = document.getElementById('artifact-tab');

    let messageHistory = [];
    let renderMode = 'markdown';

    // Set default values
    const defaultApiKey = '';

    if (!apiKeyInput.value) {
        apiKeyInput.value = defaultApiKey;
    }

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
            if (!apiKeyInput.value.trim() || !modelSelect.value) {
                settingsError.textContent = 'Please enter an OpenRouter API key.';
		settingsError.classList.add('visible'); 
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
                        "Content-Type": "application/json",
                        "HTTP-Referer": window.location.href,
                        "X-Title": "Web Chat App"
                    },
                    body: JSON.stringify({
                        "model": modelSelect.value,
                        "messages": currentMessageHistory,
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

		settingsError.classList.remove('visible'); 
                const data = await response.json();
                let aiMessage = data.choices[0].message.content;

		artifact = extractArtifactContent(aiMessage);
		console.log(artifact)
		artifactContainer.innerHTML = artifact;
                addMessage(aiMessage, 'assistant');

            } catch (error) {
                console.error('Error:', error);
	        settingsError.textContent = 'Error calling the API';
		settingsError.classList.add('visible'); 
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

	function extractArtifactContent(text) {
		  const regex = /<artifact>([\s\S]*?)<\/artifact>/;
		  const match = text.match(regex);
		  
		  if (match && match[1]) {
		      return match[1].trim();
		  } else {
		       return null;
		  }
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
        });

        if (renderMode === 'markdown') {
	    MathJax.typesetPromise([chatContainer]).catch((err) => console.error(err.message));
        }
    }

    window.addEventListener('load', function () {
        MathJax.startup.promise.then(() => {
            MathJax.typesetPromise().catch((err) => console.error(err.message));
        });
    });
});
