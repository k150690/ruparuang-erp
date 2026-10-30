import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0;

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: {
      stocks: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: { sku: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar Odoo style */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium">
            ← Home
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-slate-800">Inventory & Products / Stok & Produk</h1>
        </div>
        <div className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-md font-mono font-semibold">
          Total SKU: {products.length}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 text-sm">Master Produk P001–P016 & Stok Dua Lokasi (WH & SHOP)</h2>
            <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md font-medium">
              Pajak: PPN Efektif 11% (PPN-E11)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3">Satuan</th>
                  <th className="px-4 py-3 text-right">Harga Jual (IDR)</th>
                  <th className="px-4 py-3 text-right">Cost / HPP (IDR)</th>
                  <th className="px-4 py-3 text-center">Vendor Utama</th>
                  <th className="px-4 py-3 text-center bg-blue-50/80 text-blue-900">Stok WH</th>
                  <th className="px-4 py-3 text-center bg-green-50/80 text-green-900">Stok SHOP</th>
                  <th className="px-4 py-3 text-center font-bold bg-slate-200 text-slate-800">Total Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const whStock = p.stocks.find((s) => s.locationId === 'WH')?.qtyOnHand || 0;
                  const shopStock = p.stocks.find((s) => s.locationId === 'SHOP')?.qtyOnHand || 0;
                  const totalStock = whStock + shopStock;

                  return (
                    <tr key={p.sku} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.uom}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        Rp {p.salesPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        Rp {p.cost.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                          {p.defaultVendorId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center bg-blue-50/30 font-semibold text-blue-700">
                        {whStock}
                      </td>
                      <td className="px-4 py-3 text-center bg-green-50/30 font-semibold text-green-700">
                        {shopStock}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800 bg-slate-50">
                        {totalStock}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}