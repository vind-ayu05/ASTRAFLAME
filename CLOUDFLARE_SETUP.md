# ASTRAFLAME – Cloudflare Setup Guide

> [!IMPORTANT]
> This guide is for **production deployment only**. ASTRAFLAME is currently running locally. Complete this guide when you have a live domain and hosting provider.

---

## Prerequisites

- A registered domain name (e.g., `astraflame.example.com`)
- A Cloudflare account (free tier is sufficient for basic protection)
- Your backend server's public IP address

---

## Step 1 – Add Your Domain to Cloudflare

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Add a Site** → enter your domain → click **Add Site**
3. Select the **Free** plan (or higher for advanced WAF)
4. Cloudflare will scan your existing DNS records → review and confirm them

---

## Step 2 – Update DNS Records

Add or confirm these DNS records in Cloudflare:

| Type | Name | Value | Proxy Status |
|------|------|-------|--------------|
| A | `@` or `api` | `YOUR_BACKEND_IP` | ✅ **Proxied** (orange cloud) |
| A | `www` | `YOUR_FRONTEND_IP_OR_CNAME` | ✅ Proxied |
| CNAME | `www` | `yourfrontend.netlify.app` (if applicable) | ✅ Proxied |

> [!CAUTION]
> Never set DNS records to **DNS only** (grey cloud) for public-facing endpoints — this exposes your origin server IP directly.

---

## Step 3 – Update Your Nameservers

Cloudflare will provide two nameserver addresses. Update your domain registrar to use them:

```
ns1.cloudflare.com
ns2.cloudflare.com
```

DNS propagation typically takes 5–30 minutes.

---

## Step 4 – SSL/TLS Configuration

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Under **Edge Certificates**, enable:
   - **Always Use HTTPS** ✅
   - **HTTP Strict Transport Security (HSTS)** ✅ (max-age: 31536000, include subdomains)
   - **Minimum TLS Version**: TLS 1.2
   - **Opportunistic Encryption** ✅
   - **TLS 1.3** ✅

---

## Step 5 – Firewall / WAF Rules

Go to **Security** → **WAF**:

### Managed Rules (Cloudflare Managed Ruleset)
- Enable **Cloudflare Managed Ruleset** ✅
- Enable **Cloudflare OWASP Core Ruleset** ✅
- Set sensitivity to **Medium** initially

### Custom Rules (add these)

**Rule 1 – Block known bad bots:**
```
(cf.client.bot) and not (cf.verified_bot_category in {"Search Engine Crawler" "Monitoring & Analytics"})
Action: Block
```

**Rule 2 – Challenge suspicious countries (optional — adjust to your user base):**
```
(ip.geoip.country in {"XX" "YY"}) and (http.request.uri.path contains "/api/auth")
Action: Managed Challenge
```

**Rule 3 – Protect admin endpoints:**
```
(http.request.uri.path contains "/api/admin") and not (ip.src in {YOUR_ADMIN_IP/32})
Action: Block
```

**Rule 4 – Rate limit auth endpoint:**
```
(http.request.uri.path eq "/api/auth/login") and (rate(1m) > 20)
Action: Block for 1 hour
```

---

## Step 6 – Bot Protection

Go to **Security** → **Bots**:

- Enable **Bot Fight Mode** ✅ (Free)
- If on Pro+: Enable **Super Bot Fight Mode** → Block **Definitely Automated**

---

## Step 7 – DDoS Protection

Cloudflare's DDoS protection is **automatic** at all plan levels.

- Go to **Security** → **DDoS** → verify "Enabled" is shown
- Under **DDoS Override**, leave as **Default**
- During an active attack: temporarily set **Security Level** to **I'm Under Attack!**
  - `Security → Overview → Security Level → I'm Under Attack!`

---

## Step 8 – Caching Rules

Go to **Rules** → **Cache Rules** → **Create rule**:

**Rule 1 – Cache static frontend assets:**
```
URI Path matches: /*.js OR /*.css OR /*.png OR /*.woff2
Cache Level: Cache Everything
Edge TTL: 1 day
Browser TTL: 4 hours
```

**Rule 2 – Bypass cache for API:**
```
URI Path starts with: /api/
Cache Level: Bypass
```

---

## Step 9 – Security Level Settings

Go to **Security** → **Settings**:

| Setting | Recommended Value |
|---------|------------------|
| Security Level | **Medium** (normal), **High** (suspected attack), **I'm Under Attack!** (active DDoS) |
| Browser Integrity Check | **On** |
| Privacy Pass Support | **On** |
| Challenge Passage | 30 minutes |

---

## Step 10 – Origin IP Protection

After Cloudflare is **fully proxied**:

1. Run `scripts/setup-cloudflare-firewall.sh` on your Linux server, **OR**
2. Run `scripts/setup-cloudflare-firewall.ps1` on Windows Server

These scripts restrict inbound HTTP/HTTPS traffic to Cloudflare IPs only.

> [!WARNING]
> Do **NOT** run firewall scripts before Cloudflare proxying is verified. You will lose web access to your server.

**Verify Cloudflare is active first:**
```bash
curl -I https://yourdomain.com
# Look for: cf-ray: xxxxx  in response headers
```

---

## Step 11 – Update CORS in `.env`

Once deployed behind Cloudflare, update your backend `.env`:

```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
NODE_ENV=production
```

---

## Step 12 – Verify Setup

Checklist:
- [ ] Cloudflare shows domain as **Active**
- [ ] `curl -I https://yourdomain.com` shows `cf-ray` header
- [ ] Browser shows green padlock (HTTPS)
- [ ] `/api/health` returns 200 through Cloudflare
- [ ] Admin IP firewall rule blocks non-admin access to `/api/admin`
- [ ] `I'm Under Attack!` mode tested and reverted to **Medium**

---

## Cloudflare IP Ranges Reference

- IPv4: https://www.cloudflare.com/ips-v4
- IPv6: https://www.cloudflare.com/ips-v6

These are used by the firewall scripts to allow only Cloudflare traffic.
