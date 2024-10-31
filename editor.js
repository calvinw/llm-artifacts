// DOM Elements
const previewContent = document.getElementById('preview');
const systemPromptTextArea = document.getElementById('system-prompt');
const apiKeyInput = document.getElementById('apiKey');
const currentModelDisplay = document.getElementById('current-model');
const artifactTitle = document.getElementById('artifact-title');
const typeSelect = document.getElementById('type-select');
const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const clearChatButton = document.getElementById('clear-messages');
const displayModeRadios = document.getElementsByName('displayMode');

const apiKey=""


// Initialize ACE editor
let acePreviewEditor = ace.edit("artifact");
acePreviewEditor.setOptions({
    selectionStyle: "text",
    highlightActiveLine: false,
    fontSize: "18px",
    fontFamily: "Monaco, Menlo, 'Ubuntu Mono', 'Droid Sans Mono', Consolas, monospace",
    showPrintMargin: false
});
acePreviewEditor.setTheme("ace/theme/github");
acePreviewEditor.session.setOption("wrap", true);
acePreviewEditor.session.setUseWrapMode(true);

let chatEngine = null;
const model = "openai/gpt-4-mini" 

async function initializeChatEngine(apiKey) {
    chatEngine = new ChatEngine({
        model : model,
        apiKey: apiKey,
        systemPrompt: DEFAULT_SYSTEM_PROMPT
    });

    window.chatEngine = chatEngine;

    typeSelect.value = DEFAULT_OPTION
    typeSelect.addEventListener('change', handleTypeChange);

    chatEngine.subscribe("messages", updateMessagesUI);

    // Set up subscriptions
  
    chatEngine.subscribe("model", function(newValue){
         currentModelDisplay.textContent = newValue;
    })
    chatEngine.subscribe("artifact.title", function(title){
        artifactTitle.textContent= title; 
    });
    chatEngine.subscribe("artifact.content", renderPreview);
    chatEngine.subscribe("artifact.content", updateArtifactUI);

    //subscribe to the system message
    chatEngine.subscribe("messages.0.content", function(content) {
        systemPromptTextArea.value = content;
    });

    systemPromptTextArea.addEventListener('change', function() {
        chatEngine.setSystemMessage(this.value.trim());
    });


    acePreviewEditor.session.on('change', debouncedUpdate);
    acePreviewEditor.on('blur', () => {
        const value = acePreviewEditor.getValue();
        const artifact = chatEngine.getArtifact();
        if (value !== artifact.content) {
            chatEngine.setArtifactContent(value);
            chatEngine.setLlmNeedsUserChanges(true);
        }
    });

    // Add event listener for radio buttons
    displayModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            //console.log("display mode changes")
            updateMessagesUI();
        });
    });

    clearChatButton.addEventListener('click', () => {
        chatEngine.store.commit('clearMessages');
        chatEngine.setLlmNeedsUserChanges(true);
    });

}

// Event listeners
sendButton.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage();
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    let message = messageInput.value.trim();
    if (!message) return;

    messageInput.value = '';
    messageInput.focus();

    const selectedText = acePreviewEditor.getSelectedText();
    if(selectedText) {
       message += "\n" + selectedText;
    }

    try {
        await chatEngine.sendMessage(message);
    } catch (error) {
        console.error('Error sending message:', error);
        settingsError.textContent = 'Error sending message. Please check your API key and selected model.';
        settingsError.classList.remove('d-none');
    }
}

const messagesInsideDiv = document.getElementById('messages-inside');
function updateMessagesUIText(showArtifacts) {
    const dashes = "=".repeat(60);
    const messages = chatEngine.getMessages();
    
    let content = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n' + dashes + '\n');

    if (!showArtifacts) {
        // Remove artifacts and clean up resulting empty lines
        content = content
            .replace(/<artifact[\s\S]*?<\/artifact>/g, '')
            // Remove lines that only contain whitespace
            .replace(/^\s*$\n/gm, '')
            // Remove multiple consecutive empty lines
            .replace(/\n{3,}/g, '\n\n');
    }

    messagesInsideDiv.textContent = content;
}

