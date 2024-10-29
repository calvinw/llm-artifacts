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
    console.log(`Before ${mutation}:`, JSON.parse(JSON.stringify(this.state))); // Log state before mutation
    if (this.mutations[mutation]) {
      this.mutations[mutation](this.state, payload);
      this.notifySubscribers();
    } else {
      console.error(`Mutation ${mutation} does not exist`);
    }
    console.log(`After ${mutation}:`, JSON.parse(JSON.stringify(this.state))); // Log state after mutation
  }

  // Subscribe to state changes
  subscribe(fn) {
    this.subscribers.push(fn);
  }

  // Notify all subscribers of a state change
  notifySubscribers() {
    this.subscribers.forEach(fn => fn(this.state));
  }
}

// Define the initial state and mutations
const store = new Store({
  state: {
    count: 0,
    items: [],
  },
  mutations: {
    increment(state) {
      state.count++;
    },
    addItem(state, item) {
      state.items.push(item);
    }
  }
});

// Subscribe to state changes
store.subscribe((newState) => {
  console.log('State changed:', JSON.parse(JSON.stringify(newState)));
});

// Commit mutations
console.log("before incrment")
store.commit('increment');
console.log("after incrment")
store.commit('addItem', { name: 'NewItem', id: 1 });
console.log("after addItem")
