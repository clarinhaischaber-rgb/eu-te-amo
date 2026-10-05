/**
 * ============================================================================
 * JOESTAR GAME - MINIGAME 2D DE LUTA
 * ============================================================================
 * Código refatorado com arquitetura modular, orientada a objetos e totalmente configurável.
 * 
 * Seções do Código:
 * 1. CONFIGURAÇÃO GERAL (GAME_CONFIG) - Ajuste balanceamento, teclas e assets aqui
 * 2. GERENCIADOR DE ÁUDIO (SoundManager) - Sons e música de fundo
 * 3. CARREGADOR DE ASSETS (AssetLoader) - Carregamento de spritesheets
 * 4. GERENCIADOR DE CONTROLES (InputManager) - Mapeamento de entradas do jogador
 * 5. CENÁRIO PROCEDURAL (CityBackground) - Geração e cache do fundo
 * 6. ENTIDADES (Fighter, Projectile) - Lógica de personagens e projéteis
 * 7. SISTEMA DE COMBATE (CombatSystem) - Colisões, danos e parry
 * 8. INTELIGÊNCIA ARTIFICIAL (AISystem) - Comportamento do inimigo (P2)
 * 9. MOTOR DO JOGO (JoestarGame) - Loop principal, máquina de estados e HUD
 * ============================================================================
 */

// ============================================================================
// 1. CONFIGURAÇÃO GERAL DO JOGO
// Facilita alterar qualquer detalhe no futuro em um único lugar!
// ============================================================================
const GAME_CONFIG = {
    // Dimensões do mundo e física
    WORLD: {
        GROUND_Y: 320,
        GRAVITY: 0.6,
        FRICTION: 0.85
    },

    // Mapeamento de controles do teclado e mouse
    CONTROLS: {
        MOVE_LEFT: ['a', 'A', 'ArrowLeft'],
        MOVE_RIGHT: ['d', 'D', 'ArrowRight'],
        JUMP: ['w', 'W', 'ArrowUp', ' '],
        BLOCK: ['f', 'F'],
        ULTIMATE: ['g', 'G'],
        RESTART: ['r', 'R'],
        PAUSE: ['Escape'],
        TOGGLE_MUTE: ['m', 'M'],
        ATTACK_MOUSE_BUTTON: 0 // Botão esquerdo
    },

    // Configurações de combate e mecânicas
    COMBAT: {
        ATTACK: {
            WINDUP_FRAMES: 30,   // Frames de aviso pré-ataque (tempo de reagir/dar parry)
            ACTIVE_FRAMES: 6,     // Frames onde o golpe causa dano ativo
            RECOVERY_FRAMES: 12,  // Frames de recuperação (atacante vulnerável)
            HITBOX_WIDTH: 55,     // Alcance retangular pra frente
            HITBOX_HEIGHT: 45,    // Altura da caixa do soco
            DAMAGE_UNBLOCKED: 5,
            DAMAGE_BLOCKED: 1,
            KNOCKBACK_FORCE: 15,
            ATTACKER_ULT_GAIN: 10,
            DEFENDER_ULT_GAIN_ON_HIT: 5
        },
        PARRY: {
            WINDOW_FRAMES: 12,       // Janela perfeita ao pressionar defesa
            STUN_DURATION_FRAMES: 60, // Tempo que o atacante fica congelado
            PARRY_ULT_GAIN: 15,       // Bônus de ult ao acertar o parry
            TEXT_DURATION: 30         // Duração do aviso 'PARRY!' na tela
        },
        TIMESTOP: {
            DURATION_FRAMES: 300,    // 5 segundos a 60 FPS
            COUNTER_WINDOW: 30,       // Se o rival ultar em até 0.5s (30 frames), anula!
            COUNTER_FEEDBACK_FRAMES: 45,
            P1_DELAY_FRAMES: 60,      // ~1 segundo de delay para o P1 sincronizar a fala com a parada do tempo
            EXPANSION_SPEED: 28,      // Velocidade de crescimento do círculo temporal
            REVERSE_SPEED: 56        // A reversão visual acontece mais rápido
        }
    },

    // Configurações dos Personagens
    CHARACTERS: {
        P1: {
            id: 'p1',
            name: 'Jotaro',
            displayName: 'JOTARO (P1) - [G] ULT',
            startX: 100,
            width: 38,
            height: 64,
            speed: 4,
            jumpForce: -11,
            maxHp: 100,
            maxUlt: 100,
            color: '#ff4757',
            spritesFolder: 'jotaro',
            spriteOverrides: {
                idle: {
                    folder: '../../img/joestargame/lvl1/p1/standing',
                    count: 24,
                    filename: (index) => `Jot_0-${index}.png`
                },
                walk: {
                    folder: '../../img/joestargame/lvl1/p1/moving',
                    count: 16,
                    filename: (index) => `Jot_0-${index + 37}.png`
                },
                attack: {
                    folder: '../../img/joestargame/lvl1/p1/atack',
                    count: 9,
                    filename: (index) => `Jot_0-${index + 467}.png`
                },
                jump: {
                    folder: '../../img/joestargame/lvl1/p1/jump',
                    count: 14,
                    filename: (index) => `Jot_0-${index + 85}.png`
                },
                parry: {
                    folder: '../../img/joestargame/lvl1/p1/parry',
                    count: 11,
                    filename: (index) => `Jot_0-${index + 568}.png`
                }
            },
            animationSpeeds: {
                attack: 5,
                jump: 3,
                parry: 3
            },
            showAttackHitbox: false,
            spriteDisplay: {
                sourceX: 145,
                sourceY: 45,
                sourceWidth: 95,
                sourceHeight: 140,
                width: 80,
                height: 112,
                groundOffset: 32
            },
            spriteDisplays: {
                attack: {
                    sourceX: 100,
                    sourceY: 35,
                    sourceWidth: 200,
                    sourceHeight: 160,
                    width: 160,
                    height: 128,
                    groundOffset: 32
                },
                jump: {
                    sourceX: 110,
                    sourceY: 25,
                    sourceWidth: 160,
                    sourceHeight: 180,
                    width: 128,
                    height: 144,
                    groundOffset: 23
                },
                parry: {
                    sourceX: 150,
                    sourceY: 45,
                    sourceWidth: 180,
                    sourceHeight: 140,
                    width: 144,
                    height: 112,
                    groundOffset: 32
                }
            },
            ultSound: '../../sounds/gameJoestar/lvl1/star-platinum-za-warudo.mp3'
        },
        P2: {
            id: 'p2',
            name: 'Dio',
            displayName: 'OPONENTE (P2)',
            startX: 650,
            width: 38,
            height: 64,
            speed: 4,
            jumpForce: -11,
            maxHp: 100,
            maxUlt: 100,
            color: '#2ed573',
            spritesFolder: 'enemy',
            spriteOverrides: {
                idle: {
                    folder: '../../img/joestargame/lvl1/p2/standing',
                    count: 6,
                    filename: (index) => `sDIO_0-${index}.png`
                },
                walk: {
                    folder: '../../img/joestargame/lvl1/p2/moving',
                    count: 16,
                    filename: (index) => `sDIO_0-${index + 21}.png`
                },
                parry: {
                    folder: '../../img/joestargame/lvl1/p2/parry',
                    count: 11,
                    filename: (index) => `sDIO_0-${index + 431}.png`
                },
                attack: {
                    folder: '../../img/joestargame/lvl1/p2/atack',
                    count: 13,
                    filename: (index) => `sDIO_0-${index + 340}.png`
                },
                knife: {
                    folder: '../../img/joestargame/lvl1/p2/knife',
                    count: 1,
                    filename: () => 'sDIO_0-598.png'
                }
            },
            projectileDisplay: {
                sourceX: 160,
                sourceY: 110,
                sourceWidth: 70,
                sourceHeight: 20,
                width: 60,
                height: 18
            },
            showAttackHitbox: false,
            spriteDisplay: {
                sourceX: 145,
                sourceY: 45,
                sourceWidth: 95,
                sourceHeight: 140,
                width: 80,
                height: 112,
                groundOffset: 30
            },
            spriteDisplays: {
                attack: {
                    sourceX: 155,
                    sourceY: 40,
                    sourceWidth: 190,
                    sourceHeight: 155,
                    width: 152,
                    height: 124,
                    groundOffset: 30
                }
            },
            animationSpeeds: {
                attack: 4,
                parry: 3
            },
            ultSound: '../../sounds/gameJoestar/lvl1/hd-stardust-crusaders-za-warudo_1.mp3',
            // Comportamento específico da IA
            ai: {
                parryChance: 0.25,
                approachDistance: 60,
                projectileDistance: 250,
                approachSpeed: 3,
                knifeCooldown: 120,
                knifeSpeed: 8,
                knifeDamage: 8,
                knifeUltGain: 3,
                attackChance: 0.1,
                ultChance: 0.5
            }
        }
    },

    // Configurações de Animação e Sprites
    SPRITES: {
        ANIM_SPEED: 8, // Frames por sprite
        FRAMES: {
            idle: 2,
            walk: 2,
            jump: 1,
            attack: 2,
            parry: 1
        }
    },

    // Sons e Músicas
    AUDIO: {
        BGM: {
            src: '../../sounds/gameJoestar/lvl1/audio_JOJOs_background.mp3',
            volume: 0.75,
            loop: true
        },
        SFX: {
            jump: '../../sounds/gameJoestar/lvl1/action_jump.mp3',
            parry: '../../sounds/gameJoestar/lvl1/shield-parry-smb.mp3',
            punch: '../../sounds/gameJoestar/lvl1/punch.mp3',
            lose: '../../sounds/gameJoestar/lose/voce-nao-tem-aura.mp3',
            victory: '../../sounds/gameJoestar/victory/super-smash-bros-bonus-results.mp3'
        }
    }
};

