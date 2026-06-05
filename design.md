# FixIT — Design & Technical Specification

> Platform servis laptop on-demand berbasis web. Menghubungkan pelanggan dengan teknisi terdekat secara real-time.

---

## 1. Overview

| Atribut | Detail |
|---|---|
| **Nama Aplikasi** | FixIT |
| **Tipe** | Web Application (Mobile-First, PWA-ready) |
| **Target Pengguna** | Pelanggan laptop, Teknisi servis, Super Admin |
| **Tujuan** | Portfolio / Academic Project |
| **Tagline** | Solusi Perbaikan Laptop Terpercaya — Cepat, Profesional & Bergaransi |

---

## 2. User Roles

### 2.1 Pelanggan
- Mendaftar / login via email
- Memesan layanan servis laptop (Hardware, Software, Cleaning, Estetika & Proteksi)
- Memilih lokasi pertemuan dengan teknisi
- Melakukan pembayaran via QRIS atau Virtual Account (Midtrans)
- Melacak status perbaikan secara real-time
- Chat dengan teknisi
- Memberikan ulasan & rating
- Melihat riwayat servis

### 2.2 Teknisi
- Mendaftar / login via email (diverifikasi admin sebelum aktif)
- Melihat daftar pekerjaan yang di-assign
- Update status pekerjaan (Pending → Berangkat → Proses → Selesai)
- Chat dengan pelanggan
- Melihat profil & ulasan dari pelanggan
- Set status ketersediaan (Tersedia / Tidak Tersedia)

### 2.3 Super Admin
- Dashboard overview sistem
- Kelola akun pelanggan & teknisi
- Kelola & assign pesanan ke teknisi (manual override tersedia)
- Monitor posisi / status teknisi (Tersedia, Sedang Bertugas, Offline)
- Kelola daftar harga layanan (CRUD per kategori)
- Verifikasi & monitor pembayaran
- Kelola & moderasi chat
- Melihat history service
- Kelola ulasan & rating

---

## 3. Tech Stack

### 3.1 Frontend
| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v3 |
| **UI Components** | shadcn/ui |
| **State Management** | Zustand |
| **Form Handling** | React Hook Form + Zod |
| **Map** | Leaflet.js + React-Leaflet (OpenStreetMap, gratis) |
| **Real-time Chat** | Supabase Realtime (WebSocket) |
| **Icons** | Lucide React |
| **Date/Time** | date-fns |
| **HTTP Client** | Fetch API (Next.js built-in) |

### 3.2 Backend
| Layer | Teknologi |
|---|---|
| **Runtime** | Next.js API Routes (App Router, Route Handlers) |
| **Auth** | Supabase Auth (email/password) |
| **Database** | Supabase (PostgreSQL) |
| **ORM** | Supabase JS Client (langsung, tanpa Prisma) |
| **File Storage** | Supabase Storage (foto profil, foto lokasi) |
| **Real-time** | Supabase Realtime (chat, status update) |
| **Payment Gateway** | Midtrans (QRIS + Virtual Account) |
| **Email** | Supabase Auth built-in / Resend (opsional) |

### 3.3 Infrastructure & Deployment
| Layer | Teknologi |
|---|---|
| **Hosting** | Vercel |
| **Database** | Supabase (managed PostgreSQL) |
| **Storage** | Supabase Storage |
| **Environment** | `.env.local` (Vercel env vars di production) |
| **Version Control** | Git + GitHub |

---

## 4. Database Schema

### 4.1 Tabel `profiles`
Extends Supabase Auth `auth.users`.

