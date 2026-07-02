# FixIT

FixIT adalah platform manajemen perbaikan dan servis elektronik (seperti laptop dan PC) yang mempertemukan pelanggan dengan teknisi ahli.

## Fitur Utama
- **Pelanggan:** Memesan servis, lacak status pesanan, pembayaran, dan memberikan ulasan.
- **Teknisi:** Menerima pekerjaan, update status servis, integrasi peta (lokasi pelanggan), dan live chat.
- **Admin:** Mengelola semua pesanan, penugasan teknisi otomatis/manual, dan laporan pendapatan.

## Tech Stack
- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database & Auth:** Supabase

## Live Demo
Aplikasi FixIT dapat diakses secara live melalui tautan berikut:
🔗 **[fixitku.vercel.app](https://fixitku.vercel.app)**

## Cara Menjalankan Secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan platform FixIT di komputer Anda:

1. **Clone repository ini**
   ```bash
   git clone https://github.com/Frdalf/FixIt.git
   cd FixIt
   ```

2. **Install dependencies**
   Anda bisa menggunakan `npm`, `yarn`, `pnpm`, atau `bun`. Contoh menggunakan `npm`:
   ```bash
   npm install
   ```

3. **Siapkan Environment Variables**
   Buat file `.env.local` di folder utama proyek (sejajar dengan `package.json`) dan isi dengan kredensial Supabase Anda. Anda juga bisa melihat formatnya di file `.env.example` (jika ada):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=url_supabase_anda
   NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key_supabase_anda
   SUPABASE_SERVICE_ROLE_KEY=service_role_key_anda
   ```

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk menggunakan aplikasi.

## Cara Deploy (Vercel)

Aplikasi berbasis Next.js ini sangat mudah dan direkomendasikan untuk di-deploy menggunakan **Vercel**.

1. Login ke akun [Vercel](https://vercel.com).
2. Klik tombol **Add New...** -> **Project**.
3. Import repository GitHub `FixIt` Anda.
4. Pada menu konfigurasi deploy, buka bagian **Environment Variables** dan tambahkan 3 *secret key* berikut sesuai dengan project Supabase Anda:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Klik tombol **Deploy** dan tunggu hingga proses *build* selesai.
6. FixIT Anda kini sudah *live* dan dapat diakses publik!

## License

MIT License

Copyright (c) 2026 FixIT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