// ============================================================================
// 2. GERENCIADOR DE ÁUDIO
// Controla BGM, SFX, volume, mute e desbloqueio de áudio em navegadores modernos
// ============================================================================
class SoundManager {
    constructor(config) {
        this.config = config;
        this.audioCtx = null;
        this.muted = false;
        this.bgmStopped = false;
        this.bgmPaused = false;

        // BGM
        this.bgm = new Audio(this.config.BGM.src);
        this.bgm.loop = this.config.BGM.loop;
        this.bgm.volume = this.config.BGM.volume;

        // SFX Cache
        this.sfxCache = new Map();
        this.preloadSfx('jump', this.config.SFX.jump);
        this.preloadSfx('parry', this.config.SFX.parry);
        this.preloadSfx('punch', this.config.SFX.punch);
        this.preloadSfx('lose', this.config.SFX.lose);
        this.preloadSfx('victory', this.config.SFX.victory);
        this.preloadSfx('p1_ult', GAME_CONFIG.CHARACTERS.P1.ultSound);
        this.preloadSfx('p2_ult', GAME_CONFIG.CHARACTERS.P2.ultSound);

        this.setupAudioUnlock();
    }

    preloadSfx(name, path) {
        if (!path) return;
        const audio = new Audio(path);
        this.sfxCache.set(name, audio);
    }

    setupAudioUnlock() {
        const unlock = () => {
            if (!this.audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) this.audioCtx = new AudioContextClass();
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        };

        window.addEventListener('keydown', unlock, { once: false });
        window.addEventListener('mousedown', unlock, { once: false });
    }

    play(name) {
        const audio = this.sfxCache.get(name);
        if (audio) {
            audio.currentTime = 0;
            audio.muted = this.muted;
            audio.play().catch(() => {});
        }
    }

    stop(name) {
        const audio = this.sfxCache.get(name);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

    setBgmVolume(volume) {
        this.bgm.volume = volume;
    }

    stopBgm() {
        this.bgmStopped = true;
        this.bgmPaused = true;
        this.bgm.pause();
        this.bgm.currentTime = 0;
    }

    pauseBgm() {
        if (this.bgmStopped) return;
        this.bgmPaused = true;
        this.bgm.pause();
    }

    resumeBgm() {
        this.bgmStopped = false;
        this.bgmPaused = false;
        if (!this.muted) {
            this.bgm.play().catch(() => {});
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        this.bgm.muted = this.muted;
        this.sfxCache.forEach(audio => {
            audio.muted = this.muted;
        });
        return this.muted;
    }
}

// ============================================================================
// 3. CARREGADOR DE ASSETS
// ============================================================================
class AssetLoader {
    static loadSprites(folder, frameCounts, spriteOverrides = {}) {
        const sprites = {};
        const states = new Set([
            ...Object.keys(frameCounts),
            ...Object.keys(spriteOverrides)
        ]);

        for (const state of states) {
            const count = frameCounts[state] ?? 1;
            const override = spriteOverrides[state];
            const frameCount = override?.count ?? count;
            const spriteFolder = override?.folder ?? `../../img/joestargame/${folder}`;
            const getFilename = override?.filename ?? ((index) => `${state}_${index}.png`);

            sprites[state] = Array.from({ length: frameCount }, (_, i) => {
                const img = new Image();
                img.src = `${spriteFolder}/${getFilename(i)}`;
                return img;
            });
        }
        return sprites;
    }
}

// ============================================================================
// 4. GERENCIADOR DE ENTRADA (INPUT)
// Suporta teclado, mouse e comandos virtuais touch
// ============================================================================
class InputManager {
    constructor(controlsConfig) {
        this.controls = controlsConfig;
        this.activeKeys = new Set();
        this.virtualKeys = new Set();
        this.mouseLeftPressed = false;

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => {
            this.activeKeys.add(e.key);
        });

        window.addEventListener('keyup', (e) => {
            this.activeKeys.delete(e.key);
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === this.controls.ATTACK_MOUSE_BUTTON) {
                this.mouseLeftPressed = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === this.controls.ATTACK_MOUSE_BUTTON) {
                this.mouseLeftPressed = false;
            }
        });
    }

    setVirtual(actionName, isActive) {
        if (isActive) {
            this.virtualKeys.add(actionName);
        } else {
            this.virtualKeys.delete(actionName);
        }
    }

    isPressed(actionKeys, virtualName = null) {
        if (virtualName && this.virtualKeys.has(virtualName)) return true;
        if (!actionKeys) return false;
        return actionKeys.some(key => this.activeKeys.has(key));
    }

