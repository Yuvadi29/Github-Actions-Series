#!/bin/bash
   set -e

   # Check required variables
   if [ -z "$GITHUB_TOKEN" ]; then
     echo "❌ GITHUB_TOKEN is not set in your .env file"
     exit 1
   fi
   if [ -z "$REPO_URL" ]; then
     echo "❌ REPO_URL is not set in your .env file"
     exit 1
   fi

   RUNNER_NAME=${RUNNER_NAME:-"my-docker-runner"}
   RUNNER_LABELS=${RUNNER_LABELS:-"self-hosted,docker,linux"}

   echo "🔑 Getting registration token from GitHub..."
   REPO_PATH=$(echo "$REPO_URL" | sed 's|https://github.com/||')
   REG_TOKEN=$(curl -s -X POST \
     -H "Authorization: Bearer $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github+json" \
     "https://api.github.com/repos/${REPO_PATH}/actions/runners/registration-token" \
     | jq -r '.token')

    if [ -z "$REG_TOKEN" ] || [ "$REG_TOKEN" == "null" ]; then
     echo "❌ Could not get token. Check your GITHUB_TOKEN and REPO_URL."
     exit 1
   fi
   echo "✅ Got registration token"

   echo "⚙️  Registering runner with GitHub..."
   ./config.sh \
     --url "$REPO_URL" \
     --token "$REG_TOKEN" \
     --name "$RUNNER_NAME" \
     --labels "$RUNNER_LABELS" \
     --unattended \
     --replace
   echo "✅ Runner registered"

   # Auto-deregister when you stop the container (Ctrl+C)
   cleanup() {
     echo "🛑 Shutting down — removing runner from GitHub..."
     ./config.sh remove --token "$REG_TOKEN"
     echo "✅ Runner removed cleanly"
   }
   trap cleanup EXIT SIGTERM SIGINT

   echo "🚀 Runner is ONLINE — waiting for GitHub jobs..."
   ./run.sh
