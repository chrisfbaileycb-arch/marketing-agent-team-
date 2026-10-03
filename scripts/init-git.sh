#!/bin/bash
# This script is kept for reference only — the repo is already initialized.
# To clone and set up fresh:
#
#   git clone https://github.com/chrisfbaileycb-arch/marketing-agent-team-.git
#   cd marketing-agent-team-
#   npm install
#   cd functions && npm install && cd ..
#   cp functions/.env.example functions/.env
#   # Fill in functions/.env, then:
#   bash scripts/setup-uid.sh YOUR_FIREBASE_UID
#   firebase deploy --only firestore:rules,firestore:indexes,functions
