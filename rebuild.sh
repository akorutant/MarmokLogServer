#!/bin/bash

# Rebuild and restart MarmokLogs server

echo "===== MarmokLogs Server Rebuild ====="

# Navigate to the project directory (modify this if needed)
cd ~/MarmokLogServer

# Install dependencies if needed
if [ "$1" == "--deps" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build CSS
echo "Building CSS..."
npm run build:css

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Copy static assets if not already handled by build process
echo "Ensuring assets are available..."
mkdir -p build/assets
cp -R assets build/ 2>/dev/null || :

# Restart the service if using systemd
if [ -f /etc/systemd/system/marmok-logs.service ]; then
  echo "Restarting systemd service..."
  sudo systemctl restart marmok-logs
  sudo systemctl status marmok-logs --no-pager
else
  echo "Starting server manually..."
  npm start
fi

echo "===== Rebuild Complete ====="