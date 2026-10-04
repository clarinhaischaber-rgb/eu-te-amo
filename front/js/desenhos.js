/**
 * Módulo de Gerenciamento do Quadro de Desenhos e Galeria.
 * Implementa cache em localStorage, verificação leve de IDs e compressão de imagem.
 */
document.addEventListener("DOMContentLoaded", () => {
    const photosEndpoint = `${API_URL}/desenhos`;
    const photosIdsEndpoint = `${API_URL}/desenhos/ids`;
    const DESENHOS_CACHE_KEY = "cached_desenhos";

    const token = typeof getToken === "function" ? getToken() : localStorage.getItem("token");
    const isAutenticado = Boolean(token);

    // Mapeamento de elementos
    const secaoCriacao = document.getElementById("secao-criacao");
    const gridDesenhos = document.getElementById("grid-desenhos");
    const desenhoStatus = document.getElementById("desenho-status");

    // Elementos do Canvas
    const canvas = document.getElementById("canvas-desenho");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const colorPicker = document.getElementById("color-picker");
    const brushSize = document.getElementById("brush-size");
    const brushSizeVal = document.getElementById("brush-size-val");
    const btnPincel = document.getElementById("btn-pincel");
    const btnBorracha = document.getElementById("btn-borracha");
    const btnLimpar = document.getElementById("btn-limpar");
    const btnSalvar = document.getElementById("btn-salvar");
    const inputTitulo = document.getElementById("input-titulo");

    let desenhando = false;
    let modoBorracha = false;
    let corAtual = "#181818";
    let tamanhoAtual = 5;

    // Controla visibilidade para usuários autenticados
    if (isAutenticado && secaoCriacao) {
        secaoCriacao.classList.remove("hidden");
        inicializarCanvas();
    }

    // Carrega desenhos salvos
    loadDesenhos();

    /**
     * Atualiza a mensagem de status da galeria na interface.
     */
    function setDesenhoStatus(message) {
        if (desenhoStatus) {
            desenhoStatus.textContent = message;
        }
    }

    /**
     * Remove desenhos duplicados com base no ID único do banco de dados (desenho.id).
     * Corrigido para garantir que registros com publicIds idênticos não sejam descartados.
     */
    function uniqueDesenhos(desenhos) {
        const seen = new Set();
        return desenhos.filter((desenho) => {
            // Utiliza estritamente o id numérico único como chave de desduplicação
            const key = desenho.id;
            if (!key || seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Renderiza a lista de desenhos na grelha HTML.
     */
    function renderDesenhos(desenhos) {
        if (!gridDesenhos) return;
        gridDesenhos.innerHTML = "";

        const unique = uniqueDesenhos(desenhos);
        if (unique.length === 0) {
            gridDesenhos.innerHTML = "<p style='color: var(--gray); font-size: 13px;'>Nenhum desenho publicado ainda.</p>";
            return;
        }

        unique.forEach((d) => {
            const card = document.createElement("div");
            card.className = "card-desenho";

            const botaoExcluir = isAutenticado 
                ? `<button type="button" class="btn-delete" onclick="deletarDesenho(${d.id})">Excluir</button>` 
                : "";

            card.innerHTML = `
                <img src="${d.url}" alt="${d.titulo}">
                <div class="card-info">
                    <span>${d.titulo}</span>
                    ${botaoExcluir}
                </div>
            `;
            gridDesenhos.appendChild(card);
        });
    }

    /**
     * Carrega do cache (Cache First) e agenda verificação leve de alterações.
     */
    async function loadDesenhos() {
        const cachedDesenhos = localStorage.getItem(DESENHOS_CACHE_KEY);
        if (cachedDesenhos) {
            try {
                const desenhos = JSON.parse(cachedDesenhos);
                renderDesenhos(desenhos);
                await fetchAndCacheDesenhosIfChanged(desenhos);
            } catch (error) {
                console.error("Erro ao ler cache de desenhos:", error);
                await fetchAndCacheDesenhos();
            }
        } else {
            await fetchAndCacheDesenhos();
        }
    }

    /**
     * Compara os IDs em cache com os IDs mais recentes do servidor.
     */
    function hasDesenhosChanged(cachedIds, newIds) {
        if (cachedIds.length !== newIds.length) {
            return true;
        }
        const sortedCached = [...cachedIds].map(Number).sort((a, b) => a - b);
        const sortedNew = [...newIds].map(Number).sort((a, b) => a - b);
        return JSON.stringify(sortedCached) !== JSON.stringify(sortedNew);
    }

    /**
     * Verifica via endpoint de IDs (/ids) se a galeria mudou antes de fazer o download completo.
     */
    async function fetchAndCacheDesenhosIfChanged(cachedDesenhos) {
        try {
            const response = await fetch(photosIdsEndpoint);
            if (!response.ok) throw new Error("Não foi possível verificar atualizações dos desenhos.");

            const newIds = await response.json();
            const cachedIds = cachedDesenhos.map(d => d.id);

            if (hasDesenhosChanged(cachedIds, newIds)) {
                await fetchAndCacheDesenhos();
            }
        } catch (error) {
            console.error("Erro ao verificar IDs de desenhos:", error);
            await fetchAndCacheDesenhos();
        }
    }

    /**
     * Baixa a lista completa de desenhos da API e atualiza o cache.
     */
    async function fetchAndCacheDesenhos() {
        try {
            const response = await fetch(photosEndpoint);
            if (!response.ok) throw new Error("Não foi possível carregar os desenhos.");

            const desenhos = await response.json();
            localStorage.setItem(DESENHOS_CACHE_KEY, JSON.stringify(desenhos));
            renderDesenhos(desenhos);
            setDesenhoStatus("");
        } catch (error) {
            setDesenhoStatus(error.message);
        }
    }

    /**
     * Inicializa eventos e ferramentas do Canvas.
     */
    function inicializarCanvas() {
        if (!canvas || !ctx) return;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        brushSize.addEventListener("input", (e) => {
            tamanhoAtual = e.target.value;
            brushSizeVal.textContent = `${tamanhoAtual}px`;
        });

        colorPicker.addEventListener("input", (e) => {
            corAtual = e.target.value;
            if (modoBorracha) alternarModo(false);
        });

        btnPincel.addEventListener("click", () => alternarModo(false));
        btnBorracha.addEventListener("click", () => alternarModo(true));

        btnLimpar.addEventListener("click", () => {
            if (confirm("Deseja limpar todo o quadro?")) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        });

        canvas.addEventListener("mousedown", iniciarTraco);
        canvas.addEventListener("mousemove", desenhar);
        canvas.addEventListener("mouseup", pararTraco);
        canvas.addEventListener("mouseleave", pararTraco);

        canvas.addEventListener("touchstart", (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            iniciarTraco({ clientX: touch.clientX, clientY: touch.clientY });
        });

        canvas.addEventListener("touchmove", (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            desenhar({ clientX: touch.clientX, clientY: touch.clientY });
        });

        canvas.addEventListener("touchend", pararTraco);

        btnSalvar.addEventListener("click", salvarDesenho);
    }

    function alternarModo(borracha) {
        modoBorracha = borracha;
        if (borracha) {
            btnBorracha.classList.add("active");
            btnPincel.classList.remove("active");
        } else {
            btnPincel.classList.add("active");
            btnBorracha.classList.remove("active");
        }
    }

    function obterPosicao(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function iniciarTraco(e) {
        desenhando = true;
        const pos = obterPosicao(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function desenhar(e) {
        if (!desenhando) return;
        const pos = obterPosicao(e);

        ctx.lineWidth = tamanhoAtual;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = modoBorracha ? "#ffffff" : corAtual;

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function pararTraco() {
        desenhando = false;
        ctx.beginPath();
    }

    /**
     * Comprime a imagem gerada no Canvas em formato JPEG otimizado antes do envio.
     */
    function compressCanvasImage(quality = 0.8) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const file = new File([blob], "desenho.jpg", {
                            type: "image/jpeg",
                            lastModified: Date.now()
                        });
                        resolve(file);
                    } else {
                        reject(new Error("Falha ao gerar o arquivo de imagem do desenho."));
                    }
                },
                "image/jpeg",
                quality
            );
        });
    }

    /**
     * Comprime e envia o desenho do Canvas para o servidor.
     */
    async function salvarDesenho() {
        btnSalvar.disabled = true;
        setDesenhoStatus("Comprimindo e preparando o desenho...");

        try {
            const compressedFile = await compressCanvasImage(0.8);
            setDesenhoStatus("Enviando o desenho para o servidor...");

            const formData = new FormData();
            formData.append("file", compressedFile);
            formData.append("titulo", inputTitulo.value);

            const response = await fetch(photosEndpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error("Não foi possível salvar o desenho no servidor.");
            }

            setDesenhoStatus("Desenho salvo com sucesso!");
            inputTitulo.value = "";
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await fetchAndCacheDesenhos();
        } catch (error) {
            setDesenhoStatus(error.message);
        } finally {
            btnSalvar.disabled = false;
        }
    }

    /**
     * Exclui um desenho selecionado por ID.
     */
    window.deletarDesenho = async function(id) {
        if (!confirm("Tem certeza que deseja excluir este desenho?")) return;

        setDesenhoStatus("Excluindo desenho...");

        try {
            const response = await fetch(`${photosEndpoint}/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Não foi possível excluir o desenho.");
            }

            setDesenhoStatus("Desenho excluído com sucesso.");
            await fetchAndCacheDesenhos();
        } catch (error) {
            setDesenhoStatus(error.message);
        }
    };
});