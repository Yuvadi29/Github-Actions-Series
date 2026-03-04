#!/bin/bash

# ============================================================
# Local Blog Writer Test Script
# ============================================================
#
# This script tests the auto-blog-writer locally without GitHub
# Useful for debugging and development
#
# Usage:
#   bash test-blog-writer.sh
#
# Or with custom files:
#   TOPIC_FILE=topics/my-other-topic.md bash test-blog-writer.sh

set -e

# Configuration
GEMINI_API_KEY=${GEMINI_API_KEY:-""}
TOPIC_FILE=${TOPIC_FILE:-"topics/example-docker-guide.md"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "============================================"
echo "🖊️  Auto Blog Writer — Local Test"
echo "============================================"
echo ""

# Validate API key
if [ -z "$GEMINI_API_KEY" ]; then
  echo -e "${RED}❌ Error: GEMINI_API_KEY environment variable not set${NC}"
  echo ""
  echo "To get your API key:"
  echo "  1. Go to https://aistudio.google.com/"
  echo "  2. Click 'Get API Key' → 'Create API key in new project'"
  echo "  3. Copy and export it:"
  echo ""
  echo "     export GEMINI_API_KEY='your-key-here'"
  echo "     bash test-blog-writer.sh"
  echo ""
  exit 1
fi

# Validate topic file
if [ ! -f "$TOPIC_FILE" ]; then
  echo -e "${RED}❌ Topic file not found: $TOPIC_FILE${NC}"
  echo ""
  echo "Create an example first:"
  echo "  mkdir -p topics"
  echo "  cat > topics/example.md << 'EOF'"
  echo "---"
  echo "title: \"My Example Post\""
  echo "tags: [\"example\"]"
  echo "audience: \"beginners\""
  echo "publish: false"
  echo "---"
  echo "- First point"
  echo "- Second point"
  echo "EOF"
  exit 1
fi

echo -e "${GREEN}✅ Environment setup OK${NC}"
echo "   GEMINI_API_KEY: ••••••••${GEMINI_API_KEY: -8}"
echo "   TOPIC_FILE: $TOPIC_FILE"
echo ""

# Run the script
echo -e "${YELLOW}Running blog writer...${NC}"
echo ""

export GEMINI_API_KEY="$GEMINI_API_KEY"
export TOPIC_FILE="$TOPIC_FILE"
export HASHNODE_API_KEY=""  # Not required for testing
export HASHNODE_PUBLICATION_ID=""  # Not required for testing

node scripts/auto-blog-writer.js

echo ""
echo -e "${GREEN}✅ Test complete!${NC}"
echo ""
echo "Check your generated post:"
echo "  ls -la posts/"
echo ""
echo "View the published.json log:"
echo "  cat .published.json"
echo ""
