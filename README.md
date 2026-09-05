# Miskova Luxury Fragrances — E-Commerce Storefront

A modern, high-performance e-commerce storefront for **Miskova Luxury Fragrances**, built with Next.js 16 (App Router), React 19, Tailwind CSS, Three.js / React Three Fiber, and motion animations.

---

## Features

- **Interactive 3D Hero Bottle**: Real-time Three.js stage with spray interactions, lighting, and spring-physics bottle cap.
- **Editorial Fragrance Collections**: Curated showcases for *Summer*, *For Him*, *For Her*, and *Best Sellers*.
- **Cart & Slide-out Bag**: Instant drawer with quantity management, cart totals, and free-shipping threshold bar.
- **Checkout & Order Flow**: Express order submission with Egyptian phone validation, server-computed pricing, and optional WhatsApp order confirmation.
- **Customer Reviews System**: On-page verified reviews with star ratings and helpful votes.
- **Merchant Admin Dashboard (`/admin`)**: Password-protected dashboard with HMAC-SHA256 authenticated sessions to review, filter, and update customer order statuses (Pending, Confirmed, Shipped, Delivered, Canceled).

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm** or **pnpm**

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env.local` and set your admin password:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
ADMIN_PASSWORD=your-secret-password-here
```

### 4. Run the Application

- **Development Mode**:
  ```bash
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000).

- **Production Build (Recommended)**:
  ```bash
  npm run build
  npm run start
  ```

---

## Admin Dashboard

- **URL**: `http://localhost:3000/admin` (or `https://your-domain.com/admin`)
- **Login**: Enter the `ADMIN_PASSWORD` you configured in `.env.local`.
- Sessions are valid for 12 hours via an encrypted, HTTP-only cookie (`miskova_admin`).

---

## Production Deployment Guide

### Option 1: Railway (Recommended — 1-Click with Persistent Disk)
1. Push this repository to your GitHub account.
2. Sign up / log in to [Railway.app](https://railway.app).
3. Click **New Project** → **Deploy from GitHub repo** → select this repo.
4. Go to **Variables** and add:
   - `ADMIN_PASSWORD`: `<your-admin-password>`
5. Go to **Volumes** → **Add Volume**:
   - Mount path: `/app/.data`
6. Railway automatically builds and deploys the site with free HTTPS.

---

### Option 2: Render
1. Push this repository to your GitHub account.
2. Sign up / log in to [Render.com](https://render.com).
3. Click **New +** → **Web Service** → connect this repo.
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. In **Environment Variables**, add:
   - `ADMIN_PASSWORD`: `<your-admin-password>`
6. In **Disks**, add a persistent disk mounted to `/app/.data`.

---

### Option 3: Linux VPS (Hetzner, DigitalOcean, Ubuntu)
1. Install Node.js 20+ and PM2:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm
   sudo npm install -g pm2
   ```
2. Clone your repository:
   ```bash
   git clone <repo-url> /var/www/miskova
   cd /var/www/miskova
   ```
3. Set environment variables:
   ```bash
   cp .env.example .env.local
   nano .env.local
   ```
4. Build and start with PM2:
   ```bash
   npm install
   npm run build
   pm2 start npm --name "miskova" -- start
   pm2 save
   pm2 startup
   ```
5. Set up Caddy or Nginx with a free Let's Encrypt SSL certificate to reverse-proxy traffic to `http://localhost:3000`.

---

## Available Scripts

- `npm run dev`: Starts local Next.js development server.
- `npm run build`: Compiles production build using Turbopack.
- `npm run start`: Starts production HTTP server.
- `npm run typecheck`: Runs TypeScript type validation without emitting files.
- `npm run test:e2e`: Runs Playwright / Puppeteer E2E tests across all collection routes.
- `npm run test:catalog`: Verifies fragrance catalog integrity and image links.
