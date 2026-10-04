document.addEventListener("DOMContentLoaded", async () => {
    const progressFill = document.getElementById("progress-fill");
    const statusPercent = document.getElementById("status-percent");
    const splashTitle = document.getElementById("splash-title");
    const splashSubtitle = document.getElementById("splash-subtitle");

    let progress = 0;
    let progressInterval = null;

    function setProgress(val) {
        progress = Math.min(val, 100);
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (statusPercent) statusPercent.textContent = `${progress}%`;
    }

    // Timer para mostrar mensagem de servidor "acordando" se demorar mais de 1.5s
    const slowTimer = setTimeout(() => {
        if (splashTitle) splashTitle.textContent = "Acordando o servidor...";
        if (splashSubtitle) splashSubtitle.textContent = "Servidores gratuitos demoram ~90s no primeiro acesso.";
        
        // Inicia simulação de progresso gradual até a API responder
        progressInterval = setInterval(() => {
            if (progress < 90) {
                setProgress(progress + Math.floor(Math.random() * 4) + 1);
            }
        }, 500);
    }, 1500);

    try {
        // 1. Tenta "acordar" a API e já faz o pré-carregamento dos dados em paralelo
        const [cartasRes, fotosRes] = await Promise.all([
            fetch(`${API_URL}/cartas`),
            fetch(`${API_URL}/fotos`)
        ]);

        clearTimeout(slowTimer);
        if (progressInterval) clearInterval(progressInterval);

        // 2. Se as requisições deram certo, salva em cache no localStorage
        if (cartasRes.ok) {
            const cartas = await cartasRes.json();
            // Salva se necessário ou deixa disponível pro browser
        }

        if (fotosRes.ok) {
            const fotos = await fotosRes.json();
            localStorage.setItem("cached_photos", JSON.stringify(fotos));
        }

        // Completa o carregamento
        setProgress(100);

        // 3. Redirecionamento Inteligente após 400ms
        setTimeout(() => {
            const token = localStorage.getItem("token");
            if (token) {
                window.location.replace("./Nos.html");
            } else {
                window.location.replace("./login.html");
            }
        }, 400);

    } catch (error) {
        console.error("Erro ao conectar à API:", error);
        clearTimeout(slowTimer);
        if (progressInterval) clearInterval(progressInterval);
        
        if (splashTitle) splashTitle.textContent = "Erro na conexão";
        if (splashSubtitle) splashSubtitle.textContent = "Não foi possível conectar ao servidor. Tente atualizar.";
    }
});