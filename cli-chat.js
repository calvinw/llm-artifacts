import 'dotenv/config';
import readline from 'readline';
import fs from 'fs';
import ChatEngine from './chat-engine.js';

class CliChat {
    constructor(config) {
        this.artifactFile = config.artifactFile;
        this.systemPromptFile = config.systemPromptFile;
        this.messagesFile = config.messagesFile;

        // Initialize chat engine with system prompt
        this.chatEngine = new ChatEngine({
            apiKey: config.apiKey,
            model: config.model,
            systemPrompt: this.loadSystemPrompt()
        });

        // Set up file watchers and subscribers
        this.setupFileHandlers();
        
        // Initialize readline interface
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    loadSystemPrompt() {
        try {
            return fs.readFileSync(this.systemPromptFile, 'utf8').trim();
        } catch (error) {
            console.warn(`Warning: Could not load system prompt from ${this.systemPromptFile}. Using default.`);
            return 'You are a helpful AI assistant.';
        }
    }

      setupFileHandlers() {
          this.chatEngine.store.subscribe('artifact.content', (newValue) => {
              if (this.artifactFile) {
                  fs.writeFileSync(this.artifactFile, newValue, 'utf8');
              }
          });

          this.chatEngine.store.subscribe('messages', (messages) => {
              if (this.messagesFile) {
                  const formattedContent = this.formatMessagesForMarkdown(messages);
                  fs.writeFileSync(this.messagesFile, formattedContent, 'utf8');
              }
          });
      }

    formatMessagesForMarkdown(messages) {
        const timestamp = new Date().toISOString();
        let output = `# Chat Messages (Updated: ${timestamp})\n`;
        
        messages.forEach((msg) => {
            output += `=================================================================\n`;
            output += `${msg.role.toUpperCase()}: `;
            output += `${msg.content}\n`;
        });
        
        return output;
    }

    loadInitialArtifact() {
        try {
            const initialContent = fs.readFileSync(this.artifactFile, 'utf8');
            this.chatEngine.updateArtifactContent(initialContent);
            return true;
        } catch (error) {
            console.error('Error loading initial artifact:', error);
            return false;
        }
    }

    displayArtifact() {
        const artifact = this.chatEngine.getArtifact();
        console.log('\nCurrent Artifact Structure:');
        console.log('-------------------------');
        console.log(JSON.stringify({
            identifier: artifact.identifier,
            type: artifact.type,
            title: artifact.title,
            version: artifact.version,
            changed: artifact.changed
        }, null, 2));
        console.log('\nContent:');
        console.log(artifact.content);
    }

    displayMessages() {
        const messages = this.chatEngine.getMessages();
        console.log('\nMessage History:');
        console.log('---------------');
        messages.forEach((msg, index) => {
            console.log(`[${index}] ${msg.role.toUpperCase()}: ${msg.content}`);
        });
    }

    displaySystemPrompt() {
        const systemPrompt = this.chatEngine.getSystemPrompt();
        console.log('\nCurrent System Prompt:');
        console.log('---------------------');
        console.log(systemPrompt);
    }

    processCommand(input) {
        switch (input.toLowerCase()) {
            case '/artifact':
                this.displayArtifact();
                return true;
            case '/messages':
                this.displayMessages();
                return true;
            case '/system':
                this.displaySystemPrompt();
                return true;
            case '/help':
                console.log('\nAvailable Commands:');
                console.log('/artifact - Display current artifact structure');
                console.log('/messages - Display message history');
                console.log('/system  - Display current system prompt');
                console.log('/help    - Show this help message');
                console.log('exit     - Exit the chat');
                return true;
            default:
                return false;
        }
    }

    async startChat() {
        try {
            this.loadInitialArtifact();
            console.log('Initial artifact loaded. Starting chat...');
            console.log('Type /help to see available commands\n');

            const askQuestion = () => {
                this.rl.question('You: ', async (userInput) => {
                    if (userInput.toLowerCase() === 'exit') {
                        this.rl.close();
                        return;
                    }

                    if (this.processCommand(userInput)) {
                        askQuestion();
                        return;
                    }

                    try {
                        const aiMessage = await this.chatEngine.sendMessage(userInput);
                        console.log('\nAI:', aiMessage, '\n');
                    } catch (error) {
                        console.error('Error sending message:', error);
                    }
                    askQuestion();
                });
            };

            askQuestion();
        } catch (error) {
            console.error('Error starting chat:', error);
            process.exit(1);
        }
    }
}

// Extract command line arguments with .env fallbacks
const args = process.argv.slice(2);
const config = {
    apiKey: args[0] || process.env.npm_config_key,
    model: args[1] || process.env.npm_config_model || 'openai/gpt-4-mini',
    artifactFile: args[2] || process.env.npm_config_file || './artifact-content.md',
    systemPromptFile: args[3] || process.env.npm_config_system || './system.txt',
    messagesFile: args[4] || process.env.npm_config_messages || './messages.md'
};

if (!config.apiKey) {
    console.error('Error: API key is required. Please provide it via command line or .env file');
    process.exit(1);
}

// Create and start the CLI chat
const cliChat = new CliChat(config);
cliChat.startChat();

export default CliChat;
