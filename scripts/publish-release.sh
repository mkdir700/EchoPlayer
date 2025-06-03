#!/bin/bash

# EchoLab Release Publisher Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 EchoLab Release Publisher${NC}"
echo "================================="

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📦 Current version:${NC} v$CURRENT_VERSION"

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    echo "Committing changes..."
    git add .
    git commit -m "chore: bump version to v$CURRENT_VERSION"
fi

# Check if tag already exists
if git rev-parse "v$CURRENT_VERSION" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Tag v$CURRENT_VERSION already exists${NC}"
    read -p "Do you want to delete and recreate it? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        git tag -d "v$CURRENT_VERSION"
        git push --delete origin "v$CURRENT_VERSION" 2>/dev/null || true
    else
        echo -e "${RED}❌ Aborted${NC}"
        exit 1
    fi
fi

# Create tag
echo -e "\n${YELLOW}🏷️  Creating tag v$CURRENT_VERSION...${NC}"
git tag "v$CURRENT_VERSION"

# Push changes and tags
echo -e "\n${YELLOW}📤 Pushing to repository...${NC}"
git push origin main
git push origin "v$CURRENT_VERSION"

echo -e "\n${GREEN}✅ Release published successfully!${NC}"
echo -e "\n${BLUE}📋 What happens next:${NC}"
echo "1. GitHub Actions will automatically build packages for all platforms"
echo "2. A draft release will be created on GitHub"
echo "3. You can review and publish the release at:"
echo -e "   ${YELLOW}https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[\/:]//;s/.git$//')/releases${NC}"

echo -e "\n${BLUE}🔗 Useful links:${NC}"
echo "- Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[\/:]//;s/.git$//')/actions"
echo "- Releases: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[\/:]//;s/.git$//')/releases" 