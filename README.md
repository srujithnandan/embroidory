# EMBROIDERY STUDIO — Digital Catalog & Management System

> **Beautiful Designs • Quality Embroidery**  
> A production-quality, mobile-first embroidery design gallery and digital catalog management system built for embroidery studios and ateliers.

---

## 🌸 Overview & The Core Problem

For an embroidery business, design photos are traditionally kept on a phone gallery. Over time:
- Phone storage gets clogged with gigabytes of high-res photos.
- Scrolling through thousands of unorganized images in front of customers is slow and unprofessional.
- The same design photo is frequently uploaded multiple times.
- There is anxiety over deleting phone photos without being certain they are backed up safely.

**EMBROIDERY STUDIO** solves this with a **cloud-backed digital catalog**:
- **Smart Phone Gallery Sync**: Select 10, 50, or hundreds of photos directly from your phone.
- **Client-Side SHA-256 Hashing**: Prevents duplicates by computing content-based SHA-256 hashes in the browser before upload—renaming photos on the phone will never fool the system.
- **Pre-flight Duplicate Check**: Only brand-new images are uploaded to Cloudinary and cataloged in Supabase.
- **Mom-Friendly Reassurance**: Clear summaries showing what was uploaded vs what already existed, giving full confidence to safely free up phone storage.
- **Customer Presentation Showroom**: A distraction-free, 1-tap presentation mode designed specifically for handing the phone to a customer with no delete or edit buttons.
- **Design ID System**: Automatically sequential IDs (`EMB-0001`, `EMB-0002`...) so customers can easily order: *"I want EMB-0027"*.

---

## 🏛️ Technology Stack & Architecture

- **Frontend & App Engine**: Next.js 14/15 (App Router), TypeScript, React 19
- **Styling**: Tailwind CSS with custom Atelier Luxury palette (ivory, cream, charcoal, gold, sand)
- **Database**: Supabase PostgreSQL with RLS, triggers, indexes, and sequential ID sequence
- **Image Storage & CDN**: Cloudinary CDN with automatic thumbnail generation and responsive viewer transformations
- **Authentication**: Supabase Auth

```
                    ┌──────────────────────┐
                    │     MOM'S PHONE      │
                    │  Photo Gallery (1000s)│
                    └──────────┬───────────┘
                               │
                               │ Select multiple photos
                               ▼
                    ┌──────────────────────┐
                    │  EMBROIDERY WEBSITE  │
                    │   Next.js App Router │
                    └──────────┬───────────┘
                               │
                               │ SHA-256 Pre-Check
                               ▼
                    ┌──────────────────────┐
                    │       SUPABASE       │
                    │      PostgreSQL      │
                    │                      │
                    │ • Design metadata    │
                    │ • Unique file hashes │
                    │ • Sequential IDs     │
                    │ • Categories         │
                    └──────────┬───────────┘
                               │
                               │ Upload only NEW images
                               ▼
                    ┌──────────────────────┐
                    │      CLOUDINARY      │
                    │                      │
                    │ • Original image CDN │
                    │ • Thumbnails (400px) │
                    │ • Lightbox (1600px)  │
                    │ • Auto format/quality│
                    └──────────────────────┘
```

---

## 🚀 Getting Started Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Cloudinary Credentials (server-side only)
CLOUDINARY_CLOUD_NAME=hcn8xt5g
CLOUDINARY_API_KEY=169781418545283
CLOUDINARY_API_SECRET=your_actual_cloudinary_api_secret

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note on Local / Demo Mode**: If Supabase or Cloudinary credentials are not yet entered, the application automatically launches in **Local Engine Mode** pre-loaded with 24 realistic embroidery designs and working SHA-256 duplicate detection. As soon as `.env.local` is configured, it immediately operates against your live cloud database and CDN.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your mobile browser or responsive devtools.

---

## 🗄️ Setting Up Supabase Database

1. Sign up / log into [Supabase](https://supabase.com) and create a new project.
2. In your Supabase project dashboard, navigate to **SQL Editor**.
3. Open `supabase/schema.sql` from this repository, copy its contents, and run it. This creates:
   - `categories` table with default fashion categories (Floral, Bridal, Saree, Blouse, etc.)
   - `designs` table with a UNIQUE constraint on `file_hash`
   - `emb_design_seq` sequence and trigger for automatic sequential `EMB-0001` ID generation
   - Full Row Level Security (RLS) policies allowing public customer viewing while protecting management operations
   - Performance indexes on `file_hash`, `design_id`, `category_id`, and `created_at`
4. (Optional) Run `supabase/seed.sql` if you wish to seed 24 initial embroidery designs directly into your Postgres database.
5. In Supabase **Project Settings → API**, copy your **Project URL** and **anon public key** into `.env.local`.

---

## ☁️ Setting Up Cloudinary

1. Sign up for a free account at [Cloudinary](https://cloudinary.com).
2. On your Cloudinary Dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Place them in `.env.local`:
   ```env
   CLOUDINARY_CLOUD_NAME=hcn8xt5g
   CLOUDINARY_API_KEY=169781418545283
   CLOUDINARY_API_SECRET=your_secret_here
   ```
4. *Important*: The API Secret is used exclusively inside server-side route handlers (`/api/sync/upload` and `/api/designs/[id]`) and is never leaked to the frontend client.

---

## 👥 Creating an Admin User in Supabase

1. In your Supabase Dashboard, go to **Authentication → Users**.
2. Click **Add User → Create User**.
3. Enter the email and password for the studio manager (e.g. your mother's email).
4. Click **Create User**.
5. You can now log in at `/login` to access the full admin suite and sync new designs.

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Embroidery Studio"
   git remote add origin https://github.com/your-username/embroidery-studio.git
   git push -u origin main
   ```
2. Import your GitHub repository on [Vercel](https://vercel.com).
3. In the Vercel project configuration, add your Environment Variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build and launch the site globally on high-performance CDN edges.

---

## 📱 Mobile-First Workflow for Mom

1. Open the website on phone browser and tap **+ SYNC** (center bottom button).
2. Tap **Choose Photos** and select multiple photos from the phone gallery.
3. Tap **START SMART SYNC**.
4. The system calculates content hashes, filters out duplicates automatically, and uploads only new designs.
5. Review the reassurance summary:
   ```text
   SYNC COMPLETED
   ✓ 21 new designs uploaded
   ↻ 75 designs already existed
   ⚠ 0 failed

   Your designs are safely backed up.
   You can now safely delete the uploaded photos from your phone if you need more storage.
   ```
6. When meeting with a customer, tap **Showroom** (Presentation Mode) to let them browse in full distraction-free luxury.

---

## 🔒 Security Best Practices

- `CLOUDINARY_API_SECRET` is never exposed in client code.
- `.env` and `.env.local` are explicitly ignored by Git.
- Image uploads validate MIME type and restrict file size.
- Server-side SHA-256 verification and PostgreSQL unique constraints prevent duplicate data.
- Row Level Security (RLS) protects write operations.

---

## 📄 License

MIT License — Built for Embroidery Studio.