    consumeMouseAttack() {
        if (this.mouseLeftPressed) {
            this.mouseLeftPressed = false;
            return true;
        }
        return false;
    }
}

// ============================================================================
// 5. CENÁRIO PROCEDURAL (CITY BACKGROUND)
// Desenhado em canvas offscreen para máxima performance e qualidade
// ============================================================================
class CityBackground {
    static create(width, height, groundY) {
        const bg = document.createElement('canvas');
        bg.width = width || 800;
        bg.height = height || 400;
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
        const drawLayer = (color, minH, maxH, minW, maxW, windowColor) => {
            let x = -10;
            while (x < bg.width) {
                const w = minW + rand() * (maxW - minW);
                const h = minH + rand() * (maxH - minH);
                const facade = b.createLinearGradient(x, 0, x + w, 0);
                facade.addColorStop(0, color);
                facade.addColorStop(0.68, color);
                facade.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
                b.fillStyle = facade;
                b.fillRect(x, groundY - h, w, h);

                b.fillStyle = 'rgba(255, 255, 255, 0.08)';
                b.fillRect(x, groundY - h, w, 3);

                b.fillStyle = 'rgba(0, 0, 0, 0.18)';
                b.fillRect(x + w * 0.7, groundY - h + 5, Math.max(3, w * 0.08), h - 5);

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
        };

        drawLayer('#2a1b45', 90, 200, 40, 80, null);      // Fundo distante
        drawLayer('#160e2b', 60, 150, 50, 90, '#ffd56b'); // Frente com janelas

        // Rua
        const streetH = bg.height - groundY;
        b.fillStyle = '#2b2b3a';
        b.fillRect(0, groundY, bg.width, streetH);
        b.fillStyle = '#3d3d52'; // Calçada
        b.fillRect(0, groundY, bg.width, 6);
        b.fillStyle = '#e8c547'; // Faixa tracejada
        for (let x = 0; x < bg.width; x += 60) {
            b.fillRect(x, groundY + streetH / 2, 30, 4);
        }

        // Postes de luz com iluminação suave
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
}

// ============================================================================
// 6. ENTIDADES: FIGHTER (LUTADOR) E PROJECTILE (PROJÉTIL)
// ============================================================================
class Fighter {
    constructor(charConfig, sprites, isFacingRight = true) {
        this.config = charConfig;
        this.id = charConfig.id;
        this.name = charConfig.name;
        this.displayName = charConfig.displayName;
        this.color = charConfig.color;

        this.width = charConfig.width;
        this.height = charConfig.height;
        this.speed = charConfig.speed;
        this.jumpForce = charConfig.jumpForce;

        this.maxHp = charConfig.maxHp;
        this.hp = this.maxHp;
        this.maxUlt = charConfig.maxUlt;
        this.ultCharge = 0;

        this.sprites = sprites;
        this.defaultFacingRight = isFacingRight;

        this.reset(charConfig.startX);
    }

    reset(x) {
        this.x = x;
        this.y = GAME_CONFIG.WORLD.GROUND_Y - this.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = true;
        this.facingRight = this.defaultFacingRight;

        this.hp = this.maxHp;
        this.ultCharge = 0;

        // Estados de combate
        this.isAttacking = false;
        this.attackTimer = 0;
        this.hasHit = false;
        this.attackOrder = 0;

        this.isBlocking = false;
        this.parryWindowTimer = 0;
        this.parryTextTimer = 0;
        this.parryAttempted = false;

        this.isStunned = false;
        this.stunTimer = 0;

        this.knifeCooldown = 0;

        // Animação
        this.animState = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = GAME_CONFIG.SPRITES.ANIM_SPEED;
    }

    addUlt(amount) {
        this.ultCharge = Math.min(this.maxUlt, this.ultCharge + amount);
    }

    canAct() {
        return !this.isStunned;
    }

    jump(soundManager) {
        if (this.isGrounded && this.canAct()) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            soundManager.play('jump');
        }
    }

    startAttack(attackOrder = 0) {
        if (!this.isAttacking && !this.isBlocking && this.canAct()) {
            const attackTotal = GAME_CONFIG.COMBAT.ATTACK.WINDUP_FRAMES +
                                GAME_CONFIG.COMBAT.ATTACK.ACTIVE_FRAMES +
                                GAME_CONFIG.COMBAT.ATTACK.RECOVERY_FRAMES;
            this.isAttacking = true;
            this.attackTimer = attackTotal;
            this.hasHit = false;
            this.attackOrder = attackOrder;
        }
    }

    startBlock() {
        if (!this.isBlocking && !this.isAttacking && this.canAct()) {
            this.isBlocking = true;
            this.parryWindowTimer = GAME_CONFIG.COMBAT.PARRY.WINDOW_FRAMES;
        }
    }

    stopBlock() {
        this.isBlocking = false;
    }

    getAttackPhase() {
        if (!this.isAttacking) return null;
        const { ACTIVE_FRAMES, RECOVERY_FRAMES } = GAME_CONFIG.COMBAT.ATTACK;
        if (this.attackTimer > ACTIVE_FRAMES + RECOVERY_FRAMES) return 'windup';
        if (this.attackTimer > RECOVERY_FRAMES) return 'active';
        return 'recovery';
    }

    getAttackHitbox() {
        const hWidth = GAME_CONFIG.COMBAT.ATTACK.HITBOX_WIDTH;
        const hHeight = GAME_CONFIG.COMBAT.ATTACK.HITBOX_HEIGHT;
        const startY = this.y + 10;

        return {
            x: this.facingRight ? (this.x + this.width) : (this.x - hWidth),
            y: startY,
            width: hWidth,
            height: hHeight
        };
    }

    getHurtbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    applyStun(duration) {
        this.isStunned = true;
        this.stunTimer = duration;
        this.isAttacking = false;
        this.attackTimer = 0;
    }

    updatePhysics(groundY, canvasWidth) {
        // Gravidade e chão
        this.velocityY += GAME_CONFIG.WORLD.GRAVITY;
        this.y += this.velocityY;

        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        }

        // Limites horizontais do canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;

        // Timers internos
        if (this.stunTimer > 0) {
            this.stunTimer--;
            if (this.stunTimer === 0) this.isStunned = false;
        }

        if (this.parryWindowTimer > 0) this.parryWindowTimer--;
        if (this.parryTextTimer > 0) this.parryTextTimer--;

        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }

