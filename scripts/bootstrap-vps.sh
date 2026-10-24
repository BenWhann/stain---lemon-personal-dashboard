#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 22.04/24.04 Hostinger VPS. Run as root:
#   curl -fsSL <raw link to this file> -o bootstrap-vps.sh   (or scp it over)
#   sudo bash bootstrap-vps.sh "ssh-ed25519 AAAA... github-deploy"
# The argument is the PUBLIC half of the key GitHub Actions will use to log in.
set -euo pipefail

DEPLOY_KEY="${1:?pass the deploy public key as the first argument}"
APP_DIR=/opt/lemon-stain
DEPLOY_USER=deploy

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)." >&2; exit 1; }

echo "==> Updating packages and enabling automatic security updates"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl ufw fail2ban unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Installing Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> Swap (helps a 1-2 GB VPS ride out memory spikes)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Firewall: SSH, HTTP, HTTPS (and HTTP/3)"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "==> Deploy user"
id "$DEPLOY_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
grep -qxF "$DEPLOY_KEY" "/home/$DEPLOY_USER/.ssh/authorized_keys" 2>/dev/null || echo "$DEPLOY_KEY" >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

echo "==> App directory $APP_DIR"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/scripts" "$APP_DIR/backups"

echo "==> Nightly database backup at 03:15"
cat > /etc/cron.d/lemon-stain-backup <<CRON
15 3 * * * $DEPLOY_USER cd $APP_DIR && ./scripts/backup.sh >> $APP_DIR/backups/backup.log 2>&1
CRON
chmod 644 /etc/cron.d/lemon-stain-backup

cat <<DONE

Done. Next steps:
  1. As $DEPLOY_USER, create $APP_DIR/.env from .env.example (DOMAIN, ADMIN_USERNAME, ADMIN_PASSWORD).
       sudo -u $DEPLOY_USER nano $APP_DIR/.env && sudo chmod 600 $APP_DIR/.env
  2. Point your domain's A record at this server.
  3. Add the GitHub repository secrets (see README) and push to main.
DONE
