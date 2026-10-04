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
        // 1. Tenta "acordar" a API e faz o pré-carregamento dos dados em paralelo
        const [cartasRes, fotosRes] = await Promise.all([
            fetch(`${API_URL}/cartas`),
            fetch(`${API_URL}/fotos`)
        ]);

        clearTimeout(slowTimer);
        if (progressInterval) clearInterval(progressInterval);

        // 2. Guarda fotos em cache no localStorage
        if (cartasRes.ok) {
            const cartas = await cartasRes.json();
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

    // --- LÓGICA DO JOGO DO DINOSSAURO ---
    initDinoGame();

});

// --- MOTOR DO JOGO DO DINOSSAURO ---
function initDinoGame() {
    const canvas = document.getElementById("dino-game");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const GROUND_Y = 110;
    let score = 0;
    let gameOver = false;
    let gameFrame = 0;

    const dino = {
        x: 30,
        y: GROUND_Y - 24,
        width: 20,
        height: 24,
        vy: 0,
        gravity: 0.6,
        jumpForce: -9,
        isGrounded: true,
        jump() {
            if (this.isGrounded) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
            } else if (gameOver) {
                resetGame();
            }
        },
        update() {
            this.vy += this.gravity;
            this.y += this.vy;

            if (this.y + this.height >= GROUND_Y) {
                this.y = GROUND_Y - this.height;
                this.vy = 0;
                this.isGrounded = true;
            }
        },
        draw() {
            ctx.fillStyle = "#f3b6c8";
            // Corpo do Dinossauro
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Olho
            ctx.fillStyle = "#121116";
            ctx.fillRect(this.x + 12, this.y + 4, 3, 3);
            // Patas animadas ao correr
            if (this.isGrounded && Math.floor(gameFrame / 6) % 2 === 0) {
                ctx.fillRect(this.x + 2, this.y + this.height, 4, 3);
            } else if (this.isGrounded) {
                ctx.fillRect(this.x + 12, this.y + this.height, 4, 3);
            }
        }
    };

    let obstacles = [];
    let spawnTimer = 0;

    function spawnObstacle() {
        const height = Math.floor(Math.random() * 14) + 16;
        obstacles.push({
            x: canvas.width,
            y: GROUND_Y - height,
            width: 12,
            height: height
        });
    }

    function resetGame() {
        obstacles = [];
        score = 0;
        gameOver = false;
        dino.y = GROUND_Y - dino.height;
        dino.vy = 0;
        dino.isGrounded = true;
    }

    // Eventos de Pulo (Espaço, Seta para Cima ou Toque/Clique no Canvas)
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp") {
            e.preventDefault();
            dino.jump();
        }
    });

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        dino.jump();
    }, { passive: false });

    canvas.addEventListener("mousedown", () => {
        dino.jump();
    });

    // Loop Principal de Animação
    function loop() {
        gameFrame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Chão
        ctx.strokeStyle = "#3a3546";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(canvas.width, GROUND_Y);
        ctx.stroke();

        if (!gameOver) {
            dino.update();

            // Lógica dos Obstáculos (Cactos)
            spawnTimer++;
            if (spawnTimer > 75 + Math.floor(Math.random() * 40)) {
                spawnObstacle();
                spawnTimer = 0;
            }

            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.x -= 3.5;

                // Desenha Cacto
                ctx.fillStyle = "#b8d7f2";
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

                // Colisão AABB
                if (
                    dino.x < obs.x + obs.width &&
                    dino.x + dino.width > obs.x &&
                    dino.y < obs.y + obs.height &&
                    dino.y + dino.height > obs.y
                ) {
                    gameOver = true;
                }

                if (obs.x + obs.width < 0) {
                    obstacles.splice(i, 1);
                    score += 10;
                }
            }
        }

        dino.draw();

        // Pontuação
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px monospace";
        ctx.fillText(`HI: ${score}`, canvas.width - 60, 15);

        if (gameOver) {
            ctx.fillStyle = "#ff4757";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, 55);
            ctx.font = "10px sans-serif";
            ctx.fillStyle = "#cccccc";
            ctx.fillText("Toque ou Pressione ESPAÇO", canvas.width / 2, 72);
            ctx.textAlign = "left";
        }

        requestAnimationFrame(loop);
    }

    loop();
}