#!/bin/sh

set -eu

DOMAIN="${1:-presupuestofamiliar.rodriguezgalvan.es}"
EMAIL="${2:-}"
APP_DIR="${3:-/opt/presupuesto-familiar}"
NGINX_CONF="/etc/nginx/conf.d/presupuesto-familiar.conf"

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecuta este script como root."
  exit 1
fi

dnf update -y
dnf install -y dnf-plugins-core nginx curl git epel-release

dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

dnf install -y snapd
systemctl enable --now snapd.socket

if [ ! -e /snap ]; then
  ln -s /var/lib/snapd/snap /snap
fi

if systemctl is-enabled --quiet firewalld 2>/dev/null || systemctl is-active --quiet firewalld 2>/dev/null; then
  firewall-cmd --permanent --add-service=ssh
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
fi

mkdir -p "$APP_DIR"

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

nginx -t
systemctl enable --now nginx
systemctl reload nginx

if command -v setsebool >/dev/null 2>&1; then
  setsebool -P httpd_can_network_connect 1 || true
fi

if [ ! -x /usr/local/bin/certbot ] && [ ! -x /usr/bin/certbot ]; then
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/local/bin/certbot
fi

if [ -n "$EMAIL" ]; then
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
else
  echo "Certbot instalado. Ejecuta manualmente:"
  echo "certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

echo "Bootstrap completado."
echo "Carpeta de despliegue: $APP_DIR"
echo "Configuracion Nginx: $NGINX_CONF"
