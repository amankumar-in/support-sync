#!/bin/bash

# Set environment variables directory
ENV_DIR=/var/app/current

# Create the .env files for each service if they don't exist
mkdir -p $ENV_DIR/services/auth-service
mkdir -p $ENV_DIR/services/transcription-service
mkdir -p $ENV_DIR/services/client-service
mkdir -p $ENV_DIR/services/chatbot-service

# Exit successfully
echo "Pre-deployment environment setup completed"
exit 0
