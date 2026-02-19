#!/bin/bash
# Usage: ./scripts/deploy.sh <client> <product>
# Example: ./scripts/deploy.sh oracle enhanced
#
# Builds and deploys a diagnostic to Vercel, then updates the central
# diagnostics.json in the nrr-cx-starter GitHub repo so the portal
# automatically shows the new entry.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

GITHUB_REPO="jakeb440/nrr-cx-starter"
REGISTRY_PATH="diagnostics.json"

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

if [[ "$PRODUCT" == "agentic" ]]; then
  NAME="agentic-cx-${CLIENT}"
else
  NAME="nrr-cx-${CLIENT}-${PRODUCT}"
fi

OUTPUT_DIR="$ROOT_DIR/output/$NAME"

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

echo -e "${BOLD}[1/4]${RESET} Installing dependencies..."
(cd "$OUTPUT_DIR" && npm install)
echo -e "${GREEN}✓${RESET} Dependencies installed"
echo ""

echo -e "${BOLD}[2/4]${RESET} Building static export..."
(cd "$OUTPUT_DIR" && npm run build)
echo -e "${GREEN}✓${RESET} Build complete (output in out/)"
echo ""

echo -e "${BOLD}[3/4]${RESET} Deploying to Vercel..."
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

if [[ -z "$DEPLOYED_URL" ]]; then
  echo ""
  read -rp "$(echo -e "${CYAN}Enter the deployed URL${RESET} (or press Enter to skip): ")" DEPLOYED_URL
fi

if [[ -z "$DEPLOYED_URL" ]]; then
  echo ""
  echo -e "${YELLOW}Skipping registry update.${RESET} Run this script again or manually update diagnostics.json."
  exit 0
fi

# ── Step 4: Update central diagnostics.json via GitHub API ──

echo ""
echo -e "${BOLD}[4/4]${RESET} Updating central diagnostics registry..."

read -rp "$(echo -e "${CYAN}NRR value${RESET} (e.g. 115%, or Enter to skip): ")" NRR_VALUE
read -rp "$(echo -e "${CYAN}Sector${RESET} (e.g. Cloud Infrastructure, or Enter to skip): ")" SECTOR
read -rp "$(echo -e "${CYAN}Short description${RESET} (or Enter to skip): ")" DESCRIPTION

NRR_VALUE="${NRR_VALUE:-}"
SECTOR="${SECTOR:-}"
DESCRIPTION="${DESCRIPTION:-}"
TODAY=$(date +%Y-%m-%d)
AUTHOR=$(whoami)

# Also update local diagnostics.json
REGISTRY="$ROOT_DIR/diagnostics.json"
NEW_ENTRY=$(cat <<ENTRYEOF
{
  "client": "$CLIENT",
  "product": "$PRODUCT",
  "repo": "",
  "url": "$DEPLOYED_URL",
  "created": "$TODAY",
  "author": "$AUTHOR",
  "status": "deployed",
  "nrr": "$NRR_VALUE",
  "sector": "$SECTOR",
  "description": "$DESCRIPTION"
}
ENTRYEOF
)

if [[ -f "$REGISTRY" ]]; then
  if command -v jq &>/dev/null; then
    jq --argjson entry "$NEW_ENTRY" '. += [$entry]' "$REGISTRY" > "$REGISTRY.tmp"
    mv "$REGISTRY.tmp" "$REGISTRY"
  else
    sed -i.bak '$ s/]$//' "$REGISTRY"
    echo "  ,$NEW_ENTRY" >> "$REGISTRY"
    echo "]" >> "$REGISTRY"
    rm -f "$REGISTRY.bak"
  fi
  echo -e "${GREEN}✓${RESET} Updated local diagnostics.json"
fi

# Push to GitHub repo via API so the portal picks it up automatically
GH_TOKEN=""

if command -v git &>/dev/null; then
  GH_TOKEN=$(git credential-osxkeychain get <<CREDEOF 2>/dev/null | grep "^password=" | cut -d= -f2
protocol=https
host=github.com
CREDEOF
  ) || true
fi

if [[ -z "$GH_TOKEN" ]]; then
  echo -e "${YELLOW}No GitHub token found.${RESET} Skipping remote registry update."
  echo "  The portal will not show this diagnostic until diagnostics.json is updated in the repo."
  echo "  Push manually: cd $ROOT_DIR && git add diagnostics.json && git commit -m 'Add $NAME' && git push"
else
  echo "Pushing to ${GITHUB_REPO}..."

  # Fetch current file content and SHA
  RESPONSE=$(curl -s -H "Authorization: token $GH_TOKEN" \
    "https://api.github.com/repos/${GITHUB_REPO}/contents/${REGISTRY_PATH}")

  FILE_SHA=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sha',''))" 2>/dev/null || echo "")
  CURRENT_CONTENT=$(echo "$RESPONSE" | python3 -c "
import sys,json,base64
data = json.load(sys.stdin)
print(base64.b64decode(data.get('content','')).decode('utf-8'))
" 2>/dev/null || echo "[]")

  # Add the new entry
  UPDATED_CONTENT=$(echo "$CURRENT_CONTENT" | python3 -c "
import sys, json
current = json.load(sys.stdin)
new_entry = json.loads('''$NEW_ENTRY''')
current.append(new_entry)
print(json.dumps(current, indent=2))
")

  ENCODED=$(echo "$UPDATED_CONTENT" | python3 -c "import sys,base64; print(base64.b64encode(sys.stdin.buffer.read()).decode())")

  UPDATE_RESULT=$(curl -s -X PUT \
    -H "Authorization: token $GH_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${GITHUB_REPO}/contents/${REGISTRY_PATH}" \
    -d "{
      \"message\": \"feat: add ${NAME} to diagnostics registry\",
      \"content\": \"${ENCODED}\",
      \"sha\": \"${FILE_SHA}\"
    }")

  COMMIT_SHA=$(echo "$UPDATE_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('commit',{}).get('sha','ERROR'))" 2>/dev/null || echo "ERROR")

  if [[ "$COMMIT_SHA" != "ERROR" && -n "$COMMIT_SHA" ]]; then
    echo -e "${GREEN}✓${RESET} Pushed to GitHub (commit: ${COMMIT_SHA:0:7})"
    echo -e "${GREEN}✓${RESET} Portal will show the new diagnostic automatically"
  else
    echo -e "${YELLOW}Failed to push to GitHub.${RESET} Update manually."
    echo "  cd $ROOT_DIR && git add diagnostics.json && git commit -m 'Add $NAME' && git push"
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}Deploy complete!${RESET}"
echo -e "  URL:      ${BOLD}$DEPLOYED_URL${RESET}"
echo -e "  Portal:   ${BOLD}https://portal-agentic-customer.vercel.app${RESET}"
