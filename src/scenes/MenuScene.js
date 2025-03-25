export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // 添加背景
        this.add.image(400, 300, 'background');
        
        // 添加云朵
        for (let i = 0; i < 3; i++) {
            const cloud = this.add.image(200 + i * 200, 100 + i * 50, 'cloud');
            cloud.setScale(0.5 + Math.random() * 0.5);
        }

        // 添加标题
        const title = this.add.text(400, 150, 'Flappy Dunk', {
            font: '64px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        });
        title.setOrigin(0.5);

        // 添加游戏模式按钮
        const modes = [
            { text: '经典模式', mode: 'classic' },
            { text: '计时模式', mode: 'time' },
            { text: '挑战模式', mode: 'challenge' }
        ];

        modes.forEach((mode, index) => {
            const button = this.add.image(400, 300 + index * 80, 'button');
            const text = this.add.text(400, 300 + index * 80, mode.text, {
                font: '32px Arial',
                fill: '#ffffff'
            });
            text.setOrigin(0.5);

            button.setInteractive();
            button.on('pointerover', () => button.setScale(1.1));
            button.on('pointerout', () => button.setScale(1));
            button.on('pointerdown', () => {
                this.gameMode = mode.mode;
                this.scene.start('GameScene', { mode: mode.mode });
            });
        });

        // 添加音效控制按钮
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

        // 显示排行榜
        this.showLeaderboard();
    }

    showLeaderboard() {
        const leaderboard = this.add.container(400, 500);
        const bg = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.7);
        leaderboard.add(bg);

        const title = this.add.text(0, -80, '排行榜', {
            font: '24px Arial',
            fill: '#ffffff'
        });
        title.setOrigin(0.5);
        leaderboard.add(title);

        // 从localStorage获取排行榜数据
        const leaderboardData = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        
        leaderboardData.slice(0, 5).forEach((entry, index) => {
            const text = this.add.text(0, -40 + index * 30, 
                `${index + 1}. ${entry.score}分`, {
                font: '20px Arial',
                fill: '#ffffff'
            });
            text.setOrigin(0.5);
            leaderboard.add(text);
        });
    }
} 