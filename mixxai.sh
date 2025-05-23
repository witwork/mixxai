#!/bin/bash

# witai-install.sh
# Script to install WitAI Server on Ubuntu 24.04
# Run with: bash witai-install.sh

# Display colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting WitAI Server Installation ===${NC}"
echo "This script will install Docker, Docker Compose and deploy WitAI Server."

# Check if the script is run with root privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with root privileges (sudo).${NC}"
  echo "Try again: sudo bash $0"
  exit 1
fi

# Error handling function
handle_error() {
  echo -e "${RED}Error: $1${NC}"
  exit 1
}

# 1. Install Docker and Docker Compose
echo -e "\n${YELLOW}[1/5] Installing Docker and Docker Compose...${NC}"
apt-get update || handle_error "Cannot update packages"
apt-get install -y ca-certificates curl gnupg lsb-release || handle_error "Cannot install required packages"

# Add Docker GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg || handle_error "Cannot download Docker GPG key"

# Set up Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update || handle_error "Cannot update packages"
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || handle_error "Cannot install Docker"

# Install Docker Compose v2
apt-get install -y docker-compose-plugin || handle_error "Cannot install Docker Compose"

# Check if Docker and Docker Compose were installed successfully
docker --version || handle_error "Docker was not installed correctly"
docker compose version || handle_error "Docker Compose was not installed correctly"

# 2. Create directory and configuration files
echo -e "\n${YELLOW}[2/5] Creating directories and configuration files...${NC}"

# Create directory for WitAI Server
mkdir -p /opt/witai-server/public/uploads || handle_error "Cannot create directory"
cd /opt/witai-server || handle_error "Cannot change to directory"

# Create docker-compose.yml file
echo -e "${YELLOW}Creating docker-compose.yml file...${NC}"
cat > docker-compose.yml << 'EOF'
services:
  strapi:
    container_name: witai-server
    image: witworkapp/witai-server:latest
    restart: unless-stopped
    env_file: .env
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      NODE_ENV: production
    volumes:
      - ./public/uploads:/app/public/uploads
    ports:
      - '1337:1337'
    networks:
      - strapi
    depends_on:
      - postgres

  postgres:
    container_name: postgres
    image: postgres:14-alpine
    restart: unless-stopped
    env_file: .env
    environment:
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    networks:
      - strapi

volumes:
  postgres-data:

networks:
  strapi:
    driver: bridge
EOF

# Create .env file
echo -e "${YELLOW}Creating .env file...${NC}"
# Generate random tokens
RANDOM_PASSWORD=$(openssl rand -base64 12)
APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)

# Basic part of .env file
cat > .env << EOF
# Database
DATABASE_CLIENT=postgres
DATABASE_NAME=witai_db
DATABASE_USERNAME=witai_user
DATABASE_PASSWORD=$RANDOM_PASSWORD

# Server
HOST=0.0.0.0
PORT=1337

# Secrets (Generate your own secure values)
APP_KEYS=$APP_KEYS
API_TOKEN_SALT=$API_TOKEN_SALT
ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET
TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT
EOF

# Ask the user about SMTP configuration
echo -e "\n${YELLOW}Do you want to configure SMTP for sending emails? (y/n)${NC}"
read -p "Enter your choice: " setup_smtp

if [[ "$setup_smtp" == "y" || "$setup_smtp" == "Y" ]]; then
    echo -e "\n${YELLOW}Enter SMTP information:${NC}"
    read -p "SMTP Username: " smtp_username
    read -p "SMTP Password: " smtp_password
    read -p "SMTP Host (default: smtp.gmail.com): " smtp_host
    smtp_host=${smtp_host:-smtp.gmail.com}
    read -p "SMTP Port (default: 587): " smtp_port
    smtp_port=${smtp_port:-587}
    
    # Add SMTP configuration to .env file
    cat >> .env << EOF

# Email
SMTP_USERNAME=$smtp_username
SMTP_PASSWORD=$smtp_password
SMTP_HOST=$smtp_host
SMTP_PORT=$smtp_port
EOF
    echo -e "${GREEN}SMTP configuration successful!${NC}"
else
    # Add SMTP configuration as comments
    cat >> .env << EOF

# Email (Optional - Replace with your values)
# SMTP_USERNAME=your_smtp_username
# SMTP_PASSWORD=your_smtp_password
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
EOF
fi

# Ask the user about Apple Subscription configuration
echo -e "\n${YELLOW}Do you want to configure Apple Subscription? (y/n)${NC}"
read -p "Enter your choice: " setup_apple

if [[ "$setup_apple" == "y" || "$setup_apple" == "Y" ]]; then
    echo -e "\n${YELLOW}Enter Apple Subscription information:${NC}"
    read -p "Apple Shared Secret: " apple_secret
    
    # Add Apple Subscription configuration to .env file
    cat >> .env << EOF

# Apple Subscription
APPLE_SHARED_SECRET=$apple_secret
EOF
    echo -e "${GREEN}Apple Subscription configuration successful!${NC}"
else
    # Add Apple Subscription configuration as comments
    cat >> .env << EOF

# Apple Subscription (Optional - Replace with your values)
# APPLE_SHARED_SECRET=your_apple_shared_secret
EOF
fi

echo -e "${GREEN}The .env file has been created successfully!${NC}"
echo -e "${YELLOW}You can edit the .env file at: /opt/witai-server/.env${NC}"

# 3. Pull Docker image
echo -e "\n${YELLOW}[3/5] Pulling Docker images...${NC}"
docker compose pull || handle_error "Cannot pull Docker images"

# 4. Start containers
echo -e "\n${YELLOW}[4/5] Starting containers...${NC}"
docker compose up -d || handle_error "Cannot start containers"

# 5. Display logs and API URL
echo -e "\n${YELLOW}[5/5] Starting and displaying logs...${NC}"
echo -e "${GREEN}WitAI Server is starting. Please wait...${NC}"
sleep 10

# Display IP and URL information
HOST_IP=$(hostname -I | awk '{print $1}')
echo -e "\n${GREEN}=== WitAI Server has been installed successfully! ===${NC}"
echo -e "${GREEN}API URL: http://$HOST_IP:1337/api${NC}"
echo -e "${GREEN}Admin URL: http://$HOST_IP:1337/admin${NC}"
echo -e "${YELLOW}PostgreSQL Password: $RANDOM_PASSWORD${NC}"
echo -e "${YELLOW}Note: You should store this information in a secure place.${NC}"

# Display logs
echo -e "\n${YELLOW}Displaying logs (Press Ctrl+C to exit)...${NC}"
docker compose logs -f

exit 0