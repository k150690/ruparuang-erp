import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function POSPage() {
  // ==========================================
  // 1. BACKEND LOGIC: PROSES CHECKOUT KERANJANG
  // ==========================================
  async function processCheckout(formData: FormData) {
    'use server';
    
    const allProducts = await prisma.product.findMany();
    const cart = [];

    // Kumpulin semua barang yang Qty-nya diisi lebih dari 0
    for (const p of allProducts) {
      const qty = parseInt(formData.get(`qty_${p.sku}`) as string) || 0;
      if (qty > 0) {
        cart.push({
          sku: p.sku,
          name: p.name,
          price: p.salesPrice,
          qty: qty,
          subtotal: p.salesPrice * qty
        });
      }
    }

    // Kalo keranjang kosong, batalin transaksi
    if (cart.length === 0) return;

    // A. Validasi & Potong Stok di SHOP
    for (const item of cart) {
      const stock = await prisma.stock.findUnique({
        where: { sku_locationId: { sku: item.sku, locationId: 'SHOP' } }
      });
      if (!stock || stock.qtyOnHand < item.qty) return; // Tolak kalo stok ga cukup

      await prisma.stock.update({
        where: { sku_locationId: { sku: item.sku, locationId: 'SHOP' } },
        data: { qtyOnHand: { decrement: item.qty } }
      });
    }

    // B. Siapin Sesi Kasir
    let session = await prisma.pOSSession.findFirst({ where: { status: 'Open' } });
    if (!session) {
      session = await prisma.pOSSession.create({
        data: { sessionNumber: `SESS-${Math.floor(Date.now() / 1000)}`, cashierName: 'Kasir Utama', startBalance: 0 }
      });
    }

    // C. Hitung Total & Simpan Struk
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const tax = subtotal * 0.11;
    const total = subtotal + tax;
    
    await prisma.pOSOrder.create({
      data: {
        sessionId: session.id,
        docNumber: `TRX-${Math.floor(Date.now() / 1000)}`,
        subtotal, taxAmount: tax, totalAmount: total, paidAmount: total, change: 0,
        lines: {
          create: cart.map(item => ({
            sku: item.sku, qty: item.qty, unitPrice: item.price, subtotal: item.subtotal
          }))
        }
      }
    });

    revalidatePath('/pos');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
  }


  // ==========================================
  // 2. FETCH DATA & UI
  // ==========================================
  const sessions = await prisma.pOSSession.findMany({
    include: { orders: { include: { lines: { include: { product: true } } } } },
    orderBy: { openedAt: 'desc' },
  });

  const shopProducts = await prisma.product.findMany({
    include: { stocks: { where: { locationId: 'SHOP' } } },
    orderBy: { sku: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium">← Home</Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-slate-800">Point of Sale (POS) / Mesin Kasir Aktif</h1>
        </div>
        <div className="text-xs bg-rose-100 text-rose-800 px-3 py-1.5 rounded-md font-mono font-semibold">
          Total Transaksi TRX: {sessions.flatMap(s => s.orders).length}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- KIRI: KATALOG PRODUK + FORM CHECKOUT --- */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
            <h2 className="font-bold text-slate-800">Katalog Gerai Depok</h2>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">PILIH QTY LALU BAYAR</span>
          </div>

          <form action={processCheckout}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-20">
              {shopProducts.map((p) => {
                const shopQty = p.stocks[0]?.qtyOnHand || 0;
                const isOutOfStock = shopQty <= 0;

                return (
                  <div key={p.sku} className={`border rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all ${isOutOfStock ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-rose-300'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{p.sku}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          Sisa: {shopQty}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-xs mb-1 line-clamp-2">{p.name}</h3>
                      <span className="font-extrabold text-slate-700 text-xs">Rp {p.salesPrice.toLocaleString('id-ID')}</span>
                    </div>
                    
                    {/* Input Qty Belanja */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Beli:</span>
                        <input 
                          type="number" 
                          name={`qty_${p.sku}`} 
                          defaultValue="0" 
                          min="0" 
                          max={shopQty} 
                          disabled={isOutOfStock}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded px-2 py-1 focus:ring-rose-500 focus:border-rose-500 outline-none disabled:bg-slate-200 disabled:cursor-not-allowed transition-all"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tombol Checkout Melayang di Bawah */}
            <div className="fixed bottom-6 left-6 lg:w-[62%] bg-slate-800 p-4 rounded-xl flex justify-between items-center shadow-2xl z-20 border border-slate-700">
              <div className="text-white">
                <span className="block text-xs font-medium text-slate-400">Total belanja & PPN dihitung otomatis.</span>
                <span className="block text-sm font-bold">Pilih Qty Barang di atas ⬆️</span>
              </div>
              <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-3 rounded-lg shadow-md transition-all flex items-center gap-2">
                🛒 Checkout & Bayar
              </button>
            </div>
          </form>
        </div>

        {/* --- KANAN: STRUK / RIWAYAT TRANSAKSI --- */}
        <div className="space-y-4 pb-20">
          <div className="bg-slate-800 text-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <h2 className="font-bold">Riwayat Transaksi</h2>
            <span className="text-xs text-slate-300 font-mono">Real-time</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto p-4 space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="space-y-3">
                <div className="text-xs font-bold text-slate-400 border-b border-slate-100 pb-1 uppercase">
                  Sesi: {session.sessionNumber}
                </div>
                
                {session.orders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada struk penjualan.</p>
                ) : (
                  session.orders.map(order => (
                    <div key={order.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs shadow-sm">
                      <div className="flex justify-between font-bold text-slate-700 mb-2 border-b border-slate-200 pb-2">
                        <span>{order.docNumber}</span>
                        <span className="text-rose-600">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                      </div>
                      {order.lines.map(line => (
                        <div key={line.id} className="flex justify-between text-slate-600 mb-1">
                          <span>{line.qty}x {line.product.name}</span>
                          <span className="font-medium">Rp {line.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      <div className="text-right mt-2 pt-2 border-t border-slate-200 text-slate-500 font-semibold">
                        + PPN 11%: Rp {order.taxAmount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}