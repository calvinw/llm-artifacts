// Function to append a debug message to the debug tab
function appendDebugMessage(info, message) {
    const debugTab = document.getElementById('debug-tab');
    if (!debugTab) {
        console.error('Debug tab not found');
        return;
    }

    const timestamp = new Date().toISOString();
    const messageElement = document.createElement('div');
    messageElement.style.borderBottom = '1px solid #ddd';
    messageElement.style.padding = '5px';
    messageElement.style.fontFamily = 'monospace';

    // Add the timestamp and info
    const headerElement = document.createElement('div');
    headerElement.textContent = `[${timestamp}] ${info}:`;
    messageElement.appendChild(headerElement);

    // Handle the message part
    let formattedMessage = message;
    if (typeof message === 'object') {
        // If it's an object, stringify it with indentation
        formattedMessage = JSON.stringify(message, null, 2);
    } else if (typeof message === 'string') {
        // If it's a string, try to parse it as JSON
        try {
            const parsedMessage = JSON.parse(message);
            formattedMessage = JSON.stringify(parsedMessage, null, 2);
        } catch (e) {
            // If parsing fails, use the original string
            formattedMessage = message;
        }
    }

    const pre = document.createElement('pre');
    pre.textContent = formattedMessage;
    pre.style.backgroundColor = '#f4f4f4';
    pre.style.padding = '10px';
    pre.style.border = '1px solid #ddd';
    pre.style.borderRadius = '4px';
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.wordWrap = 'break-word';
    pre.style.marginTop = '5px';
    pre.style.marginBottom = '0';

    messageElement.appendChild(pre);
    debugTab.appendChild(messageElement);

    // Scroll to the bottom of the debug tab
    debugTab.scrollTop = debugTab.scrollHeight;
}

// Function to display a single debug message in the debug tab
function debugMessage(info, message) {
    const debugTab = document.getElementById('debug-tab');
    if (!debugTab) {
        console.error('Debug tab not found');
        return;
    }

    const timestamp = new Date().toISOString();
    const messageElement = document.createElement('div');
    messageElement.style.padding = '5px';
    messageElement.style.fontFamily = 'monospace';

    // Add the timestamp and info
    const headerElement = document.createElement('div');
    headerElement.textContent = `[${timestamp}] ${info}:`;
    messageElement.appendChild(headerElement);

    // Handle the message part
    let formattedMessage = message;
    if (typeof message === 'object') {
        formattedMessage = JSON.stringify(message, null, 2);
    } else if (typeof message === 'string') {
        try {
            const parsedMessage = JSON.parse(message);
            formattedMessage = JSON.stringify(parsedMessage, null, 2);
        } catch (e) {
            formattedMessage = message;
        }
    }

    const pre = document.createElement('pre');
    pre.textContent = formattedMessage;
    pre.style.backgroundColor = '#f4f4f4';
    pre.style.padding = '10px';
    pre.style.border = '1px solid #ddd';
    pre.style.borderRadius = '4px';
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.wordWrap = 'break-word';
    pre.style.marginTop = '5px';
    pre.style.marginBottom = '0';

    messageElement.appendChild(pre);

    // Clear existing content and add the new message
    debugTab.innerHTML = '';
    debugTab.appendChild(messageElement);
}
