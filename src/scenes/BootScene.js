export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 不需要加载外部资源，我们将直接创建所有资源
    }

    create() {
        // 创建背景纹理
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4682B4, 0x4682B4, 1);
        bgGraphics.fillRect(0, 0, 800, 600);
        bgGraphics.generateTexture('background', 800, 600);
        bgGraphics.clear();
        
        // 创建地面纹理
        const groundGraphics = this.add.graphics();
        groundGraphics.fillStyle(0x8B4513);
        groundGraphics.fillRect(0, 0, 800, 100);
        groundGraphics.fillStyle(0x654321);
        groundGraphics.fillRect(0, 0, 800, 20);
        groundGraphics.generateTexture('ground', 800, 100);
        groundGraphics.clear();
        
        // 创建云朵纹理
        const cloudGraphics = this.add.graphics();
        cloudGraphics.fillStyle(0xFFFFFF);
        cloudGraphics.fillCircle(25, 25, 25);
        cloudGraphics.fillCircle(50, 25, 20);
        cloudGraphics.fillCircle(75, 25, 25);
        cloudGraphics.generateTexture('cloud', 100, 50);
        cloudGraphics.clear();
        
        // 创建玩家纹理
        const playerGraphics = this.add.graphics();
        // 身体
        playerGraphics.fillStyle(0xFFD700); // 金色的球衣
        playerGraphics.fillRect(20, 10, 40, 30);
        // 头部
        playerGraphics.fillStyle(0xFFDAB9); // 肤色
        playerGraphics.fillCircle(40, 10, 15);
        // 胳膊和腿
        playerGraphics.fillStyle(0xFFDAB9);
        playerGraphics.fillRect(10, 15, 10, 20); // 左臂
        playerGraphics.fillRect(60, 15, 10, 20); // 右臂
        playerGraphics.fillRect(25, 40, 10, 20); // 左腿
        playerGraphics.fillRect(45, 40, 10, 20); // 右腿
        // 号码
        playerGraphics.fillStyle(0xFF0000);
        playerGraphics.fillRect(35, 20, 10, 15);
        playerGraphics.generateTexture('player', 80, 60);
        playerGraphics.clear();
        
        // 创建按钮纹理
        const buttonGraphics = this.add.graphics();
        buttonGraphics.fillStyle(0x4169E1);
        buttonGraphics.fillRoundedRect(0, 0, 200, 60, 15);
        buttonGraphics.fillStyle(0x3A5FCD);
        buttonGraphics.fillRoundedRect(0, 0, 200, 10, 5);
        buttonGraphics.generateTexture('button', 200, 60);
        buttonGraphics.clear();
        
        // 创建篮球纹理
        const ballGraphics = this.add.graphics();
        ballGraphics.fillStyle(0xE25822); // 橙色
        ballGraphics.fillCircle(25, 25, 25);
        ballGraphics.lineStyle(2, 0x000000);
        ballGraphics.strokeCircle(25, 25, 25);
        ballGraphics.lineStyle(2, 0x000000);
        ballGraphics.lineBetween(0, 25, 50, 25);
        ballGraphics.lineBetween(25, 0, 25, 50);
        ballGraphics.generateTexture('ball', 50, 50);
        ballGraphics.generateTexture('basketball', 50, 50); // 同时创建particle需要的纹理
        ballGraphics.clear();
        
        // 创建篮筐纹理
        const hoopGraphics = this.add.graphics();
        // 支架 - 深红色
        hoopGraphics.lineStyle(8, 0xB22222);
        hoopGraphics.moveTo(0, 0);
        hoopGraphics.lineTo(0, 60); // 垂直支架
        hoopGraphics.moveTo(0, 30);
        hoopGraphics.lineTo(60, 30); // 水平支架
        // 篮网 - 白色
        hoopGraphics.lineStyle(3, 0xFFFFFF, 0.8);
        for (let i = 0; i < 6; i++) {
            hoopGraphics.moveTo(i * 10, 30);
            hoopGraphics.lineTo(i * 10, 60); // 篮网线
        }
        hoopGraphics.generateTexture('hoop_texture', 60, 60);
        hoopGraphics.generateTexture('hoop', 60, 60); // 备用名称
        hoopGraphics.clear();
        
        // 创建音效
        this.createAudioPlaceholder('jump');
        this.createAudioPlaceholder('dunk');
        this.createAudioPlaceholder('score');
        this.createAudioPlaceholder('gameover');
        this.createAudioPlaceholder('click');
        
        // 进入菜单场景
        this.scene.start('MenuScene');
    }
    
    createAudioPlaceholder(key) {
        // 创建一个空的音频对象，因为没有实际的音频文件
        this.sound.add(key, {
            mute: false,
            volume: 1,
            rate: 1,
            detune: 0,
            seek: 0,
            loop: false,
            delay: 0
        });
    }
} 