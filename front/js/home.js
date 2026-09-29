const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const relationshipTime = document.querySelector('#relationship-time span');
const relationshipStartDate = new Date('2026-09-11T00:00:00');
const photoGallery = document.querySelector('#photo-gallery');
const photoInput = document.querySelector('#photo-input');
const addPhotoButton = document.querySelector('#add-photo-button');
const deleteConfirmation = document.querySelector('#delete-confirmation');
const confirmDeleteButton = document.querySelector('#confirm-delete');
const cancelDeleteButton = document.querySelector('#cancel-delete');
const emptyGallery = document.querySelector('#empty-gallery');
const galleryStatus = document.querySelector('#gallery-status');
const photosEndpoint = 'http://localhost:8081/api/fotos';
let selectedPhotoId = null;

function updateRelationshipTime() {
    if (!relationshipTime) {
        return;
    }

    const now = new Date();
    const start = new Date(relationshipStartDate);

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        const previousMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += previousMonthDays;
        months -= 1;
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    if (years < 0) {
        years = 0;
        months = 0;
        days = 0;
    }

    const formatUnit = (value, singular, plural) => `${value} ${value === 1 ? singular : plural}`;

    if (years > 0) {
        relationshipTime.textContent = `${formatUnit(years, 'ano', 'anos')}, ${formatUnit(months, 'mês', 'meses')} e ${formatUnit(days, 'dia', 'dias')}`;
    } else if (months > 0) {
        relationshipTime.textContent = `${formatUnit(months, 'mês', 'meses')} e ${formatUnit(days, 'dia', 'dias')}`;
    } else {
        relationshipTime.textContent = formatUnit(days, 'dia', 'dias');
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

function setGalleryStatus(message) {
    galleryStatus.textContent = message;
}

function clearPhotoSelection() {
    selectedPhotoId = null;
    document.querySelectorAll('.gallery-item.selected').forEach((item) => item.classList.remove('selected'));
    deleteConfirmation.hidden = true;
}

function selectPhoto(photoId, item) {
    selectedPhotoId = photoId;
    document.querySelectorAll('.gallery-item.selected').forEach((galleryItem) => galleryItem.classList.remove('selected'));
    item.classList.add('selected');
    deleteConfirmation.hidden = false;
}

function renderPhotos(photos) {
    photoGallery.replaceChildren();
    emptyGallery.hidden = photos.length > 0;

    photos.forEach((photo) => {
        const item = document.createElement('figure');
        item.className = 'gallery-item';
        item.tabIndex = 0;
        item.setAttribute('aria-label', 'Selecionar foto');

        const image = document.createElement('img');
        image.src = photo.url;
        image.alt = 'Foto adicionada';
        item.append(image);

        item.addEventListener('click', () => selectPhoto(photo.id, item));
        item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectPhoto(photo.id, item);
            }
        });
        photoGallery.append(item);
    });
}

async function loadPhotos() {
    try {
        const response = await fetch(photosEndpoint);
        if (!response.ok) {
            throw new Error('Não foi possível carregar as imagens.');
        }
        renderPhotos(await response.json());
    } catch (error) {
        setGalleryStatus(error.message);
    }
}

async function uploadPhoto(file) {
    const formData = new FormData();
    formData.append('foto', file);
    setGalleryStatus('Enviando imagem...');

    const response = await fetch(`${photosEndpoint}/upload`, { method: 'POST', body: formData });
    if (!response.ok) {
        throw new Error('Não foi possível enviar a imagem.');
    }

    await loadPhotos();
    setGalleryStatus('Imagem adicionada.');
}

async function deleteSelectedPhoto() {
    if (selectedPhotoId === null) {
        return;
    }

    setGalleryStatus('Excluindo imagem...');
    const response = await fetch(`${photosEndpoint}/${selectedPhotoId}`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('Não foi possível excluir a imagem.');
    }

    clearPhotoSelection();
    await loadPhotos();
    setGalleryStatus('Imagem excluída.');
}

if (photoGallery) {
    addPhotoButton.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', async () => {
        const [file] = photoInput.files;
        if (!file) {
            return;
        }

        try {
            await uploadPhoto(file);
        } catch (error) {
            setGalleryStatus(error.message);
        } finally {
            photoInput.value = '';
        }
    });

    confirmDeleteButton.addEventListener('click', async () => {
        try {
            await deleteSelectedPhoto();
        } catch (error) {
            setGalleryStatus(error.message);
        }
    });

    cancelDeleteButton.addEventListener('click', () => {
        clearPhotoSelection();
    });

    loadPhotos();
}
