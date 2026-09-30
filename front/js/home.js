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
const photosEndpoint = 'https://eu-te-amo-spjs.onrender.com/api/fotos';
const photosIdsEndpoint = 'https://eu-te-amo-spjs.onrender.com/api/fotos/ids';
const PHOTOS_CACHE_KEY = 'cached_photos';
const PHOTOS_IDS_CACHE_KEY = 'cached_photos_ids';
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
    // Primeiro, tenta carregar do cache do localStorage
    const cachedPhotos = localStorage.getItem(PHOTOS_CACHE_KEY);
    if (cachedPhotos) {
        try {
            const photos = JSON.parse(cachedPhotos);
            renderPhotos(photos);
            // Busca apenas os IDs do backend para verificar se há novidades
            fetchAndCachePhotosIfChanged(photos);
        } catch (error) {
            console.error('Erro ao ler cache:', error);
            await fetchAndCachePhotos();
        }
    } else {
        // Se não tem cache, busca do backend
        await fetchAndCachePhotos();
    }
}

// Verifica se há mudanças comparando os IDs das fotos
function hasPhotosChanged(cachedIds, newIds) {
    // Se a quantidade mudou, há diferença
    if (cachedIds.length !== newIds.length) {
        console.log(`Quantidade mudou: ${cachedIds.length} -> ${newIds.length}`);
        return true;
    }
    
    const sortedCachedIds = [...cachedIds].sort();
    const sortedNewIds = [...newIds].sort();
    
    // Verifica se os IDs são os mesmos
    const changed = JSON.stringify(sortedCachedIds) !== JSON.stringify(sortedNewIds);
    if (changed) {
        console.log('IDs mudaram:', sortedCachedIds, '->', sortedNewIds);
    }
    return changed;
}

async function fetchAndCachePhotosIfChanged(cachedPhotos) {
    try {
        // Primeiro busca apenas os IDs (muito leve)
        const response = await fetch(photosIdsEndpoint);
        if (!response.ok) {
            throw new Error('Não foi possível verificar as imagens.');
        }
        const newIds = await response.json();
        
        const cachedIds = cachedPhotos.map(p => p.id);
        
        // Só busca as fotos completas se houver mudança nos IDs
        if (hasPhotosChanged(cachedIds, newIds)) {
            console.log('Há novas fotos, buscando imagens completas...');
            await fetchAndCachePhotos();
        } else {
            console.log('Nenhuma nova foto, cache mantido.');
        }
    } catch (error) {
        console.error('Erro ao verificar IDs:', error);
        // Se der erro na verificação, força atualização completa
        console.log('Forçando atualização completa devido a erro...');
        await fetchAndCachePhotos();
    }
}

async function fetchAndCachePhotos() {
    try {
        const response = await fetch(photosEndpoint);
        if (!response.ok) {
            throw new Error('Não foi possível carregar as imagens.');
        }
        const photos = await response.json();
        // Salva no cache
        localStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify(photos));
        renderPhotos(photos);
    } catch (error) {
        setGalleryStatus(error.message);
    }
}

function clearPhotosCache() {
    localStorage.removeItem(PHOTOS_CACHE_KEY);
    console.log('Cache de fotos limpo');
}

// Torna disponível no console para debug manual
window.clearPhotosCache = clearPhotosCache;
window.forceReloadPhotos = async () => {
    console.log('Forçando recarregamento de fotos...');
    clearPhotosCache();
    await fetchAndCachePhotos();
};

// Função que redimensiona e comprime a imagem usando HTML5 Canvas
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Mantém a proporção da imagem dentro do limite
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                // Desenha a imagem no Canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Converte para Blob (JPEG com 70% de qualidade)
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
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

async function uploadPhoto(file) {
    setGalleryStatus('Comprimindo imagem...');
    
    // Tenta comprimir a foto antes de enviar
    let fileToUpload = file;
    try {
        fileToUpload = await compressImage(file, 1200, 1200, 0.7);
        console.log(`Foto comprimida de ${(file.size / 1024 / 1024).toFixed(2)} MB para ${(fileToUpload.size / 1024).toFixed(2)} KB`);
    } catch (e) {
        console.warn('Não foi possível comprimir a foto, enviando original:', e);
    }

    const formData = new FormData();
    formData.append('foto', fileToUpload);
    setGalleryStatus('Enviando imagem...');

    const response = await fetch(`${photosEndpoint}/upload`, { method: 'POST', body: formData });
    if (!response.ok) {
        throw new Error('Não foi possível enviar a imagem.');
    }

    // Atualiza o cache buscando as fotos atualizadas
    await fetchAndCachePhotos();
    setGalleryStatus('Imagem adicionada.');
}

async function deleteSelectedPhoto() {
    if (selectedPhotoId === null) {
        return;
    }

    setGalleryStatus('Excluindo imagem...');
    console.log(`Tentando deletar foto ID: ${selectedPhotoId}`);
    
    try {
        const response = await fetch(`${photosEndpoint}/${selectedPhotoId}`, { method: 'DELETE' });
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro ao deletar:', errorText);
            throw new Error('Não foi possível excluir a imagem.');
        }

        clearPhotoSelection();
        // Atualiza o cache buscando as fotos atualizadas
        await fetchAndCachePhotos();
        setGalleryStatus('Imagem excluída.');
        console.log('Foto deletada com sucesso');
    } catch (error) {
        console.error('Erro no delete:', error);
        setGalleryStatus(error.message);
    }
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

