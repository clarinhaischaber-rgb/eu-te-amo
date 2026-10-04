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
    window.location.href = "login.html";
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
        window.location.href = "login.html";
    }
}

// --- Comportamento Global de UI & Permissões ---
document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();

    // 1. Menu e Navbar Dinâmica
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

    // 2. Ocultar/Exibir o link "Conta" na Navbar
    const accountLink = document.querySelector('a.nav-link[href="Conta.html"]');
    if (accountLink) {
        accountLink.style.display = token ? "inline-block" : "none";
    }

    // 3. Regras Globais para Visitantes (Sem Token)
    if (!token) {
        // Oculta formulários de criação/envio (Cartas, Fotos, etc.)
        const formsToHide = document.querySelectorAll('#carta-form, #foto-form, .gallery-actions');
        formsToHide.forEach(element => {
            element.style.display = 'none';
        });

        // Aplica um estilo CSS global para esconder botões de exclusão mesmo se forem gerados dinamicamente
        const style = document.createElement('style');
        style.innerHTML = `
            .carta-delete, .foto-delete, .btn-delete, #add-photo-button { 
                display: none !important; 
            }
        `;
        document.head.appendChild(style);
    }
});