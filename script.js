document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const chatButton = document.getElementById('chatButton');
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('model');
    const settingsError = document.getElementById('settingsError');
    const renderModeRadios = document.querySelectorAll('input[name="renderMode"]');
    const editModeRadios = document.querySelectorAll('input[name="editMode"]');
    const clearChatButton = document.getElementById('clearChatButton');
    const systemPromptInput = document.getElementById('systemPrompt');
    const artifactContainer = document.getElementById('artifact-tab');
    const codeChangeIndicator = document.getElementById('codeChangeIndicator');
    const editor = ace.edit("codeArea");

    editor.setOptions({selectionStyle: "text"})
    editor.setTheme("ace/theme/github");
    editor.session.setOption("wrap", true);
    editor.session.setUseWrapMode(true);
    editor.setOption("highlightActiveLine", false);
    document.getElementById('codeArea').style.fontSize='15px';

    const tabLabels = document.querySelectorAll('.tab-label');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLabels.forEach(label => {
        label.addEventListener('click', () => {
            switchTab(label.getAttribute('data-tab'));
        });
    });

    // New function to programmatically switch tabs
    window.switchTab = function(tabName) {
        tabLabels.forEach(lbl => lbl.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        const selectedLabel = document.querySelector(`.tab-label[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}-tab`);

        if (selectedLabel && selectedContent) {
            selectedLabel.classList.add('active');
            selectedContent.classList.add('active');
        }

        if(tabName == "code") {
            setTimeout(()=> {
                editor.resize();
            },0)
        }
    };


    // Global artifact object
    //let artifact = null;
    let artifact = {
        identifier: '',
        type: '',
        title: '',
        version: '',
        changed: false,
        content: null 
    };

    // The global messages list
    let messages = [
        { role: "system", content: "" }
    ];

    let renderMode = 'markdown';
    let codeChanged = false;
    let editMode = 'llm and user' 
    setEditorState();

    function setEditorState() {
        if(editMode == "llm only")
                 editor.setReadOnly(true)
        else
                 editor.setReadOnly(false)
    }

    // Set default values
    const defaultApiKey = '';

    if (!apiKeyInput.value) {
        apiKeyInput.value = defaultApiKey;
    }

    editModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
        editMode = this.value;
        setEditorState();
        });
    });

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
    systemPromptInput.addEventListener('input', updateSystemMessage);

    function updateSystemMessage() {
        messages[0].content = systemPromptInput.value.trim();
    }

    function clearChatMessages() {
        chatContainer.innerHTML = '';
        messages = [{ role: "system", content: systemPromptInput.value.trim() }];
        editor.session.off("change", changeHandler)
        editor.setValue("", -1);
        artifact.identifier= "";
        artifact.type= "";
        artifact.title= "";
        artifact.version= "";
        artifact.changed = false;
        artifact.content = "";
        updateArtifactDisplay();
    }
    
    function updateArtifact() {
        //console.log("updateArtifact called")
        if (artifact) {
	    const editorContent = editor.getValue();

            if(artifact.content != editorContent && 
		    editMode == "llm and user") {
                artifact.content = editorContent;
                console.log("artfcat.changed set")
                artifact.changed = true;
            }
        }
        updateArtifactDisplay();
    }

    function appendArtifactToMessage(userMessage) {
        if (artifact && artifact.changed) {
            artifact.version = (parseInt(artifact.version) + 1).toString();
            const artifactContent = `<artifact identifier="${artifact.identifier}" type="${artifact.type}" title="${artifact.title}" version="${artifact.version}">
        ${artifact.content}
        </artifact>`;

            artifact.changed = false;
            console.log("User is sending this artifact:")
            console.log(artifact)

            return `${userMessage}\n\n${artifactContent}`;
        }
        return userMessage;
    }

    function changeHandler(delta) {
        console.log("changeHandler called");
        updateArtifact();
    }

    async function sendMessage() {
        let userMessage = chatInput.value.trim();
        if (userMessage) {
            if (!apiKeyInput.value.trim() || !modelSelect.value) {
                settingsError.textContent = 'Please enter an OpenRouter API key.';
                settingsError.classList.add('visible'); 
                return;
            }

            const selectedText = editor.getSelectedText();
            if(selectedText) {
               userMessage = userMessage + "\n" + selectedText;
            }

	    if(editMode == "llm and user") { 
            	userMessage = appendArtifactToMessage(userMessage);
        }
            addMessage(userMessage, 'user');

            chatInput.value = '';
        
            try {
                const url = "https://openrouter.ai/api/v1/chat/completions";
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKeyInput.value.trim()}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": window.location.href,
                        "X-Title": "Web Chat App"
                    },
                    body: JSON.stringify({
                        "model": modelSelect.value,
                        "messages": messages,
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                settingsError.classList.remove('visible'); 
                const data = await response.json();
                let aiMessage = data.choices[0].message.content;
                //console.log(aiMessage)
                let found = extractArtifact(artifact, aiMessage);
                
                if (found) { 
                    console.log("AI sent this artifact:")
                    console.log(artifact)
                    editor.session.off("change", changeHandler)
                    editor.setValue(artifact.content, -1); 
                    updateArtifactDisplay();
                    editor.session.on('change', changeHandler);
                }

                addMessage(aiMessage, 'assistant');

            } catch (error) {
                console.error('Error:', error);
                settingsError.textContent = 'Error calling the API';
                settingsError.classList.add('visible'); 
            }
        }
    }

    function updateArtifactDisplay() {
        //console.log("Update Artifact Display: ")
        if (artifact) {
            if (artifact.type == "text/markdown") { 
                const markdown = artifact.content;
                const markedOptions = { breaks: true, gfm: true };
                const processedMarkdown = preprocessMessageForMath(markdown);
                let html = marked.parse(processedMarkdown, markedOptions);
                artifactContainer.innerHTML = html;

                MathJax.typesetPromise([artifactContainer]).catch((err) => console.error(err.message));
            } else {
                artifactContainer.innerHTML = artifact.content;
            }
        }
	else
           artifactContainer.innerHTML = null;
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
        scrollToBottom();

        messages.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: message
        });

        if (renderMode === 'markdown') {
            MathJax.typesetPromise([textElement]).catch((err) => 
                console.error(err.message));
        }
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
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
            const messageWithoutArtifact = removeArtifacts(message);
            const processedMessage = preprocessMessageForMath(messageWithoutArtifact);

            const markedOptions = { breaks: true, gfm: true };
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
        messages.forEach((msg) => {
            if (msg.role !== 'system') {
                const { messageElement, textElement } = createMessageElement(msg.content, msg.role);
                chatContainer.appendChild(messageElement);
            }
        });
        scrollToBottom();

        if (renderMode === 'markdown') {
            MathJax.typesetPromise([chatContainer]).catch((err) => console.error(err.message));
        }
    }

    // Observe changes in the chat container
    const resizeObserver = new ResizeObserver(() => {
        scrollToBottom();
    });
    resizeObserver.observe(chatContainer);

    window.addEventListener('load', function () {
        MathJax.startup.promise.then(() => {
            MathJax.typesetPromise().catch((err) => console.error(err.message));
        });
    });

    // Initial update of system message
    updateSystemMessage();

    // Artifact-related functions
    const MIME_TYPES = {
        "text/html": "HTML",
        "text/markdown": "Markdown",
        "image/svg+xml": "SVG",
        "application/x-python": "Python",
        "application/javascript": "JavaScript",
        "text/css": "CSS",
        "application/json": "JSON",
        "text/csv": "CSV",
        "text/plain": "Plain text"
    };

    function extractArtifact(artifact, text) {
        const pattern = /<artifact\s+(.*?)>([\s\S]*?)<\/artifact>/g;
        let match = pattern.exec(text);

        if (match) {
            const attributesString = match[1];
            artifact.content = match[2].trim();
            const attributePattern = /(\w+)="([^"]*)"/g;
            let attrMatch;
            while ((attrMatch = attributePattern.exec(attributesString)) !== null) {
                const [, key, value] = attrMatch;
                if (key in artifact) {
                    artifact[key] = value;
                }
            }
            return true
        }

        return false;
    }

    function removeArtifacts(text) {
        const pattern = /<artifact\s+.*?>[\s\S]*?<\/artifact>/g;
        return text.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim();
    }

});
