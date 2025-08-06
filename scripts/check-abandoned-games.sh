#!/bin/bash

# Script to check for abandoned games
# This can be set up as a cron job to run periodically

# Base URL of your Nuxt application (update for production)
BASE_URL="http://localhost:3000"

# Call the cron endpoint
curl -X POST "${BASE_URL}/api/cron/check-abandoned-games"

# Log completion
echo "$(date): Abandoned games check completed"
