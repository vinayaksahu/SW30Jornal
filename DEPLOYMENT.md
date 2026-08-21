# Production Deployment Guide: SW30 Prop Firm Trading Journal

This guide provides end-to-end instructions for deploying the **SW30 Prop Firm Trading Journal** to production on **Vercel** with a **Neon Serverless PostgreSQL** database and a custom domain configured via **Namecheap**.

---

## Architecture Overview

- **Framework**: Next.js 16 (App Router, Turbopack, React Server Components)
- **Runtime**: Node.js 20+ / Serverless Edge Functions on Vercel
- **Database**: Neon Serverless PostgreSQL with connection pooling & `@prisma/adapter-neon`
- **Authentication**: Auth.js v5 (NextAuth.js) with salted bcrypt passwords and JWT session cookies
- **Evidence Storage**: Vercel Blob SDK with automatic local storage fallback (`public/uploads`)
- **MT5 OCR Extraction Engine**: Google Cloud Vision REST API with fallback to built-in pattern & regex OCR parser
- **Economic News & Blackout Engine**: ForexFactory / Curated real-time feed with customizable blackout windows and admin overrides
- **Primary Timezone**: `Asia/Kolkata` (IST - UTC+5:30) with UTC storage

---

## 1. Database Setup: Neon PostgreSQL

1. **Create a Neon Project**:
   - Go to [neon.tech](https://neon.tech) and create a free or standard project.
   - Select your nearest region (e.g., `AWS us-east-2` or `AWS ap-south-1` for Asia).
2. **Retrieve Connection String**:
   - In the Neon Console dashboard, copy the **Pooled connection string**:
     ```
     postgresql://<username>:<password>@<ep-pooler-id>.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
3. **Run Prisma Migrations**:
   From your local terminal, initialize the database schema in Neon:
   ```bash
   npx prisma db push
   ```
4. **Seed Demo Data & Admin User** (Optional):
   ```bash
   npx ts-node scripts/seed.ts
   ```
   This creates an initial Administrator account:
   - **Email**: `admin@sw30journal.com`
   - **Password**: `Admin@123456`

---

## 2. Evidence Storage: Vercel Blob (Optional for Serverless)

For production deployments on Vercel where the local filesystem is ephemeral:
1. In your Vercel Project Dashboard, navigate to the **Storage** tab.
2. Click **Create Database** and select **Blob**.
3. Link the Blob store to your project. This automatically provisions the environment variable:
   - `BLOB_READ_WRITE_TOKEN`

*(Note: If `BLOB_READ_WRITE_TOKEN` is not provided, SW30 Journal automatically falls back to local disk storage in `public/uploads` for local hosting or VPS setups.)*

---

## 3. MT5 Screenshot OCR Setup (Optional)

The application includes two OCR engines:
1. **Google Cloud Vision REST API** (Recommended for high-accuracy MT5 extraction):
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Enable the **Cloud Vision API**.
   - Create an API key under **Credentials**.
   - Set `GOOGLE_VISION_API_KEY=your_api_key` in your Vercel environment variables.
2. **Local Pattern & Regex Fallback**:
   - If no API key is configured, SW30 Journal uses a built-in heuristic pattern extractor that parses ticket numbers, lot sizes, execution prices, and P/L from MT5 trade screenshot filenames and metadata.

---

## 4. Vercel Deployment Step-by-Step

### Option A: Deploy via GitHub / Git Repository (Recommended)

1. Push this repository to GitHub or GitLab:
   ```bash
   git init
   git add .
   git commit -m "feat: complete SW30 prop firm trading journal"
   git remote add origin https://github.com/your-username/sw30-journal.git
   git push -u origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/new), click **Add New Project** and import your repository.
3. Configure the **Build & Development Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (or `next build`)
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Add the **Environment Variables** (see table below).
5. Click **Deploy**.

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 5. Environment Variables Reference

Configure these in the Vercel Dashboard under **Project Settings -> Environment Variables**:

| Variable Name | Required | Description | Example / Default |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Neon PostgreSQL pooled connection string | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | **Yes** | 32+ character random secret for JWT signing | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | **Yes** | Base production URL of your application | `https://journal.yourdomain.com` |
| `NEXTAUTH_URL` | **Yes** | Identical to `AUTH_URL` for Auth.js compatibility | `https://journal.yourdomain.com` |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob access token for screenshot uploads | `vercel_blob_rw_...` |
| `GOOGLE_VISION_API_KEY` | Optional | Google Vision REST API key for MT5 OCR | `AIzaSy...` |
| `FINANCIAL_NEWS_API_KEY`| Optional | External news feed provider API key | Optional (ForexFactory feed is included) |
| `NODE_ENV` | Optional | Node execution environment | `production` |

---

## 6. Custom Domain Configuration (Namecheap)

To point your custom domain (e.g., `journal.yourdomain.com` or `yourdomain.com`) from Namecheap to Vercel:

### Step 1: Add Domain in Vercel
1. In your Vercel Project, go to **Settings -> Domains**.
2. Type your domain (e.g., `yourdomain.com` and `www.yourdomain.com` or subdomain `journal.yourdomain.com`) and click **Add**.
3. Note the DNS records provided by Vercel.

### Step 2: Configure DNS Records in Namecheap
1. Log in to [Namecheap](https://www.namecheap.com/) and go to your **Domain List**.
2. Click **Manage** next to your domain, then open the **Advanced DNS** tab.
3. Add the following records:

#### For Root Domain (`yourdomain.com`):
| Type | Host | Value | TTL |
|---|---|---|---|
| **A Record** | `@` | `76.76.21.21` | Automatic / 1 min |
| **CNAME Record** | `www` | `cname.vercel-dns.com.` | Automatic / 1 min |

#### For Subdomain (e.g., `journal.yourdomain.com`):
| Type | Host | Value | TTL |
|---|---|---|---|
| **CNAME Record** | `journal` | `cname.vercel-dns.com.` | Automatic / 1 min |

4. Wait 2–5 minutes for DNS propagation. Vercel will automatically provision a free, auto-renewing **Let's Encrypt SSL certificate**.

---

## 7. Security Best Practices & Maintenance

1. **Authentication & Session Security**:
   - Passwords are encrypted with salted bcrypt hashing (`12` rounds).
   - Cookies are configured with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes in production.
2. **Immutable Audit Logging**:
   - Any administrative override of news blackout windows or user role changes creates an immutable record in the `AuditLog` table.
3. **Database Backups**:
   - Access the **Settings & Backup Center** (`/settings`) to download a full JSON snapshot or export all logged trades to CSV.
   - Use the **GitHub Gist Cloud Sync** feature to maintain an offsite, encrypted cloud backup.
