#!/bin/bash

# Script to manually install FontAwesome in public directory
echo "===== Installing FontAwesome locally ====="

# Create directory
mkdir -p public/fontawesome/css
mkdir -p public/fontawesome/webfonts

# Download FontAwesome CSS
echo "Downloading FontAwesome CSS..."
curl -s https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css > public/fontawesome/css/all.min.css

# Download webfonts
echo "Downloading FontAwesome webfonts..."
curl -s https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2 > public/fontawesome/webfonts/fa-brands-400.woff2
curl -s https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2 > public/fontawesome/webfonts/fa-solid-900.woff2
curl -s https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2 > public/fontawesome/webfonts/fa-regular-400.woff2

# Fix CSS paths
echo "Fixing CSS paths..."
sed -i 's/\.\.\/webfonts/\/assets\/fontawesome\/webfonts/g' public/fontawesome/css/all.min.css

echo "===== FontAwesome Installation Complete ====="
echo "Update your main.ejs to use: /assets/fontawesome/css/all.min.css"