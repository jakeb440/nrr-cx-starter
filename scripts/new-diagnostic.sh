#!/bin/bash
# Usage: ./scripts/new-diagnostic.sh <client> <product>
# Example: ./scripts/new-diagnostic.sh oracle enhanced
#
# Scaffolds a new NRR CX diagnostic from the matching template.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

usage() {
  echo -e "${BOLD}Usage:${RESET} ./scripts/new-diagnostic.sh <client> <product>"
  echo ""
  echo "  client   Lowercase client name (e.g. oracle, crowdstrike, t-mobile)"
  echo "  product  One of: basic, enhanced, assessment"
  echo ""
  echo -e "${BOLD}Examples:${RESET}"
  echo "  ./scripts/new-diagnostic.sh oracle enhanced"
  echo "  ./scripts/new-diagnostic.sh crowdstrike basic"
  echo "  ./scripts/new-diagnostic.sh servicenow assessment"
  exit 1
}

if [[ $# -ne 2 ]]; then
  echo -e "${RED}Error:${RESET} Expected 2 arguments, got $#."
  usage
fi

CLIENT="$1"
PRODUCT="$2"

# Validate client name (lowercase, hyphens allowed, no spaces)
if [[ ! "$CLIENT" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo -e "${RED}Error:${RESET} Client name must be lowercase alphanumeric with optional hyphens."
  echo "  Got: '$CLIENT'"
  exit 1
fi

# Validate product type
if [[ "$PRODUCT" != "basic" && "$PRODUCT" != "enhanced" && "$PRODUCT" != "assessment" ]]; then
  echo -e "${RED}Error:${RESET} Product must be one of: basic, enhanced, assessment."
  echo "  Got: '$PRODUCT'"
  exit 1
fi

# Construct output name following naming convention
if [[ "$PRODUCT" == "assessment" ]]; then
  NAME="${CLIENT}-ops-assessment"
else
  NAME="nrr-cx-${CLIENT}-${PRODUCT}"
fi

TEMPLATE_DIR="$ROOT_DIR/templates/$PRODUCT"
OUTPUT_DIR="$ROOT_DIR/output/$NAME"

# Verify template exists
if [[ ! -d "$TEMPLATE_DIR" ]]; then
  echo -e "${RED}Error:${RESET} Template directory not found: $TEMPLATE_DIR"
  echo "  Available templates:"
  ls -1 "$ROOT_DIR/templates/" 2>/dev/null | sed 's/^/    /'
  exit 1
fi

# Check output doesn't already exist
if [[ -d "$OUTPUT_DIR" ]]; then
  echo -e "${RED}Error:${RESET} Output directory already exists: $OUTPUT_DIR"
  echo "  Remove it first if you want to start fresh:"
  echo "    rm -rf $OUTPUT_DIR"
  exit 1
fi

echo -e "${CYAN}Scaffolding ${BOLD}$NAME${RESET}${CYAN} from ${PRODUCT} template...${RESET}"
echo ""

mkdir -p "$ROOT_DIR/output"
cp -R "$TEMPLATE_DIR" "$OUTPUT_DIR"

# Update package.json name field
if [[ -f "$OUTPUT_DIR/package.json" ]]; then
  if command -v jq &>/dev/null; then
    jq --arg name "$NAME" '.name = $name' "$OUTPUT_DIR/package.json" > "$OUTPUT_DIR/package.json.tmp"
    mv "$OUTPUT_DIR/package.json.tmp" "$OUTPUT_DIR/package.json"
  else
    sed -i.bak "s/\"name\": \"[^\"]*\"/\"name\": \"$NAME\"/" "$OUTPUT_DIR/package.json"
    rm -f "$OUTPUT_DIR/package.json.bak"
  fi
fi

echo -e "${GREEN}✓${RESET} Created ${BOLD}output/$NAME/${RESET}"
echo ""
echo -e "${BOLD}Next steps:${RESET}"
echo ""
echo "  1. Open the project in Cursor:"
echo -e "     ${CYAN}cd $OUTPUT_DIR${RESET}"
echo ""
echo "  2. Edit the client data file with real data:"
echo -e "     ${CYAN}public/data/client-data.json${RESET}"
echo ""
echo "  3. Install dependencies and preview:"
echo -e "     ${CYAN}npm install && npm run dev${RESET}"
echo ""
echo "  4. When ready, deploy:"
echo -e "     ${CYAN}./scripts/deploy.sh $CLIENT $PRODUCT${RESET}"
echo ""
echo -e "  Or tell Cursor: ${BOLD}\"Generate an NRR CX $PRODUCT for ${CLIENT^}\"${RESET}"
echo "  and it will populate client-data.json using the generation rules."
