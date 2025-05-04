#!/bin/bash
# File: ~/bad-movie-engine/setup-cron.sh
# Script to set up cron jobs for Bad Movie Engine

# Define paths
APP_DIR="$HOME/bad-movie-engine"
LOG_DIR="$APP_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Get current user
CURRENT_USER=$(whoami)

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
  echo "Error: Application directory does not exist: $APP_DIR"
  exit 1
fi

# Check if required files exist
if [ ! -f "$APP_DIR/cronSync.js" ]; then
  echo "Error: cronSync.js not found in $APP_DIR"
  exit 1
fi

echo "Setting up cron jobs for Bad Movie Engine..."
echo "App directory: $APP_DIR"
echo "Log directory: $LOG_DIR"
echo ""

# Create cron entries
FULL_SYNC_CRON="0 2 * * * cd $APP_DIR && /usr/bin/node cronSync.js full >> $LOG_DIR/full_sync_\$(date +\%Y\%m\%d).log 2>&1"
DELTA_SYNC_CRON="0 * * * * cd $APP_DIR && /usr/bin/node cronSync.js delta >> $LOG_DIR/delta_sync_\$(date +\%Y\%m\%d).log 2>&1"

echo "Cron jobs to be added:"
echo "1. Full sync (daily at 2 AM):"
echo "   $FULL_SYNC_CRON"
echo ""
echo "2. Delta sync (hourly):"
echo "   $DELTA_SYNC_CRON"
echo ""

# Ask for confirmation
read -p "Do you want to add these cron jobs? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Aborted. No changes were made."
  exit 0
fi

# Add cron jobs
(crontab -l 2>/dev/null || echo "") | grep -v "$APP_DIR.*cronSync.js" | { cat; echo "$FULL_SYNC_CRON"; echo "$DELTA_SYNC_CRON"; } | crontab -

echo "Cron jobs added successfully."
echo "You can view the cron jobs with: crontab -l"
echo "Logs will be saved to: $LOG_DIR"