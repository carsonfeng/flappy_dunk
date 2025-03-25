// 音效管理器
class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
    }

    load(name, url) {
        const audio = new Audio(url);
        audio.volume = 0.5;
        this.sounds[name] = audio;
    }

    play(name) {
        if (this.muted) return;
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

class FlappyDunk {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.gameState = 'start';
        this.soundManager = new SoundManager();
        this.player = {
            x: 100,
            y: 0,
            width: 40,
            height: 40,
            velocity: 0,
            gravity: 0.4,
            jumpForce: -8,
            rotation: 0,
            rotationSpeed: 0.2,
            maxRotation: Math.PI / 4,
            minRotation: -Math.PI / 4,
            armRotation: 0,
            armRotationSpeed: 0.3,
            maxArmRotation: Math.PI / 2,
            minArmRotation: -Math.PI / 2,
            scale: 1,
            scaleSpeed: 0.05,
            maxScale: 1.1,
            minScale: 0.9
        };
        this.obstacles = [];
        this.hoops = [];
        this.lastObstacleTime = 0;
        this.lastHoopTime = 0;
        this.obstacleInterval = 2500;
        this.hoopInterval = 2500;
        this.gameSpeed = 2.5;
        this.effects = {
            particles: [],
            scorePopups: [],
            flashes: [],
            nets: []
        };
        this.tutorialShown = false;
        this.tutorialTip = document.getElementById('tutorial-tip');
        this.tutorialTimeout = null;
        this.missedHoops = 0;
        this.maxMissedHoops = 10;
        this.difficulty = 1;
        this.difficultyLevels = [
            { speed: 2.5, interval: 2500, gap: 180 },
            { speed: 3.0, interval: 2200, gap: 170 },
            { speed: 3.5, interval: 2000, gap: 160 },
            { speed: 4.0, interval: 1800, gap: 150 },
            { speed: 4.5, interval: 1600, gap: 140 }
        ];
        this.currentLevel = 0;
        this.gameMode = 'classic';
        this.timeLeft = 60;
        this.challengeScore = 100;
        this.gameTimer = null;
        
        // 初始化排行榜
        this.leaderboards = {
            classic: JSON.parse(localStorage.getItem('leaderboard_classic') || '[]'),
            time: JSON.parse(localStorage.getItem('leaderboard_time') || '[]'),
            challenge: JSON.parse(localStorage.getItem('leaderboard_challenge') || '[]')
        };
        
        this.init();
    }

    init() {
        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 事件监听
        document.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleClick();
        });
        
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick();
        });
        
        // 初始化游戏
        this.loadAssets();
        this.setupEventListeners();
        this.updateHighScore();
        
        // 设置初始玩家位置
        this.player.y = this.canvas.height / 2;
        
        // 初始化排行榜显示
        this.updateLeaderboardDisplay();
        
        // 开始游戏循环
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    loadAssets() {
        // 加载游戏资源（图片、音效等）
        this.assets = {
            player: new Image(),
            obstacle: new Image(),
            hoop: new Image(),
            background: new Image()
        };
        
        // 设置资源路径
        this.assets.player.src = 'assets/player.png';
        this.assets.obstacle.src = 'assets/obstacle.png';
        this.assets.hoop.src = 'assets/hoop.png';
        this.assets.background.src = 'assets/background.png';

        // 加载音效
        this.soundManager.load('jump', 'assets/jump.mp3');
        this.soundManager.load('dunk', 'assets/dunk.mp3');
        this.soundManager.load('hit', 'assets/hit.mp3');
        this.soundManager.load('score', 'assets/score.mp3');
    }

    setupEventListeners() {
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restart();
        });

        // 添加音效控制按钮事件
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle.addEventListener('click', () => {
            const isMuted = this.soundManager.toggleMute();
            soundToggle.classList.toggle('muted', isMuted);
            soundToggle.textContent = isMuted ? '🔈' : '🔊';
        });

        // 添加游戏模式选择事件
        document.querySelectorAll('.mode-button').forEach(button => {
            button.addEventListener('click', () => {
                this.gameMode = button.dataset.mode;
                this.updateLeaderboardDisplay();
                this.startGame();
            });
        });
    }

    handleClick() {
        console.log('Click handled, game state:', this.gameState); // 添加调试日志
        switch (this.gameState) {
            case 'start':
                this.startGame();
                break;
            case 'playing':
                this.jump();
                break;
            case 'gameOver':
                this.restart();
                break;
        }
    }

    startGame() {
        console.log('Starting game...');
        this.gameState = 'playing';
        document.getElementById('start-screen').classList.add('hidden');
        this.showTutorialTip();
        this.player.y = this.canvas.height / 2;
        this.player.velocity = 0;
        this.score = 0;
        this.obstacles = [];
        this.hoops = [];
        this.currentLevel = 0;
        this.missedHoops = 0;
        document.getElementById('score-display').textContent = '0';
        
        // 根据游戏模式设置
        switch (this.gameMode) {
            case 'time':
                this.timeLeft = 60;
                this.gameTimer = setInterval(() => {
                    this.timeLeft--;
                    if (this.timeLeft <= 0) {
                        this.gameOver();
                    }
                }, 1000);
                break;
            case 'challenge':
                this.challengeScore = 100;
                break;
        }
    }

    jump() {
        console.log('Jumping...'); // 添加调试日志
        this.player.velocity = this.player.jumpForce;
        this.player.rotation = this.player.maxRotation;
        this.soundManager.play('jump');
    }

    update() {
        if (this.gameState !== 'playing') return;

        // 更新玩家位置
        this.player.velocity += this.player.gravity;
        this.player.y += this.player.velocity;

        // 更新玩家旋转
        if (this.player.velocity < 0) {
            // 上升时向上倾斜
            this.player.rotation = Math.min(this.player.rotation + this.player.rotationSpeed, this.player.maxRotation);
        } else {
            // 下降时向下倾斜
            this.player.rotation = Math.max(this.player.rotation - this.player.rotationSpeed, this.player.minRotation);
        }

        // 更新玩家动画
        this.updatePlayerAnimation();

        // 更新障碍物
        this.updateObstacles();
        
        // 更新篮筐
        this.updateHoops();

        // 碰撞检测
        this.checkCollisions();

        // 更新分数
        this.updateScore();

        // 更新特效
        this.updateEffects();
    }

    updateObstacles() {
        // 不再生成新的障碍物
        // 保留已有的障碍物移动逻辑
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= this.gameSpeed;
            return obstacle.x > -obstacle.width;
        });
    }

    updateHoops() {
        const currentTime = Date.now();
        if (currentTime - this.lastHoopTime > this.hoopInterval) {
            this.createHoop();
            this.lastHoopTime = currentTime;
        }

        this.hoops = this.hoops.filter(hoop => {
            hoop.x -= this.gameSpeed;
            
            // 更新篮筐动画
            if (hoop.rotation >= hoop.maxRotation || hoop.rotation <= hoop.minRotation) {
                hoop.rotationSpeed = -hoop.rotationSpeed;
            }
            hoop.rotation += hoop.rotationSpeed;
            
            return hoop.x > -hoop.width;
        });
    }

    createObstacle() {
        const height = 100 + Math.random() * 200;
        this.obstacles.push({
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - height - 100) + 50,
            width: 60,
            height: height
        });
    }

    createHoop() {
        const level = this.difficultyLevels[this.currentLevel];
        const gap = level.gap;
        const baseY = this.canvas.height - 180;
        
        // 根据难度调整篮筐位置
        const randomOffset = (Math.random() - 0.5) * (20 * this.currentLevel);
        
        if (Math.random() < 0.5) {
            this.hoops.push({
                x: this.canvas.width,
                y: baseY + randomOffset,
                width: 80,
                height: 60,
                type: 'bottom',
                scale: 1,
                rotation: 0,
                rotationSpeed: 0.02,
                maxRotation: Math.PI / 8,
                minRotation: -Math.PI / 8
            });
        } else {
            this.hoops.push({
                x: this.canvas.width,
                y: baseY - gap + randomOffset,
                width: 80,
                height: 60,
                type: 'top',
                scale: 1,
                rotation: 0,
                rotationSpeed: 0.02,
                maxRotation: Math.PI / 8,
                minRotation: -Math.PI / 8
            });
        }
    }

    createParticle(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.effects.particles.push({
                x,
                y,
                color,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                life: 1
            });
        }
    }

    createScorePopup(x, y, score) {
        this.effects.scorePopups.push({
            x,
            y,
            score,
            life: 1,
            velocity: -2
        });
    }

    checkCollisions() {
        let hoopPassed = false;
        for (const hoop of this.hoops) {
            if (this.isColliding(this.player, hoop)) {
                const playerCenter = this.player.y + this.player.height / 2;
                const hoopCenter = hoop.y + hoop.height / 2;
                const hoopTop = hoop.y;
                const hoopBottom = hoop.y + hoop.height;
                
                // 判断是否是从上方进入篮筐
                if (playerCenter > hoopTop && playerCenter < hoopBottom && this.player.velocity > 0) {
                    // 根据难度计算得分
                    const baseScore = 10;
                    const difficultyBonus = Math.floor(this.difficulty * 5);
                    const comboBonus = this.missedHoops === 0 ? 5 : 0;
                    const totalScore = baseScore + difficultyBonus + comboBonus;
                    
                    this.score += totalScore;
                    this.hoops = this.hoops.filter(h => h !== hoop);
                    this.soundManager.play('dunk');
                    
                    // 增强入篮特效 - 创建更多彩色粒子
                    for (let i = 0; i < 30; i++) {
                        // 使用多种颜色
                        const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        this.createParticle(
                            this.player.x + this.player.width / 2,
                            this.player.y + this.player.height / 2,
                            color
                        );
                    }
                    
                    // 添加闪光效果
                    this.createFlashEffect(this.player.x, this.player.y);
                    
                    // 显示得分
                    this.createScorePopup(
                        this.player.x + this.player.width / 2,
                        this.player.y - 20,
                        `+${totalScore}`
                    );
                    
                    hoopPassed = true;
                    this.missedHoops = 0;
                    
                    // 播放篮网震动动画
                    this.createNetAnimation(hoop.x, hoop.y);
                }
            }
        }

        if (!hoopPassed && this.hoops.length > 0) {
            const firstHoop = this.hoops[0];
            if (this.player.x > firstHoop.x + firstHoop.width) {
                this.missedHoops++;
                this.createParticle(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height / 2,
                    '#e74c3c'
                );
                
                if (this.missedHoops >= this.maxMissedHoops) {
                    this.soundManager.play('hit');
                    this.gameOver();
                    return;
                }
            }
        }

        // 移除障碍物碰撞检测
        // 只检查玩家是否撞到地面或飞出顶部
        if (this.player.y + this.player.height > this.canvas.height || this.player.y < 0) {
            this.soundManager.play('hit');
            this.gameOver();
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    updateScore() {
        this.score++;
        
        // 每100分增加难度
        if (this.score % 100 === 0) {
            this.currentLevel = Math.min(this.currentLevel + 1, this.difficultyLevels.length - 1);
            const level = this.difficultyLevels[this.currentLevel];
            
            this.gameSpeed = level.speed;
            this.hoopInterval = level.interval;
            this.difficulty = 1 + (this.currentLevel * 0.2);
            
            // 播放升级音效
            this.soundManager.play('score');
            
            // 显示升级提示
            this.createScorePopup(
                this.canvas.width / 2,
                this.canvas.height / 2,
                `Level ${this.currentLevel + 1}!`
            );
        }
        
        document.getElementById('score-display').textContent = this.score;
    }

    gameOver() {
        this.gameState = 'gameOver';
        if (this.tutorialTimeout) {
            clearTimeout(this.tutorialTimeout);
        }
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
        
        // 根据游戏模式显示不同信息
        const gameOverText = document.getElementById('game-over-text');
        switch (this.gameMode) {
            case 'time':
                gameOverText.textContent = `时间到！\n最终得分：${this.score}`;
                break;
            case 'challenge':
                if (this.score >= this.challengeScore) {
                    gameOverText.textContent = `挑战成功！\n目标分数：${this.challengeScore}\n最终得分：${this.score}`;
                } else {
                    gameOverText.textContent = `挑战失败！\n目标分数：${this.challengeScore}\n最终得分：${this.score}`;
                }
                break;
            default:
                gameOverText.textContent = `游戏结束！\n最终得分：${this.score}`;
        }
        
        this.updateHighScore();
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        
        // 更新排行榜
        this.updateLeaderboard();
        
        document.getElementById('high-score').textContent = this.highScore;
    }

    updateLeaderboard() {
        const leaderboard = this.leaderboards[this.gameMode];
        const newScore = {
            score: this.score,
            date: new Date().toISOString(),
            mode: this.gameMode
        };
        
        leaderboard.push(newScore);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.splice(10); // 只保留前10名
        
        // 保存到本地存储
        localStorage.setItem(`leaderboard_${this.gameMode}`, JSON.stringify(leaderboard));
        
        // 更新显示
        this.updateLeaderboardDisplay();
    }

    updateLeaderboardDisplay() {
        const leaderboardContainer = document.getElementById('leaderboard');
        const leaderboard = this.leaderboards[this.gameMode];
        
        let html = '<h3>排行榜</h3>';
        html += '<table><tr><th>排名</th><th>分数</th><th>日期</th></tr>';
        
        leaderboard.forEach((entry, index) => {
            const date = new Date(entry.date).toLocaleDateString();
            html += `<tr>
                <td>${index + 1}</td>
                <td>${entry.score}</td>
                <td>${date}</td>
            </tr>`;
        });
        
        html += '</table>';
        leaderboardContainer.innerHTML = html;
    }

    restart() {
        this.score = 0;
        this.player.y = this.canvas.height / 2;
        this.player.velocity = 0;
        this.obstacles = [];
        this.hoops = [];
        this.gameState = 'playing';
        this.tutorialShown = false;
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('score-display').textContent = '0';
        this.showTutorialTip();
    }

    updateEffects() {
        // 更新粒子
        this.effects.particles = this.effects.particles.filter(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.life -= 0.02;
            particle.size -= 0.05; // 粒子逐渐变小
            return particle.life > 0 && particle.size > 0;
        });

        // 更新分数弹出
        this.effects.scorePopups = this.effects.scorePopups.filter(popup => {
            popup.y += popup.velocity;
            popup.life -= 0.02;
            // 添加缩放效果
            popup.scale = 1 + Math.sin(popup.life * Math.PI) * 0.5;
            return popup.life > 0;
        });
        
        // 更新闪光效果
        if (this.effects.flashes) {
            this.effects.flashes = this.effects.flashes.filter(flash => {
                flash.radius += 5;
                flash.alpha -= 0.05;
                return flash.radius < flash.maxRadius && flash.alpha > 0;
            });
        }
        
        // 更新篮网动画
        if (this.effects.nets) {
            this.effects.nets = this.effects.nets.filter(net => {
                net.phase += 0.1;
                net.life -= 0.02;
                return net.life > 0;
            });
        }
    }

    updatePlayerAnimation() {
        // 更新手臂旋转
        if (this.player.velocity < 0) {
            // 上升时手臂向上
            this.player.armRotation = Math.min(
                this.player.armRotation + this.player.armRotationSpeed,
                this.player.maxArmRotation
            );
        } else {
            // 下降时手臂向下
            this.player.armRotation = Math.max(
                this.player.armRotation - this.player.armRotationSpeed,
                this.player.minArmRotation
            );
        }

        // 更新缩放效果
        if (this.player.velocity !== 0) {
            this.player.scale = this.player.velocity < 0 ? 
                this.player.maxScale : 
                this.player.minScale;
        } else {
            this.player.scale = 1;
        }
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#2980b9');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制云朵
        this.drawClouds();
        
        // 绘制地面
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // 绘制地面纹理
        this.ctx.fillStyle = '#27ae60';
        for (let i = 0; i < this.canvas.width; i += 30) {
            this.ctx.fillRect(i, this.canvas.height - 50, 2, 50);
        }

        // 不再绘制障碍物
        this.obstacles = []; // 清空所有障碍物

        // 绘制篮筐
        for (const hoop of this.hoops) {
            this.ctx.save();
            this.ctx.translate(hoop.x + hoop.width / 2, hoop.y + hoop.height / 2);
            this.ctx.rotate(hoop.rotation);
            
            // 绘制篮筐支架
            this.ctx.fillStyle = '#c0392b';
            this.ctx.fillRect(-5, -50, 10, 100);
            
            // 绘制篮筐
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillRect(0, -10, hoop.width - 10, 10);
            
            // 绘制篮网
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(i * 15, 0);
                this.ctx.lineTo(i * 15, 30);
                this.ctx.stroke();
            }

            // 绘制篮筐发光效果
            const gradient = this.ctx.createLinearGradient(0, -10, 0, 0);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, -10, hoop.width - 10, 10);
            
            this.ctx.restore();
        }

        // 绘制玩家
        this.ctx.save();
        this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        this.ctx.rotate(this.player.rotation);
        this.ctx.scale(this.player.scale, this.player.scale);
        
        // 绘制阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        
        // 绘制身体
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.roundRect(
            -this.player.width / 2,
            -this.player.height / 2,
            this.player.width,
            this.player.height,
            5
        );
        this.ctx.fill();
        
        // 绘制球衣号码
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('23', 0, 0);
        
        // 绘制球衣条纹
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.player.width / 2, -this.player.height / 4);
        this.ctx.lineTo(this.player.width / 2, -this.player.height / 4);
        this.ctx.stroke();
        
        // 绘制头部
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.width / 4,
            -this.player.height / 2,
            this.player.width / 4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 绘制手臂（带旋转）
        this.ctx.save();
        this.ctx.translate(-this.player.width / 2, -this.player.height / 4);
        this.ctx.rotate(this.player.armRotation);
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.roundRect(0, 0, this.player.width / 4, this.player.height / 2, 3);
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(this.player.width / 2 - this.player.width / 4, -this.player.height / 4);
        this.ctx.rotate(this.player.armRotation);
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.roundRect(0, 0, this.player.width / 4, this.player.height / 2, 3);
        this.ctx.fill();
        this.ctx.restore();
        
        // 绘制篮球
        this.ctx.fillStyle = '#e67e22';
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.width / 2 + 5,
            0,
            this.player.width / 4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 绘制篮球纹理
        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(
                this.player.width / 2 + 5,
                0,
                this.player.width / 4,
                (i * Math.PI) / 3,
                (i * Math.PI) / 3 + Math.PI
            );
            this.ctx.stroke();
        }
        
        this.ctx.restore();

        // 绘制特效
        this.drawEffects();

        // 绘制游戏模式特定信息
        if (this.gameState === 'playing') {
            switch (this.gameMode) {
                case 'time':
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 24px Arial';
                    this.ctx.textAlign = 'right';
                    this.ctx.fillText(`剩余时间：${this.timeLeft}秒`, this.canvas.width - 20, 40);
                    break;
                case 'challenge':
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 24px Arial';
                    this.ctx.textAlign = 'right';
                    this.ctx.fillText(`目标分数：${this.challengeScore}`, this.canvas.width - 20, 40);
                    break;
            }
        }
    }

    drawEffects() {
        // 绘制粒子
        for (const particle of this.effects.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 绘制分数弹出
        for (const popup of this.effects.scorePopups) {
            this.ctx.save();
            this.ctx.globalAlpha = popup.life;
            // 设置阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.fillStyle = '#fff';
            // 随时间变化颜色
            if (popup.life > 0.7) {
                this.ctx.fillStyle = '#f1c40f'; // 金色
            } else if (popup.life > 0.4) {
                this.ctx.fillStyle = '#e74c3c'; // 红色
            }
            
            // 应用缩放效果
            this.ctx.font = `bold ${24 * (popup.scale || 1)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(popup.score, popup.x, popup.y);
            this.ctx.restore();
        }
        
        // 绘制闪光效果
        if (this.effects.flashes) {
            for (const flash of this.effects.flashes) {
                this.ctx.save();
                this.ctx.globalAlpha = flash.alpha;
                
                // 创建径向渐变
                const gradient = this.ctx.createRadialGradient(
                    flash.x, flash.y, 0,
                    flash.x, flash.y, flash.radius
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }
        
        // 绘制篮网动画
        if (this.effects.nets) {
            for (const net of this.effects.nets) {
                this.ctx.save();
                this.ctx.globalAlpha = net.life;
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                
                // 绘制震动的篮网线
                for (let i = 0; i < net.lines; i++) {
                    const x = net.x + i * (net.width / (net.lines - 1));
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, net.y);
                    
                    // 为每条线添加波浪效果
                    for (let y = 0; y < net.height; y += 5) {
                        const waveX = x + Math.sin(net.phase + i * 0.5) * net.amplitude * (1 - y / net.height);
                        this.ctx.lineTo(waveX, net.y + y);
                    }
                    
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
            }
        }

        // 绘制未进球提示
        if (this.missedHoops > 0) {
            this.ctx.save();
            const alpha = 1 - this.missedHoops / this.maxMissedHoops;
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `剩余机会: ${this.maxMissedHoops - this.missedHoops}`,
                this.canvas.width / 2,
                40
            );
            
            // 添加警告效果
            if (this.missedHoops === this.maxMissedHoops - 1) {
                this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(
                    this.canvas.width / 2,
                    40,
                    30,
                    0,
                    Math.PI * 2
                );
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            const x = (i * 300 + this.score * 0.5) % (this.canvas.width + 200) - 100;
            const y = 50 + i * 80;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30, 0, Math.PI * 2);
            this.ctx.arc(x + 30, y, 30, 0, Math.PI * 2);
            this.ctx.arc(x + 60, y, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    showTutorialTip() {
        if (!this.tutorialShown) {
            this.tutorialTip.classList.remove('hidden');
            this.tutorialTimeout = setTimeout(() => {
                this.tutorialTip.classList.add('hidden');
                this.tutorialShown = true;
            }, 5000);
        }
    }

    createFlashEffect(x, y) {
        // 创建一个从小到大的圆形闪光
        const flash = {
            x: x + this.player.width / 2,
            y: y + this.player.height / 2,
            radius: 10,
            maxRadius: 80,
            alpha: 1,
            color: '#FFFFFF'
        };
        
        // 存储闪光效果
        if (!this.effects.flashes) {
            this.effects.flashes = [];
        }
        this.effects.flashes.push(flash);
    }
    
    createNetAnimation(x, y) {
        // 创建篮网震动动画
        const net = {
            x: x,
            y: y,
            width: 80,
            height: 30,
            lines: 6,
            amplitude: 5,
            frequency: 0.3,
            phase: 0,
            duration: 1,
            life: 1
        };
        
        // 存储网动画
        if (!this.effects.nets) {
            this.effects.nets = [];
        }
        this.effects.nets.push(net);
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new FlappyDunk();
}); 