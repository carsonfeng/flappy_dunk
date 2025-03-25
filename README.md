# Flappy Dunk 游戏

一个基于Canvas的篮球飞行挑战游戏。

## 游戏特点

- 简单易上手的点击控制方式
- 多种游戏模式：经典、计时和挑战
- 精美的视觉效果和动画
- 排行榜系统

## 本地开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run start
```

### 构建项目

```bash
npm run build
```

## 部署到服务器

### 1. 将代码上传到服务器

使用SCP或SFTP将代码上传到服务器：

```bash
# 使用SCP上传目录
scp -r /path/to/flappy_dunk user@your-server-ip:/path/on/server
```

### 2. 使用部署脚本

连接到服务器后，进入项目目录并运行部署脚本：

```bash
cd /path/on/server/flappy_dunk
chmod +x run.sh  # 确保脚本有执行权限
./run.sh
```

部署脚本会自动：
- 检查并安装必要的依赖（Node.js、npm、Nginx）
- 安装项目依赖包
- 构建项目（如果需要）
- 配置Nginx
- 设置正确的文件权限

### 3. 配置域名（可选）

如果你有域名，请将其指向服务器IP并修改Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/flappy_dunk
```

将`server_name localhost;`修改为你的域名：

```
server_name yourdomain.com www.yourdomain.com;
```

然后重启Nginx：

```bash
sudo systemctl restart nginx
```

## 游戏操作

- 点击屏幕使角色上升
- 穿过篮筐得分
- 避免错过太多篮筐或撞到屏幕顶部/底部

## 技术栈

- HTML5 Canvas
- 原生JavaScript
- CSS3
- Nginx (用于部署)

## 项目结构

```
flappy_dunk/
├── index.html          # 游戏主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   └── game.js        # 游戏逻辑
└── assets/            # 游戏资源
    ├── player.png     # 玩家角色图片
    ├── obstacle.png   # 障碍物图片
    ├── hoop.png       # 篮筐图片
    ├── background.png # 背景图片
    └── dunk.mp3       # 音效文件
```

## 开发说明

1. 游戏使用 Canvas 进行渲染
2. 使用 requestAnimationFrame 实现流畅动画
3. 实现了基本的物理引擎（重力和跳跃）
4. 使用 localStorage 存储最高分
5. 响应式设计适配不同屏幕尺寸

## 注意事项

- 确保浏览器支持 HTML5 和 Canvas API
- 建议使用最新版本的现代浏览器
- 移动设备上需要触摸支持 