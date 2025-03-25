export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gameMode = data.mode;
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.missedHoops = 0;
        this.maxMissedHoops = 10;
        this.currentLevel = 1;
        this.gameSpeed = 1.5;
        this.jumpForce = -350;
        this.gravity = 600;
        this.hoopInterval = 4000;
        this.timeLeft = 60;
        this.success = false;
    }

    create() {
        // 添加背景
        this.add.image(400, 300, 'background');
        
        // 添加云朵
        for (let i = 0; i < 3; i++) {
            const cloud = this.add.image(200 + i * 200, 100 + i * 50, 'cloud');
            cloud.setScale(0.5 + Math.random() * 0.5);
        }

        // 添加地面
        this.ground = this.add.tileSprite(400, 550, 800, 100, 'ground');
        
        // 创建玩家
        this.player = this.physics.add.sprite(100, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);
        this.player.name = 'player'; // 添加名称以防被移除
        
        // 创建篮球 - 使用生成的纹理
        this.basketball = this.physics.add.sprite(120, 300, 'ball');
        this.basketball.setBounce(0.6);
        this.basketball.name = 'basketball'; // 添加名称以防被移除
        
        // 创建篮筐组
        this.hoops = this.physics.add.group();
        
        // 添加碰撞检测
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.basketball, this.ground);
        // 移除玩家和篮筐的碰撞检测，只保留篮球和篮筐的碰撞
        this.physics.add.collider(this.basketball, this.hoops, this.handleBasketballCollision, null, this);
        
        // 添加分数显示
        this.scoreText = this.add.text(16, 16, '分数: 0', {
            fontSize: '32px',
            fill: '#fff'
        });
        
        // 根据游戏模式添加额外显示
        switch (this.gameMode) {
            case 'time':
                this.timeText = this.add.text(16, 50, '时间: 60', {
                    fontSize: '32px',
                    fill: '#fff'
                });
                this.timeEvent = this.time.addEvent({
                    delay: 1000,
                    callback: this.updateTime,
                    callbackScope: this,
                    loop: true
                });
                break;
            case 'challenge':
                this.challengeText = this.add.text(16, 50, `目标: ${this.challengeScore}`, {
                    fontSize: '32px',
                    fill: '#fff'
                });
                break;
        }
        
        // 添加音效控制
        const soundButton = this.add.image(750, 50, 'button');
        const soundText = this.add.text(750, 50, '🔊', {
            font: '24px Arial'
        });
        soundText.setOrigin(0.5);

        soundButton.setInteractive();
        soundButton.on('pointerdown', () => {
            const isMuted = this.sound.mute;
            this.sound.mute = !isMuted;
            soundText.setText(isMuted ? '🔈' : '🔊');
        });
        
        // 添加输入控制
        this.input.on('pointerdown', this.jump, this);
        
        // 开始生成篮筐
        this.time.addEvent({
            delay: this.hoopInterval,
            callback: this.createHoop,
            callbackScope: this,
            loop: true
        });

        // 立即创建第一个篮筐
        this.createHoop();
    }

    update() {
        // 更新地面滚动
        this.ground.tilePositionX += this.gameSpeed;
        
        // 更新玩家旋转 - 减少旋转速度
        this.player.rotation = this.player.body.velocity.y * 0.003;
        
        // 让篮球也有一点旋转，看起来更真实
        this.basketball.rotation += 0.01;
        
        // 检查游戏结束条件 - 只检查掉落或错过太多篮筐
        if (this.player.y > 580 || this.missedHoops >= this.maxMissedHoops) {
            this.gameOver();
        }
        
        // 检查挑战模式目标
        if (this.gameMode === 'challenge' && this.score >= this.challengeScore) {
            this.gameOver(true);
        }
        
        // 查找并销毁可能存在的黑色柱子
        this.children.each(child => {
            // 检查游戏对象
            if (child && child.type === 'Sprite' && !child.name && child.width > 50 && child.height > 150) {
                console.log('销毁障碍物:', child);
                child.destroy();
            }
        });
    }

    jump() {
        this.player.setVelocityY(this.jumpForce);
        this.basketball.setVelocityY(this.jumpForce);
        this.sound.play('jump');
    }

    createHoop() {
        // 随机高度但保持在合理范围内
        const baseY = Phaser.Math.Between(350, 450);
        
        // 创建碰撞体，完全透明 - 现在只用于检测篮球而非玩家
        const hitbox = this.physics.add.sprite(850, baseY, 'player');
        hitbox.visible = false;
        hitbox.alpha = 0;
        hitbox.setImmovable(true);
        hitbox.setSize(60, 30);
        hitbox.name = 'hoop_hitbox'; // 添加名称以防被移除
        
        // 创建篮筐精灵（使用预生成的纹理）- 注意这里不添加任何额外的图形或障碍物
        const hoopSprite = this.add.sprite(850, baseY, 'hoop_texture');
        hoopSprite.setOrigin(0.5, 0.5);
        hoopSprite.name = 'hoop_sprite'; // 命名精灵防止被移除
        
        // 添加动画效果
        this.tweens.add({
            targets: [hitbox, hoopSprite],
            x: -100,
            duration: 15000 / this.gameSpeed,
            ease: 'Linear',
            onComplete: () => {
                hitbox.destroy();
                hoopSprite.destroy();
            }
        });
        
        // 保存视觉精灵的引用
        hitbox.visualSprite = hoopSprite;
        
        // 添加到篮筐组
        this.hoops.add(hitbox);
        
        return hitbox;
    }

    handleBasketballCollision(basketball, hoop) {
        // 检查篮球是否从上方进入篮筐
        if (basketball.y < hoop.y - 10) {
            // 篮球进入篮筐，进行得分
            this.score += 10;
            this.scoreText.setText('分数: ' + this.score);
            this.sound.play('dunk');
            
            // 创建得分特效
            this.createScoreEffect(basketball.x, basketball.y);
            
            // 篮网动画效果
            if (hoop.visualSprite) {
                // 创建一个篮网动画
                const net = this.add.graphics();
                net.lineStyle(3, 0xFFFFFF, 0.8);
                
                // 绘制篮网线
                for (let i = 0; i < 6; i++) {
                    const x = hoop.x - 30 + i * 10;
                    net.moveTo(x, hoop.y);
                    net.lineTo(x, hoop.y + 30);
                }
                
                // 添加动画效果
                this.tweens.add({
                    targets: net,
                    alpha: 0,
                    scaleY: 1.3,
                    duration: 400,
                    ease: 'Quad.easeOut',
                    onComplete: () => net.destroy()
                });
                
                // 销毁篮筐精灵
                hoop.visualSprite.destroy();
            }
            
            // 移除篮筐
            hoop.destroy();
            
            // 更新难度
            if (this.score % 100 === 0) {
                this.currentLevel = Math.min(this.currentLevel + 1, 2);
                this.gameSpeed = Math.min(1.5 + (this.currentLevel * 0.1), 1.7);
                this.sound.play('score');
                this.createLevelUpEffect();
            }
        } else {
            // 篮球从下方或侧面碰到篮筐，弹开
            basketball.setVelocityY(-150);
            // 给一些随机的水平速度模拟弹开效果
            basketball.setVelocityX((Math.random() - 0.5) * 200);
        }
    }

    createScoreEffect(x, y) {
        // 创建闪烁的"+10"文本而不是粒子
        const scoreText = this.add.text(x, y, '+10', {
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#FFD700',
            stroke: '#000',
            strokeThickness: 5
        });
        scoreText.setOrigin(0.5);
        
        // 添加文本动画
        this.tweens.add({
            targets: scoreText,
            y: y - 100,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                scoreText.destroy();
            }
        });
    }

    createLevelUpEffect() {
        const text = this.add.text(400, 300, 'Level Up!', {
            fontSize: '48px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 8
        });
        text.setOrigin(0.5);
        
        this.tweens.add({
            targets: text,
            y: 200,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    updateTime() {
        this.timeLeft--;
        this.timeText.setText('时间: ' + this.timeLeft);
        
        if (this.timeLeft <= 0) {
            this.gameOver();
        }
    }

    gameOver(success = false) {
        // 保存分数
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        leaderboard.push({
            score: this.score,
            date: new Date().toISOString(),
            mode: this.gameMode
        });
        leaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        
        // 进入游戏结束场景
        this.scene.start('GameOverScene', {
            score: this.score,
            highScore: this.highScore,
            success: success,
            mode: this.gameMode
        });
    }
} 