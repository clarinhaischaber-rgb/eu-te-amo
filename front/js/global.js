const API_URL = "https://eu-te-amo-spjs.onrender.com/api";

// --- Gerenciamento de Token ---
function getToken() {
    return localStorage.getItem("token");
}

function saveToken(token) {
    localStorage.setItem("token", token);
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "Login.html";
}

function getAuthHeaders() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function checkAuth() {
    if (!getToken()) {
        window.location.href = "Login.html";
    }
}

// --- Comportamento de Menu e Navbar Dinâmica ---
document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (menuButton) {
        menuButton.addEventListener('click', () => {
            const isOpen = menu.classList.toggle('open');
            menuButton.setAttribute('aria-expanded', String(isOpen));
        });
    }

    if (navLinks) {
        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                if (menu) menu.classList.remove('open');
                if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
                navLinks.forEach((item) => item.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    // --- Ocultar/Exibir o link "Conta" na Navbar ---
    const accountLink = document.querySelector('a.nav-link[href="Conta.html"]');
    if (accountLink) {
        if (getToken()) {
            accountLink.style.display = "inline-block"; // Exibe se tiver token
        } else {
            accountLink.style.display = "none";         // Esconde se for visitante
        }
    }
});