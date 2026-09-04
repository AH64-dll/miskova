#!/usr/bin/env bash
# Round capture harness: loads /scene in headless Chrome, captures the labeled
# screenshot set reviewers score, plus exercises interaction.
# Usage: ./scripts/capture_round.sh <round-name> [port]
set -euo pipefail
ROUND="${1:?round name required}"
PORT="${2:-3001}"
OUT="/home/amr/Documents/miskova/reference/bottle-reviews/$ROUND"
mkdir -p "$OUT"

node - <<EOF
const { execSync } = require('child_process');
EOF

echo "Captures for round $ROUND go to $OUT"
echo "NOTE: driven by the lead agent via the browser tool — this file documents the set:"
echo "  front.webp          - load, settle 4s, full viewport"
echo "  label.webp          - zoomed close-up of label region"
echo "  slosh.webp          - 300ms after __fluidKick(3,0.5,0)"
echo "  rotation-25.webp    - scrolled to 25% progress"
echo "  rotation-75.webp    - scrolled to 75% progress"
echo "  scores.json         - written by lead from 5 reviewer JSON replies"
