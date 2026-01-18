#!/bin/bash
set -e

echo "🚀 Deploying Gotta Fill 'Em All to Digital Ocean"

# Pull latest code
git pull origin master

# Stop existing containers
docker-compose down

# Build and start
docker-compose up -d --build

echo "✅ Deployment complete!"
echo "🌐 App running on port 3000"
