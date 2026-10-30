import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function SalesPage() {
  // ==========================================
  // 1. BACKEND LOGIC (SERVER ACTIONS)
  // ==========================================
  async function confirmQuotation(formData: FormData) {
    'use server'; // Ini yang bikin Next.js ngejalanin kodingan ini di server (backend)
    
    const quotationId = formData.get('quotationId') as string;

    // Cari data penawaran yang mau dikonfirmasi
    const quote = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { lines: true }
    });

    if (!quote || quote.status !== 'Draft') return;

    // A. Bikin dokumen Sales Order (SO) baru dari data Penawaran
    await prisma.salesOrder.create({
      data: {
        docNumber: quote.docNumber.replace('Q', 'SO'), // Q00031 jadi SO00031
        customerId: quote.customerId,
        status: 'Confirmed',
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        totalAmount: quote.totalAmount,
        lines: {
          create: quote.lines.map(l => ({
            sku: l.sku,
            qtyOrdered: l.qty,
            unitPrice: l.unitPrice,
            subtotal: l.subtotal
          }))
        }
      }
    });

    // B. Ubah status Quotation jadi Confirmed
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'Confirmed' }
    });

    // C. Refresh halaman otomatis biar data terupdate
    revalidatePath('/sales');
  }


  // ==========================================
  // 2. FETCH DATA DARI DATABASE
  // ==========================================
  const quotations = await prisma.quotation.findMany({
    include: { customer: true, lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const salesOrders = await prisma.salesOrder.findMany({
    include: { customer: true, lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });


  // ==========================================
  // 3. FRONTEND UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium">← Home</Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-slate-800">Sales & CRM / Penjualan B2B</h1>
        </div>
        <div className="flex gap-2">
          <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1.5 rounded-md font-mono font-semibold">
            Quotations: {quotations.length}
          </span>
          <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-md font-mono font-semibold">
            Sales Orders: {salesOrders.length}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* --- DAFTAR QUOTATION --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 text-sm">Daftar Quotation (Penawaran)</h2>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotations.map((q) => (
              <div key={q.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono font-bold text-purple-700 text-sm bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {q.docNumber}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base mt-2">{q.customer.name}</h3>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${q.status === 'Draft' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                      {q.status}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3 space-y-2 text-xs">
                    {q.lines.map((line) => (
                      <div key={line.id} className="flex justify-between items-center bg-slate-50 p-2 rounded text-slate-700">
                        <span>{line.qty}x <strong>{line.product.name}</strong></span>
                        <span className="font-semibold">Rp {line.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] font-bold">TOTAL</span>
                    <span className="font-extrabold text-slate-800 text-base">Rp {q.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {/* Tombol Konfirmasi (Hanya muncul kalo status Draft) */}
                  {q.status === 'Draft' && (
                    <form action={confirmQuotation}>
                      <input type="hidden" name="quotationId" value={q.id} />
                      <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm">
                        Confirm to SO
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- DAFTAR SALES ORDER --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 text-sm">Daftar Sales Order (Confirmed)</h2>
          </div>

          <div className="p-4">
            {salesOrders.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Belum ada Sales Order terkonfirmasi.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salesOrders.map((so) => (
                  <div key={so.id} className="border border-emerald-200 rounded-xl p-5 bg-emerald-50/30 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-mono font-bold text-emerald-700 text-sm bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          {so.docNumber}
                        </span>
                        <h3 className="font-bold text-slate-800 text-base mt-2">{so.customer.name}</h3>
                      </div>
                      <span className="text-xs bg-green-200 text-green-900 px-2.5 py-1 rounded-full font-semibold">
                        {so.status}
                      </span>
                    </div>
                    <div className="border-t border-emerald-100 pt-3 mt-4 text-right">
                      <span className="text-slate-500 block text-[10px] font-bold">TOTAL TRANSAKSI</span>
                      <span className="font-extrabold text-slate-800 text-base">Rp {so.totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}