class Store {
    constructor(options) {
        this.state = options.state || {};
        this.mutations = options.mutations || {};
        this.subscribers = [];
    }

    commit(mutation, payload) {
        if (this.mutations[mutation]) {
            const prevState = JSON.parse(JSON.stringify(this.state));
            this.mutations[mutation](this.state, payload);
            this.notifySubscribers(prevState);
        } else {
            console.error(`Mutation ${mutation} does not exist`);
        }
    }

    subscribe(path, fn) {
        this.subscribers.push({ path, fn });
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

    printState() {
        console.log('Current State:', JSON.parse(JSON.stringify(this.state)));
    }
}

function getNestedProperty(obj, path) {
    if (typeof path !== 'string') {
        path = String(path);
    }
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

// Initialize store with initial state and mutations
const store = new Store({
    state: {
        artifact: {
            identifier: 'my-summer-vacation',
            type: 'text/markdown',
            title: 'My Summer Vacation',
            version: 0,
            changed:  false,
            content:  ""
        },
        messages: [
            { role: "system", content: "" }
        ]
    },
    mutations: {
        setArtifact(state, artifactData) {
            state.artifact = { ...state.artifact, ...artifactData };
        },
        setArtifactContent(state, content) {
            state.artifact.content = content;
        },
        setArtifactChanged(state, changed) {
            state.artifact.changed = changed;
        },
        setArtifactVersion(state, version) {
            state.artifact.version=version;
        },
        incrementArtifactVersion(state) {
            state.artifact.version += 1;
        },
        addMessage(state, message) {
            state.messages.push(message);
        },
        updateSystemMessage(state, content) {
            state.messages[0].content = content;
        },
        clearMessages(state) {
            state.messages = [{ role: "system", content: state.messages[0].content }];
        }
    }
});
