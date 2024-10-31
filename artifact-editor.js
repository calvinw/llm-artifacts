import ChatEngine from './chat-engine.js';

// DOM Elements - Move these to the top
const clearChatButton = document.getElementById('clear-chat');
const messagesDiv = document.getElementById('messages');
const previewDiv = document.getElementById('preview');
//const artifactContent = document.getElementById('artifact-content');
const artifactTitle = document.getElementById('artifact-title');
const artifactVersion = document.getElementById('artifact-version');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('model');
const settingsError = document.getElementById('settingsError');
const currentModelDisplay = document.getElementById('current-model');
const systemPromptTextarea = document.getElementById('system-prompt');
const prevVersionBtn = document.getElementById('prev-version');
const nextVersionBtn = document.getElementById('next-version');
const displayModeRadios = document.getElementsByName('displayMode');
const fileTypeSelect = document.getElementById('file-type-select');
const clearRevisionsButton = document.getElementById('clear-revisions');
const artifactContentDiv = document.getElementById('artifact-content');

let editor = null;
editor = ace.edit("artifact-content");
editor.setOptions({
    selectionStyle: "text",
    highlightActiveLine: false,
    fontSize: "18px",
    fontFamily: "Monaco, Menlo, 'Ubuntu Mono', 'Droid Sans Mono', Consolas, monospace",
    showPrintMargin: false  // Removes the vertical line in the middle
});
editor.setTheme("ace/theme/github");
editor.session.setOption("wrap", true);
editor.session.setUseWrapMode(true);

function resizeEditor() {
    editor.resize();
}

// Add event listener for radio buttons
displayModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        updateMessagesUI();
    });
});

clearChatButton.addEventListener('click', () => {
    chatEngine.store.commit('clearMessages');
    chatEngine.setLlmNeedsUserChanges(true);
});

// Get stored API key or use default for development
const apiKey =""	 
const model = 'openai/gpt-4o-mini';

let chatEngine = null;

async function initializeChatEngine(apiKey) {

  chatEngine = new ChatEngine({
        apiKey: apiKey,
        model: model,
        systemPrompt: DEFAULT_SYSTEM_PROMPT})

	window.chatEngine = chatEngine;

	chatEngine.subscribe("model", function(newValue){
	     currentModelDisplay.textContent = newValue;
	})

    chatEngine.subscribe("artifact.content", renderPreview);
    chatEngine.subscribe("artifact.content", updateArtifactUI);
    // chatEngine.subscribe("currentVersion", function(val) {
    //     artifactVersion.textContent = `v${val}`;
    // });
    chatEngine.subscribe("messages", updateMessagesUI);

	chatEngine.subscribe("messages.0.content", function(content){
	     systemPromptTextarea.value = content;
	})

	fileTypeSelect.value = DEFAULT_OPTION 

const initialMessages = [
     //"Can you see my document?",
     // "Can you remove the red rectangle?",
     // "Can you remove the green rectangle?",
     // "Can you put in blue circle?",
];

 for (const message of initialMessages) {
       try {
           const response = await chatEngine.sendMessage(message);
       } catch (error) {
           console.error(`Error sending message: ${message}`, error);
       }
   }
}

// Add this function to handle file type changes
function handleFileTypeChange(event) {
    const fileType = event.target.value;
    let newSystemPrompt, newArtifact;
    
    if (fileType === 'markdown') {
        newSystemPrompt = MARKDOWN_SYSTEM_PROMPT;
        newArtifact = MARKDOWN_ARTIFACT;
    } else if (fileType === 'orderbot') {
        newSystemPrompt = ORDERBOT_SYSTEM_PROMPT;
        newArtifact = ORDERBOT_ARTIFACT;
    } else if (fileType === 'svg') {
        newSystemPrompt = SVG_SYSTEM_PROMPT;
        newArtifact = SVG_ARTIFACT;
    } else if (fileType === 'html') {
        newSystemPrompt = HTML_SYSTEM_PROMPT;
        newArtifact = HTML_ARTIFACT;
    } 

	chatEngine.setSystemMessage(newSystemPrompt)
	chatEngine.clearMessages();
  console.log("seting Artifact")
	     chatEngine.store.commit('setArtifact', {
		 ...newArtifact,
	     });
        chatEngine.setLlmNeedsUserChanges(true);
}


