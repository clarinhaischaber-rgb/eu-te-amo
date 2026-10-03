const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

if (menuButton) {
    menuButton.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        menuButton.setAttribute('aria-expanded', String(isOpen));
    });
}

navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        if (menu) menu.classList.remove('open');
        if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
        navLinks.forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
    });
});