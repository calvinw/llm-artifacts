import ChatEngine from './chat-engine.js';


// DOM Elements - Move these to the top
const clearChatButton = document.getElementById('clear-chat');
const messagesDiv = document.getElementById('messages');
const previewDiv = document.getElementById('preview');
const artifactContent = document.getElementById('artifact-content');
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

// Add event listener for radio buttons
displayModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        updateMessagesUI();
    });
});

clearChatButton.addEventListener('click', () => {
    chatEngine.store.commit('clearMessages');
});

// Get stored API key or use default for development
const apiKey = '';
const model = 'openai/gpt-4o-mini';

let chatEngine = new ChatEngine({
        apiKey: apiKey,
        model: model,
        systemPrompt: DEFAULT_SYSTEM_PROMPT
})

window.chatEngine = chatEngine;

// Add this function to handle file type changes
function handleFileTypeChange(event) {
    const fileType = event.target.value;
    let newSystemPrompt, newArtifact;
    
    if (fileType === 'markdown') {
        newSystemPrompt = DEFAULT_MARKDOWN_SYSTEM_PROMPT;
        newArtifact = DEFAULT_MARKDOWN_ARTIFACT;
    } else if (fileType === 'svg') {
        newSystemPrompt = DEFAULT_SVG_SYSTEM_PROMPT;
        newArtifact = DEFAULT_SVG_ARTIFACT;
    } else if (fileType === 'html') {
        newSystemPrompt = DEFAULT_HTML_SYSTEM_PROMPT;
        newArtifact = DEFAULT_HTML_ARTIFACT;
    } 

    // Update system prompt
    // systemPromptTextarea.value = newSystemPrompt;
    //
    //
    // chatEngine.store.state.messages[0].content = newSystemPrompt;
    //
    // // Update artifact
    // chatEngine.store.commit('setArtifact', {
    //     ...newArtifact,
    //     changed: false 
    // });
    //
    // // Clear revisions
    // console.log("setting revision 0");
    // chatEngine.store.state.revisions = {};
    // chatEngine.store.state.revisions[0] = newArtifact;
    //
    // // Update UI
    // updateMessagesUI();
    // updateArtifactUI();
    // updateRevisionNavigationButtons();
}

// Add this function to handle clearing revisions
function handleClearRevisions() {
    // const currentArtifact = chatEngine.getArtifact();
    // chatEngine.store.state.revisions = {};
    // chatEngine.store.state.revisions[0] = currentArtifact;
    // chatEngine.store.commit('setArtifact', {
    //     ...currentArtifact,
    //     version: 0,
    //     changed: false
    // });
    updateRevisionNavigationButtons();
}

// Add these event listeners
fileTypeSelect.addEventListener('change', handleFileTypeChange);
clearRevisionsButton.addEventListener('click', handleClearRevisions);

// Initialize file type select with current value
fileTypeSelect.value = chatEngine.getArtifact().type === 'text/markdown' ? 'markdown' : 'svg';

// Initialize API key input, model display, and system prompt
apiKeyInput.value = apiKey;
systemPromptTextarea.value = chatEngine.getMessages()[0].content;

modelSelect.addEventListener('change', function() {
    chatEngine.store.commit("setModel", this.value);
});

chatEngine.subscribe("model", function(newValue){
     currentModelDisplay.textContent = newValue;
});

// Add this to your setupSubscriptions function
// chatEngine.subscribe("artifact.version", updateRevisionNavigationButtons);

