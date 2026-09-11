# 🐾 Lemon & Stain Cozy Luxury Personal Dashboard

A production-grade, lightweight full-stack personal productivity dashboard featuring the dual-theme **"Lemon & Stain"** aesthetic (Warm Cream Sunlight mode & Sleek Obsidian Void mode). Specifically engineered for high aesthetics, responsive micro-interactions, and self-hosting on low-resource Linux VPS instances (1–2 vCPU, 1–2 GB RAM with < 100 MB RAM usage).

---

## 🌟 Key Features

1. **Dual "Lemon & Stain" Design System**:
   - **Lemon Mode (Light)**: Warm cream/canvas tones (`#FAF6F0`), cozy amber accents, soft diffuse paper shadows.
   - **Stain Mode (Dark)**: Sleek obsidian slate (`#151318`), rich charcoal cards, glowing amber outlines.
2. **Interactive Pet Counter & Mood Engine**:
   - Individual counters for Lemon 🍋 and Stain 🐈‍⬛.
   - Micro-interaction particle animations (`🍋💛🐾` and `🐈‍⬛🖤✨`) powered by Framer Motion.
   - Dynamic mood messages responding to interaction velocity.
3. **Task & Clinical Deadline Engine**:
   - Priority tags: `⚡ Zoomies` (High), `🐾 Purr-fect` (Medium), `💤 Catnap` (Low).
   - Category filtering: Grad School (MSW), Work/Practicum, Bills, Personal.
   - Smart relative countdown badges (*"Due in 2 days"*, *"Overdue"*).
4. **Master Schedule & Agenda**:
   - Unified calendar for Augsburg MSW coursework, CARE Counseling practicum, UHHC shifts, and personal reminders.
   - Month grid view and upcoming agenda timeline.
5. **Focus Den / Purr-modoro Timer**:
   - 25m Focus Sprint, 5m Cat Nap, and 15m Long Nap intervals.
   - Animated SVG circular progress ring.
   - **Synthesized Web Audio API Chime**: Crystal clear 528 Hz meditation harmonic bell without external MP3 dependencies.
6. **Habit & Paw-gress Routine Tracker**:
   - 7-day completion toggles with automatic streak calculations.
7. **Quick Feline Launchpad**:
   - Direct launch links for Augsburg Moodle, CARE Counseling EHR, Master Sheets, and Banfield Vet.
8. **Clinical & Study Hub**:
   - MSW Course milestones table and autosaving markdown scratchpad.
9. **Google Sheets / CSV Bi-Directional Synchronization**:
   - Syncs with Master Task Tracker sheets published as CSV.
   - Server-side task merging preserving local completion states.
   - RFC 4180 compliant CSV export for backup.

---

## 🏗️ System Architecture

```text
personal-dashboard/
├── docker-compose.yml       # Multi-container orchestration with resource limits
├── Caddyfile                # Automated Let's Encrypt HTTPS, caching, and proxy
├── .env.example             # Documented environment variables
├── README.md
├── backend/                 # Lightweight FastAPI + SQLite REST API (< 45 MB RAM)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── config.py
│   ├── database/            # SQLite connection, session management, and seed data
│   ├── models/              # Pydantic v2 schemas and SQLAlchemy models
│   └── routes/              # Tasks, Events, Habits, Counters, Bookmarks, Notes, Sync
└── frontend/                # React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
    ├── Dockerfile           # Multi-stage build with Caddy static hosting
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
```

---

## 🚀 Quick Start with Docker Compose

### 1. Clone & Configure
```bash
git clone <your-repo-url> personal-dashboard
cd personal-dashboard

# Copy environment template
cp .env.example .env
```

### 2. Run Locally
```bash
docker compose up -d --build
```
Open your browser to [http://localhost](http://localhost). Interactive API documentation is available at [http://localhost/docs](http://localhost/docs).

---

## ☁️ Low-Resource Linux VPS Deployment Guide (1–2 vCPU, 1 GB RAM)

### 1. Server Prerequisites (Ubuntu 22.04 / 24.04 LTS or Debian 12)
```bash
# Update and install Docker + Compose
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl ufw git
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. Configure Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt verification)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. DNS Configuration
Point your domain's DNS `A` record (e.g. `dashboard.yourdomain.com`) to your VPS public IPv4 address.

### 4. Deploy with Automated HTTPS
Edit your `.env` file on the server:
```env
DOMAIN=dashboard.yourdomain.com
APP_ENV=production
DATA_DIR=./data
```

Launch the stack:
```bash
docker compose up -d --build
```
Caddy will automatically request and provision a free Let's Encrypt TLS certificate. Your dashboard is now live and secure!

---

## 🛠️ Local Development (Without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will run on `http://localhost:5173` and proxy API calls to `http://localhost:8000`.

---

## 💾 SQLite Backup & Restore

All application data (tasks, habits, events, counters, bookmarks, and notes) is persisted in a single SQLite database file in `./data/dashboard.db`.

### Create a Backup
```bash
# Safely snapshot the SQLite database without stopping the container
docker exec lemon-stain-api python -c "
import sqlite3
src = sqlite3.connect('/data/dashboard.db')
dst = sqlite3.connect('/data/dashboard_backup.db')
src.backup(dst)
dst.close()
src.close()
print('Backup created successfully!')
"
```

### Restore from Backup
```bash
cp ./data/dashboard_backup.db ./data/dashboard.db
docker compose restart api
```

---

## 📊 Google Sheets Sync Setup

1. Open your Google Sheet (e.g., Master Task Tracker).
2. Go to **File** → **Share** → **Publish to web**.
3. Under *Link*, select the specific sheet tab (e.g., `Active Tasks & Deadlines`) and choose **Comma-separated values (.csv)**.
4. Click **Publish** and copy the generated link.
5. In your dashboard, open the **Sources & Sync** tab and paste the link into the **Connected Sheet CSV URL** field.
6. Toggle **Auto-sync on page load** or click **Sync from Google Sheet Now**.

---

## 🐾 License
MIT. Crafted with love for Lemon 🍋 & Stain 🐈‍⬛.
