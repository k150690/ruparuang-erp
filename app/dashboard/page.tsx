import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0;

export default async function DashboardPage() {
  const contactCount = await prisma.contact.count();
  const productCount = await prisma.product.count();
  const quotationCount = await prisma.quotation.count();
  const poCount = await prisma.purchaseOrder.count();
  const accountCount = await prisma.account.count();
  const stocks = await prisma.stock.findMany();

  const totalWhQty = stocks
    .filter((s) => s.locationId === 'WH')
    .reduce((acc, curr) => acc + curr.qtyOnHand, 0);

  const totalShopQty = stocks
    .filter((s) => s.locationId === 'SHOP')
    .reduce((acc, curr) => acc + curr.qtyOnHand, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar Odoo style */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium">
            ← Home
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-slate-800">Executive Dashboard / Ringkasan Sistem</h1>
        </div>
        <div className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-mono font-semibold">
          Status: Operational
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Contacts</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">{contactCount}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Pelanggan & Vendor</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total SKU Produk</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">{productCount}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Katalog P001–P016</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok Gudang (WH)</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-2">{totalWhQty} <span className="text-xs text-slate-500 font-normal">unit</span></div>
            <span className="text-[11px] text-slate-500 mt-1 block">Gudang Utama JKT</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok Gerai (SHOP)</span>
            <div className="text-2xl font-extrabold text-green-600 mt-2">{totalShopQty} <span className="text-xs text-slate-500 font-normal">unit</span></div>
            <span className="text-[11px] text-slate-500 mt-1 block">Gerai POS Depok</span>
          </div>
        </div>

        {/* Quick Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="font-bold text-slate-800 text-sm">Dokumen & Transaksi Aktif</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">Quotations Sales (Q00031)</span>
                <span className="font-bold text-purple-700">{quotationCount} Dokumen</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">Purchase Orders (PO00018)</span>
                <span className="font-bold text-emerald-700">{poCount} Dokumen</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="font-bold text-slate-800 text-sm">Konstruksi Akuntansi & COA</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">Chart of Accounts Terdaftar</span>
                <span className="font-bold text-indigo-700">{accountCount} Akun</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">Metode Penilaian Persediaan</span>
                <span className="font-bold text-slate-800">AVCO / Perpetual</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}