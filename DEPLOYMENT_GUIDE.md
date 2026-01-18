# Deployment Guide - Digital Ocean

## Prerequisites
- Digital Ocean account with GitHub Student Pack ($200 credits)
- SSH key added to Digital Ocean
- Domain name (optional)

## 1. Create Droplet
1. Go to digitalocean.com/droplets
2. **Choose Image:** Docker (Marketplace)
3. **Droplet Type:** Basic ($6/month)
4. **CPU:** Regular Intel - 1 GB RAM / 1 CPU
5. **Datacenter:** Choose closest to you
6. **Authentication:** SSH Key (add your key)
7. **Hostname:** gotta-fill-em-all
8. Click **Create Droplet**

## 2. SSH into Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

## 3. Clone and Setup
```bash
# Install Docker Compose
apt update
apt install docker-compose -y

# Clone repository
git clone https://github.com/atinder-harika/gotta-fill-em-all.git
cd gotta-fill-em-all

# Create .env file
nano .env
```

## 4. Add Environment Variables to .env
```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## 5. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

## 6. Access Your App
- Open browser: `http://YOUR_DROPLET_IP:3000`
- Extension: Update panel.html iframe src to your droplet IP

## Optional: Setup Domain + HTTPS
```bash
# Install Nginx and Certbot
apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx (create /etc/nginx/sites-available/gotta-fill-em-all)
# Point your domain A record to droplet IP
# Get SSL certificate
certbot --nginx -d yourdomain.com
```

## Update & Redeploy
```bash
cd gotta-fill-em-all
./deploy.sh
```
