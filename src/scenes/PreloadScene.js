export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 加载游戏资源
        // 图片资源
        this.load.image('background', 'assets/images/background.png');
        this.load.image('ground', 'assets/images/ground.png');
        this.load.image('player', 'assets/images/player.png');
        this.load.image('basketball', 'assets/images/basketball.png');
        this.load.image('hoop', 'assets/images/hoop.png');
        this.load.image('cloud', 'assets/images/cloud.png');
        this.load.image('score-bg', 'assets/images/score-bg.png');
        this.load.image('button', 'assets/images/button.png');

        // 音频资源
        this.load.audio('jump', 'assets/audio/jump.mp3');
        this.load.audio('dunk', 'assets/audio/dunk.mp3');
        this.load.audio('score', 'assets/audio/score.mp3');
        this.load.audio('gameover', 'assets/audio/gameover.mp3');
        this.load.audio('bgm', 'assets/audio/bgm.mp3');
    }

    create() {
        // 创建加载进度条
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
            font: '20px Arial',
            fill: '#ffffff'
        });
        loadingText.setOrigin(0.5, 0.5);

        // 监听加载进度
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        // 加载完成后进入菜单场景
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            this.scene.start('MenuScene');
        });
    }
} 