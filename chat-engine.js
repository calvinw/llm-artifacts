// Helper functions
const getNestedProperty = (obj, path) => {
    if (typeof path !== 'string') path = String(path);
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
};

class Store {
    constructor(options = {}) {
        this.state = options.state || {};
        this.mutations = options.mutations || {};
        this.subscribers = [];
    }

    commit(mutation, payload) {
        if (!this.mutations[mutation]) {
            console.error(`Mutation ${mutation} does not exist`);
            return;
        }
        
        const prevState = JSON.parse(JSON.stringify(this.state));
        this.mutations[mutation](this.state, payload);
        this.notifySubscribers(prevState);
    }

    subscribe(path, fn) {
        this.subscribers.push({ path, fn });
        // Immediately call with current value
        const currentValue = getNestedProperty(this.state, path);
        fn(currentValue, undefined);
    }

    notifySubscribers(prevState) {
        this.subscribers.forEach(({ path, fn }) => {
            const newValue = getNestedProperty(this.state, path);
            const prevValue = getNestedProperty(prevState, path);
            if (JSON.stringify(newValue) !== JSON.stringify(prevValue)) {
                fn(newValue, prevValue);
            }
        });
    }
}

class ChatEngine {
    constructor(config) {
        if (!config.apiKey) throw new Error('API key is required');
        if (!config.model) throw new Error('Model name is required');

        this.apiKey = config.apiKey;
        this.model = config.model;
        this.setupStore(config.systemPrompt);
    }

    setupStore(systemPrompt) {
        this.store = new Store({
            state: {
                model: "openai/gpt-4o-mini",
                artifact: DEFAULT_ARTIFACT,
                llmNeedsUserChanges: true,
		exchangeVersion: 0,
                currentVersion: 1,
                changedSinceRevision: false,
                revisions: [DEFAULT_ARTIFACT],
                messages: [{
                    role: 'system',
                    content: DEFAULT_SYSTEM_PROMPT,
                    containsArtifact: false
                }]
            },
            mutations: {
                setArtifact: (state, artifactData) => {
                    state.artifact = { ...state.artifact, ...artifactData };
                },
                setModel: (state, model) => {
                    state.model = model;
                },
                setLlmNeedsUserChanges: (state, llmNeedsUserChanges) => {
                    state.llmNeedsUserChanges = llmNeedsUserChanges;
                },
                setExchangeVersion: (state, exchangeVersion) => {
                    state.exchangeVersion = exchangeVersion 
                },
                setCurrentVersion: (state, currentVersion) => {
                    state.artifact.content = currentVersion 
                },
                setChangedSinceRevision: (state, changedSinceRevision) => {
                    state.changedSinceRevision = changedSinceRevision;
                },
                setArtifactContent: (state, content) => {
                    state.artifact.content = content;
                },
                saveRevision: (state) => {
                    let nextIndex = state.currentVersion
                    state.revisions[nextIndex] = {
                        identifier: state.artifact.identifier,
                        type: state.artifact.type,
                        title: state.artifact.title,
                        content: state.artifact.content
                    };
                    state.currentVerison += 1;
                },
                setSystemMessage: (state, message) => {
                    state.messages[0].content = message;
                },
                addMessage: (state, message) => {
                    state.messages.push(message);
                },
                removeArtifact: (state, index) => {
                    state.messages[index].content = 
                     this.removeArtifacts(state.messages[index].content);
                },
                clearMessages: (state) => {
                    state.messages = [{
                        role: 'system',
                        content: state.messages[0].content,
                        hasArtifact: false
                    }];
                }
            }
        });
    }

