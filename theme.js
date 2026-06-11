// Apply saved theme immediately to avoid a flash of the wrong theme
(function () {
    try {
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    } catch (e) {}
})();

document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    const updateLabel = () => {
        toggle.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
    };

    updateLabel();

    toggle.addEventListener('click', () => {
        if (isDark()) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        updateLabel();
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: isDark() ? 'dark' : 'light' } }));
    });
});