```sql
profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL CHECK (role IN ('pelanggan', 'teknisi', 'admin')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.2 Tabel `teknisi_profiles`
Data tambahan khusus teknisi.

```sql
teknisi_profiles (
  id              UUID PRIMARY KEY REFERENCES profiles(id),
  status          TEXT DEFAULT 'offline' CHECK (status IN ('tersedia', 'bertugas', 'offline')),
  specializations TEXT[],           -- e.g. ['hardware', 'software']
  rating_avg      DECIMAL(3,2) DEFAULT 0,
  total_jobs      INT DEFAULT 0,
  latitude        DECIMAL(10,8),    -- last known location
  longitude       DECIMAL(11,8),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.3 Tabel `service_categories`
```sql
service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,        -- 'Hardware', 'Software', 'Cleaning', 'Estetika & Proteksi'
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  is_active   BOOLEAN DEFAULT TRUE
)
```

### 4.4 Tabel `services`
Daftar harga layanan, dikelola admin.

```sql
services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID REFERENCES service_categories(id),
  name          TEXT NOT NULL,
  description   TEXT,
  price_min     INT NOT NULL,       -- dalam Rupiah
  price_max     INT NOT NULL,
  duration_est  TEXT,               -- e.g. '30 - 45 Menit'
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.5 Tabel `orders`
```sql
orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code      TEXT UNIQUE NOT NULL,   -- e.g. 'FIX-2024-001'
  pelanggan_id    UUID REFERENCES profiles(id),
  teknisi_id      UUID REFERENCES profiles(id),
  status          TEXT NOT NULL DEFAULT 'menunggu'
                  CHECK (status IN ('menunggu', 'dikonfirmasi', 'berangkat', 'diproses', 'selesai', 'dibatalkan')),
  
  -- Perangkat
  device_name     TEXT NOT NULL,          -- e.g. 'MacBook Pro M1 2020'
  device_type     TEXT NOT NULL,          -- 'laptop', 'pc'
  
  -- Lokasi pertemuan
  location_address TEXT NOT NULL,
  location_lat    DECIMAL(10,8),
  location_lng    DECIMAL(11,8),
  location_photo  TEXT,                   -- URL Supabase Storage
  location_notes  TEXT,
  
  -- Catatan
  order_notes     TEXT,
  
  -- Subtotal
  subtotal        INT NOT NULL,
  admin_fee       INT NOT NULL DEFAULT 10000,
  total           INT NOT NULL,
  
  -- Timestamps
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.6 Tabel `order_items`
Layanan yang dipesan dalam satu order (bisa multiple).

```sql
order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES services(id),
  service_name TEXT NOT NULL,         -- snapshot nama saat pesan
  price       INT NOT NULL,           -- snapshot harga saat pesan
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.7 Tabel `payments`
```sql
payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID REFERENCES orders(id),
  method              TEXT NOT NULL CHECK (method IN ('qris', 'virtual_account')),
  va_bank             TEXT,               -- 'bca', 'bni', 'mandiri' (jika VA)
  
  -- Midtrans
  midtrans_order_id   TEXT UNIQUE,
  midtrans_token      TEXT,               -- Snap token
  midtrans_redirect   TEXT,               -- payment URL
  
  amount              INT NOT NULL,
  status              TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
  paid_at             TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.8 Tabel `chats`
```sql
chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.9 Tabel `messages`
```sql
messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES profiles(id),
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.10 Tabel `reviews`
```sql
reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id) UNIQUE,
  pelanggan_id UUID REFERENCES profiles(id),
  teknisi_id  UUID REFERENCES profiles(id),
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

### 4.11 Tabel `notifications`
```sql
notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT,                   -- 'order', 'payment', 'chat', 'system'
  is_read     BOOLEAN DEFAULT FALSE,
  related_id  UUID,                   -- order_id atau payment_id
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

---

## 5. Application Routes

### 5.1 Pelanggan (Public + Auth)
```
/                         → Landing / Beranda
/login                    → Login Pelanggan
/register                 → Registrasi Pelanggan

/repairs                  → Pilih Kategori Layanan
/repairs/[category]       → Daftar Layanan per Kategori
/repairs/[category]/[id]  → Detail Layanan

/orders/new               → Ringkasan Pesanan + Pilih Lokasi
/orders/new/location      → Detail Lokasi Tujuan
/orders/new/payment       → Pilih Metode Pembayaran
/orders/new/payment/confirm → Konfirmasi Pembayaran
/orders/[id]              → Lacak Perbaikan (status tracker)
/orders/[id]/review       → Form Ulasan

/history                  → Riwayat Servis
/chat                     → Daftar Chat
/chat/[orderId]           → Chat dengan Teknisi
/profile                  → Profil Pelanggan
/teknisi/[id]             → Profil Teknisi (view only)
```

### 5.2 Teknisi (Auth — role: teknisi)
```
/teknisi/login            → Login Teknisi
/teknisi/register         → Registrasi Teknisi

/teknisi/tasks            → Workflow Pekerjaan (home)
/teknisi/tasks/[id]       → Detail Pekerjaan + Update Status
/teknisi/map/[orderId]    → Peta Navigasi ke Lokasi Pelanggan

/teknisi/chat             → Daftar Chat
/teknisi/chat/[orderId]   → Chat dengan Pelanggan

/teknisi/profile          → Profil & Ulasan
```

### 5.3 Super Admin (Auth — role: admin)
```
/admin/login              → Login Super Admin

/admin                    → Dashboard
/admin/orders             → Kelola Pesanan
/admin/orders/[id]        → Detail Pesanan + Assign Teknisi

/admin/users/pelanggan    → Kelola Akun Pelanggan
/admin/users/teknisi      → Kelola Akun Teknisi

/admin/services           → Kelola Daftar Harga
/admin/payments           → Kelola Pembayaran
/admin/chats              → Kelola Chat (monitor)
/admin/reviews            → Kelola Ulasan
/admin/history            → History Service
/admin/map                → Monitor Posisi Teknisi
```

### 5.4 API Routes (Next.js Route Handlers)
```
POST /api/orders                    → Buat order baru + auto-assign teknisi
PATCH /api/orders/[id]/status       → Update status order (teknisi)
POST  /api/orders/[id]/assign       → Manual assign teknisi (admin)

POST /api/payments/create           → Buat transaksi Midtrans
POST /api/payments/webhook          → Midtrans webhook (verifikasi otomatis)

GET  /api/teknisi/nearest           → Cari teknisi terdekat (algoritma)
PATCH /api/teknisi/status           → Update status ketersediaan teknisi

POST /api/auth/register             → Register + insert ke tabel profiles
```

---

## 6. Key Features & Business Logic

### 6.1 Auto-Assign Teknisi
Saat order dibuat, sistem secara otomatis mencari teknisi terbaik:

**Algoritma:**
1. Filter teknisi dengan `status = 'tersedia'`
2. Filter berdasarkan `specializations` yang sesuai kategori layanan
3. Hitung jarak antara koordinat pelanggan dan `latitude/longitude` teknisi menggunakan **Haversine formula**
4. Assign ke teknisi dengan **jarak terdekat**
5. Jika tidak ada teknisi tersedia → status order `menunggu` dan admin notifikasi

```typescript
// Haversine Formula (approximate)
function getDistance(lat1, lng1, lat2, lng2): number {
  const R = 6371; // radius bumi km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

### 6.2 Order Status Flow
```
[Pelanggan buat order]
        ↓
   MENUNGGU ──(auto-assign gagal)──→ [Admin manual assign]
        ↓ (auto-assign berhasil)
  DIKONFIRMASI ──→ teknisi menerima notifikasi
        ↓ (teknisi klik "Berangkat")
   BERANGKAT ──→ pelanggan lihat status "Menuju Lokasi"
        ↓ (teknisi klik "Proses")
   DIPROSES ──→ pelanggan lihat status "Sedang Dikerjakan"
        ↓ (teknisi klik "Selesai")
   SELESAI ──→ pelanggan diminta beri ulasan
        
   [Bisa dibatalkan dari status MENUNGGU/DIKONFIRMASI]
        ↓
  DIBATALKAN
```

### 6.3 Payment Flow (Midtrans)
```
[Pelanggan pilih metode bayar]
        ↓
[POST /api/payments/create]
  → Buat transaksi di Midtrans
  → Simpan midtrans_token & order_id ke tabel payments
        ↓
[Redirect ke Midtrans Snap / tampilkan QR]
        ↓
[Pelanggan bayar]
        ↓
[Midtrans kirim webhook ke /api/payments/webhook]
  → Verifikasi signature key
  → Update status payments → 'paid'
  → Update status orders → 'dikonfirmasi'
  → Trigger auto-assign teknisi
  → Kirim notifikasi ke pelanggan & teknisi
```

**Catatan:** Gunakan Midtrans **Sandbox** untuk development, production key saat deploy.

### 6.4 Real-time Chat (Supabase Realtime)
```typescript
// Subscribe ke channel chat per order
const channel = supabase
  .channel(`chat:${orderId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_id=eq.${chatId}`
  }, (payload) => {
    // Append pesan baru ke UI
    setMessages(prev => [...prev, payload.new])
  })
  .subscribe()
