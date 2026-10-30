import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function PurchasePage() {
  // ==========================================
  // 1. BACKEND LOGIC: ALUR ODOO (CONFIRM -> RECEIVE)
  // ==========================================
  
  // Fungsi buat nerima barang di gudang (Nambah stok WH)
  async function receiveProducts(formData: FormData) {
    'use server';
    
    const poId = formData.get('poId') as string;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lines: true }
    });

    // Kalo statusnya bukan Confirmed, ga bisa direceive
    if (!po || po.status !== 'Confirmed') return;

    // A. Looping semua barang di dokumen PO, trus tambahin ke stok Gudang Utama (WH)
    for (const line of po.lines) {
      const stock = await prisma.stock.findUnique({
        where: { sku_locationId: { sku: line.sku, locationId: 'WH' } }
      });

      if (stock) {
        // Kalo stok udah ada, tambahin angkanya
        await prisma.stock.update({
          where: { id: stock.id },
          data: { qtyOnHand: stock.qtyOnHand + line.qtyOrdered }
        });
      } else {
        // Kalo barang baru banget masuk gudang, bikin record stok baru
        await prisma.stock.create({
          data: { sku: line.sku, locationId: 'WH', qtyOnHand: line.qtyOrdered }
        });
      }
    }

    // B. Ubah status PO jadi "Done / Received" biar ga bisa diklik 2x
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'Received' }
    });

    // Refresh halaman biar UI langsung update
    revalidatePath('/purchase');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
  }


  // ==========================================
  // 2. FETCH DATA PO DARI DATABASE
  // ==========================================
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      vendor: true,
      lines: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });


  // ==========================================
  // 3. FRONTEND UI (MIRIP ODOO WORKFLOW)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar Odoo style */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium">
            ← Home
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-slate-800">Purchase / Pembelian B2B</h1>
        </div>
        <div className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-md font-mono font-semibold">
          Total PO: {purchaseOrders.length}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 text-sm">Daftar Purchase Order (PO)</h2>
            <span className="text-xs text-slate-500 font-medium">Alur: Draft ➔ Confirmed ➔ Received (Masuk Gudang)</span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="border border-slate-200 rounded-xl p-0 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
                
                {/* Odoo Style Status Bar */}
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-700 text-sm">{po.docNumber}</span>
                  <div className="flex gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <span className={`px-2 py-1 rounded-l-full border border-slate-300 ${po.status === 'Draft' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-400'}`}>Draft</span>
                    <span className={`px-2 py-1 border-t border-b border-slate-300 ${po.status === 'Confirmed' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-400'}`}>Confirmed</span>
                    <span className={`px-2 py-1 rounded-r-full border border-slate-300 ${po.status === 'Received' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400'}`}>Received</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-slate-800 text-base">{po.vendor.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">📍 {po.vendor.city} | Termin: {po.vendor.paymentTerms}</p>

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                    {po.lines.map((line) => (
                      <div key={line.id} className="flex justify-between items-center bg-slate-50 p-2 rounded text-slate-700">
                        <span>{line.qtyOrdered}x <strong>{line.product.name}</strong></span>
                        <span className="font-semibold">Rp {line.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
                  <div className="text-left">
                    <span className="text-slate-400 block text-[10px] font-bold tracking-wider">TOTAL TAGIHAN</span>
                    <span className="font-extrabold text-slate-800 text-base">
                      Rp {po.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Logika Tombol Odoo: Muncul Sesuai Status */}
                  {po.status === 'Confirmed' && (
                    <form action={receiveProducts}>
                      <input type="hidden" name="poId" value={po.id} />
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition-all flex items-center gap-1">
                        📦 Terima Barang (Receive)
                      </button>
                    </form>
                  )}
                  {po.status === 'Received' && (
                    <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                      ✓ Barang Masuk Gudang
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}