#!/bin/bash

# Flappy Dunk 游戏部署脚本 - 适用于Ubuntu服务器

# 确保脚本在出错时停止执行
set -e

echo "===== Flappy Dunk 游戏部署脚本 ====="

# 检查是否安装了必要的软件
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo "未找到 $1，正在安装..."
    sudo apt-get update
    sudo apt-get install -y $1
    echo "$1 安装完成"
  else
    echo "$1 已安装"
  fi
}

echo "正在检查依赖项..."
check_dependency "nodejs"
check_dependency "npm"
check_dependency "nginx"

# 安装项目依赖
echo "正在安装项目依赖..."
npm install

# 检查是否需要构建项目
if [ ! -f "main.js" ]; then
  echo "正在构建项目..."
  if [ -f "webpack.config.js" ]; then
    # 如果存在webpack配置文件，使用webpack构建
    npx webpack --mode production
  else
    echo "警告: 未找到webpack配置文件，跳过构建步骤"
  fi
else
  echo "项目已构建，跳过构建步骤"
fi

# 配置Nginx
echo "正在配置Nginx..."
NGINX_CONF="/etc/nginx/sites-available/flappy_dunk"
NGINX_CONF_ENABLED="/etc/nginx/sites-enabled/flappy_dunk"

# 创建Nginx配置文件
sudo tee $NGINX_CONF > /dev/null << EOF
server {
    listen 80;
    server_name localhost;  # 替换为你的域名

    root $(pwd);
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }

    # 禁止访问敏感文件
    location ~ \.(git|sh|json|md)$ {
        deny all;
        return 404;
    }
}
EOF

# 启用网站配置
if [ ! -L "$NGINX_CONF_ENABLED" ]; then
    sudo ln -s $NGINX_CONF $NGINX_CONF_ENABLED
fi

# 检查配置有效性并重启Nginx
echo "检查Nginx配置并重启服务..."
sudo nginx -t && sudo systemctl restart nginx

# 设置文件权限
echo "设置文件权限..."
chmod -R 755 .
find . -type f -exec chmod 644 {} \;
chmod 755 run.sh

echo "===== 部署完成 ====="
echo "您的游戏现在应该可以通过 http://服务器IP 访问"
echo "如果您有域名，请将其指向服务器IP并修改Nginx配置中的server_name" 