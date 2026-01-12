# Deployment Guide - Weaviate Admin UI

This guide covers deploying the Weaviate Admin UI to EC2 or similar Linux servers.

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Weaviate running on localhost:8080 or accessible URL
- Domain name (optional but recommended)
- SSL certificate (recommended for production)

## Deployment Architecture

```
Internet → Nginx (Port 80/443) → React Static Files
                                ↓
                         FastAPI (Port 8000) → Weaviate (Port 8080)
```

## Step-by-Step Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.10 python3.10-venv python3-pip nginx git

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Create deployment directory
sudo mkdir -p /opt/weaviate-admin
sudo chown $USER:$USER /opt/weaviate-admin
```

### 2. Clone and Setup Backend

```bash
cd /opt/weaviate-admin

# Clone repository (or upload files)
git clone <your-repo-url> .

# Setup Python virtual environment
cd weaviate-admin-api
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create production .env file
cat > .env << 'EOL'
WEAVIATE_URL=http://localhost:8080
JWT_SECRET=<generate-a-strong-random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=https://weaviate-admin.yourdomain.com
API_V1_PREFIX=/api/v1
EOL

# Generate a strong JWT secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy the output and replace <generate-a-strong-random-secret> in .env
```

### 3. Setup Systemd Service for Backend

Create `/etc/systemd/system/weaviate-admin-api.service`:

```bash
sudo tee /etc/systemd/system/weaviate-admin-api.service << 'EOL'
[Unit]
Description=Weaviate Admin API
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/weaviate-admin/weaviate-admin-api
Environment="PATH=/opt/weaviate-admin/weaviate-admin-api/venv/bin"
EnvironmentFile=/opt/weaviate-admin/weaviate-admin-api/.env
ExecStart=/opt/weaviate-admin/weaviate-admin-api/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOL
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable weaviate-admin-api
sudo systemctl start weaviate-admin-api
sudo systemctl status weaviate-admin-api
```

### 4. Build and Deploy Frontend

```bash
cd /opt/weaviate-admin/weaviate-admin-ui

# Create production .env file
cat > .env << 'EOL'
REACT_APP_API_URL=https://weaviate-admin.yourdomain.com/api/v1
EOL

# Install dependencies
npm ci --only=production

# Build for production
npm run build

# Deploy to web root
sudo mkdir -p /var/www/weaviate-admin
sudo cp -r build/* /var/www/weaviate-admin/
sudo chown -R www-data:www-data /var/www/weaviate-admin
```

### 5. Configure Nginx

Create `/etc/nginx/sites-available/weaviate-admin`:

```bash
sudo tee /etc/nginx/sites-available/weaviate-admin << 'EOL'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name weaviate-admin.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name weaviate-admin.yourdomain.com;

    # SSL Configuration (update paths to your certificates)
    ssl_certificate /etc/ssl/certs/weaviate-admin.crt;
    ssl_certificate_key /etc/ssl/private/weaviate-admin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory for React app
    root /var/www/weaviate-admin;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # React Router - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to FastAPI backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Cache static assets
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Logs
    access_log /var/log/nginx/weaviate-admin-access.log;
    error_log /var/log/nginx/weaviate-admin-error.log;
}
EOL
```

Enable the site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/weaviate-admin /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 6. Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d weaviate-admin.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### 7. Configure Firewall

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Post-Deployment Verification

### 1. Check Backend Status

```bash
# Check service status
sudo systemctl status weaviate-admin-api

# Check logs
sudo journalctl -u weaviate-admin-api -f

# Test API endpoint
curl http://localhost:8000/health
```

### 2. Check Frontend

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/weaviate-admin-access.log

# View error logs
sudo tail -f /var/log/nginx/weaviate-admin-error.log
```

### 3. Test Application

1. Open https://weaviate-admin.yourdomain.com in browser
2. Login with test credentials
3. Verify all features work:
   - Dashboard loads
   - Schema viewer shows classes
   - Data browser shows objects
   - Query playground executes queries

## Monitoring and Maintenance

### Log Management

```bash
# Backend logs
sudo journalctl -u weaviate-admin-api -n 100

# Nginx access logs
sudo tail -f /var/log/nginx/weaviate-admin-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/weaviate-admin-error.log
```

### Log Rotation

Create `/etc/logrotate.d/weaviate-admin`:

```bash
sudo tee /etc/logrotate.d/weaviate-admin << 'EOL'
/var/log/nginx/weaviate-admin-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
EOL
```

### Backup Strategy

```bash
# Create backup script
sudo tee /usr/local/bin/backup-weaviate-admin.sh << 'EOL'
#!/bin/bash
BACKUP_DIR="/opt/backups/weaviate-admin"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/weaviate-admin

# Backup nginx config
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx/sites-available/weaviate-admin

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOL

sudo chmod +x /usr/local/bin/backup-weaviate-admin.sh
```

### Update Deployment

```bash
# Backend update
cd /opt/weaviate-admin/weaviate-admin-api
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart weaviate-admin-api

# Frontend update
cd /opt/weaviate-admin/weaviate-admin-ui
git pull
npm ci
npm run build
sudo cp -r build/* /var/www/weaviate-admin/
```

## Troubleshooting

### Backend Issues

**Service won't start:**
```bash
# Check logs
sudo journalctl -u weaviate-admin-api -n 50

# Check environment file
cat /opt/weaviate-admin/weaviate-admin-api/.env

# Test manually
cd /opt/weaviate-admin/weaviate-admin-api
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Connection to Weaviate fails:**
```bash
# Check if Weaviate is running
curl http://localhost:8080/v1/.well-known/ready

# Check network connectivity
nc -zv localhost 8080
```

### Frontend Issues

**Nginx 502 Bad Gateway:**
- Check if backend is running: `sudo systemctl status weaviate-admin-api`
- Check backend logs: `sudo journalctl -u weaviate-admin-api -n 50`
- Verify proxy_pass configuration in Nginx

**Static files not loading:**
```bash
# Check file permissions
ls -la /var/www/weaviate-admin/

# Should be owned by www-data
sudo chown -R www-data:www-data /var/www/weaviate-admin
```

## Security Hardening

### 1. Restrict Backend Access

The backend should only be accessible from localhost:

```bash
# Verify backend only listens on 127.0.0.1
sudo netstat -tlnp | grep 8000
```

### 2. Rate Limiting

Add to Nginx configuration:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of proxy config
}
```

### 3. Fail2Ban for Nginx

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure for nginx
sudo tee /etc/fail2ban/jail.local << 'EOL'
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/weaviate-admin-error.log
maxretry = 5
bantime = 3600
EOL

sudo systemctl restart fail2ban
```

## Performance Optimization

### 1. Backend Workers

Adjust workers in systemd service based on CPU cores:
```
ExecStart=... --workers 4
```

Rule of thumb: `(2 x CPU_CORES) + 1`

### 2. Nginx Caching

Add to Nginx configuration:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/v1/dashboard/overview {
    proxy_cache api_cache;
    proxy_cache_valid 200 30s;
    # ... rest of proxy config
}
```

### 3. Database Connection Pooling

Already configured in backend with default timeouts.

## Rollback Procedure

```bash
# Stop services
sudo systemctl stop weaviate-admin-api

# Restore from backup
cd /opt/backups/weaviate-admin
tar -xzf app_YYYYMMDD_HHMMSS.tar.gz -C /

# Restore frontend
tar -xzf nginx_YYYYMMDD_HHMMSS.tar.gz -C /

# Restart services
sudo systemctl start weaviate-admin-api
sudo systemctl reload nginx
```

---

**For questions or issues, contact the TestNeo DevOps team.**

