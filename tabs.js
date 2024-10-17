document.addEventListener('DOMContentLoaded', function() {
  const tabLabels = document.querySelectorAll('.tab-label');
  const tabContents = document.querySelectorAll('.tab-content');

  tabLabels.forEach(label => {
    label.addEventListener('click', () => {
      const tabName = label.getAttribute('data-tab');

      tabLabels.forEach(lbl => lbl.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      label.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
});
