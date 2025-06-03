#!/bin/bash

# EchoLab Release Preparation Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 EchoLab Release Preparation${NC}"
echo "=================================="

# Get version type from argument or prompt
VERSION_TYPE=${1:-""}
if [ -z "$VERSION_TYPE" ]; then
    echo -e "${YELLOW}Select version bump type:${NC}"
    echo "1) patch (0.1.0 -> 0.1.1)"
    echo "2) minor (0.1.0 -> 0.2.0)" 
    echo "3) major (0.1.0 -> 1.0.0)"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1) VERSION_TYPE="patch";;
        2) VERSION_TYPE="minor";;
        3) VERSION_TYPE="major";;
        *) echo -e "${RED}Invalid choice${NC}"; exit 1;;
    esac
fi

echo -e "${BLUE}📦 Current version:${NC} $(node -p "require('./package.json').version")"

# Run pre-release checks
echo -e "\n${YELLOW}🧪 Running tests...${NC}"
pnpm test:run

echo -e "\n${YELLOW}🔍 Type checking...${NC}"
pnpm typecheck

echo -e "\n${YELLOW}✨ Linting...${NC}"
pnpm lint

# Update version
echo -e "\n${YELLOW}📊 Bumping version ($VERSION_TYPE)...${NC}"
npm version $VERSION_TYPE --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✅ Version updated to: v$NEW_VERSION${NC}"

# Build project
echo -e "\n${YELLOW}🔨 Building project...${NC}"
pnpm build

echo -e "\n${GREEN}✅ Release preparation completed!${NC}"
echo -e "\n${BLUE}📋 Next steps:${NC}"
echo "1. Review the changes"
echo "2. Commit changes: git add . && git commit -m \"chore: bump version to v$NEW_VERSION\""
echo "3. Create tag: git tag v$NEW_VERSION"
echo "4. Push to repository: git push origin main --tags"
echo -e "5. Or use: ${YELLOW}./scripts/publish-release.sh${NC}" 