        if (this.knifeCooldown > 0) {
            this.knifeCooldown--;
        }
    }

    updateAnimation(isMovingHorizontally) {
        let newState = 'idle';
        if (this.isAttacking) newState = 'attack';
        else if (this.isBlocking) newState = 'parry';
        else if (!this.isGrounded) newState = 'jump';
        else if (isMovingHorizontally) newState = 'walk';

        if (this.animState !== newState) {
            this.animState = newState;
            this.animFrame = 0;
            this.animTimer = 0;
        }

        this.animTimer++;
        const animationSpeed = this.config.animationSpeeds?.[this.animState] ?? this.animSpeed;
        if (this.animTimer >= animationSpeed) {
            this.animTimer = 0;
            const currentSprites = this.sprites[this.animState];
            if (currentSprites && currentSprites.length > 0) {
                if (this.animState === 'jump' || this.animState === 'parry') {
                    this.animFrame = Math.min(this.animFrame + 1, currentSprites.length - 1);
                } else {
                    this.animFrame = (this.animFrame + 1) % currentSprites.length;
                }
            }
        }
    }

    draw(ctx, globalFrameCount) {
        const currentSprites = this.sprites[this.animState];
        const img = (currentSprites && currentSprites[this.animFrame]) ? currentSprites[this.animFrame] : null;

        ctx.save();

        // Espelhamento horizontal conforme a direção para onde o personagem olha
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(this.x, this.y);
        }

        if (img && img.complete && img.naturalWidth !== 0) {
            const display = this.config.spriteDisplays?.[this.animState] ?? this.config.spriteDisplay;
            if (display) {
                ctx.drawImage(
                    img,
                    display.sourceX,
                    display.sourceY,
                    display.sourceWidth,
                    display.sourceHeight,
                    (this.width - display.width) / 2,
                    this.height - display.height + (display.groundOffset ?? 0),
                    display.width,
                    display.height
                );
            } else {
                ctx.drawImage(img, 0, 0, this.width, this.height);
            }
        } else {
            // Renderização geométrica reserva (fallback limpo e bonito)
            ctx.fillStyle = this.isStunned ? '#f1c40f' : (this.isBlocking ? '#3498db' : this.color);
            if (this.animState === 'walk') {
                const legOffset = this.animFrame % 2 === 0 ? 3 : -3;
                ctx.fillRect(4, 8, this.width - 8, this.height - 24);
                ctx.fillRect(8 + legOffset, this.height - 18, 8, 18);
                ctx.fillRect(this.width - 16 - legOffset, this.height - 18, 8, 18);
            } else {
                ctx.fillRect(0, 0, this.width, this.height);
            }
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.width - 8, 10, 6, 6);
        }

        ctx.restore();

        // Indicador visual de ataque (Windup / Active)
        const phase = this.getAttackPhase();
        if (phase && this.config.showAttackHitbox !== false) {
            const attackBox = this.getAttackHitbox();

            if (phase === 'windup') {
                const { ACTIVE_FRAMES, RECOVERY_FRAMES, WINDUP_FRAMES } = GAME_CONFIG.COMBAT.ATTACK;
                const remaining = this.attackTimer - (ACTIVE_FRAMES + RECOVERY_FRAMES);
                const progress = 1 - (remaining / WINDUP_FRAMES);

                ctx.fillStyle = `rgba(231, 76, 60, ${0.15 + progress * 0.4})`;
                ctx.fillRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 2;
                ctx.strokeRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);

                // Exclamação piscando acima da cabeça avisando o parry
                if (Math.floor(globalFrameCount / 4) % 2 === 0) {
                    ctx.fillStyle = '#ff4757';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.fillText('!', this.x + this.width / 2 - 4, this.y - 28);
                }
            } else if (phase === 'active') {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
            }
        }

        // Texto visual de PARRY
        if (this.parryTextTimer > 0) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PARRY!', this.x + this.width / 2, this.y - 15);
            ctx.textAlign = 'left';
        }
    }
}

class Projectile {
    constructor(x, y, vx, owner, width = 15, height = 5, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = options.vy ?? 0;
        this.owner = owner;
        this.width = width;
        this.height = height;
        this.sprite = options.sprite ?? owner.sprites?.knife?.[0];
        this.spriteDisplay = options.spriteDisplay ?? owner.config.projectileDisplay;
        this.cachedSprite = null;
        this.angle = options.angle ?? (vx >= 0 ? Math.PI : 0);
        this.damage = options.damage ?? owner.config.ai?.knifeDamage ?? 0;
        this.isUltimateKnife = options.isUltimateKnife ?? false;
        this.frozenUntilTimeStopEnds = options.frozenUntilTimeStopEnds ?? false;
    }

    getRenderableSprite() {
        if (this.cachedSprite) return this.cachedSprite;
        if (!this.sprite || !this.sprite.complete || this.sprite.naturalWidth === 0) return null;

        const display = this.spriteDisplay;
        if (!display) return this.sprite;

        const canvas = document.createElement('canvas');
        canvas.width = display.sourceWidth;
        canvas.height = display.sourceHeight;
        const context = canvas.getContext('2d');
        context.drawImage(
            this.sprite,
            display.sourceX,
            display.sourceY,
            display.sourceWidth,
            display.sourceHeight,
            0,
            0,
            display.sourceWidth,
            display.sourceHeight
        );

        this.cachedSprite = canvas;
        return canvas;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    isOutOfBounds(canvasWidth) {
        return this.x < 0 || this.x > canvasWidth;
    }

    isOnGround(groundY) {
        return this.y + this.height >= groundY;
    }

    getBox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================================================
// 7. SISTEMA DE COMBATE (COLLISION & DAMAGE)
// ============================================================================
class CombatSystem {
    static checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    static handleMelee(attacker, defender, soundManager) {
        if (attacker.getAttackPhase() !== 'active' || attacker.hasHit) return null;

        const attackBox = attacker.getAttackHitbox();
        const defenderBox = defender.getHurtbox();

        if (this.checkCollision(attackBox, defenderBox)) {
            attacker.hasHit = true;

            const combatCfg = GAME_CONFIG.COMBAT;

            // Parry Perfeito!
            if (defender.isBlocking && defender.parryWindowTimer > 0) {
                soundManager.play('parry');
                defender.parryTextTimer = combatCfg.PARRY.TEXT_DURATION;
                defender.addUlt(combatCfg.PARRY.PARRY_ULT_GAIN);

                attacker.applyStun(combatCfg.PARRY.STUN_DURATION_FRAMES);
                return null;
            }

            // Dano normal ou mitigado por defesa
            const damage = defender.isBlocking ? combatCfg.ATTACK.DAMAGE_BLOCKED : combatCfg.ATTACK.DAMAGE_UNBLOCKED;
            defender.hp = Math.max(0, defender.hp - damage);
            soundManager.play('punch');

            if (!defender.isBlocking) {
                defender.x += attacker.facingRight ? combatCfg.ATTACK.KNOCKBACK_FORCE : -combatCfg.ATTACK.KNOCKBACK_FORCE;
            }

            attacker.addUlt(combatCfg.ATTACK.ATTACKER_ULT_GAIN);
            defender.addUlt(combatCfg.ATTACK.DEFENDER_ULT_GAIN_ON_HIT);

            if (defender.hp <= 0) {
                return attacker; // Retorna o vencedor
            }
        }
        return null;
    }

    static handleProjectiles(projectiles, target, soundManager, timeStopOwner, canvasWidth, groundY) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];

            // Atualiza posição se não houver tempo parado ou se o projétil for do dono da ult
            if ((timeStopOwner === null || timeStopOwner === p.owner.id) &&
                !(timeStopOwner !== null && p.frozenUntilTimeStopEnds)) {
                p.update();
            }

            // Se o tempo estiver parado para o oponente, o projétil não causa dano durante o Za Warudo
            if (timeStopOwner !== null && timeStopOwner !== p.owner.id) continue;
            if (timeStopOwner !== null && p.frozenUntilTimeStopEnds) continue;

            if (this.checkCollision(p.getBox(), target.getHurtbox())) {
                const aiCfg = GAME_CONFIG.CHARACTERS.P2.ai;

                if (target.isBlocking && target.parryWindowTimer > 0) {
                    soundManager.play('parry');
                    target.parryTextTimer = GAME_CONFIG.COMBAT.PARRY.TEXT_DURATION;
                } else {
                    target.hp = Math.max(0, target.hp - p.damage);
                    target.addUlt(aiCfg.knifeUltGain);
                }
                projectiles.splice(i, 1);
                continue;
            }

            if (p.isOutOfBounds(canvasWidth) || p.isOnGround(groundY)) {
                projectiles.splice(i, 1);
            }
        }
    }
}

