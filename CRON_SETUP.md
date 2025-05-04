# Bad Movie Engine - Cron Setup Guide

This guide explains how to set up automated syncing for the Bad Movie Engine using cron jobs.

## Overview

The system supports two sync modes:

1. **Full Sync**: Processes all posts and updates all movies in the database
   - Runs once daily at 2 AM
   - Takes longer but ensures complete data

2. **Delta Sync**: Only processes posts added or updated since the last run
   - Runs hourly on the hour
   - Quick and efficient for keeping the database updated with new content

## Setup Instructions

Follow these steps to set up the automated cron jobs:

1. Make sure you have all the required files in your `~/bad-movie-engine` directory:
   - All source code files
   - `cronSync.js` for scheduled syncing
   - `setup-cron.sh` script for setting up cron jobs

2. Make the setup script executable:
   ```bash
   chmod +x ~/bad-movie-engine/setup-cron.sh