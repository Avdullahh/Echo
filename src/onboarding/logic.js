document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('login-btn');
    const input = document.getElementById('username');

    btn.addEventListener('click', () => {
        const username = input.value;
        if (username.length > 0) {
            // Save Session
            chrome.storage.local.set({ userSession: { name: username, active: true } }, () => {
                // Redirect to Dashboard Home
                window.location.href = '/dashboard.html#home';
            });
        } else {
            alert("Identity Required");
        }
    });
});