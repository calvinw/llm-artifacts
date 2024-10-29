class Store {
  constructor(options) {
    // Initial state
    this.state = options.state || {};
   
    // Mutations
    this.mutations = options.mutations || {};
   
    // Subscribers (used for reactive updates)
    this.subscribers = [];
  }

  // Commit method to trigger mutations
  commit(mutation, payload) {
    if (this.mutations[mutation]) {
      const prevState = JSON.parse(JSON.stringify(this.state));
      this.mutations[mutation](this.state, payload);
      this.notifySubscribers(prevState);
    } else {
      console.error(`Mutation ${mutation} does not exist`);
    }
  }

  // Subscribe to state changes
  subscribe(path, fn) {
    this.subscribers.push({ path, fn });
  }

  // Notify all subscribers of a state change
  notifySubscribers(prevState) {
    this.subscribers.forEach(({ path, fn }) => {
      const newValue = getNestedProperty(this.state, path);
      const prevValue = getNestedProperty(prevState, path);
      if (JSON.stringify(newValue) !== JSON.stringify(prevValue)) {
        fn(newValue, prevValue);
      }
    });
  }

  // Print the current state
  printState() {
    console.log('Current State:', JSON.parse(JSON.stringify(this.state)));
  }
}

// Utility function to get nested property
function getNestedProperty(obj, path) {
  if (typeof path !== 'string') {
    path = String(path);
  }
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

function removeArtifacts(text) {
  const pattern = /<artifact\s+.*?>[\s\S]*?<\/artifact>/g;
  return text.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim();
}

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
      if (key in artifact.attributes) {
        artifact.attributes[key] = value;
      }
    }
    return true;
  }

  return false;
}

// Define the initial state and mutations
const store = new Store({
  state: {
    artifact: {
      content: null,
      type: '',
      identifier: '',
      title: '',
      version: 0
    },
    messages: [],
  },
  mutations: {
    setArtifactVersion(state, version) {
      state.artifact.version = version;
    },
    setArtifactContent(state, content) {
      state.artifact.content = content;
    },
    setArtifact(state, artifact) {
      state.artifact.content = artifact.content
      state.artifact.type = artifact.attributes.type
      state.artifact.title = artifact.attributes.title
      state.artifact.identifier = artifact.attributes.identifier
      state.artifact.version = artifact.attributes.version
    },
    addMessage(state, message) {
      state.messages.push(message);
    },
    deleteAllMessages(state) {
      state.messages = [];
    }
  }
});

//Subscribe to specific changes in artifact attributes
store.subscribe('artifact', (newValue, prevValue) => {
  console.log('Artifact attributes changed:');
  console.log('Old attributes:', prevValue);
  console.log('New attributes:', newValue);
});
store.subscribe('artifact.version', (newValue, prevValue) => {
  console.log('Version changed:');
  console.log('Old:', prevValue);
  console.log('New:', newValue);
});
store.subscribe('artifact.content', (newValue, prevValue) => {
  console.log('Content changed:');
  console.log('Old:', prevValue);
  console.log('New:', newValue);
});

//
// // Commit a mutation to see the subscription in action
// store.commit('setArtifactAttributes', { type: 'document', title: 'New Title' });
// store.commit('setArtifactAttributes', { version: 2 });
// store.commit('setArtifactContent', "# Hello \n This is *some* markdown \n _Cool_");
//
let message_v1 =`
Hello there
<artifact identifier="my-summer-vacation" title="My Summer Vacation" type="text/markdown" version="1">
# My Summer Vacation
</artifact>`;
let message_v2 =`
Nice to see you
<artifact identifier="my-summer-vacation" title="My Summer Vacation" type="text/markdown" version="2">
# My Big Summer Vacation
</artifact>
Hows it going?`;
//
store.commit('addMessage', { role: "user", content: "Hello how are you?" });
store.commit('addMessage', { role: "assistant", content: "Im here to help" });

let artifact =  {
	content: null,
	attributes: {
	type: '',
	identifier: '',
	title: '',
	version: 0
	   }
	};

let isFound = extractArtifact(artifact, message_v1);

store.commit('setArtifact', artifact);
store.commit('setArtifactVersion', 5);

