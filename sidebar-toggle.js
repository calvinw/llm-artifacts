document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const mainContent = document.querySelector('.main-content');
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    
    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            // Mobile behavior
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        } else {
            // Desktop behavior
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('sidebar-collapsed');
        }
    }

    // Toggle sidebar on button click
    sidebarCollapse.addEventListener('click', toggleSidebar);

    // Close sidebar when clicking overlay (mobile only)
    sidebarOverlay.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });

    // Close sidebar when clicking on main content area
    mainContent.addEventListener('click', function(e) {
        // Only proceed if sidebar is open
        const isSidebarOpen = window.innerWidth <= 768 ? 
            sidebar.classList.contains('active') : 
            !sidebar.classList.contains('collapsed');
            
        if (isSidebarOpen) {
            // Don't close if clicking on the toggle button or within the sidebar
            if (!e.target.closest('#sidebarCollapse') && !e.target.closest('#sidebar')) {
                toggleSidebar();
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // Reset mobile classes when switching to desktop
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        } else {
            // Reset desktop classes when switching to mobile
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
        }
    });
});
