#!/usr/bin/env bash
# ASTRAFLAME – Cloudflare IP Allowlist Firewall Script (Linux/UFW)
# ==============================================================================
# PURPOSE: After Cloudflare proxying is FULLY ACTIVE, restrict inbound
#          HTTP/HTTPS traffic to Cloudflare IPs only, preventing direct
#          origin-server access that bypasses WAF and DDoS protection.
#
# WARNING: DO NOT run this script before Cloudflare is fully proxied.
#          Running it prematurely will block all web traffic to your server.
#
# PREREQUISITES: ufw installed and SSH access preserved on port 22.
# TESTED ON: Ubuntu 20.04+, Debian 11+
# ==============================================================================

set -euo pipefail

echo "========================================================"
echo "  ASTRAFLAME – Cloudflare Firewall Setup"
echo "========================================================"
echo ""
echo "WARNING: Only run this AFTER Cloudflare proxy is active!"
echo "Verify with: curl -I https://yourdomain.com | grep cf-ray"
echo ""
read -rp "Have you verified Cloudflare is active? (yes/no): " CONFIRM
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Aborted. Run only when Cloudflare proxying is confirmed."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Enable UFW and set default policies
# ---------------------------------------------------------------------------
echo "[1/5] Setting default UFW policies..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# ---------------------------------------------------------------------------
# 2. Always preserve SSH access (adjust port if non-standard)
# ---------------------------------------------------------------------------
SSH_PORT="${SSH_PORT:-22}"
echo "[2/5] Allowing SSH on port ${SSH_PORT}..."
ufw allow "${SSH_PORT}/tcp" comment "SSH access"

# ---------------------------------------------------------------------------
# 3. Allow Cloudflare IPv4 ranges for HTTP (80) and HTTPS (443)
# ---------------------------------------------------------------------------
echo "[3/5] Allowing Cloudflare IPv4 ranges..."
CF_IPV4=(
  "173.245.48.0/20"
  "103.21.244.0/22"
  "103.22.200.0/22"
  "103.31.4.0/22"
  "141.101.64.0/18"
  "108.162.192.0/18"
  "190.93.240.0/20"
  "188.114.96.0/20"
  "197.234.240.0/22"
  "198.41.128.0/17"
  "162.158.0.0/15"
  "104.16.0.0/13"
  "104.24.0.0/14"
  "172.64.0.0/13"
  "131.0.72.0/22"
)

for ip in "${CF_IPV4[@]}"; do
  ufw allow from "${ip}" to any port 80 proto tcp comment "Cloudflare IPv4"
  ufw allow from "${ip}" to any port 443 proto tcp comment "Cloudflare IPv4"
done

# ---------------------------------------------------------------------------
# 4. Allow Cloudflare IPv6 ranges (if IPv6 is configured on this server)
# ---------------------------------------------------------------------------
echo "[4/5] Allowing Cloudflare IPv6 ranges (if applicable)..."
CF_IPV6=(
  "2400:cb00::/32"
  "2606:4700::/32"
  "2803:f800::/32"
  "2405:b500::/32"
  "2405:8100::/32"
  "2a06:98c0::/29"
  "2c0f:f248::/32"
)

for ip in "${CF_IPV6[@]}"; do
  ufw allow from "${ip}" to any port 80 proto tcp comment "Cloudflare IPv6" 2>/dev/null || true
  ufw allow from "${ip}" to any port 443 proto tcp comment "Cloudflare IPv6" 2>/dev/null || true
done

# ---------------------------------------------------------------------------
# 5. Enable UFW
# ---------------------------------------------------------------------------
echo "[5/5] Enabling UFW..."
ufw --force enable

echo ""
echo "========================================================"
echo "  Cloudflare firewall rules applied successfully!"
echo "  HTTP/HTTPS restricted to Cloudflare IPs only."
echo "  SSH port ${SSH_PORT} remains open."
echo "========================================================"
echo ""
echo "To verify:"
echo "  sudo ufw status numbered"
echo ""
echo "To REVERT (emergency):"
echo "  sudo ufw --force reset && sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable"