// // Add this function to handle revision navigation
// function updateRevisionNavigationButtons() {
//     const currentVersion = chatEngine.getArtifact().version;
//     const revisions = Object.keys(chatEngine.store.state.revisions)
//         .map(v => parseInt(v))
//         .sort((a, b) => a - b);
//
//     console.log("currentVersion: " + currentVersion)
//     console.log("revisions")
//     console.log(revisions)
//     console.log(revisions.length)
//     
//     const currentIndex = revisions.indexOf(currentVersion);
//     
//     console.log("currentIndex: " + currentIndex)
//     prevVersionBtn.disabled = currentIndex <= 0;
//     nextVersionBtn.disabled = currentIndex === revisions.length - 1;
// }
//
// Add click handlers for the navigation buttons
// prevVersionBtn.addEventListener('click', () => {
//     const currentVersion = chatEngine.getArtifact().version;
//   console.log("prev button click: currentVersion: ", currentVersion)
//     const revisions = Object.keys(chatEngine.store.state.revisions)
//         .map(v => parseInt(v))
//         .sort((a, b) => a - b);
//     
//     const currentIndex = revisions.indexOf(currentVersion);
//     console.log("prev button currentIndex: ", currentIndex)
//     if (currentIndex > 0) {
//         const prevVersion = revisions[currentIndex - 1];
//         const revision = chatEngine.store.state.revisions[prevVersion];
//         chatEngine.store.commit('setArtifact', revision);
//         //chatEngine.store.commit('setArtifactChanged', true);
//         updateRevisionNavigationButtons();
//     }
// });

// nextVersionBtn.addEventListener('click', () => {
//     const currentVersion = chatEngine.getArtifact().version;
//   console.log("prev button click: ", currentVersion)
//     const revisions = Object.keys(chatEngine.store.state.revisions)
//         .map(v => parseInt(v))
//         .sort((a, b) => a - b);
//     
//     const currentIndex = revisions.indexOf(currentVersion);
//     if (currentIndex < revisions.length - 1) {
//         const nextVersion = revisions[currentIndex + 1];
//         const revision = chatEngine.store.state.revisions[nextVersion];
//         chatEngine.store.commit('setArtifact', revision);
//         //chatEngine.store.commit('setArtifactChanged', true);
//         updateRevisionNavigationButtons();
//     }
// });
//

// System prompt handler
systemPromptTextarea.addEventListener('change', function() {
    const newSystemPrompt = this.value.trim();
    if (newSystemPrompt) {
        chatEngine.store.commit('setSystemMessage', newSystemPrompt);
    }
});

function setupSubscriptions() {
    chatEngine.subscribe("artifact.content", renderPreview);
    chatEngine.subscribe("artifact.content", updateArtifactUI);
    chatEngine.subscribe("currentVersion", function(val) {
        artifactVersion.textContent = `v${val}`;
    });
    chatEngine.subscribe("messages", updateMessagesUI);
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
        html = content
    } else if (type === 'image/svg+xml') {
        html = content
    } 
    previewDiv.innerHTML = html;
}

// UI update functions
function updateArtifactUI() {
    const artifact = chatEngine.getArtifact();
    artifactTitle.textContent = artifact.title;
    if (artifactContent.value != artifact.content) {
        artifactContent.value = artifact.content;
    }

}

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

    messagesDiv.textContent = content;
    
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

artifactContent.addEventListener('change', (e) => {
    const newValue = e.target.value;
    const artifact = chatEngine.getArtifact();
    if (newValue != artifact.content) {
        chatEngine.setArtifactContent(newValue);
        chatEngine.setLlmNeedsUserChanges(true);
    }
});

// Initial setup
setupSubscriptions();
updateMessagesUI();
updateArtifactUI();


 async function sendInitialMessages(messages) {
 for (const message of messages) {
       try {
           const response = await chatEngine.sendMessage(message);
       } catch (error) {
           console.error(`Error sending message: ${message}`, error);
       }
   }
 }

const initialMessages = [
     "Can you see my document?",
//      "Can you remove the red rectangle?",
];

// const initialMessages = [
//     "Can you see my document?",
//     "Can you remove the word Hello",
//     "Can you give me 3 more sections",
//     "Can you reverse the words in the entire document",
//     "Can you put a xoxo between every word in the whole document",
// ];
//
//await sendInitialMessages(initialMessages);

