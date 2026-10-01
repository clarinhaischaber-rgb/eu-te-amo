document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // --- CONFIGURAÇÕES BÁSICAS ---
    const groundY = 320;
    let gameOver = false;
    let isPaused = false; // Estado de Pause
    let winnerMessage = '';

    // --- CARREGAMENTO DE ÁUDIOS ---
    const soundStarPlatinum = new Audio('../../sounds/gameJoestar/lvl1/star-platinum-za-warudo.mp3');
    const soundDioZaWarudo = new Audio('../../sounds/gameJoestar/lvl1/hd-stardust-crusaders-za-warudo_1.mp3');
    const soundParry = new Audio('../../sounds/gameJoestar/lvl1/shield-parry-smb.mp3');
    const soundJump = new Audio('../../sounds/gameJoestar/lvl1/action_jump.mp3');

    // Funções utilitárias para reproduzir sons reiniciando o tempo se necessário
    function playSound(audio) {
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    }

    // Fases do ataque (em frames, ~60 FPS)
    const ATTACK_WINDUP = 30;   // aviso: dá tempo de reagir/dar parry
    const ATTACK_ACTIVE = 6;    // frames em que o golpe realmente acerta
    const ATTACK_RECOVERY = 12; // recuperação (atacante vulnerável)
    const ATTACK_TOTAL = ATTACK_WINDUP + ATTACK_ACTIVE + ATTACK_RECOVERY;

    function getAttackPhase(f) {
        if (!f.isAttacking) return null;
        if (f.attackTimer > ATTACK_ACTIVE + ATTACK_RECOVERY) return 'windup';
        if (f.attackTimer > ATTACK_RECOVERY) return 'active';
        return 'recovery';
    }

    // Estado global de manipulação do tempo (Ultimates)
    let timeStopOwner = null; // 'p1' ou 'p2'
    let timeStopTimer = 0;    // Duração do tempo parado (~5 seg = 300 frames)
    let timeStopCancelTimer = 0; // Frame de ativação para verificar a anulação (<1.5s)
    let globalFrameCount = 0;

    // Lista para controlar projéteis (Facas da IA)
    const projectiles = [];

    // --- FUNDO: CIDADE (desenhada uma vez num canvas offscreen) ---
    function buildCityBackground() {
        const bg = document.createElement('canvas');
        bg.width = canvas.width;
        bg.height = canvas.height;
        const b = bg.getContext('2d');

        let seed = 7;
        const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

        // Céu entardecer/noite
        const sky = b.createLinearGradient(0, 0, 0, groundY);
        sky.addColorStop(0, '#1a1033');
        sky.addColorStop(0.6, '#5b2a6e');
        sky.addColorStop(1, '#ff7e5f');
        b.fillStyle = sky;
        b.fillRect(0, 0, bg.width, groundY);

        // Estrelas e lua
        b.fillStyle = '#fff';
        for (let i = 0; i < 40; i++) b.fillRect(rand() * bg.width, rand() * 120, 2, 2);
        b.fillStyle = '#fff3c4';
        b.beginPath();
        b.arc(bg.width * 0.8, 70, 28, 0, Math.PI * 2);
        b.fill();

        // Camadas de prédios
        function drawLayer(color, minH, maxH, minW, maxW, windowColor) {
            let x = -10;
            while (x < bg.width) {
                const w = minW + rand() * (maxW - minW);
                const h = minH + rand() * (maxH - minH);
                b.fillStyle = color;
                b.fillRect(x, groundY - h, w, h);
                if (windowColor) {
                    for (let wy = groundY - h + 10; wy < groundY - 15; wy += 16) {
                        for (let wx = x + 6; wx < x + w - 10; wx += 14) {
                            if (rand() < 0.45) {
                                b.fillStyle = windowColor;
                                b.fillRect(wx, wy, 6, 8);
                            }
                        }
                    }
                }
                x += w + 2 + rand() * 6;
            }
        }
        drawLayer('#2a1b45', 90, 200, 40, 80, null);       // fundo (distante)
        drawLayer('#160e2b', 60, 150, 50, 90, '#ffd56b');  // frente (janelas acesas)

        // Rua
        const streetH = bg.height - groundY;
        b.fillStyle = '#2b2b3a';
        b.fillRect(0, groundY, bg.width, streetH);
        b.fillStyle = '#3d3d52'; // calçada
        b.fillRect(0, groundY, bg.width, 6);
        b.fillStyle = '#e8c547'; // faixa tracejada
        for (let x = 0; x < bg.width; x += 60) b.fillRect(x, groundY + streetH / 2, 30, 4);

        // Postes de luz
        for (let x = 120; x < bg.width; x += 260) {
            b.fillStyle = '#111';
            b.fillRect(x, groundY - 110, 4, 110);
            b.fillRect(x, groundY - 110, 18, 4);
            b.fillStyle = 'rgba(255, 220, 120, 0.25)';
            b.beginPath();
            b.arc(x + 16, groundY - 104, 22, 0, Math.PI * 2);
            b.fill();
            b.fillStyle = '#ffe28a';
            b.fillRect(x + 13, groundY - 106, 6, 4);
        }

        return bg;
    }

    const cityBg = buildCityBackground();

    // --- CARREGAMENTO DE SPRITES ---
    function loadSpritesheet(paths) {
        return paths.map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });
    }

    function buildSprites(folder, frameCounts) {
        const out = {};
        for (const [state, n] of Object.entries(frameCounts)) {
            out[state] = loadSpritesheet(
                Array.from({ length: n }, (_, i) => `sprites/${folder}/${state}_${i}.png`)
            );
        }
        return out;
    }

    const FRAMES = { idle: 2, walk: 2, jump: 1, attack: 2, parry: 1 };
    const p1Sprites = buildSprites('jotaro', FRAMES);
    const p2Sprites = buildSprites('enemy', FRAMES);

    const bgm = new Audio('sounds/bgm.mp3');
    bgm.loop = true;
    bgm.volume = 0.25;

    let audioCtx = null;
    let muted = false;

    function unlockAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (bgm.paused && !bgm.error) bgm.play().catch(() => { });
    }
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('mousedown', unlockAudio);

    // Tecla M liga/desliga o som
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'm') {
            muted = !muted;
            bgm.muted = muted;
        }
    });

    // --- CONTROLES TECLADO ---
    const keys = {
        a: false,
        d: false,
        w: false,
        f: false,
        g: false
    };

    // --- MODELO DOS LUTADORES ---
    function createFighter(id, x, color, sprites, isPlayer2 = false) {
        return {
            id: id,
            x: x,
            y: groundY - 64,
            width: 40,
            height: 64,
            color: color,
            hp: 100,
            maxHp: 100,

            ultCharge: 0,
            maxUlt: 100,

            velocityX: 0,
            velocityY: 0,
            speed: 4,
            isGrounded: true,
            facingRight: !isPlayer2,

            isAttacking: false,
            attackTimer: 0,
            hasHit: false,

            isBlocking: false,
            parryWindowTimer: 0,
            isStunned: false,
            stunTimer: 0,
            parryTextTimer: 0,

            knifeCooldown: 0,

            sprites: sprites,
            animState: 'idle',
            animFrame: 0,
            animTimer: 0,
            animSpeed: 8,

            addUlt(amount) {
                this.ultCharge = Math.min(this.maxUlt, this.ultCharge + amount);
            }
        };
    }

    const player1 = createFighter('p1', 100, '#ff4757', p1Sprites, false);
    const player2 = createFighter('p2', 650, '#2ed573', p2Sprites, true);

    // --- EVENTOS DO TECLADO E MOUSE ---
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        // Alternar Pause ao pressionar ESC
        if (e.key === 'Escape' && !gameOver) {
            isPaused = !isPaused;
            return;
        }

        if (isPaused) return;

        if (key in keys) keys[key] = true;

        if ((key === 'w' || key === ' ') && player1.isGrounded && !player1.isStunned && !gameOver) {
            player1.velocityY = -11;
            player1.isGrounded = false;
            playSound(soundJump); // Toca o som de Pulo
        }

        if (key === 'f' && !player1.isBlocking && !player1.isStunned && !gameOver) {
            player1.isBlocking = true;
            player1.parryWindowTimer = 12;
        }

        // Ativar Ultimate do Jogador (G)
        if (key === 'g' && !player1.isStunned && !gameOver) {
            triggerUltimate(player1);
        }

        if (gameOver && key === 'r') {
            resetGame();
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key in keys) keys[key] = false;
        if (key === 'f') player1.isBlocking = false;
    });

    window.addEventListener('mousedown', (e) => {
        if (isPaused) return;
        if (e.button === 0 && !player1.isAttacking && !player1.isStunned && !gameOver) {
            player1.isAttacking = true;
            player1.attackTimer = ATTACK_TOTAL;
            player1.hasHit = false;
        }
    });

    // --- LÓGICA DE ULTIMATE & ANULAÇÃO DE TEMPO ---
    function triggerUltimate(fighter) {
        if (fighter.ultCharge < fighter.maxUlt) return;

        fighter.ultCharge = 0; // Consome toda a barra

        // Toca o som apropriado da Ultimate
        if (fighter.id === 'p1') {
            playSound(soundStarPlatinum);
        } else {
            playSound(soundDioZaWarudo);
        }

        // Se o outro personagem já ativou a ult recentemente (<1.5s = 90 frames)
        if (timeStopOwner && timeStopOwner !== fighter.id) {
            const timeDiff = globalFrameCount - timeStopCancelTimer;
            if (timeDiff <= 90) {
                timeStopOwner = null;
                timeStopTimer = 0;
                player1.parryTextTimer = 45;
                player2.parryTextTimer = 45;
                return;
            }
        }

        timeStopOwner = fighter.id;
        timeStopTimer = 300; // 5 segundos
        timeStopCancelTimer = globalFrameCount;
    }

    function resetGame() {
        [player1, player2].forEach(f => {
            f.hp = 100;
            f.ultCharge = 0;
            f.isStunned = false;
            f.stunTimer = 0;
            f.isAttacking = false;
            f.attackTimer = 0;
            f.isBlocking = false;
            f.parryWindowTimer = 0;
            f.parryTextTimer = 0;
            f.knifeCooldown = 0;
            f.velocityY = 0;
            f.y = groundY - f.height;
            f.isGrounded = true;
        });
        player1.x = 100;
        player2.x = 650;

        timeStopOwner = null;
        timeStopTimer = 0;
        projectiles.length = 0;

        gameOver = false;
        isPaused = false;
        winnerMessage = '';
    }

    // --- INTELIGÊNCIA ARTIFICIAL (P2) ---
    function updateAI() {
        if (player2.isStunned || gameOver) return;

        const distance = player1.x - player2.x;
        const absDistance = Math.abs(distance);

        if (player2.ultCharge >= player2.maxUlt) {
            const randomChance = Math.random();
            if (randomChance < 0.5) {
                triggerUltimate(player2);
            }
        }

        if (absDistance > 250 && player2.knifeCooldown <= 0) {
            projectiles.push({
                x: player2.x + (player2.facingRight ? player2.width : 0),
                y: player2.y + 20,
                vx: player2.facingRight ? 8 : -8,
                width: 15,
                height: 5,
                owner: player2
            });
            player2.knifeCooldown = 180;
        }

        if (absDistance > 60) {
            player2.x += distance > 0 ? 2 : -2;
        } else {
            if (!player2.isAttacking && Math.random() < 0.03) {
                player2.isAttacking = true;
                player2.attackTimer = ATTACK_TOTAL;
                player2.hasHit = false;
            }
        }
    }

    // --- COLISÕES DE GOLPES ---
    function handleCombat(attacker, defender) {
        if (getAttackPhase(attacker) !== 'active' || attacker.hasHit) return;

        const attackBox = {
            x: attacker.facingRight ? attacker.x + attacker.width : attacker.x - 30,
            y: attacker.y + 10,
            width: 30,
            height: 30
        };

        if (
            attackBox.x < defender.x + defender.width &&
            attackBox.x + attackBox.width > defender.x &&
            attackBox.y < defender.y + defender.height &&
            attackBox.y + attackBox.height > defender.y
        ) {
            attacker.hasHit = true;

            // PARRY PERFEITO!
            if (defender.isBlocking && defender.parryWindowTimer > 0) {
                playSound(soundParry); // Toca o som de Parry
                defender.parryTextTimer = 30;
                attacker.isStunned = true;
                attacker.stunTimer = 60;
                attacker.isAttacking = false;
                defender.addUlt(15);
                return;
            }

            let damage = defender.isBlocking ? 2 : 12;
            defender.hp -= damage;
            if (!defender.isBlocking) defender.x += attacker.facingRight ? 15 : -15;

            attacker.addUlt(10);
            defender.addUlt(5);

            if (defender.hp <= 0) {
                defender.hp = 0;
                gameOver = true;
                winnerMessage = attacker === player1 ? 'PLAYER 1 VENCEU!' : 'INIMIGO VENCEU!';
            }
        }
    }

    // --- ATUALIZAÇÃO E ANIMAÇÃO ---
    function updateFighterAnimation(f) {
        let newState = 'idle';
        if (f.isAttacking) newState = 'attack';
        else if (f.isBlocking) newState = 'parry';
        else if (!f.isGrounded) newState = 'jump';
        else if (keys.a || keys.d || (f.id === 'p2' && Math.abs(player1.x - player2.x) > 60)) newState = 'walk';

        if (f.animState !== newState) {
            f.animState = newState;
            f.animFrame = 0;
            f.animTimer = 0;
        }

        f.animTimer++;
        if (f.animTimer >= f.animSpeed) {
            f.animTimer = 0;
            const currentSprites = f.sprites[f.animState];
            if (currentSprites && currentSprites.length > 0) {
                f.animFrame = (f.animFrame + 1) % currentSprites.length;
            }
        }
    }

    // --- LOOP DE ATUALIZAÇÕES ---
    function update() {
        if (gameOver || isPaused) return;
        globalFrameCount++;

        if (timeStopTimer > 0) {
            timeStopTimer--;
            if (timeStopTimer === 0) timeStopOwner = null;
        }

        if (player2.knifeCooldown > 0) player2.knifeCooldown--;

        if (timeStopOwner !== 'p2') {
            if (player1.stunTimer > 0) {
                player1.stunTimer--;
                if (player1.stunTimer === 0) player1.isStunned = false;
            } else {
                if (keys.a && player1.x > 0) player1.x -= player1.speed;
                if (keys.d && player1.x + player1.width < canvas.width) player1.x += player1.speed;
            }

            player1.facingRight = player1.x < player2.x;
            if (player1.parryWindowTimer > 0) player1.parryWindowTimer--;
            if (player1.parryTextTimer > 0) player1.parryTextTimer--;
            if (player1.isAttacking) {
                player1.attackTimer--;
                if (player1.attackTimer <= 0) player1.isAttacking = false;
            }

            player1.velocityY += 0.6;
            player1.y += player1.velocityY;
            if (player1.y + player1.height >= groundY) {
                player1.y = groundY - player1.height;
                player1.velocityY = 0;
                player1.isGrounded = true;
            }
            updateFighterAnimation(player1);
        }

        if (timeStopOwner !== 'p1') {
            if (player2.stunTimer > 0) {
                player2.stunTimer--;
                if (player2.stunTimer === 0) player2.isStunned = false;
            } else {
                updateAI();
            }

            player2.facingRight = player2.x < player1.x;
            if (player2.parryTextTimer > 0) player2.parryTextTimer--;
            if (player2.isAttacking) {
                player2.attackTimer--;
                if (player2.attackTimer <= 0) player2.isAttacking = false;
            }
            updateFighterAnimation(player2);
        }

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            if (timeStopOwner === null || timeStopOwner === p.owner.id) {
                p.x += p.vx;
            }

            if (
                p.x < player1.x + player1.width &&
                p.x + p.width > player1.x &&
                p.y < player1.y + player1.height &&
                p.y + p.height > player1.y
            ) {
                if (player1.isBlocking && player1.parryWindowTimer > 0) {
                    playSound(soundParry);
                    player1.parryTextTimer = 30;
                } else {
                    player1.hp -= 8;
                    player1.addUlt(3);
                }
                projectiles.splice(i, 1);
                continue;
            }

            if (p.x < 0 || p.x > canvas.width) projectiles.splice(i, 1);
        }

        if (timeStopOwner !== 'p2') handleCombat(player1, player2);
        if (timeStopOwner !== 'p1') handleCombat(player2, player1);
    }

    // --- RENDERIZAÇÃO ---
    function drawFighter(f) {
        const currentSprites = f.sprites[f.animState];
        const img = (currentSprites && currentSprites[f.animFrame]) ? currentSprites[f.animFrame] : null;

        ctx.save();

        if (!f.facingRight) {
            ctx.translate(f.x + f.width, f.y);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(f.x, f.y);
        }

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, 0, 0, f.width, f.height);
        } else {
            ctx.fillStyle = f.isStunned ? '#f1c40f' : (f.isBlocking ? '#3498db' : f.color);
            ctx.fillRect(0, 0, f.width, f.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(f.width - 8, 10, 6, 6);
        }

        ctx.restore();

        const phase = getAttackPhase(f);
        if (phase) {
            const boxX = f.facingRight ? f.x + f.width : f.x - 30;

            if (phase === 'windup') {
                const remaining = f.attackTimer - (ATTACK_ACTIVE + ATTACK_RECOVERY);
                const progress = 1 - remaining / ATTACK_WINDUP;

                ctx.fillStyle = `rgba(231, 76, 60, ${0.15 + progress * 0.4})`;
                ctx.fillRect(boxX, f.y + 10, 30, 30);
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 2;
                ctx.strokeRect(boxX, f.y + 10, 30, 30);

                if (Math.floor(globalFrameCount / 4) % 2 === 0) {
                    ctx.fillStyle = '#ff4757';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.fillText('!', f.x + f.width / 2 - 4, f.y - 28);
                }
            } else if (phase === 'active') {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(boxX, f.y + 10, 30, 30);
            }
        }

        if (f.parryTextTimer > 0) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('PARRY!', f.x, f.y - 15);
        }
    }

    function draw() {
        ctx.drawImage(cityBg, 0, 0);

        ctx.fillStyle = '#dcdde1';
        projectiles.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

        drawFighter(player1);
        drawFighter(player2);

        if (timeStopOwner) {
            ctx.save();
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        // HUD
        ctx.fillStyle = '#555';
        ctx.fillRect(30, 20, 250, 15);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(30, 20, (player1.hp / player1.maxHp) * 250, 15);

        ctx.fillStyle = '#555';
        ctx.fillRect(30, 40, 250, 8);
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(30, 40, (player1.ultCharge / player1.maxUlt) * 250, 8);

        ctx.fillStyle = '#555';
        ctx.fillRect(canvas.width - 280, 20, 250, 15);
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(canvas.width - 280, 20, (player2.hp / player2.maxHp) * 250, 15);

        ctx.fillStyle = '#555';
        ctx.fillRect(canvas.width - 280, 40, 250, 8);
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(canvas.width - 280, 40, (player2.ultCharge / player2.maxUlt) * 250, 8);

        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText('JOTARO (P1) - [G] ULT', 30, 15);
        ctx.fillText('OPONENTE (P2)', canvas.width - 280, 15);

        if (timeStopOwner) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ZA WARUDO! TEMPO PARADO!', canvas.width / 2, 80);
            ctx.textAlign = 'left';
        }

        // TELA DE PAUSE
        if (isPaused && !gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2 - 10);
            ctx.font = '16px sans-serif';
            ctx.fillText('Pressione ESC para continuar', canvas.width / 2, canvas.height / 2 + 30);
            ctx.textAlign = 'left';
        }

        // FIM DE JOGO
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(winnerMessage, canvas.width / 2, canvas.height / 2 - 10);
            ctx.font = '16px sans-serif';
            ctx.fillText('Pressione R para reiniciar', canvas.width / 2, canvas.height / 2 + 30);
            ctx.textAlign = 'left';
        }
    }

    function animate() {
        update();
        draw();
        requestAnimationFrame(animate);
    }

    animate();
});