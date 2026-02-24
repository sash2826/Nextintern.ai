#!/bin/bash
# ============================================================
# NextIntern.ai — Oracle Cloud Server Setup Script
# Run this ONCE on a fresh Ubuntu 22.04/24.04 ARM instance.
# Works on Oracle Cloud Always Free Ampere A1 instances.
# Usage: bash deploy/setup-ec2.sh
# ============================================================
set -euo pipefail

echo "🚀 NextIntern.ai — Server Setup (Oracle Cloud)"
echo "================================================"

# ── Update system ──────────────────────────────────────────
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ── Install Docker ─────────────────────────────────────────
echo "🐳 Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# ── Configure system limits for OpenSearch ─────────────────
echo "⚙️ Configuring system limits for OpenSearch..."
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -w vm.max_map_count=262144

# ── Open firewall ports (Oracle Cloud iptables) ────────────
echo "🔥 Configuring firewall (iptables)..."
# Oracle Cloud Ubuntu images have iptables rules that block ports by default
# We need to explicitly allow HTTP, HTTPS
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 7 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save || sudo sh -c "iptables-save > /etc/iptables/rules.v4"

# ── Create application directory ───────────────────────────
echo "📁 Creating application directory..."
sudo mkdir -p /opt/nextintern
sudo chown $USER:$USER /opt/nextintern

# ── Enable Docker on boot ─────────────────────────────────
sudo systemctl enable docker
sudo systemctl start docker

echo ""
echo "✅ Server setup complete!"
echo ""
echo "⚠️  IMPORTANT: Log out and back in for docker group to take effect:"
echo "    exit"
echo "    ssh -i <key> ubuntu@<IP>"
echo ""
echo "Then:"
echo "  1. Clone repo:   git clone <your-repo-url> /opt/nextintern"
echo "  2. Copy env:     cp /opt/nextintern/.env.production /opt/nextintern/.env"
echo "  3. Edit env:     nano /opt/nextintern/.env"
echo "  4. Deploy:       cd /opt/nextintern && bash deploy/deploy.sh"
