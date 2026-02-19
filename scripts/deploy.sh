#!/bin/bash
# Usage: ./scripts/deploy.sh <client> <product>
# Example: ./scripts/deploy.sh oracle enhanced
#
# Builds and deploys a diagnostic to Vercel, then updates diagnostics.json.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
RESET='\033[0m'

usage() {
  echo -e "${BOLD}Usage:${RESET} ./scripts/deploy.sh <client> <product>"
  echo ""
  echo "  client   Lowercase client name (e.g. oracle, crowdstrike)"
  echo "  product  One of: basic, enhanced, agentic"
  echo ""
  echo -e "${BOLD}Examples:${RESET}"
  echo "  ./scripts/deploy.sh oracle enhanced"
  echo "  ./scripts/deploy.sh crowdstrike basic"
  exit 1
}

if [[ $# -ne 2 ]]; then
  echo -e "${RED}Error:${RESET} Expected 2 arguments, got $#."
  usage
fi

CLIENT="$1"
PRODUCT="$2"

if [[ "$PRODUCT" != "basic" && "$PRODUCT" != "enhanced" && "$PRODUCT" != "agentic" ]]; then
  echo -e "${RED}Error:${RESET} Product must be one of: basic, enhanced, agentic."
  exit 1
fi

# Construct directory name
if [[ "$PRODUCT" == "agentic" ]]; then
  NAME="agentic-cx-${CLIENT}"
else
  NAME="nrr-cx-${CLIENT}-${PRODUCT}"
fi

OUTPUT_DIR="$ROOT_DIR/output/$NAME"

# Validate the output directory exists
if [[ ! -d "$OUTPUT_DIR" ]]; then
  echo -e "${RED}Error:${RESET} Output directory not found: output/$NAME/"
  echo "  Run new-diagnostic.sh first:"
  echo "    ./scripts/new-diagnostic.sh $CLIENT $PRODUCT"
  exit 1
fi

if [[ ! -f "$OUTPUT_DIR/package.json" ]]; then
  echo -e "${RED}Error:${RESET} No package.json found in output/$NAME/"
  exit 1
fi

echo -e "${CYAN}Building ${BOLD}$NAME${RESET}${CYAN}...${RESET}"
echo ""

# Install dependencies
echo -e "${BOLD}[1/3]${RESET} Installing dependencies..."
(cd "$OUTPUT_DIR" && npm install)
echo -e "${GREEN}✓${RESET} Dependencies installed"
echo ""

# Build the static export
echo -e "${BOLD}[2/3]${RESET} Building static export..."
(cd "$OUTPUT_DIR" && npm run build)
echo -e "${GREEN}✓${RESET} Build complete (output in out/)"
echo ""

# Deploy to Vercel
echo -e "${BOLD}[3/3]${RESET} Deploying to Vercel..."
echo ""

DEPLOYED_URL=""

if command -v npx &>/dev/null; then
  echo -e "${YELLOW}Running:${RESET} npx vercel --prod"
  echo "  (Follow prompts if this is a new project)"
  echo ""

  if DEPLOYED_URL=$(cd "$OUTPUT_DIR" && npx vercel --prod 2>&1 | tee /dev/tty | grep -oE 'https://[^ ]+' | tail -1); then
    echo ""
    echo -e "${GREEN}✓${RESET} Deployed to: ${BOLD}$DEPLOYED_URL${RESET}"
  else
    echo ""
    echo -e "${YELLOW}Could not auto-detect URL.${RESET}"
  fi
else
  echo -e "${YELLOW}npx not found.${RESET} Deploy manually:"
  echo "  cd $OUTPUT_DIR && npx vercel --prod"
fi

# Prompt for URL if we didn't capture it
if [[ -z "$DEPLOYED_URL" ]]; then
  echo ""
  read -rp "$(echo -e "${CYAN}Enter the deployed URL${RESET} (or press Enter to skip): ")" DEPLOYED_URL
fi

if [[ -z "$DEPLOYED_URL" ]]; then
  echo ""
  echo -e "${YELLOW}Skipping registry update.${RESET} Run this script again or manually update diagnostics.json."
  exit 0
fi

# Update diagnostics.json
REGISTRY="$ROOT_DIR/diagnostics.json"
TODAY=$(date +%Y-%m-%d)

echo ""
echo -e "Updating ${BOLD}diagnostics.json${RESET}..."

# Prompt for optional fields
read -rp "$(echo -e "${CYAN}NRR value${RESET} (e.g. 115%, or Enter to skip): ")" NRR_VALUE
read -rp "$(echo -e "${CYAN}Sector${RESET} (e.g. Cloud Infrastructure, or Enter to skip): ")" SECTOR
read -rp "$(echo -e "${CYAN}Short description${RESET} (or Enter to skip): ")" DESCRIPTION
read -rp "$(echo -e "${CYAN}GitHub repo${RESET} (e.g. jakeb440/$NAME, or Enter to skip): ")" REPO

NRR_VALUE="${NRR_VALUE:-}"
SECTOR="${SECTOR:-}"
DESCRIPTION="${DESCRIPTION:-}"
REPO="${REPO:-}"

NEW_ENTRY=$(cat <<EOF
{
  "client": "$CLIENT",
  "product": "$PRODUCT",
  "repo": "$REPO",
  "url": "$DEPLOYED_URL",
  "created": "$TODAY",
  "author": "$(whoami)",
  "status": "deployed",
  "nrr": "$NRR_VALUE",
  "sector": "$SECTOR",
  "description": "$DESCRIPTION"
}
EOF
)

if command -v jq &>/dev/null; then
  jq --argjson entry "$NEW_ENTRY" '. += [$entry]' "$REGISTRY" > "$REGISTRY.tmp"
  mv "$REGISTRY.tmp" "$REGISTRY"
else
  # Fallback: simple JSON array append without jq
  # Remove trailing ] and whitespace, append new entry
  sed -i.bak '$ s/]$//' "$REGISTRY"
  echo "  ,$NEW_ENTRY" >> "$REGISTRY"
  echo "]" >> "$REGISTRY"
  rm -f "$REGISTRY.bak"
fi

echo -e "${GREEN}✓${RESET} Added ${BOLD}$NAME${RESET} to diagnostics.json"
echo ""
echo -e "${GREEN}${BOLD}Deploy complete!${RESET}"
echo -e "  URL:      ${BOLD}$DEPLOYED_URL${RESET}"
echo -e "  Registry: diagnostics.json updated"
