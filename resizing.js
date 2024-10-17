
document.addEventListener('DOMContentLoaded', function() {

    // Elements for resizing
    const divider = document.getElementById('divider');
    const divider2 = document.getElementById('divider2');
    const container = document.getElementById('container');
    const panel1 = document.getElementById('panel1');
    const panel2 = document.getElementById('panel2');
    const panel3 = document.getElementById('panel3');

    let isResizing = false;
    let startX = 0;
    let startWidthPanel1 = 0;
    let startWidthPanel2 = 0;
    let startWidthPanel3 = 0;

        divider.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection while resizing
            isResizing = 'panel1-panel2';
            startX = e.clientX;
            startWidthPanel1 = panel1.offsetWidth;
            startWidthPanel2 = panel2.offsetWidth;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        divider2.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection while resizing
            isResizing = 'panel2-panel3';
            startX = e.clientX;
            startWidthPanel2 = panel2.offsetWidth;
            startWidthPanel3 = panel3.offsetWidth;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        function handleMouseMove(e) {
            if (!isResizing) return;

            const dx = e.clientX - startX;
            const containerWidth = container.offsetWidth;

            if (isResizing === 'panel1-panel2') {
                const newWidthPanel1 = startWidthPanel1 + dx;
                const newWidthPanel2 = startWidthPanel2 - dx;

                const panel1Percentage = (newWidthPanel1 / containerWidth) * 100;
                const panel2Percentage = (newWidthPanel2 / containerWidth) * 100;

                if (panel1Percentage > 10 && panel2Percentage > 10) {
                    panel1.style.flexBasis = `${panel1Percentage}%`;
                    panel2.style.flexBasis = `${panel2Percentage}%`;
                }
            } else if (isResizing === 'panel2-panel3') {
                const newWidthPanel2 = startWidthPanel2 + dx;
                const newWidthPanel3 = startWidthPanel3 - dx;

                const panel2Percentage = (newWidthPanel2 / containerWidth) * 100;
                const panel3Percentage = (newWidthPanel3 / containerWidth) * 100;

                if (panel2Percentage > 10 && panel3Percentage > 10) {
                    panel2.style.flexBasis = `${panel2Percentage}%`;
                    panel3.style.flexBasis = `${panel3Percentage}%`;
                }
            }
        }

        function handleMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
})

