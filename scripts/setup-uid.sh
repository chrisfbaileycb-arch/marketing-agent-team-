#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/setup-uid.sh
# One-time setup: replace the OWNER_UID placeholder in firestore.rules with
# your real Firebase Auth UID.
#
# Usage:
#   bash scripts/setup-uid.sh YOUR_FIREBASE_UID
#
# Find your UID on the Profile page of the app after signing in, or in the
# Firebase console → Authentication → Users.
# ─────────────────────────────────────────────────────────────────────────────
set -e

UID_ARG="$1"
if [ -z "$UID_ARG" ]; then
  echo "Usage: bash scripts/setup-uid.sh YOUR_FIREBASE_UID"
  echo ""
  echo "Find your UID in the Firebase console → Authentication → Users,"
  echo "or on the Profile page of the app after signing in."
  exit 1
fi

RULES_FILE="firestore.rules"
if ! grep -q "OWNER_UID" "$RULES_FILE"; then
  echo "✓ $RULES_FILE already has a real UID (no OWNER_UID placeholder found)."
  exit 0
fi

# Update the rules file
if sed --version 2>&1 | grep -q GNU; then
  sed -i "s/\"OWNER_UID\"/\"$UID_ARG\"/g" "$RULES_FILE"
else
  sed -i '' "s/\"OWNER_UID\"/\"$UID_ARG\"/g" "$RULES_FILE"
fi

echo "✓ firestore.rules updated with UID: $UID_ARG"
echo ""
echo "Also set OWNER_UID=$UID_ARG in functions/.env"
echo "Then deploy rules: firebase deploy --only firestore:rules"
