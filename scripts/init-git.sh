#!/bin/bash

# Initialize the local git repository
git init

# Add the remote origin using your provided GitHub URL
git remote add origin https://github.com/chrisfbaileycb-arch/affiliate-agent.git

# Stage all files for the initial commit
git add .

# Create the initial commit
git commit -m "feat: initialize affiliate agent platform with ci/cd pipeline"

# Set the upstream branch and push to GitHub
git branch -M main
git push -u origin main