// ============================================================================
// 8. SISTEMA DE INTELIGÊNCIA ARTIFICIAL (OPONENTE P2)
// ============================================================================
class AISystem {
    static update(aiFighter, opponent, projectiles, triggerUltCallback, startAttackCallback) {
        if (!aiFighter.canAct()) return;

        const aiConfig = GAME_CONFIG.CHARACTERS.P2.ai;

        if (!opponent.isAttacking) {
            aiFighter.parryAttempted = false;
        }

        if (aiFighter.isBlocking) {
            if (aiFighter.parryWindowTimer <= 0) aiFighter.stopBlock();
            return;
        }

        const attackConfig = GAME_CONFIG.COMBAT.ATTACK;
        const isParryWindow = opponent.getAttackPhase() === 'windup' &&
            opponent.attackTimer <= attackConfig.ACTIVE_FRAMES + attackConfig.RECOVERY_FRAMES + 1;

        if (isParryWindow && !aiFighter.parryAttempted) {
            aiFighter.parryAttempted = true;
            if (Math.random() < aiConfig.parryChance) {
                aiFighter.startBlock();
                return;
            }
        }

        const distance = opponent.x - aiFighter.x;
        const absDistance = Math.abs(distance);

        // Uso do Ultimate pela IA
        if (aiFighter.ultCharge >= aiFighter.maxUlt) {
            if (Math.random() < aiConfig.ultChance) {
                triggerUltCallback(aiFighter);
            }
        }

        // Lançamento de Projétil (Faca)
        if (absDistance > aiConfig.projectileDistance && aiFighter.knifeCooldown <= 0) {
            const vx = aiFighter.facingRight ? aiConfig.knifeSpeed : -aiConfig.knifeSpeed;
            const startX = aiFighter.x + (aiFighter.facingRight ? aiFighter.width : 0);
            projectiles.push(new Projectile(startX, aiFighter.y + 20, vx, aiFighter));
            aiFighter.knifeCooldown = aiConfig.knifeCooldown;
        }

        // Aproximação ou Ataque Corpo-a-Corpo
        if (absDistance > aiConfig.approachDistance) {
            aiFighter.x += distance > 0 ? aiConfig.approachSpeed : -aiConfig.approachSpeed;
        } else {
            if (!aiFighter.isAttacking && Math.random() < aiConfig.attackChance) {
                startAttackCallback(aiFighter);
            }
        }
    }
}

