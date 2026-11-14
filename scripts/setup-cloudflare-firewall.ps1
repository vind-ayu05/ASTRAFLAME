# ASTRAFLAME – Cloudflare IP Allowlist Firewall Script (Windows Server)
# ==============================================================================
# PURPOSE: After Cloudflare proxying is FULLY ACTIVE, restrict inbound
#          HTTP/HTTPS traffic to Cloudflare IPs only.
#
# WARNING: DO NOT run before Cloudflare is fully proxied!
#          Run as Administrator.
#
# USAGE: Right-click → Run as Administrator, OR:
#   powershell -ExecutionPolicy Bypass -File setup-cloudflare-firewall.ps1
# ==============================================================================

#Requires -RunAsAdministrator

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  ASTRAFLAME - Cloudflare Firewall Setup (Windows)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: Only run AFTER Cloudflare proxy is active!" -ForegroundColor Yellow
Write-Host "Verify with: curl -I https://yourdomain.com | Select-String cf-ray" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Have you verified Cloudflare is active? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# Cloudflare IP ranges
# ---------------------------------------------------------------------------
$cfIPv4 = @(
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22"
)

$cfIPv6 = @(
    "2400:cb00::/32",
    "2606:4700::/32",
    "2803:f800::/32",
    "2405:b500::/32",
    "2405:8100::/32",
    "2a06:98c0::/29",
    "2c0f:f248::/32"
)

# ---------------------------------------------------------------------------
# Remove old Cloudflare rules (clean start)
# ---------------------------------------------------------------------------
Write-Host "[1/4] Removing old Cloudflare firewall rules..." -ForegroundColor Green
Get-NetFirewallRule -DisplayName "ASTRAFLAME-CF-*" -ErrorAction SilentlyContinue | Remove-NetFirewallRule

# ---------------------------------------------------------------------------
# Allow Cloudflare IPv4 for HTTP + HTTPS
# ---------------------------------------------------------------------------
Write-Host "[2/4] Adding Cloudflare IPv4 inbound rules..." -ForegroundColor Green

New-NetFirewallRule `
    -DisplayName "ASTRAFLAME-CF-IPv4-HTTP-HTTPS" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 80,443 `
    -RemoteAddress $cfIPv4 `
    -Profile Any `
    -Description "Allow HTTP/HTTPS from Cloudflare IPv4 ranges only" | Out-Null

Write-Host "  Added Cloudflare IPv4 allow rule (ports 80, 443)"

# ---------------------------------------------------------------------------
# Allow Cloudflare IPv6 for HTTP + HTTPS
# ---------------------------------------------------------------------------
Write-Host "[3/4] Adding Cloudflare IPv6 inbound rules..." -ForegroundColor Green

try {
    New-NetFirewallRule `
        -DisplayName "ASTRAFLAME-CF-IPv6-HTTP-HTTPS" `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 80,443 `
        -RemoteAddress $cfIPv6 `
        -Profile Any `
        -Description "Allow HTTP/HTTPS from Cloudflare IPv6 ranges only" | Out-Null
    Write-Host "  Added Cloudflare IPv6 allow rule (ports 80, 443)"
} catch {
    Write-Host "  IPv6 rule skipped (IPv6 may not be configured)" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# Block all other HTTP/HTTPS inbound traffic
# ---------------------------------------------------------------------------
Write-Host "[4/4] Adding block rule for non-Cloudflare HTTP/HTTPS traffic..." -ForegroundColor Green

New-NetFirewallRule `
    -DisplayName "ASTRAFLAME-CF-Block-Direct-HTTP-HTTPS" `
    -Direction Inbound `
    -Action Block `
    -Protocol TCP `
    -LocalPort 80,443 `
    -RemoteAddress Any `
    -Profile Any `
    -Description "Block direct HTTP/HTTPS access — force through Cloudflare" | Out-Null

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Cloudflare firewall rules applied successfully!" -ForegroundColor Green
Write-Host "  HTTP/HTTPS restricted to Cloudflare IPs only." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To verify rules:" -ForegroundColor White
Write-Host "  Get-NetFirewallRule -DisplayName 'ASTRAFLAME-CF-*' | Select DisplayName, Enabled, Action" -ForegroundColor Gray
Write-Host ""
Write-Host "To REVERT (emergency):" -ForegroundColor Yellow
Write-Host "  Get-NetFirewallRule -DisplayName 'ASTRAFLAME-CF-*' | Remove-NetFirewallRule" -ForegroundColor Gray
