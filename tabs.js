document.addEventListener('DOMContentLoaded', function() {
    const tabLabels = document.querySelectorAll('.tab-label');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLabels.forEach(label => {
        label.addEventListener('click', () => {
            switchTab(label.getAttribute('data-tab'));
        });
    });

    // New function to programmatically switch tabs
    window.switchTab = function(tabName) {
        tabLabels.forEach(lbl => lbl.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        const selectedLabel = document.querySelector(`.tab-label[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}-tab`);

        if (selectedLabel && selectedContent) {
            selectedLabel.classList.add('active');
            selectedContent.classList.add('active');
        }

        if(tabName == "code-tab") {
            setTimeout(()=> {
                editor.resize();
            },0)
        }
    };
});
