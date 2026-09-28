const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const relationshipTime = document.querySelector('#relationship-time span');
const relationshipStartDate = new Date('2026-09-11T00:00:00');

function updateRelationshipTime() {
    if (!relationshipTime) {
        return;
    }

    const now = new Date();
    const elapsedMilliseconds = now - relationshipStartDate;

    

    let currentDate = new Date(relationshipStartDate);
    let years = now.getFullYear() - currentDate.getFullYear();
    currentDate.setFullYear(currentDate.getFullYear() + years);

    if (currentDate > now) {
        years -= 1;
        currentDate.setFullYear(currentDate.getFullYear() - 1);
    }

    let months = now.getMonth() - currentDate.getMonth();
    if (months < 0) {
        months += 12;
    }

    currentDate.setMonth(currentDate.getMonth() + months);
    if (currentDate > now) {
        months -= 1;
        currentDate.setMonth(currentDate.getMonth() - 1);
    }

    const days = Math.floor((now - currentDate) / 86400000);

    if (years > 0) {
        relationshipTime.textContent = `${years} anos, ${months} meses e ${days} dias`;
    } else if (months > 0) {
        relationshipTime.textContent = `${months} meses e ${days} dias`;
    } else {
        relationshipTime.textContent = `${days} dias`;
    }
}

updateRelationshipTime();
setInterval(updateRelationshipTime, 60000);

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