#!/bin/bash

# MarmokLogs Server Setup Script
echo "===== MarmokLogs Standalone Server Setup ====="
echo "This script will help you set up the standalone log server."

# Create required directories
echo "Creating directory structure..."
mkdir -p public/css public/js views/layouts views/partials build/views build/public

# Copy .env.example to .env if not exists
if [ ! -f .env ]; then
  echo "Creating .env file from example..."
  cp .env.example .env
  echo "Please edit the .env file with your configuration after setup."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build CSS
echo "Building CSS..."
npm run build:css

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Set up systemd service
echo "Would you like to set up a systemd service for MarmokLogs? (y/n)"
read setup_service

if [ "$setup_service" = "y" ] || [ "$setup_service" = "Y" ]; then
  echo "Creating systemd service file..."
  
  # Get current directory and username
  current_dir=$(pwd)
  username=$(whoami)
  
  # Create service file content
  service_content="[Unit]
Description=MarmokLogs - Standalone Log Server
After=network.target

[Service]
Type=simple
User=$username
WorkingDirectory=$current_dir
ExecStart=/usr/bin/node $current_dir/build/logServer.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target"

  # Save to file
  echo "$service_content" > marmok-logs.service
  
  echo "Service file created as marmok-logs.service"
  echo "To install the service, run the following commands:"
  echo "  sudo cp marmok-logs.service /etc/systemd/system/"
  echo "  sudo systemctl daemon-reload"
  echo "  sudo systemctl enable marmok-logs"
  echo "  sudo systemctl start marmok-logs"
fi

# Check SSL setup
echo "Checking SSL configuration..."
if [ -z "$(grep -E "^SSL_KEY_PATH=" .env | grep -v "=$")" ] || [ -z "$(grep -E "^SSL_CERT_PATH=" .env | grep -v "=$")" ]; then
  echo "⚠️  SSL certificate paths not configured in .env"
  echo "To use HTTPS, you need SSL certificates."
  echo "For Let's Encrypt with certbot:"
  echo "  sudo certbot certonly --standalone -d $(grep -E "^DOMAIN=" .env | cut -d= -f2)"
  echo "Then update your .env file with the certificate paths."
fi

echo "===== Setup Complete ====="
echo "To start the server manually, run: npm start"
echo "Visit https://$(grep -E "^DOMAIN=" .env | cut -d= -f2):$(grep -E "^LOG_PORT=" .env | cut -d= -f2 || echo 3001) or http://localhost:$(grep -E "^LOG_PORT=" .env | cut -d= -f2 || echo 3001)/logs"