// ============================================================================
// 9. MOTOR DO JOGO (JOESTAR GAME ENGINE)
// Orquestrador de inicialização, inputs, renderização e ciclo de vida
// ============================================================================
class JoestarGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.effectCanvas = document.createElement('canvas');
        this.effectCanvas.width = this.canvas.width || 800;
        this.effectCanvas.height = this.canvas.height || 400;
        this.effectCtx = this.effectCanvas.getContext('2d');

        this.soundManager = new SoundManager(GAME_CONFIG.AUDIO);
        this.inputManager = new InputManager(GAME_CONFIG.CONTROLS);

        this.cityBg = CityBackground.create(
            this.canvas.width || 800,
            this.canvas.height || 400,
            GAME_CONFIG.WORLD.GROUND_Y
        );

        // Carrega sprites dos lutadores
        const p1Sprites = AssetLoader.loadSprites(
            GAME_CONFIG.CHARACTERS.P1.spritesFolder,
            GAME_CONFIG.SPRITES.FRAMES,
            GAME_CONFIG.CHARACTERS.P1.spriteOverrides
        );
        const p2Sprites = AssetLoader.loadSprites(
            GAME_CONFIG.CHARACTERS.P2.spritesFolder,
            GAME_CONFIG.SPRITES.FRAMES,
            GAME_CONFIG.CHARACTERS.P2.spriteOverrides
        );

        // Inicializa Lutadores
        this.player1 = new Fighter(GAME_CONFIG.CHARACTERS.P1, p1Sprites, true);
        this.player2 = new Fighter(GAME_CONFIG.CHARACTERS.P2, p2Sprites, false);

        this.projectiles = [];

        // Estado do Jogo
        this.gameOver = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.hasPaused = false;
        this.pendingFullscreenResume = false;
        this.winnerMessage = '';
        this.globalFrameCount = 0;
        this.attackSequence = 0;

        // Estado de Tempo Parado (Za Warudo)
        this.timeStopOwner = null;
        this.timeStopTimer = 0;
        this.timeStopCancelTimer = 0;
        this.timeStopPhase = null;
        this.timeStopNormalFighterId = null;
        this.timeStopWave = null;
        this.pendingUlt = null;
        this.ultimateKnivesSpawned = false;

        this.setupEventListeners();
        this.setupUIControls();
        this.start();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            // Tecla de Início do Jogo (Se o jogo ainda não tiver começado)
            if (!this.gameStarted) {
                if (e.code === 'Enter') {
                    this.startGame();
                }
                return;
            }

            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);

            // Alternar Pause (ESC)
            if (e.key === 'Escape' && this.gameStarted && !this.gameOver) {
                if (isFull) {
                    e.preventDefault();
                    if (!this.isPaused) this.togglePause();
                }
                return;
            }

            // Alternar Mudo (M)
            if (this.inputManager.isPressed(GAME_CONFIG.CONTROLS.TOGGLE_MUTE)) {
                this.soundManager.toggleMute();
            }

            if (this.isPaused) return;

            // Pulo (W ou Espaço)
            if (this.inputManager.isPressed(GAME_CONFIG.CONTROLS.JUMP) && !this.gameOver) {
                this.player1.jump(this.soundManager);
            }

            // Bloqueio / Parry (F)
            if (this.inputManager.isPressed(GAME_CONFIG.CONTROLS.BLOCK) && !this.gameOver) {
                this.player1.startBlock();
            }

            // Ultimate (G)
            if (this.inputManager.isPressed(GAME_CONFIG.CONTROLS.ULTIMATE) && !this.gameOver) {
                this.triggerUltimate(this.player1);
            }

            // Reiniciar (R)
            if (this.gameOver && this.inputManager.isPressed(GAME_CONFIG.CONTROLS.RESTART)) {
                this.reset();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!this.inputManager.isPressed(GAME_CONFIG.CONTROLS.BLOCK)) {
                this.player1.stopBlock();
            }
        });
    }

    startGame() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.soundManager.resumeBgm();
        
        const wrapper = document.getElementById('gameWrapper') || this.canvas.parentElement;
        if (wrapper) {
            wrapper.classList.add('game-started');
            wrapper.classList.remove('game-over');
            wrapper.classList.remove('is-paused');
        }
    }

    setupUIControls() {
        // Função para prevenir do mouse dar scroll ou zoom e auxiliar tbm no mobile (touch)
        const bindBtn = (id, onDown, onUp) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const handleDown = (e) => {
                if (e.cancelable) e.preventDefault();
                btn.classList.add('is-active');
                if (onDown) onDown();
            };

            const handleUp = (e) => {
                if (e.cancelable) e.preventDefault();
                btn.classList.remove('is-active');
                if (onUp) onUp();
            };

            btn.addEventListener('touchstart', handleDown, { passive: false });
            btn.addEventListener('touchend', handleUp, { passive: false });
            btn.addEventListener('touchcancel', handleUp, { passive: false });

            btn.addEventListener('mousedown', handleDown);
            btn.addEventListener('mouseup', handleUp);
            btn.addEventListener('mouseleave', handleUp);
        };

        const btnStartGame = document.getElementById('btnStartGame');
        if (btnStartGame) {
            btnStartGame.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFullscreen();
                this.startGame();
            });
        }

        const btnReturnFullscreen = document.getElementById('btnReturnFullscreen');
        if (btnReturnFullscreen) {
            btnReturnFullscreen.addEventListener('click', (e) => {
                e.preventDefault();
                this.pendingFullscreenResume = true;
                this.toggleFullscreen();
            });
        }

        // BOTÃO DE TELA CHEIA
        const btnFullscreen = document.getElementById('btnFullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFullscreen();
            });

            // Atualiza texto e visual quando entrar/sair de tela cheia
            const updateFsText = () => {
                const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
                const span = btnFullscreen.querySelector('span');
                if (span) {
                    span.textContent = isFull ? 'Sair da Tela' : 'Tela Cheia';
                }
            };
            document.addEventListener('fullscreenchange', updateFsText);
            document.addEventListener('webkitfullscreenchange', updateFsText);
        }

        const handleFullscreenChange = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (isFull && this.pendingFullscreenResume) {
                this.pendingFullscreenResume = false;
                if (this.canvas.parentElement && this.canvas.parentElement.parentElement) {
                    this.canvas.parentElement.parentElement.classList.remove('paused-outside');
                }
                if (this.isPaused) this.togglePause();
            } else if (!isFull && this.gameStarted) {
                if (!this.isPaused) this.togglePause();
                if (this.canvas.parentElement && this.canvas.parentElement.parentElement) {
                    this.canvas.parentElement.parentElement.classList.add('paused-outside');
                }
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        // BOTÃO DE PAUSE
        const btnPause = document.getElementById('btnPause');
        if (btnPause) {
            btnPause.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.gameOver && this.gameStarted) this.togglePause(); // so pausa se o jogo nao acabou e se o jogo iniciou!!
            });
        }

        // BOTÃO DE REINICIAR
        const btnRestart = document.getElementById('btnRestart');
        if (btnRestart) {
            btnRestart.addEventListener('click', (e) => {
                e.preventDefault();
                this.reset();
            });
        }

        // CONTROLES MOBILE / TOUCH
        // Movimentação Esquerda / Direita
        bindBtn('btnLeft',
            () => this.inputManager.setVirtual('MOVE_LEFT', true),
            () => this.inputManager.setVirtual('MOVE_LEFT', false)
        );

        bindBtn('btnRight',
            () => this.inputManager.setVirtual('MOVE_RIGHT', true),
            () => this.inputManager.setVirtual('MOVE_RIGHT', false)
        );

        // Pulo
        bindBtn('btnJump',
            () => {
                if (this.gameStarted && !this.gameOver && !this.isPaused) {
                    this.player1.jump(this.soundManager);
                }
            }
        );

        // Bloqueio / Parry
        bindBtn('btnBlock',
            () => {
                if (this.gameStarted && !this.gameOver && !this.isPaused) {
                    this.player1.startBlock();
                }
            },
            () => {
                this.player1.stopBlock();
            }
        );

        // Golpe / Ataque
        bindBtn('btnAttack',
            () => {
                if (this.gameStarted && !this.gameOver && !this.isPaused) {
                    this.beginAttack(this.player1);
                }
            }
        );

        // Ultimate (Za Warudo)
        bindBtn('btnUlt',
            () => {
                if (this.gameStarted && !this.gameOver && !this.isPaused) {
                    this.triggerUltimate(this.player1);
                }
            }
        );
    }

    toggleFullscreen() {
        const wrapper = document.getElementById('gameWrapper') || this.canvas;
        const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);

        if (!isFull) {
            if (wrapper.requestFullscreen) {
                wrapper.requestFullscreen().then(() => {
                    if (screen.orientation?.lock) {
                        screen.orientation.lock('landscape').catch(() => {});
                    }
                }).catch(() => {});
            } else if (wrapper.webkitRequestFullscreen) {
                wrapper.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const wrapper = document.getElementById('gameWrapper') || this.canvas.parentElement;

        if (this.isPaused) {
            this.hasPaused = true;
            if (wrapper) {
                wrapper.classList.add('is-paused');
            }
            this.soundManager.pauseBgm();
        } else {
            if (wrapper) {
                wrapper.classList.remove('is-paused');
            }
            this.soundManager.resumeBgm();
        }
    }

    beginAttack(fighter) {
        const attackOrder = ++this.attackSequence;
        const opponent = fighter.id === 'p1' ? this.player2 : this.player1;

        if (this.timeStopOwner === fighter.id) {
            opponent.isAttacking = false;
            opponent.attackTimer = 0;
        } else if (opponent.getAttackPhase() === 'windup') {
            if (opponent.attackOrder < attackOrder) return;
            opponent.isAttacking = false;
            opponent.attackTimer = 0;
        }

        fighter.startAttack(attackOrder);
    }

    triggerUltimate(fighter) {
        if (fighter.ultCharge < fighter.maxUlt) return;

        // Se o P2 já usou a ult e passou da janela de 0.5s (30 frames), o P1 NÃO pode ultar!
        if (this.timeStopOwner === 'p2') {
            const timeDiff = this.globalFrameCount - this.timeStopCancelTimer;
            if (timeDiff > GAME_CONFIG.COMBAT.TIMESTOP.COUNTER_WINDOW) {
                return;
            }
        }

        // Evita disparar novamente se já estiver na contagem regressiva da ult
        if (this.pendingUlt && this.pendingUlt.fighter.id === fighter.id) return;

        fighter.ultCharge = 0;

        // Toca o áudio imediatamente
        this.soundManager.play(fighter.id === 'p1' ? 'p1_ult' : 'p2_ult');

        this.soundManager.setBgmVolume(0.25);

        // Delay para ambos os lutadores sincronizarem a fala com a parada do tempo
        const delayFrames = GAME_CONFIG.COMBAT.TIMESTOP.P1_DELAY_FRAMES;

        if (delayFrames > 0) {
            this.pendingUlt = {
                fighter: fighter,
                framesRemaining: delayFrames
            };
        } else {
            this.activateTimeStop(fighter);
        }
    }

    activateTimeStop(fighter) {
        const timestopCfg = GAME_CONFIG.COMBAT.TIMESTOP;

        // Se o P1 ativou a ult, cancela/remove APENAS as facas especiais da ult do Dio (isUltimateKnife)
        // As facas normais do P2 continuam existindo e congeladas no ar!
        if (fighter.id === 'p1') {
            this.projectiles = this.projectiles.filter(p => !p.isUltimateKnife);
            this.ultimateKnivesSpawned = false;
        }

        // Se o outro personagem já ativou a ult recentemente, anula!
        if (this.timeStopOwner && this.timeStopOwner !== fighter.id) {
            const timeDiff = this.globalFrameCount - this.timeStopCancelTimer;
            if (timeDiff <= timestopCfg.COUNTER_WINDOW) {
                this.pendingUlt = null;
                this.timeStopNormalFighterId = fighter.id;
                this.beginTimeStopReverse();
                this.player1.parryTextTimer = timestopCfg.COUNTER_FEEDBACK_FRAMES;
                this.player2.parryTextTimer = timestopCfg.COUNTER_FEEDBACK_FRAMES;
                return;
            }
        }

        this.timeStopOwner = fighter.id;
        this.timeStopTimer = timestopCfg.DURATION_FRAMES;
        this.timeStopCancelTimer = this.globalFrameCount;
        this.timeStopPhase = 'forward';
        this.timeStopNormalFighterId = fighter.id;

        if (fighter.id === 'p2') {
            this.spawnUltimateKnives();
        }

        // Configura o ponto de origem e raio máximo do círculo de expansão
        const originX = fighter.x + fighter.width / 2;
        const originY = fighter.y + fighter.height / 2;
        const maxRadius = Math.hypot(
            Math.max(originX, this.canvas.width - originX),
            Math.max(originY, this.canvas.height - originY)
        ) + 40;

        this.timeStopWave = {
            x: originX,
            y: originY,
            radius: 0,
            maxRadius: maxRadius,
            speed: timestopCfg.EXPANSION_SPEED
        };
    }

    beginTimeStopReverse() {
        if (!this.timeStopWave || this.timeStopPhase === 'reverse') return;

        const owner = this.timeStopOwner === 'p1' ? this.player1 : this.player2;
        this.timeStopWave.x = owner.x + owner.width / 2;
        this.timeStopWave.y = owner.y + owner.height / 2;
        this.timeStopPhase = 'reverse';
        this.timeStopWave.speed = GAME_CONFIG.COMBAT.TIMESTOP.REVERSE_SPEED;
        this.timeStopTimer = Math.max(1, Math.ceil(
            this.timeStopWave.radius / GAME_CONFIG.COMBAT.TIMESTOP.REVERSE_SPEED
        ));
    }

    spawnUltimateKnives() {
        if (this.ultimateKnivesSpawned) return;

        const centerX = this.player1.x + this.player1.width / 2;
        const centerY = this.player1.y + this.player1.height / 2;
        const knifeCount = 5;
        const radius = 140;
        const knifeSpeed = 4;
        const knifeDamage = 33 / knifeCount;
        const knifeSprite = this.player2.sprites.knife?.[0];

        for (let i = 0; i < knifeCount; i++) {
            const angle = Math.PI + (Math.PI * (i + 1)) / (knifeCount + 1);
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const inwardAngle = angle + Math.PI;

            this.projectiles.push(new Projectile(
                x,
                y,
                Math.cos(inwardAngle) * knifeSpeed,
                this.player2,
                15,
                5,
                {
                    vy: Math.sin(inwardAngle) * knifeSpeed,
                    sprite: knifeSprite,
                    angle,
                    damage: knifeDamage,
                    isUltimateKnife: true,
                    frozenUntilTimeStopEnds: true
                }
            ));
        }

        this.ultimateKnivesSpawned = true;
    }

    reset() {
        this.soundManager.stop('lose');
        this.soundManager.stop('victory');
        this.soundManager.setBgmVolume(GAME_CONFIG.AUDIO.BGM.volume);
        this.soundManager.resumeBgm();
        this.player1.reset(GAME_CONFIG.CHARACTERS.P1.startX);
        this.player2.reset(GAME_CONFIG.CHARACTERS.P2.startX);

        this.timeStopOwner = null;
        this.timeStopTimer = 0;
        this.timeStopPhase = null;
        this.timeStopNormalFighterId = null;
        this.timeStopWave = null;
        this.pendingUlt = null;
        this.ultimateKnivesSpawned = false;
        this.attackSequence = 0;
        this.projectiles.length = 0;

        this.gameOver = false;
        this.isPaused = false;
        this.winnerMessage = '';
        this.gameStarted = true;

        const wrapper = document.getElementById('gameWrapper') || this.canvas.parentElement;
        if (wrapper) {
            wrapper.classList.add('game-started');
            wrapper.classList.remove('game-over');
            wrapper.classList.remove('is-paused');
        }
    }

    update() {
        if (!this.gameStarted || this.gameOver || this.isPaused) return;
        this.globalFrameCount++;

        // Processa delay de ativação da Ultimate (P1)
        if (this.pendingUlt) {
            this.pendingUlt.framesRemaining--;
            if (this.pendingUlt.framesRemaining <= 0) {
                const f = this.pendingUlt.fighter;
                this.pendingUlt = null;
                this.activateTimeStop(f);
            }
        }

        // Gerenciamento do tempo parado
        if (this.timeStopTimer > 0) {
            this.timeStopTimer--;
            if (this.timeStopTimer === 0) {
                if (this.timeStopPhase === 'forward') {
                    this.timeStopWave.radius = this.timeStopWave.maxRadius;
                    this.beginTimeStopReverse();
                } else {
                    this.timeStopOwner = null;
                    this.timeStopPhase = null;
                    this.timeStopNormalFighterId = null;
                    this.timeStopWave = null;
                    this.ultimateKnivesSpawned = false;
                    this.soundManager.setBgmVolume(GAME_CONFIG.AUDIO.BGM.volume);
                }
            }
        }

        // Expansão do círculo visual do Za Warudo
        if (this.timeStopWave) {
            if (this.timeStopPhase === 'reverse') {
                this.timeStopWave.radius = Math.max(0, this.timeStopWave.radius - this.timeStopWave.speed);
            } else if (this.timeStopWave.radius < this.timeStopWave.maxRadius) {
                this.timeStopWave.radius += this.timeStopWave.speed;
            }
        }

        // Ataque via Mouse para o P1
        if (this.inputManager.consumeMouseAttack()) {
            this.beginAttack(this.player1);
        }

        // Atualização do PLAYER 1
        if (this.timeStopOwner !== 'p2') {
            let isMovingP1 = false;
            if (this.player1.canAct()) {
                const moveLeft = this.inputManager.isPressed(GAME_CONFIG.CONTROLS.MOVE_LEFT, 'MOVE_LEFT');
                const moveRight = this.inputManager.isPressed(GAME_CONFIG.CONTROLS.MOVE_RIGHT, 'MOVE_RIGHT');

                if (moveLeft && this.player1.x > 0) {
                    this.player1.x -= this.player1.speed;
                    this.player1.facingRight = false;
                    isMovingP1 = true;
                }
                if (moveRight && this.player1.x + this.player1.width < this.canvas.width) {
                    this.player1.x += this.player1.speed;
                    this.player1.facingRight = true;
                    isMovingP1 = true;
                }
            }

            this.player1.updatePhysics(GAME_CONFIG.WORLD.GROUND_Y, this.canvas.width);
            this.player1.updateAnimation(isMovingP1);
        }

        // Atualização do PLAYER 2 (IA)
        if (this.timeStopOwner !== 'p1') {
            const prevX = this.player2.x;
            const p2IsUsingUltimate = this.pendingUlt?.fighter.id === 'p2' || this.timeStopOwner === 'p2';
            if (!p2IsUsingUltimate) {
                AISystem.update(
                    this.player2,
                    this.player1,
                    this.projectiles,
                    (f) => this.triggerUltimate(f),
                    (f) => this.beginAttack(f)
                );
            }

            this.player2.facingRight = this.player2.x < this.player1.x;
            this.player2.updatePhysics(GAME_CONFIG.WORLD.GROUND_Y, this.canvas.width);

            const isMovingP2 = !p2IsUsingUltimate && Math.abs(this.player2.x - prevX) > 0.1;
            this.player2.updateAnimation(isMovingP2);
        }

        // Atualização e colisão de projéteis
        CombatSystem.handleProjectiles(
            this.projectiles,
            this.player1,
            this.soundManager,
            this.timeStopOwner,
            this.canvas.width,
            GAME_CONFIG.WORLD.GROUND_Y
        );

        if (this.player1.hp <= 0) {
            this.endGame('INIMIGO VENCEU!');
            return;
        }

        // Verificação de combate corpo a corpo
        if (this.timeStopOwner !== 'p2') {
            const winner = CombatSystem.handleMelee(this.player1, this.player2, this.soundManager);
            if (winner) this.endGame('PLAYER 1 VENCEU!');
        }

        if (this.timeStopOwner === null && this.pendingUlt?.fighter.id !== 'p2') {
            const winner = CombatSystem.handleMelee(this.player2, this.player1, this.soundManager);
            if (winner) this.endGame('INIMIGO VENCEU!');
        }
    }

    endGame(message) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.winnerMessage = message;
        this.soundManager.stopBgm();

        const wrapper = document.getElementById('gameWrapper') || this.canvas.parentElement;
        if (wrapper) {
            wrapper.classList.add('game-over');
        }

        if (this.player1.hp <= 0) {
            this.soundManager.play('lose');
        } else if (message === 'PLAYER 1 VENCEU!') {
            this.soundManager.play('victory');
        }
    }

    draw() {
        const { ctx, canvas } = this;

        // Fundo da Cidade
        ctx.drawImage(this.cityBg, 0, 0);

        // Projéteis
        ctx.fillStyle = '#dcdde1';
        this.projectiles.forEach(p => {
            const sprite = p.getRenderableSprite();
            if (!sprite) return;

            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(p.angle);
            const display = p.spriteDisplay;
            if (display) {
                ctx.drawImage(
                    sprite,
                    0,
                    0,
                    sprite.width,
                    sprite.height,
                    -display.width / 2,
                    -display.height / 2,
                    display.width,
                    display.height
                );
            } else {
                ctx.drawImage(p.sprite, -18, -9, 36, 18);
            }
            ctx.restore();
        });

        // Lutadores
        this.player1.draw(ctx, this.globalFrameCount);
        this.player2.draw(ctx, this.globalFrameCount);

        // Efeito de Tempo Parado (Za Warudo) - Domo circular em expansão com inversão e anel eletrizante
        if (this.timeStopOwner && this.timeStopWave) {
            const { x, y, radius, maxRadius } = this.timeStopWave;
            const currentRadius = Math.min(radius, maxRadius);

            if (currentRadius > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
                ctx.clip(); // Limita o efeito de inversão exatamente dentro da bolha temporal

                this.effectCtx.clearRect(0, 0, canvas.width, canvas.height);
                this.effectCtx.drawImage(canvas, 0, 0);
                ctx.filter = 'invert(1)';
                ctx.drawImage(this.effectCanvas, 0, 0);
                ctx.restore();

                const normalFighter = this.timeStopNormalFighterId === 'p1'
                    ? this.player1
                    : this.timeStopNormalFighterId === 'p2'
                        ? this.player2
                        : null;
                if (normalFighter) {
                    normalFighter.draw(ctx, this.globalFrameCount);
                }

                // Onda de choque / anel de luz na borda enquanto o círculo estiver se expandindo
                if (radius < maxRadius) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = '#00f7ff';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 14;
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        // Interface do Usuário (HUD)
        this.drawHUD();

        // Tela Inicial / Overlay antes de começar
        if (!this.gameStarted) {
            this.drawOverlay('JOESTAR GAME', 'Clique em "Iniciar Jogo" ', 0.8);
        } else if (this.isPaused && !this.gameOver) {
            this.drawOverlay('PAUSADO', 'Pressione ESC para continuar', 0.6);
        } else if (this.gameOver) {
            this.drawOverlay(this.winnerMessage, 'Pressione R para reiniciar', 0.85);
        }
    }

    drawHUD() {
        const { ctx, canvas } = this;
        const p1 = this.player1;
        const p2 = this.player2;

        const barWidth = 250;
        const hpHeight = 15;
        const ultHeight = 8;

        // --- HUD PLAYER 1 ---
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(p1.displayName, 30, 15);

        // Barra de Vida P1
        ctx.fillStyle = '#555';
        ctx.fillRect(30, 20, barWidth, hpHeight);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(30, 20, (p1.hp / p1.maxHp) * barWidth, hpHeight);

        // Barra de Ult P1
        ctx.fillStyle = '#555';
        ctx.fillRect(30, 40, barWidth, ultHeight);
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(30, 40, (p1.ultCharge / p1.maxUlt) * barWidth, ultHeight);

        // --- HUD PLAYER 2 ---
        const p2X = canvas.width - (barWidth + 30);
        ctx.fillStyle = '#fff';
        ctx.fillText(p2.displayName, p2X, 15);

        // Barra de Vida P2
        ctx.fillStyle = '#555';
        ctx.fillRect(p2X, 20, barWidth, hpHeight);
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(p2X, 20, (p2.hp / p2.maxHp) * barWidth, hpHeight);

        // Barra de Ult P2
        ctx.fillStyle = '#555';
        ctx.fillRect(p2X, 40, barWidth, ultHeight);
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(p2X, 40, (p2.ultCharge / p2.maxUlt) * barWidth, ultHeight);

        // Banner ZA WARUDO
        if (this.timeStopOwner) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ZA WARUDO! TEMPO PARADO!', canvas.width / 2, 80);
            ctx.textAlign = 'left';
        }
    }

    drawOverlay(title, subtitle, alpha) {
        const { ctx, canvas } = this;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 10);

        ctx.font = '16px sans-serif';
        ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }

    start() {
        const loop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JoestarGame('gameCanvas');
});