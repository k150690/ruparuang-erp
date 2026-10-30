import { mkdirSync, writeFileSync, existsSync } from "node:fs";

// 1. WILAYAH MESIN (Folder modules/): 4 Modul Logika sesuai pembagian tugas
const modules = [
  { name: "sales-crm", title: "Sales dan CRM", owner: "Anggota 1 (A)" },
  {
    name: "purchase-inventory",
    title: "Purchase dan Inventory",
    owner: "Anggota 2 (B)",
  },
  { name: "pos", title: "Point of Sale", owner: "Anggota 3 (C)" },
  {
    name: "accounting",
    title: "Accounting dan Invoicing",
    owner: "Anggota 4 (D)",
  },
];

// 2. WILAYAH WAJAH WEB (Folder app/): 9 Menu Mutlak Sesuai Wireframe
const uiRoutes = [
  "contacts",
  "crm",
  "sales",
  "inventory",
  "purchase",
  "invoicing",
  "accounting",
  "pos",
  "dashboard",
];

function tulisSekali(path, isi) {
  if (!existsSync(path)) writeFileSync(path, isi);
}

// Eksekusi pembuatan folder Mesin Logika
for (const m of modules) {
  mkdirSync(`modules/${m.name}`, { recursive: true });
}

// Eksekusi pembuatan 9 rute URL web
for (const route of uiRoutes) {
  mkdirSync(`app/${route}`, { recursive: true });
  tulisSekali(
    `app/${route}/README.md`,
    `# Halaman /${route}\nPemilik: Anggota 3 (UI/UX)\nNavigasi wajib Odoo 17.0\n`,
  );
}

// Eksekusi folder QA & File Infrastruktur (Tugas Kamu)
mkdirSync("docs", { recursive: true });
tulisSekali("docs/README.md", "# Dokumentasi QA & Test Results\n");
tulisSekali("middleware.ts", "// TODO: Proteksi URL Hak Akses (F-01)\n");
mkdirSync("prisma", { recursive: true });
tulisSekali("prisma/seed.ts", "// TODO: Script Dataset Awal BO\n");

console.log("Rombak Selesai: 4 Mesin Modul & 9 Menu UI Odoo sudah terbentuk!");
