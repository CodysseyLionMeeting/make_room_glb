#!/bin/bash
set -e

echo "========================================="
echo "Make Room GLB - EC2 Deployment Script"
echo "========================================="

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20 (latest LTS) - includes npm
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install other dependencies
echo "📦 Installing other dependencies..."
sudo apt-get install -y \
    python3-pip \
    python3-venv \
    nginx \
    git \
    curl

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/make-room-glb
sudo chown -R ubuntu:ubuntu /var/www/make-room-glb
cd /var/www/make-room-glb

# Clone repository
echo "📥 Cloning repository..."
if [ -d ".git" ]; then
    git pull
else
    git clone https://github.com/CodysseyLionMeeting/make_room_glb.git .
fi

# Setup Backend
echo "🐍 Setting up backend..."
cd /var/www/make-room-glb/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn python-multipart opencv-python-headless pillow numpy

# Create backend systemd service
echo "⚙️ Creating backend service..."
sudo tee /etc/systemd/system/make-room-backend.service > /dev/null <<EOF
[Unit]
Description=Make Room GLB Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/make-room-glb/backend
Environment="PATH=/var/www/make-room-glb/backend/venv/bin"
ExecStart=/var/www/make-room-glb/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Setup Frontend
echo "⚛️ Setting up frontend..."
cd /var/www/make-room-glb/frontend
npm install
npm run build

# Create Nginx configuration
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/make-room-glb > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /var/www/make-room-glb/frontend/dist;
        try_files \$uri \$uri/ /index.html =404;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Increase timeouts for file uploads
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        client_max_body_size 50M;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/make-room-glb /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

# Start services
echo "🚀 Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable make-room-backend
sudo systemctl start make-room-backend
sudo systemctl restart nginx

# Check service status
echo "✅ Checking service status..."
sudo systemctl status make-room-backend --no-pager
sudo systemctl status nginx --no-pager

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "To check logs:"
echo "  Backend: sudo journalctl -u make-room-backend -f"
echo "  Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""
