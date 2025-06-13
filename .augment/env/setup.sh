#!/bin/bash

# Update system packages
sudo apt-get update

# Install Node.js 20 (LTS) using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm globally with sudo
sudo npm install -g pnpm

# Verify installations
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "pnpm version: $(pnpm --version)"

# Navigate to workspace
cd /mnt/persist/workspace

# Install project dependencies
pnpm install --frozen-lockfile

# Build the project to ensure everything works
pnpm run build

echo "Setup completed successfully!"