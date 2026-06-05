import { Service } from '@/types'

export interface DefaultCategory {
  name: string
  services: Service[]
}

export const DEFAULT_SERVICES: Record<string, DefaultCategory> = {
  hardware: {
    name: 'Hardware',
    services: [
      { id: 'h1', category_id: 'hardware', name: 'Ganti Panel LCD', description: 'Ganti LCD rusak, pecah, bergaris, atau kedip-kedip.', price_min: 800000, price_max: 1500000, duration_est: '45 - 60 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'h2', category_id: 'hardware', name: 'Ganti Layar / Touchscreen', description: 'Penggantian modul layar kaca depan dengan sensor sentuh.', price_min: 1200000, price_max: 2500000, duration_est: '60 - 90 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'h3', category_id: 'hardware', name: 'Ganti Baterai', description: 'Ganti baterai kembung, cepat drop, atau tidak mengisi daya.', price_min: 350000, price_max: 700000, duration_est: '30 - 45 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'h4', category_id: 'hardware', name: 'Upgrade RAM (DDR4/DDR5)', description: 'Upgrade kapasitas RAM laptop Anda untuk multitasking lancar.', price_min: 300000, price_max: 900000, duration_est: '15 - 30 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'h5', category_id: 'hardware', name: 'Ganti Thermal Paste', description: 'Bersihkan thermal paste lama kering, pasang pasta premium baru.', price_min: 100000, price_max: 200000, duration_est: '30 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'h6', category_id: 'hardware', name: 'Ganti Keyboard', description: 'Ganti keyboard tombol tidak berfungsi, lepas, atau short.', price_min: 250000, price_max: 600000, duration_est: '45 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'h7', category_id: 'hardware', name: 'Perbaikan Port (USB, HDMI, Jack)', description: 'Solder ulang atau ganti port konektor yang longgar/patah.', price_min: 150000, price_max: 350000, duration_est: '45 - 60 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'h8', category_id: 'hardware', name: 'Ganti SSD/HDD', description: 'Ganti atau tambah penyimpanan storage SSD kecepatan tinggi.', price_min: 400000, price_max: 1200000, duration_est: '30 Menit', is_active: true, created_at: new Date().toISOString() }
    ]
  },
  software: {
    name: 'Software',
    services: [
      { id: 's1', category_id: 'software', name: 'Install / Reinstall OS', description: 'Install ulang Windows 10/11, macOS, atau Linux (termasuk driver dasar).', price_min: 150000, price_max: 300000, duration_est: '60 - 90 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 's2', category_id: 'software', name: 'Optimasi Performa Sistem', description: 'Bersihkan registry junk, startup programs, dan tweaking windows.', price_min: 100000, price_max: 200000, duration_est: '30 - 45 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 's3', category_id: 'software', name: 'Backup & Recovery Data', description: 'Penyelamatan data terhapus, bad sector HDD, atau backup sebelum install.', price_min: 200000, price_max: 800000, duration_est: '60 - 120 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 's4', category_id: 'software', name: 'Removal Virus & Malware', description: 'Pembersihan virus, ransomware, adware, dan instalasi antivirus gratis.', price_min: 100000, price_max: 250000, duration_est: '45 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 's5', category_id: 'software', name: 'Install Aplikasi', description: 'Bantuan install aplikasi Office, Adobe Suite, CAD, dll.', price_min: 50000, price_max: 150000, duration_est: '15 - 30 Menit', is_active: true, created_at: new Date().toISOString() }
    ]
  },
  cleaning: {
    name: 'Cleaning',
    services: [
      { id: 'c1', category_id: 'cleaning', name: 'Deep Clean Internal', description: 'Pembersihan motherboard dari debu pekat, bongkar total fan.', price_min: 150000, price_max: 250000, duration_est: '45 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'c2', category_id: 'cleaning', name: 'Cleaning Fan & Port', description: 'Sedot debu di sirip fan pendingin dan semprot contact cleaner ke port.', price_min: 100000, price_max: 180000, duration_est: '30 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'c3', category_id: 'cleaning', name: 'Ganti Thermal Paste (Bundled)', description: 'Paket Deep Clean internal ditambah penggantian thermal paste kualitas premium.', price_min: 200000, price_max: 300000, duration_est: '60 Menit', is_active: true, created_at: new Date().toISOString() }
    ]
  },
  estetika: {
    name: 'Estetika & Proteksi',
    services: [
      { id: 'e1', category_id: 'estetika', name: 'Pemasangan Skin Laptop', description: 'Pasang skin sticker pelindung body luar dengan custom pattern.', price_min: 100000, price_max: 200000, duration_est: '30 - 45 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'e2', category_id: 'estetika', name: 'Pemasangan Tempered Glass Screen', description: 'Pelindung layar kaca tempered antigores khusus layar laptop.', price_min: 150000, price_max: 250000, duration_est: '30 Menit', is_active: true, created_at: new Date().toISOString() },
      { id: 'e3', category_id: 'estetika', name: 'Anti-Gores Pelindung Body', description: 'Pemasangan clear film pelindung sekeliling keyboard/palmrest.', price_min: 120000, price_max: 220000, duration_est: '30 - 45 Menit', is_active: true, created_at: new Date().toISOString() }
    ]
  }
}