// Add these event listeners
fileTypeSelect.addEventListener('change', handleFileTypeChange);

modelSelect.addEventListener('change', function() {
    chatEngine.store.commit("setModel", this.value);
});

// System prompt handler
systemPromptTextarea.addEventListener('change', function() {
    const newSystemPrompt = this.value.trim();
    if (newSystemPrompt) {
        chatEngine.store.commit('setSystemMessage', newSystemPrompt);
    }
});

function renderPreview() {
    const artifact = chatEngine.getArtifact();
    const type = artifact.type;
    const content = artifact.content;
    let html = null;

    if (type === 'text/markdown') {
        const markedOptions = { breaks: true, gfm: true };
        html = marked.parse(content, markedOptions);
    } else if (type === 'text/html') {
        html = content
    } else if (type === 'image/svg+xml') {
        html = content
    } 
    previewDiv.innerHTML = html;
}

// UI update functions

function updateArtifactUI() {
  console.log("updatingArtifactUI");
    const artifact = chatEngine.getArtifact();
    artifactTitle.textContent = artifact.title;
    console.log("artifact.content:" + artifact.content);
    console.log("editor.getValue():" + editor.getValue());
    if (editor.getValue() != artifact.content) {
        console.log("actually updateing it");
        editor.session.off("change", debouncedUpdate);
        editor.setValue(artifact.content, -1);  // -1 moves cursor to start
        editor.session.on("change", debouncedUpdate);
    }
}

const artifactTab = document.getElementById('artifact-tab');
artifactTab.addEventListener('shown.bs.tab', function (e) {
    if (editor) {
        editor.resize();
        editor.renderer.updateFull();
        // Double check content is in sync
        const artifact = chatEngine.getArtifact();
        if (editor.getValue() !== artifact.content) {
            console.log("SETTING CONTENT...WASNT SET");
            editor.setValue(artifact.content, -1);
        }
    }
});

function updateMessagesUI() {
    const displayMode = document.querySelector('input[name="displayMode"]:checked').value;
    
    if (displayMode === 'markdown') {
        updateMessagesUIMarkdown();
    } else if (displayMode === 'text') {
        updateMessagesUIText(false);
    } else {
        updateMessagesUIText(true);
    }
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

    messagesDiv.innerHTML = messagesHTML;

    const messagesContent = document.querySelector('.messages-content');
    messagesContent.scrollTop = messagesContent.scrollHeight;
}

function updateMessagesUIText(shouldShowArtifacts) {
    const dashes = "=".repeat(60);
    const messages = chatEngine.getMessages();
    
    let content = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n' + dashes + '\n');

    if (!shouldShowArtifacts) {
        // Remove artifacts and clean up resulting empty lines
        content = content
            .replace(/<artifact[\s\S]*?<\/artifact>/g, '')
            // Remove lines that only contain whitespace
            .replace(/^\s*$\n/gm, '')
            // Remove multiple consecutive empty lines
            .replace(/\n{3,}/g, '\n\n');
    }

    messagesInnerDiv.textContent = content;
    
    const messagesContent = document.querySelector('.messages-content');
    messagesContent.scrollTop = messagesContent.scrollHeight;
}

//
// Message handling
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    messageInput.value = '';
    messageInput.focus();

    try {
        await chatEngine.sendMessage(message);
    } catch (error) {
        console.error('Error sending message:', error);
        settingsError.textContent = 'Error sending message. Please check your API key and selected model.';
        settingsError.classList.remove('d-none');
    }
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
    const newValue = editor.getValue();
    const artifact = chatEngine.getArtifact();
    if (newValue != artifact.content) {
       console.log("debounced version")
        chatEngine.setArtifactContent(newValue);
        chatEngine.setLlmNeedsUserChanges(true);
    }
}, 1000);

// Set up both listeners

editor.session.on('change', debouncedUpdate);
editor.on('blur', () => {
    const newValue = editor.getValue();
    const artifact = chatEngine.getArtifact();
    if (newValue != artifact.content) {
       console.log("new value sent")
        chatEngine.setArtifactContent(newValue);
        chatEngine.setLlmNeedsUserChanges(true);
    }
});


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


