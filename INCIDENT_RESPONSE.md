# ASTRAFLAME – Incident Response Playbook

> [!CAUTION]
> This is an operational security document. Keep it accessible during incidents. Do not commit secrets or internal IPs into this file.

---

## Section 1 – Signs of an Active Attack

Watch for these indicators in logs and monitoring:

| Indicator | What It Means |
|-----------|--------------|
| Flood of `[SECURITY] [RATE_LIMIT_EXCEEDED]` log entries | High request volume — potential DDoS or abuse |
| Many `[SECURITY] [SUSPICIOUS_PAYLOAD]` with reason `brute_force_login` | Credential stuffing / brute-force attack on login |
| Many `[SECURITY] [SUSPICIOUS_PAYLOAD]` with reason `scanner_404_rate` | Automated scanner probing for vulnerabilities |
| `[SECURITY] [SUSPICIOUS_PAYLOAD]` with reason `blocked_scanner_ua` | Known attack tool (sqlmap, nikto, masscan) detected |
| `[SECURITY] [SUSPICIOUS_PAYLOAD]` with reason `api_enumeration` | Automated endpoint discovery |
| Backend response times suddenly spiking (>5s) | Server under load — potential DDoS |
| `429 Too Many Requests` flooding access logs | Rate limits being hit — potential abuse or DDoS |
| Supabase auth logs showing mass failed sign-ins | Credential stuffing against Supabase Auth |
| Unusual spike in Cloudflare Analytics traffic | Layer 3/4 DDoS or volumetric attack |

---

## Section 2 – Immediate Response Steps

### Step 1 – Verify it's an attack, not a bug

```bash
# Check recent security log entries
grep "\[SECURITY\]" /var/log/astraflame/server.log | tail -100

# Check error rate
grep "HTTP 5" /var/log/nginx/access.log | wc -l
```

### Step 2 – Enable Cloudflare "I'm Under Attack!" Mode

> [!IMPORTANT]
> This is your fastest and most effective lever during an active DDoS.

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your ASTRAFLAME domain
3. Go to **Security** → **Overview**
4. Click **Security Level** → select **I'm Under Attack!**
5. All visitors will see a 5-second JS challenge before accessing the site

**Revert after attack is over:**
- Change Security Level back to **Medium**
- This should happen within hours — do not leave it on permanently

### Step 3 – Check the IP Blocklist

```bash
# Admin API (requires admin token)
curl -H "x-admin-key: YOUR_ADMIN_KEY" https://yourdomain.com/api/admin/blocklist
```

### Step 4 – Manually Block a Known Attack IP

Via admin API:
```bash
# This endpoint is not exposed by default; use the ipBlocklist module directly
# Or add an IP to Cloudflare's IP Access Rules (see Section 5)
```

Via Cloudflare (immediate effect):
1. **Security** → **WAF** → **IP Access Rules**
2. Enter the attacking IP or CIDR range
3. Set action: **Block**

### Step 5 – Emergency Rate Limit Tightening

Update `.env` and restart the backend to reduce rate limits during an attack:

```env
# Temporarily reduce to slow down abuse
API_RATE_LIMIT_MAX=50       # from 150
CHAT_RATE_LIMIT_MAX=10      # from 30
AUTH_RATE_LIMIT_MAX=5       # from 15
```

Then restart: `pm2 restart astraflame-api` (or your process manager).

---

## Section 3 – Cloudflare Under Attack Mode – Detailed Instructions

| Mode | When to Use |
|------|-------------|
| **Low** | Cloudflare estimates your visitors are low threat. Only blocks known bad actors. |
| **Medium** | (Default) Challenges visitors that are suspected threats. Good balance. |
| **High** | More aggressive challenges. Use during elevated threat. May impact real users. |
| **I'm Under Attack!** | Active volumetric DDoS. ALL visitors get a 5-second JS challenge. Use only when needed. |

