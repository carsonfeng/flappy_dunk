export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.score = data.score;
        this.highScore = data.highScore;
        this.success = data.success;
        this.gameMode = data.mode;
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
        this.add.tileSprite(400, 550, 800, 100, 'ground');

        // 游戏结束文本
        let gameOverText = '';
        switch (this.gameMode) {
            case 'time':
                gameOverText = this.timeLeft <= 0 ? '时间到！' : '游戏结束！';
                break;
            case 'challenge':
                gameOverText = this.success ? '挑战成功！' : '挑战失败！';
                break;
            default:
                gameOverText = '游戏结束！';
        }

        const title = this.add.text(400, 150, gameOverText, {
            fontSize: '64px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 8
        });
        title.setOrigin(0.5);

        // 显示分数
        const scoreText = this.add.text(400, 250, `得分: ${this.score}`, {
            fontSize: '48px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 6
        });
        scoreText.setOrigin(0.5);

        // 显示最高分
        const highScoreText = this.add.text(400, 320, `最高分: ${this.highScore}`, {
            fontSize: '36px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });
        highScoreText.setOrigin(0.5);

        // 创建按钮容器
        const buttonContainer = this.add.container(400, 450);
        
        // 重新开始按钮
        const restartButton = this.add.image(0, 0, 'button');
        const restartText = this.add.text(0, 0, '重新开始', {
            fontSize: '32px',
            fill: '#fff'
        });
        restartText.setOrigin(0.5);
        buttonContainer.add([restartButton, restartText]);

        // 选择模式按钮
        const modeButton = this.add.image(0, 80, 'button');
        const modeText = this.add.text(0, 80, '选择模式', {
            fontSize: '32px',
            fill: '#fff'
        });
        modeText.setOrigin(0.5);
        buttonContainer.add([modeButton, modeText]);

        // 添加按钮交互
        restartButton.setInteractive();
        modeButton.setInteractive();

        // 添加按钮悬停效果
        [restartButton, modeButton].forEach(button => {
            button.on('pointerover', () => {
                button.setTint(0x00ff00);
            });
            button.on('pointerout', () => {
                button.clearTint();
            });
        });

        // 重新开始按钮点击事件
        restartButton.on('pointerdown', () => {
            this.sound.play('click');
            this.scene.start('GameScene', { mode: this.gameMode });
        });

        // 选择模式按钮点击事件
        modeButton.on('pointerdown', () => {
            this.sound.play('click');
            this.scene.start('MenuScene');
        });

        // 播放游戏结束音效
        this.sound.play('gameover');
    }
} 