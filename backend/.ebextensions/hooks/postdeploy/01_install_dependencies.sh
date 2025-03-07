#!/bin/bash

# Navigate to application root
cd /var/app/current

# Install PM2
npm install -g pm2

# Install gateway dependencies
cd /var/app/current/gateway
npm install --production
npm install http-proxy-middleware

# Install services dependencies
cd /var/app/current/services/auth-service
npm install --production

cd /var/app/current/services/transcription-service
npm install --production

cd /var/app/current/services/client-service
npm install --production

cd /var/app/current/services/chatbot-service
npm install --production
npm install pdf-parse

# Return to application root
cd /var/app/current

# Make sure our script exits with success
echo "Post-deployment dependencies installation completed"
exit 0