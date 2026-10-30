import Link from 'next/link';

export default function HomePage() {
  const modules = [
    {
      title: 'Master Contacts',
      desc: 'Database Pelanggan C01–C06 & Vendor V01–V04',
      href: '/contacts',
      icon: '👥',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'CRM & Pipeline',
      desc: 'Papan Kanban Prospek Peluang & Deal Jualan',
      href: '/crm',
      icon: '🤝',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: 'Inventory & Products',
      desc: 'Master 16 Produk SKU & Stok Gudang WH / SHOP',
      href: '/inventory',
      icon: '📦',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Sales & CRM',
      desc: 'Quotation Q00031 & Konfirmasi Sales Order',
      href: '/sales',
      icon: '💼',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Purchase Order',
      desc: 'Pembelian Vendor PO00018 & Alur Terima Barang',
      href: '/purchase',
      icon: '🛒',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Point of Sale (POS)',
      desc: 'Mesin Kasir Gerai Depok & Otomatis Potong Stok',
      href: '/pos',
      icon: '🏪',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      title: 'Invoicing & Accounting',
      desc: 'Faktur, Tagihan, & Auto-Journal Buku Besar',
      href: '/invoicing',
      icon: '📑',
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      title: 'Executive Dashboard',
      desc: 'Ringkasan Metrik Sistem & Stok Keseluruhan',
      href: '/dashboard',
      icon: '📊',
      color: 'bg-slate-100 text-slate-700 border-slate-300',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full space-y-8">
        
        {/* Header App Switcher ala Odoo */}
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
            RupaRuang ERP System v1.0
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            App Switcher / Main Menu
          </h1>
          <p className="text-xs text-slate-500">
            Pilih modul operasional toko terintegrasi (Full-Stack Next.js + Prisma)
          </p>
        </div>

        {/* Grid Card Menu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg mb-3 ${m.color}`}>
                  {m.icon}
                </div>
                <h2 className="font-bold text-slate-800 text-sm group-hover:text-purple-700 transition-colors">
                  {m.title}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {m.desc}
                </p>
              </div>
              <span className="text-[10px] font-bold text-purple-600 mt-4 block group-hover:translate-x-1 transition-transform">
                Buka Modul ➔
              </span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}