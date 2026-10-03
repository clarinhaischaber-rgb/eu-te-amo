const photoGallery = document.querySelector('#photo-gallery');
const photoInput = document.querySelector('#photo-input');
const addPhotoButton = document.querySelector('#add-photo-button');
const deleteConfirmation = document.querySelector('#delete-confirmation');
const confirmDeleteButton = document.querySelector('#confirm-delete');
const cancelDeleteButton = document.querySelector('#cancel-delete');
const emptyGallery = document.querySelector('#empty-gallery');
const galleryStatus = document.querySelector('#gallery-status');
const photosEndpoint = 'https://eu-te-amo-spjs.onrender.com/api/fotos';
const photosIdsEndpoint = 'https://eu-te-amo-spjs.onrender.com/api/fotos/ids';
const PHOTOS_CACHE_KEY = 'cached_photos';
let selectedPhotoId = null;

function setGalleryStatus(message) {
    if (galleryStatus) {
        galleryStatus.textContent = message;
    }
}

function clearPhotoSelection() {
    selectedPhotoId = null;
    document.querySelectorAll('.gallery-item.selected').forEach((item) => item.classList.remove('selected'));
    if (deleteConfirmation) deleteConfirmation.hidden = true;
}

function selectPhoto(photoId, item) {
    selectedPhotoId = photoId;
    document.querySelectorAll('.gallery-item.selected').forEach((galleryItem) => galleryItem.classList.remove('selected'));
    item.classList.add('selected');
    if (deleteConfirmation) deleteConfirmation.hidden = false;
}

function uniquePhotos(photos) {
    const seen = new Set();
    return photos.filter((photo) => {
        const key = photo.publicId || photo.url;
        if (!key || seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function renderPhotos(photos) {
    if (!photoGallery) return;
    photoGallery.replaceChildren();
    const unique = uniquePhotos(photos);
    if (emptyGallery) emptyGallery.hidden = unique.length > 0;

    unique.forEach((photo) => {
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
    const cachedPhotos = localStorage.getItem(PHOTOS_CACHE_KEY);
    if (cachedPhotos) {
        try {
            const photos = JSON.parse(cachedPhotos);
            renderPhotos(photos);
            fetchAndCachePhotosIfChanged(photos);
        } catch (error) {
            console.error('Erro ao ler cache:', error);
            await fetchAndCachePhotos();
        }
    } else {
        await fetchAndCachePhotos();
    }
}

function hasPhotosChanged(cachedIds, newIds) {
    if (cachedIds.length !== newIds.length) {
        return true;
    }
    const sortedCached = [...cachedIds].map(Number).sort((a, b) => a - b);
    const sortedNew = [...newIds].map(Number).sort((a, b) => a - b);
    return JSON.stringify(sortedCached) !== JSON.stringify(sortedNew);
}

async function fetchAndCachePhotosIfChanged(cachedPhotos) {
    try {
        const response = await fetch(photosIdsEndpoint);
        if (!response.ok) throw new Error('Não foi possível verificar as imagens.');
        
        const newIds = await response.json();
        const cachedIds = cachedPhotos.map(p => p.id);
        
        if (hasPhotosChanged(cachedIds, newIds)) {
            await fetchAndCachePhotos();
        }
    } catch (error) {
        console.error('Erro ao verificar IDs:', error);
        await fetchAndCachePhotos();
    }
}

async function fetchAndCachePhotos() {
    try {
        const response = await fetch(photosEndpoint);
        if (!response.ok) throw new Error('Não foi possível carregar as imagens.');
        
        const photos = await response.json();
        localStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify(photos));
        renderPhotos(photos);
    } catch (error) {
        setGalleryStatus(error.message);
    }
}

function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Falha ao comprimir imagem'));
                    }
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(objectUrl);
            reject(error);
        };
        img.src = objectUrl;
    });
}

async function uploadPhotos(files) {
    const rawFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
    if (rawFiles.length === 0) {
        throw new Error('Selecione pelo menos uma imagem.');
    }

    const formData = new FormData();

    for (let index = 0; index < rawFiles.length; index += 1) {
        const file = rawFiles[index];
        setGalleryStatus(`Comprimindo imagem (${index + 1}/${rawFiles.length})...`);
        
        let compressed = file;
        try {
            compressed = await compressImage(file, 1200, 1200, 0.7);
        } catch (e) {
            console.warn('Compressão falhou, usando original:', e);
        }
        
        formData.append('fotos', compressed);
    }

    setGalleryStatus('Enviando imagens para o servidor...');

    const response = await fetch(`${photosEndpoint}/upload-multiple`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Não foi possível enviar as imagens.');
    }

    setGalleryStatus('Imagens enviadas com sucesso!');
    await fetchAndCachePhotos();
}

async function deleteSelectedPhoto() {
    if (selectedPhotoId === null) return;

    setGalleryStatus('Excluindo imagem...');
    try {
        const response = await fetch(`${photosEndpoint}/${selectedPhotoId}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Não foi possível excluir a imagem.');
        }

        clearPhotoSelection();
        await fetchAndCachePhotos();
        setGalleryStatus('Imagem excluída.');
    } catch (error) {
        setGalleryStatus(error.message);
    }
}

if (photoGallery) {
    if (addPhotoButton) {
        addPhotoButton.addEventListener('click', () => photoInput.click());
    }

    if (photoInput) {
        photoInput.addEventListener('change', async () => {
            const files = photoInput.files;
            if (!files || files.length === 0) return;

            try {
                await uploadPhotos(files);
            } catch (error) {
                setGalleryStatus(error.message);
            } finally {
                photoInput.value = '';
            }
        });
    }

    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', async () => {
            try {
                await deleteSelectedPhoto();
            } catch (error) {
                setGalleryStatus(error.message);
            }
        });
    }

    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', () => {
            clearPhotoSelection();
        });
    }

    loadPhotos();
}