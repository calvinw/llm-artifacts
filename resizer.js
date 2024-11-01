document.addEventListener('DOMContentLoaded', function() {
    const resizer = document.getElementById('resizer');
    const chatPanel = document.getElementById('chat-panel');
    const artifactPanel = document.getElementById('artifact-panel');
    let isResizing = false;
    let startX;
    let startWidthChat;
    let startWidthArtifact;

    resizer.addEventListener('mousedown', initResize);

    function initResize(e) {
        isResizing = true;
        startX = e.clientX;
        startWidthChat = chatPanel.offsetWidth;
        startWidthArtifact = artifactPanel.offsetWidth;
        
        document.body.classList.add('resizing');
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }

    function resize(e) {
        if (!isResizing) return;
        
        const dx = e.clientX - startX;
        const totalWidth = chatPanel.parentElement.offsetWidth;
        
        const newWidthChat = startWidthChat + dx;
        const newWidthArtifact = startWidthArtifact - dx;
        
        // Set minimum widths (20% of total width)
        const minWidth = totalWidth * 0.2;
        
        if (newWidthChat >= minWidth && newWidthArtifact >= minWidth) {
            const chatPercentage = (newWidthChat / totalWidth) * 100;
            const artifactPercentage = (newWidthArtifact / totalWidth) * 100;
            
            chatPanel.style.flex = `0 0 ${chatPercentage}%`;
            artifactPanel.style.flex = `0 0 ${artifactPercentage}%`;
        }
    }

    function stopResize() {
        isResizing = false;
        document.body.classList.remove('resizing');
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }
});