    extractAndUpdateArtifact(text) {
        const pattern = /<artifact\s+(.*?)>([\s\S]*?)<\/artifact>/g;
        const match = pattern.exec(text);
        
        if (!match) return false;

        const [, attributesString, content] = match;
        const attributes = {};
        const attributePattern = /(\w+)="([^"]*)"/g;
        let attrMatch;
        
        while ((attrMatch = attributePattern.exec(attributesString))) {
            const [, key, value] = attrMatch;
            attributes[key] = value;
        }
        
	const llmsReturnedVersion = parseInt(attributes.version)
	const exchangeVersion = this.store.state.exchangeVersion; 

        console.log ("LLMs returned version: " + llmsReturnedVersion) 
        console.log ("exchange version: " + exchangeVersion) 

	if(llmsReturnedVersion == exchangeVersion+1) {
	    console.log("got expected exchange version")
	    this.store.commit("setExchangeVersion", exchangeVersion+1)
	}

        if(attributes.version) 
           delete attributes.version

        this.store.commit('setArtifact', {
            ...attributes,
            content: content.trim(),
        });
        
        return true;
    }
   
    async sendMessage(userMessage) {
        let fullUserMessage = userMessage 
        const userMessageHasArtifact = this.store.state.llmNeedsUserChanges;
        if(userMessageHasArtifact) {
          fullUserMessage += "\n\n"
          fullUserMessage += this.prepareArtifact()
        }

        this.store.commit('addMessage', {
            role: "user",
            content: fullUserMessage,
            hasArtifact: userMessageHasArtifact 
        });

        try {
            const response = await this.makeApiRequest(fullUserMessage);
            const aiMessage = response.choices[0].message.content;
            const aiMessageHasArtifact = this.extractAndUpdateArtifact(aiMessage);
            
            this.store.commit("setLlmNeedsUserChanges", false)
            this.store.commit('addMessage', {
                role: 'assistant',
                content: aiMessage,
                hasArtifact: aiMessageHasArtifact
            });
            //this.cleanupOldArtifacts();

            return aiMessage;
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

    async makeApiRequest(message) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Chat App'
            },
            body: JSON.stringify({
                model: this.store.state.model,
                messages: this.getMessages()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    prepareArtifact() {
	let version = this.store.state.exchangeVersion;
        console.log("preparing Artifact: exchangeVersion is " , version)
	this.store.commit("setExchangeVersion", version+1); 
	version = this.store.state.exchangeVersion;

        const identifier = this.store.state.artifact.identifier;
        const content = this.store.state.artifact.content;
        const  title = this.store.state.artifact.title;
        const  type = this.store.state.artifact.type;
        return `<artifact identifier="${identifier}" type="${type}" title="${title}" version="${version}"> ${content} </artifact>`;
    }

    cleanupOldArtifacts() {
        const currentVersion = this.store.state.artifact.version;
        const messages = this.store.state.messages;
        const keepVersions = [currentVersion, currentVersion - 1];

        for (let i = 1; i < messages.length; i++) {
            const message = messages[i];
            if (!message.hasArtifact) continue;

            const artifactMatch = message.content.match(
                /<artifact\s+.*?version="(\d+)".*?>[\s\S]*?<\/artifact>/
            );
            
            if (artifactMatch) {
                const version = parseInt(artifactMatch[1]);
                if (!keepVersions.includes(version)) {
                    this.store.commit('removeArtifact', i);
                    messages[i].hasArtifact = false;
                }
            }
        }
    }

    // Public API methods
    subscribe(property, changeHandler) {
        this.store.subscribe(property, changeHandler);
    }

    removeArtifacts(text) {
        return text.replace(/<artifact\s+.*?>[\s\S]*?<\/artifact>/g, '').trim();
    }

    setArtifactContent(content) {
        this.store.commit('setArtifactContent', content);
    }

    setLlmNeedsUserChanges(value) {
        this.store.commit('setLlmNeedsUserChanges', value);
    }

    getMessages() {
        return this.store.state.messages;
    }

    getArtifact() {
        return this.store.state.artifact;
    }

    setSystemMessage(value) {
        this.store.commit('setSystemMessage', value);
    }

    clearMessages() {
        this.store.commit('clearMessages');
    }
}

export default ChatEngine;