### Additional Cloudflare levers during attack:
- **Security** → **Bots** → Enable **Bot Fight Mode** (if not already on)
- **Security** → **WAF** → Temporarily enable stricter OWASP sensitivity (**High**)
- **Speed** → **Optimization** → Disable non-essential features to reduce server load
- **Caching** → **Configuration** → Enable **Aggressive Caching** for static content

---

## Section 4 – Reviewing ASTRAFLAME Security Logs

Security events are logged with the prefix `[SECURITY]`. Search for them:

```bash
# All security events
grep "\[SECURITY\]" server.log

# Specific event types
grep "AUTH_FAILED" server.log
grep "RATE_LIMIT_EXCEEDED" server.log
grep "PROMPT_INJECTION_DETECTED" server.log
grep "brute_force_login" server.log
grep "scanner_404_rate" server.log

# Events from a specific IP (replace IP)
grep "\[SECURITY\]" server.log | grep "192.168.1.1"
```

**What to look for:**
- Repeated `AUTH_FAILED` from the same IP → brute force, consider blocking that IP
- `RATE_LIMIT_EXCEEDED` on `/api/chat` → chatbot abuse, reduce chat rate limit
- `PROMPT_INJECTION_DETECTED` → attempted AI prompt injection, review the message content
- `blocked_scanner_ua` with `sqlmap` → automated SQL injection scanner, ensure firewall blocks it at Cloudflare level too

---

## Section 5 – Emergency Cloudflare IP Block (Fastest Method)

1. Go to **Security** → **WAF** → **IP Access Rules**
2. Enter: IP address or CIDR range (e.g., `203.0.113.0/24`)
3. Action: **Block**
4. Scope: **This website**
5. Click **Add**

Effect is immediate and applies globally before traffic reaches your server.

---

## Section 6 – Recovery Steps

After an attack subsides:

1. **Revert Cloudflare** to **Medium** security level
2. **Review blocked IPs** — remove any false positives:
   ```bash
   curl -H "x-admin-key: YOUR_KEY" -X DELETE https://yourdomain.com/api/admin/blocklist/IP_ADDRESS
   ```
3. **Review rate limit settings** — revert temporary emergency limits in `.env`
4. **Restart backend** if any config changes were made
5. **Review Cloudflare Analytics** — confirm traffic is returning to baseline
6. **Document the incident**:
   - When did it start and end?
   - Peak request rate?
   - Which IPs/countries originated traffic?
   - What protections worked?
   - What could be improved?
7. **Consider permanently blocking** persistent attack sources via Cloudflare IP Access Rules
8. **Review Supabase Auth logs** at [app.supabase.com](https://app.supabase.com) → Your project → Authentication → Logs
9. **Check for data integrity** — verify no unauthorized writes occurred during the attack

---

## Section 7 – Contact and Escalation

> Replace these placeholders with actual contacts before deploying to production.

| Role | Contact |
|------|---------|
| Primary On-Call | `[YOUR NAME] – [YOUR EMAIL/PHONE]` |
| Cloudflare Support | [support.cloudflare.com](https://support.cloudflare.com) (Pro+ plans get priority) |
| Hosting Provider | `[YOUR HOSTING PROVIDER SUPPORT URL]` |
| Supabase Support | [supabase.com/support](https://supabase.com/support) |

---

## Section 8 – Preventive Maintenance Checklist

Run monthly:

- [ ] `npm audit` — check for new dependency vulnerabilities
- [ ] Review Cloudflare WAF logs for new attack patterns
- [ ] Review `[SECURITY]` log entries for unusual activity
- [ ] Rotate `ADMIN_API_KEY` if it may have been exposed
- [ ] Verify Supabase RLS policies are still correctly applied
- [ ] Test backup restoration procedure
- [ ] Review and update Cloudflare IP Access Rules (remove stale blocks)
- [ ] Check SSL certificate expiration (auto-renews via Cloudflare, but verify)