function updateMessagesUIMarkdown() {
    const messages = chatEngine.getMessages();
    const markedOptions = { breaks: true, gfm: true };

    let messagesHTML = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => {
            const roleLabel = msg.role.toUpperCase();

            // Remove artifact tags and their content always
            const cleanContent = msg.content.replace(/<artifact[\s\S]*?<\/artifact>/g, '').trim();
            const contentHtml = marked.parse(cleanContent, markedOptions)
                .replace(/^<p>|<\/p>$/g, '')
                .replace(/<p>/g, '<br>')
                .replace(/<\/p>/g, '');
            return `<div class="chat-message ${msg.role}-message"><b>${roleLabel}</b>:${contentHtml}</div>`;
        })
        .join('');

    messagesInsideDiv.innerHTML = messagesHTML;

}


function updateMessagesUI() {
    const displayMode = 
    document.querySelector('input[name="displayMode"]:checked').value;
    
    if (displayMode === 'markdown') {
        updateMessagesUIMarkdown();
    } else if (displayMode === 'text') {
        updateMessagesUIText(false);
    } else {
        updateMessagesUIText(true);
    }

    const messagesContent = document.querySelector('.messages-content');
    messagesContent.scrollTop = messagesContent.scrollHeight;
}

function handleTypeChange(event) {
    const type = event.target.value;
    let system, artifact;
    
    if (type === 'markdown') {
        system = MARKDOWN_SYSTEM_PROMPT;
        artifact = MARKDOWN_ARTIFACT;
    } else if (type === 'orderbot') {
        system = ORDERBOT_SYSTEM_PROMPT;
        artifact = ORDERBOT_ARTIFACT;
    } else if (type === 'svg') {
        system = SVG_SYSTEM_PROMPT;
        artifact = SVG_ARTIFACT;
    } else if (type === 'html') {
        system = HTML_SYSTEM_PROMPT;
        artifact = HTML_ARTIFACT;
    } 

const systemTab = document.querySelector('a[href="#system"]');
const tab = new bootstrap.Tab(systemTab);
tab.show();

	chatEngine.setSystemMessage(system)
	chatEngine.clearMessages();
  chatEngine.store.commit('setArtifact', {
     ...artifact,
   });
  chatEngine.setLlmNeedsUserChanges(true);
}

function renderPreview() {
    const artifact = chatEngine.getArtifact();
    const type = artifact.type;
    const content = artifact.content;
    let html = null;

    if (type === 'text/markdown') {
        const markedOptions = { breaks: true, gfm: true };
        html = marked.parse(content, markedOptions);
    } else if (type === 'text/html') {
        html = content;
    } else if (type === 'image/svg+xml') {
        html = content;
    }
    previewContent.innerHTML = html;
}

function updateArtifactUI() {
    const artifact = chatEngine.getArtifact();
    if (acePreviewEditor.getValue() !== artifact.content) {
        acePreviewEditor.session.off("change", debouncedUpdate);
        acePreviewEditor.setValue(artifact.content, -1);
        acePreviewEditor.session.on("change", debouncedUpdate);
    }
}

const artifactTab = document.getElementById('artifact-tab');
artifactTab.addEventListener('shown.bs.tab', function (e) {
    if (acePreviewEditor) {
        acePreviewEditor.resize();
        acePreviewEditor.renderer.updateFull();
        // Double check content is in sync
        const artifact = chatEngine.getArtifact();
        if (acePreviewEditor.getValue() !== artifact.content) {
            //console.log("SETTING CONTENT...WASNT SET");
            acePreviewEditor.setValue(artifact.content, -1);
        }
    }
});

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced update function
const debouncedUpdate = debounce(() => {
    const newValue = acePreviewEditor.getValue();
    const artifact = chatEngine.getArtifact();
    if (newValue !== artifact.content) {
        chatEngine.setArtifactContent(newValue);
        chatEngine.setLlmNeedsUserChanges(true);
    }
}, 1000);

document.addEventListener('DOMContentLoaded', function() {
    if (typeof apiKey !== 'undefined' && apiKey) {
        apiKeyInput.value = apiKey;
        initializeChatEngine(apiKey);
    }
    else {
        apiKeyInput.addEventListener('input', function() {
            const key = apiKeyInput.value.trim();
            if (key) {
                initializeChatEngine(key);
            }
        });
    }
});
