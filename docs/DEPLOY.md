# SU Card — Production Deployment Runbook (VPS Launch Kit)

**Document Version:** 1.0 (2026-10-07)  
**Target Environment:** 1 Linux VPS (Ubuntu 24.04 LTS, 2 vCPU / 4 GB RAM)  
**Stack:** Docker Compose (`app` Next.js 16 standalone, `db` PostgreSQL 17, `caddy` HTTPS reverse proxy) behind Cloudflare  
**Target Subdomain:** `https://card.<su-domain>` (e.g. `card.nusu.nu.edu.eg`)

---

## Table of Contents

1. [Architecture & Topology](#1-architecture--topology)
2. [Step 1: Provision & Harden the VPS](#step-1-provision--harden-the-vps)
3. [Step 2: Configure Cloudflare DNS & SSL](#step-2-configure-cloudflare-dns--ssl)
4. [Step 3: Install Docker & Docker Compose](#step-3-install-docker--docker-compose)
5. [Step 4: Prepare Server Directory Structure & Secrets](#step-4-prepare-server-directory-structure--secrets)
6. [Step 5: Clone Repository & Configure Environment](#step-5-clone-repository--configure-environment)
7. [Step 6: Build Containers, Migrate Database & Seed Initial Admin](#step-6-build-containers-migrate-database--seed-initial-admin)
8. [Step 7: Update External OAuth & Console Credentials](#step-7-update-external-oauth--console-credentials)
9. [Step 8: Automated Nightly Backups & Retention](#step-8-automated-nightly-backups--retention)
10. [Step 9: Production Smoke Test Checklist](#step-9-production-smoke-test-checklist)
11. [Maintenance, Updates & Disaster Recovery](#maintenance-updates--disaster-recovery)

---

## 1. Architecture & Topology

```
Internet ──► Cloudflare Edge (Full strict SSL, CDN, DDoS)
                   │
                   ▼ (HTTPS :443)
              VPS: Ubuntu 24.04 LTS
        ┌─────────────────────────────────────────────────────┐
        │  Caddy Container (:80, :443)                        │
        │  • Auto Let's Encrypt TLS / Origin Cert             │
        │  • Gzip / Zstd compression & 10MB body limit        │
        │  • Security headers (HSTS, nosniff, camera perm)    │
        │             │                                       │
        │             ▼ (HTTP :3000)                          │
        │  App Container (Next.js 16 Standalone)              │
        │  • Non-root `nextjs` user                           │
        │  • Google Wallet credentials (mounted read-only)    │
        │  • Host-only session cookies                        │
        │             │                                       │
        │             ▼ (PostgreSQL :5432)                    │
        │  DB Container (postgres:17-alpine)                  │
        │  • Named Docker volume `sucard-pgdata`              │
        │  • Nightly automated compressed pg_dump             │
        └─────────────────────────────────────────────────────┘
```

- **Domain isolation:** SU Card runs on a dedicated subdomain (e.g. `card.nusu.nu.edu.eg`). Better Auth session cookies are host-only, strictly preventing collisions or leaks to the primary domain.
- **Secrets isolation:** Secrets and service account JSON keys are never baked into container images; they live in `/srv/sucard/env` and `/srv/sucard/secrets` with `chmod 600`.

---

## Step 1: Provision & Harden the VPS

Choose any VPS provider (Hetzner, Contabo, DigitalOcean, Linode) running **Ubuntu 24.04 LTS** (2 vCPU, 4 GB RAM, 40+ GB SSD).

### 1.1 Connect as root and create a dedicated deploy user
```bash
ssh root@<VPS_IP>

# Create deploy user with sudo privileges
adduser deploy
usermod -aG sudo deploy

# Copy root authorized SSH keys to deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 1.2 Harden SSH
Edit `/etc/ssh/sshd_config.d/50-cloud-init.conf` or `/etc/ssh/sshd_config`:
```bash
sudo nano /etc/ssh/sshd_config
```
Ensure the following directives are set:
```ini
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
```
Restart SSH service and verify connection from a new terminal before closing root:
```bash
sudo systemctl restart ssh
# In your local terminal:
# ssh deploy@<VPS_IP>
```

### 1.3 Configure UFW Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP (Caddy Let Encrypt challenge)'
sudo ufw allow 443/tcp comment 'HTTPS (Caddy)'
sudo ufw enable
sudo ufw status verbose
```

### 1.4 Automatic Security Updates & Fail2ban
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades fail2ban curl git ufw
sudo dpkg-reconfigure -plow unattended-upgrades
sudo systemctl enable --now fail2ban
```

---

## Step 2: Configure Cloudflare DNS & SSL

1. In the **Cloudflare Dashboard**, navigate to the DNS settings for your domain.
2. Add an **A record**:
   - **Type:** `A`
   - **Name:** `card` (resolves to `card.<su-domain>`)
   - **IPv4 Address:** `<VPS_IP>`
   - **Proxy Status:** **Proxied (Orange Cloud ON)**
   - **TTL:** Auto
3. Navigate to **SSL/TLS** settings:
   - Set encryption mode to **Full (strict)**.
   - Under **Edge Certificates**, enable **Always Use HTTPS**, **HTTP Strict Transport Security (HSTS)**, and **Minimum TLS Version: 1.2**.

---

## Step 3: Install Docker & Docker Compose

Run the official Docker installation script:

```bash
# Install Docker Engine & Compose plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add deploy user to docker group
sudo usermod -aG docker deploy
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Step 4: Prepare Server Directory Structure & Secrets

Create the production `/srv/sucard` directory hierarchy:

```bash
sudo mkdir -p /srv/sucard/{env,secrets,backups/weekly}
sudo chown -R deploy:deploy /srv/sucard
chmod 700 /srv/sucard/env /srv/sucard/secrets /srv/sucard/backups
```

### 4.1 Place Google Wallet Service Account Key
Upload your Google Wallet Service Account private key JSON to the secrets folder:
```bash
# On your local machine:
# scp google-wallet-key.json deploy@<VPS_IP>:/srv/sucard/secrets/google-wallet.json

# On the VPS:
chmod 600 /srv/sucard/secrets/google-wallet.json
```

---

## Step 5: Clone Repository & Configure Environment

```bash
git clone https://github.com/nileuniversity-su/sucard.git /srv/sucard/app
cd /srv/sucard/app

# Copy production environment template
cp deploy/.env.production.example /srv/sucard/env/.env.production
chmod 600 /srv/sucard/env/.env.production

# Link the environment file to repo root for docker compose convenience
ln -s /srv/sucard/env/.env.production .env.production
```

### 5.1 Edit Production Secrets
```bash
nano /srv/sucard/env/.env.production
```

Fill in all required production values:
- `DOMAIN`: `card.<su-domain>` (e.g. `card.nusu.nu.edu.eg`)
- `POSTGRES_PASSWORD`: generate a 32+ character random string (e.g. `openssl rand -hex 24`).
- `DATABASE_URL`: `postgres://sucard:<POSTGRES_PASSWORD>@db:5432/sucard`
- `BETTER_AUTH_SECRET`: generate with `openssl rand -base64 32`.
- `BETTER_AUTH_URL`: `https://card.<su-domain>`
- `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`: Entra ID credentials (see Step 7).
- `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`: Google Wallet details.
- `GOOGLE_WALLET_KEY_FILE`: `/srv/sucard/secrets/google-wallet.json`
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`: credentials for first login.

---

## Step 6: Build Containers, Migrate Database & Seed Initial Admin

### 6.1 Start Database & Build App
```bash
cd /srv/sucard/app
docker compose -f compose.prod.yml up -d --build
```
Verify all 3 containers are healthy and running:
```bash
docker compose -f compose.prod.yml ps
```

### 6.2 Apply Database Migrations
Execute Drizzle migrations inside the production app container:
```bash
docker compose -f compose.prod.yml run --rm app node scripts/migrate.mjs
```

### 6.3 Seed Built-in QR Style Presets
Seed standard NUSU QR styles into the database:
```bash
docker compose -f compose.prod.yml run --rm app node scripts/seed-qr-styles.mjs
```

### 6.4 Create First Super Admin
Create the initial super administrator account from the environment variables:
```bash
docker compose -f compose.prod.yml run --rm app node scripts/seed.mjs
```

### 6.5 Initial Login & 2FA Enrollment
1. Open `https://card.<su-domain>/login` in your browser.
2. Sign in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
3. Go to **Admin Panel** (`/admin/staff` or `/admin/account`).
4. Change the password and enroll in **Two-Factor Authentication (TOTP)** using Google Authenticator / 1Password.

---

## Step 7: Update External OAuth & Console Credentials

### 7.1 Microsoft Entra ID (Azure Portal)
1. Navigate to **Microsoft Entra ID** -> **App Registrations** -> select SU Card application.
2. Under **Authentication** -> **Web Redirect URIs**:
   - Add production URI: `https://card.<su-domain>/api/auth/callback/microsoft`
   - (Keep localhost redirect URIs for dev testing if desired, or create separate dev/prod Entra apps).
3. Under **Certificates & Secrets**:
   - **ROTATE THE CLIENT SECRET:** Delete any test/dev secrets previously shared in chat channels.
   - Generate a new secret, set expiration (e.g. 12 or 24 months), and immediately copy the Value into `/srv/sucard/env/.env.production` (`MICROSOFT_CLIENT_SECRET`).
   - Restart the app container: `docker compose -f compose.prod.yml restart app`.

### 7.2 Google Pay & Wallet Console
1. Log in to [Google Pay & Wallet Console](https://pay.google.com/business/console).
2. Ensure the issuer account is linked to the service account `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`.
3. Request **Publishing Access** for the SU Card generic pass class.
4. Verify that pass logos and hero images are served from HTTPS URLs on the production domain (e.g. `https://card.<su-domain>/brand/su-logo-color.png`).

### 7.3 Uptime Monitoring (UptimeRobot Free)
1. Sign up / log in to [UptimeRobot](https://uptimerobot.com).
2. Create an **HTTP(s) Monitor**:
   - **Friendly Name:** `SU Card Production`
   - **URL:** `https://card.<su-domain>/login`
   - **Monitoring Interval:** 5 minutes
   - **Alert Contacts:** Ahmed's email and SMS/Telegram webhook.

---

## Step 8: Automated Nightly Backups & Retention

The backup script `deploy/backup.sh` performs a compressed PostgreSQL dump (`pg_dump -F c`), saves it to `/srv/sucard/backups`, and enforces:
- **Daily retention:** 14 days.
- **Weekly retention:** 8 weeks (saved to `/srv/sucard/backups/weekly` on Sundays).
- **Optional off-site copy:** Cloudflare R2 / Backblaze B2 via `rclone`.

### 8.1 Setup Permissions
```bash
chmod +x /srv/sucard/app/deploy/backup.sh
chmod +x /srv/sucard/app/deploy/restore.sh
```

### 8.2 Add Cron Schedule
Edit root crontab:
```bash
sudo crontab -e
```
Add the nightly backup job (runs at 03:00 AM UTC every night):
```cron
0 3 * * * BACKUP_DIR=/srv/sucard/backups DB_CONTAINER=sucard-db POSTGRES_USER=sucard POSTGRES_DB=sucard /srv/sucard/app/deploy/backup.sh >> /var/log/sucard-backup.log 2>&1
```

### 8.3 (Optional) Off-site Backup via Cloudflare R2 / S3
If you configure an `rclone` remote (e.g. `r2:sucard-backups`):
Add `RCLONE_REMOTE="r2:sucard-backups"` to `/srv/sucard/env/.env.production`. The backup script will automatically copy every dump off-site.

---

## Step 9: Production Smoke Test Checklist

- [ ] **HTTPS & Headers:** `curl -I https://card.<su-domain>/login` returns `HTTP/2 200` with `Strict-Transport-Security` and `X-Content-Type-Options: nosniff`.
- [ ] **Fonts & Static Assets:** Page renders in browser with **Anton** (headings) and **Poppins** (UI) without font shift.
- [ ] **Student Sign-in (Microsoft):** Log in with an `@nu.edu.eg` account -> passes student format regex -> creates student profile -> redirects to `/welcome` or `/card`.
- [ ] **Student Card Activation:**
  - If mode is Digital: Card is immediately issued and viewable.
  - If mode is Physical: "Get your SU Card" screen renders instructions.
- [ ] **Google Wallet Integration:** Tap "Add to Google Wallet" -> Generates JWT save link -> Wallet pass renders with navy/gold branding and correct student name/ID.
- [ ] **Cashier Scanner App:** Log in as cashier -> Navigate to `/scan` -> Camera permission requested -> Scan a test QR code -> Returns green checkmark and discount details.
- [ ] **Admin Inventory & QR Studio:** Log in as Super Admin -> Generate a 10-card batch -> Export ZIP -> Verify SVG and CSV manifest.
- [ ] **Audit Trail:** Check `/admin/audit` -> Logs record super admin actions.

---

## Maintenance, Updates & Disaster Recovery

### Log Viewing
```bash
# Tail app logs
docker compose -f compose.prod.yml logs -f app

# Tail Caddy access & TLS logs
docker compose -f compose.prod.yml logs -f caddy

# Tail database logs
docker compose -f compose.prod.yml logs -f db
```

### Deploying Updates (Zero or Near-Zero Downtime)
```bash
cd /srv/sucard/app
git pull origin main

# Build updated image
docker compose -f compose.prod.yml build app

# Run any pending migrations
docker compose -f compose.prod.yml run --rm app node scripts/migrate.mjs

# Recreate app container with new image
docker compose -f compose.prod.yml up -d --no-deps app
```

### Rollback Procedure
```bash
cd /srv/sucard/app
git checkout <previous-stable-commit-or-tag>
docker compose -f compose.prod.yml build app
docker compose -f compose.prod.yml up -d --no-deps app
```

### Database Disaster Recovery
To restore the database from a backup file:
```bash
cd /srv/sucard/app
./deploy/restore.sh /srv/sucard/backups/sucard_YYYYMMDD_HHMMSS.dump
```
Type `RESTORE-CONFIRM` at the prompt to execute the restore.
