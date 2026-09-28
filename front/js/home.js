const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

menuButton.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        menu.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        navLinks.forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
    });
});