```

### 6.5 Status Tracking (Supabase Realtime)
```typescript
// Pelanggan subscribe ke perubahan status order
const channel = supabase
  .channel(`order:${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    setOrderStatus(payload.new.status)
  })
  .subscribe()
```

---

## 7. Authentication & Authorization

### 7.1 Strategy
- Semua auth via **Supabase Auth** (email + password)
- Setelah signup → insert ke tabel `profiles` dengan `role` yang sesuai
- Teknisi baru: `is_active = false` → harus diverifikasi admin sebelum bisa login
- Session management via Supabase `@supabase/ssr` package

### 7.2 Route Protection
Menggunakan Next.js **Middleware** (`middleware.ts`):

```
/admin/*   → cek role === 'admin'
/teknisi/* → cek role === 'teknisi' && is_active === true
/*         → cek sudah login (untuk halaman yang protected)
```

### 7.3 Supabase RLS (Row Level Security)
Setiap tabel memiliki policy:

- `orders`: pelanggan hanya bisa lihat order miliknya, teknisi hanya lihat order yang di-assign ke mereka
- `messages`: hanya sender & penerima yang bisa baca/tulis
- `reviews`: hanya pelanggan terkait yang bisa insert
- `payments`: read-only untuk pelanggan, webhook via service role key

---

## 8. Map Integration

**Library:** Leaflet.js + React-Leaflet  
**Tile Provider:** OpenStreetMap (gratis, no API key)

### Use Cases:
| Halaman | Fungsi |
|---|---|
| Detail Lokasi Tujuan (Pelanggan) | Pilih titik lokasi via pin draggable |
| Lacak Perbaikan (Pelanggan) | Tampilkan ilustrasi status (bukan tracking GPS live) |
| Dispatch Map (Teknisi) | Tampilkan alamat pelanggan, tombol "Navigate" → buka Google Maps |
| Monitor Teknisi (Admin) | Tampilkan marker posisi teknisi berdasarkan lat/lng di DB |

**Catatan:** Lokasi teknisi diupdate secara manual saat teknisi login/set status. Bukan GPS live tracking.

---

## 9. Layanan yang Tersedia

### Hardware
- Ganti Panel LCD
- Ganti Layar / Touchscreen
- Ganti Baterai
- Upgrade RAM (DDR4/DDR5)
- Ganti Thermal Paste
- Ganti Keyboard
- Perbaikan Port (USB, HDMI, dll)
- Ganti SSD/HDD

### Software
- Install / Reinstall OS (Windows/macOS/Linux)
- Optimasi Performa Sistem
- Backup & Recovery Data
- Removal Virus & Malware
- Install Aplikasi

### Cleaning
- Deep Clean (Bongkar + Bersihkan Internal)
- Cleaning Fan & Port
- Ganti Thermal Paste (Bundled)

### Estetika & Proteksi
- Pemasangan Skin Laptop
- Pemasangan Tempered Glass Screen
- Anti-Gores Pelindung Body

---

## 10. UI Design System

### 10.1 Color Palette
```css
--color-primary:     #1E3A8A;   /* Navy Blue — brand utama */
--color-primary-light: #3B82F6; /* Blue — accent & CTA */
--color-accent:      #F59E0B;   /* Amber/Orange — CTA buttons utama */
--color-success:     #10B981;   /* Green — status selesai, tersedia */
--color-warning:     #F59E0B;   /* Amber — status in transit */
--color-danger:      #EF4444;   /* Red — status dibatalkan, error */
--color-surface:     #F8FAFC;   /* Near-white background */
--color-card:        #FFFFFF;   /* Card background */
--color-text:        #0F172A;   /* Slate-900 — primary text */
--color-muted:       #64748B;   /* Slate-500 — secondary text */
--color-border:      #E2E8F0;   /* Slate-200 — borders */
```

### 10.2 Typography
```css
/* Display / Heading */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Body */
font-family: 'Inter', sans-serif;
```

### 10.3 Component Patterns
- **Cards:** rounded-2xl, shadow-sm, border border-slate-100
- **Buttons Primary:** bg-accent (amber), text-white, rounded-xl, full-width di mobile
- **Buttons Secondary:** border, bg-white, text-primary
- **Status Badges:** pill shape, color-coded per status
- **Bottom Navigation:** 5 tab (Home, Repairs, History, Chat, Profile) untuk pelanggan
- **Bottom Navigation:** 3 tab (Tasks, Chat, Profile) untuk teknisi
- **Admin:** Sidebar navigasi dengan icon grid cards di dashboard

### 10.4 Mobile-First Breakpoints
```
Default (mobile): 375px - 430px
sm: 640px
md: 768px (tablet)
lg: 1024px (desktop — admin panel)
```

---

## 11. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Server-only, untuk webhook

# Midtrans
MIDTRANS_SERVER_KEY=            # Server-only
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
MIDTRANS_WEBHOOK_SECRET=        # Untuk verifikasi signature
```

---

## 12. Project Structure

```
fixit/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (pelanggan)/
│   │   ├── page.tsx              # Beranda
│   │   ├── repairs/
│   │   ├── orders/
│   │   ├── history/
│   │   ├── chat/
│   │   └── profile/
│   ├── teknisi/
│   │   ├── login/
│   │   ├── register/
│   │   ├── tasks/
│   │   ├── chat/
│   │   └── profile/
│   ├── admin/
│   │   ├── login/
│   │   ├── page.tsx              # Dashboard
│   │   ├── orders/
│   │   ├── users/
│   │   ├── services/
│   │   ├── payments/
│   │   ├── chats/
│   │   ├── reviews/
│   │   ├── history/
│   │   └── map/
│   └── api/
│       ├── orders/
│       ├── payments/
│       │   ├── create/
│       │   └── webhook/
│       └── teknisi/
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── pelanggan/
│   ├── teknisi/
│   ├── admin/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts
│   ├── midtrans.ts
│   ├── haversine.ts
│   └── utils.ts
├── types/
│   └── index.ts                  # Semua TypeScript types
├── hooks/
│   ├── useRealtimeChat.ts
│   ├── useOrderStatus.ts
│   └── useAuth.ts
├── middleware.ts                  # Route protection
└── public/
```

---

## 13. Development Phases (MVP)

### Phase 1 — Foundation
- [ ] Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Setup Supabase (project, schema, RLS)
- [ ] Supabase Auth (register, login, middleware)
- [ ] Halaman Login & Register (Pelanggan, Teknisi, Admin)

### Phase 2 — Core Pelanggan
- [ ] Beranda + Kategori Layanan
- [ ] Detail Layanan + Pilih Layanan
- [ ] Ringkasan Pesanan + Input Lokasi (Leaflet)
- [ ] Halaman Lacak Perbaikan (status-based)

### Phase 3 — Payment
- [ ] Integrasi Midtrans (Snap)
- [ ] Halaman pilih metode & konfirmasi pembayaran
- [ ] Midtrans Webhook handler
- [ ] Auto-update status setelah bayar

### Phase 4 — Teknisi & Auto-Assign
- [ ] Dashboard Workflow Teknisi
- [ ] Update status pekerjaan
- [ ] Auto-assign teknisi terdekat (Haversine)
- [ ] Map navigasi (Leaflet → Google Maps deep link)

### Phase 5 — Real-time & Chat
- [ ] Supabase Realtime untuk status order
- [ ] Chat Pelanggan ↔ Teknisi (Realtime)
- [ ] Notifikasi in-app

### Phase 6 — Admin Panel
- [ ] Dashboard Super Admin
- [ ] Kelola Pesanan + Manual Assign
- [ ] Kelola Daftar Harga (CRUD)
- [ ] Kelola Akun User
- [ ] Monitor Teknisi + Map
- [ ] Kelola Pembayaran, Ulasan, History

### Phase 7 — Polish
- [ ] Ulasan & Rating
- [ ] Riwayat Servis Pelanggan
- [ ] Profil Teknisi (view dari pelanggan)
- [ ] Responsive & mobile polish
- [ ] Deploy ke Vercel

---

## 14. Third-Party Services Summary

| Service | Fungsi | Tier |
|---|---|---|
| **Supabase** | Database, Auth, Storage, Realtime | Free tier |
| **Midtrans** | Payment Gateway (QRIS, VA) | Sandbox (dev) |
| **Vercel** | Hosting & Deployment | Free tier |
| **OpenStreetMap** | Map tiles (via Leaflet) | Gratis, no key |
| **shadcn/ui** | UI Component library | Open source |

---

*Dokumen ini adalah living document — update sesuai perkembangan implementasi.*
