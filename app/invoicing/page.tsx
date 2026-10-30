import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function InvoicingPage() {
  // ==========================================
  // 1. BACKEND LOGIC: ACCOUNTING ENGINE
  // ==========================================
  
  async function createInvoice(formData: FormData) {
    'use server';
    const soId = formData.get('soId') as string;
    
    const so = await prisma.salesOrder.findUnique({
      where: { id: soId },
      include: { lines: true }
    });
    if (!so) return;

    const invNumber = so.docNumber.replace('SO', 'INV-');
    const exist = await prisma.invoice.findFirst({ where: { docNumber: invNumber }});
    if (exist) return;

    // A. Terbitkan Faktur
    await prisma.invoice.create({
      data: {
        docNumber: invNumber,
        customerId: so.customerId,
        status: 'Posted',
        subtotal: so.subtotal,
        taxAmount: so.taxAmount,
        totalAmount: so.totalAmount,
      }
    });

    // B. AUTO-JOURNAL: Pengakuan Piutang & Pendapatan (Double-Entry)
    // Debit: Trade Receivables (1100)
    // Kredit: Sales Revenue (4000) & PPN Keluaran (2100)
    await prisma.journalEntry.create({
      data: {
        docNumber: invNumber.replace('INV', 'JRN'),
        description: `Pengakuan Piutang Faktur ${invNumber}`,
        lines: {
          create: [
            { accountCode: '1100', debit: so.totalAmount, credit: 0 },
            { accountCode: '4000', debit: 0, credit: so.subtotal },
            { accountCode: '2100', debit: 0, credit: so.taxAmount }
          ]
        }
      }
    });

    revalidatePath('/invoicing');
  }

  async function createBill(formData: FormData) {
    'use server';
    const poId = formData.get('poId') as string;
    
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lines: true }
    });
    if (!po) return;

    const billNumber = po.docNumber.replace('PO', 'BILL-');
    const exist = await prisma.vendorBill.findFirst({ where: { docNumber: billNumber }});
    if (exist) return;

    // A. Terbitkan Tagihan Vendor
    await prisma.vendorBill.create({
      data: {
        docNumber: billNumber,
        vendorId: po.vendorId,
        status: 'Posted',
        subtotal: po.subtotal,
        taxAmount: po.taxAmount,
        totalAmount: po.totalAmount,
      }
    });

    // B. AUTO-JOURNAL: Pengakuan Hutang & Persediaan (Double-Entry)
    // Debit: Inventory Valuation (1200) & PPN Masukan (1150)
    // Kredit: Trade Payables (2000)
    await prisma.journalEntry.create({
      data: {
        docNumber: billNumber.replace('BILL', 'JRN'),
        description: `Pengakuan Hutang Pembelian ${billNumber}`,
        lines: {
          create: [
            { accountCode: '1200', debit: po.subtotal, credit: 0 },
            { accountCode: '1150', debit: po.taxAmount, credit: 0 },
            { accountCode: '2000', debit: 0, credit: po.totalAmount }
          ]
        }
      }
    });

    revalidatePath('/invoicing');
  }


  // ==========================================
  // 2. FETCH DATA KEUANGAN & BUKU BESAR
  // ==========================================
  const salesOrders = await prisma.salesOrder.findMany({ include: { customer: true } });
  const purchaseOrders = await prisma.purchaseOrder.findMany({ include: { vendor: true } });
  const invoices = await prisma.invoice.findMany({ include: { customer: true }, orderBy: { createdAt: 'desc' } });
  const vendorBills = await prisma.vendorBill.findMany({ include: { vendor: true }, orderBy: { createdAt: 'desc' } });
  
  // Ambil data Jurnal Akuntansi (Double-Entry Ledger)
  const journals = await prisma.journalEntry.findMany({
    include: { lines: { include: { account: true } } },
    orderBy: { createdAt: 'desc' }
  });


  // ==========================================
  // 3. FRONTEND UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium">← Home</Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-slate-800">Invoicing & Accounting</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- KOLOM KIRI: PIUTANG / CUSTOMER INVOICES --- */}
        <div className="space-y-6">
          <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-sm">
            <h2 className="font-bold text-lg">Customer Invoices (Piutang)</h2>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-700 text-sm border-b pb-2">Butuh Ditagih (To Invoice)</h3>
            {salesOrders.map(so => {
              const isBilled = invoices.some(inv => inv.docNumber.includes(so.docNumber));
              return (
                <div key={so.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{so.docNumber}</span>
                    <span className="text-xs text-slate-500">{so.customer.name} - Rp {so.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  {isBilled ? (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-md">✓ Invoiced</span>
                  ) : (
                    <form action={createInvoice}>
                      <input type="hidden" name="soId" value={so.id} />
                      <button type="submit" className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm">
                        📄 Create Invoice
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- KOLOM KANAN: HUTANG / VENDOR BILLS --- */}
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white p-4 rounded-xl shadow-sm">
            <h2 className="font-bold text-lg">Vendor Bills (Hutang)</h2>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-700 text-sm border-b pb-2">Butuh Dicatat (To Bill)</h3>
            {purchaseOrders.filter(po => po.status === 'Received').map(po => {
              const isBilled = vendorBills.some(bill => bill.docNumber.includes(po.docNumber));
              return (
                <div key={po.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{po.docNumber}</span>
                    <span className="text-xs text-slate-500">{po.vendor.name} - Rp {po.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  {isBilled ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-md">✓ Billed</span>
                  ) : (
                    <form action={createBill}>
                      <input type="hidden" name="poId" value={po.id} />
                      <button type="submit" className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm">
                        📝 Create Bill
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- FULL WIDTH: BUKU BESAR / JOURNAL ENTRIES --- */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4">
          <div className="p-4 border-b border-slate-100 bg-slate-800 flex justify-between items-center">
            <h2 className="font-bold text-white text-sm">Buku Besar / Journal Entries (Otomatis)</h2>
            <span className="text-xs bg-slate-600 text-white px-2 py-1 rounded">Double-Entry Ledger</span>
          </div>
          
          <div className="p-4">
            {journals.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Belum ada mutasi jurnal. Coba terbitkan Invoice/Bill di atas!</p>
            ) : (
              <div className="space-y-6">
                {journals.map(journal => (
                  <div key={journal.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-700 text-sm mr-2">{journal.docNumber}</span>
                        <span className="text-xs text-slate-500">{journal.description}</span>
                      </div>
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-2 w-1/2">Akun (COA)</th>
                          <th className="px-4 py-2 text-right">Debit (Rp)</th>
                          <th className="px-4 py-2 text-right">Kredit (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {journal.lines.map(line => (
                          <tr key={line.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-700">
                              <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-[10px] mr-2">{line.accountCode}</span>
                              {line.account.name}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-slate-800">
                              {line.debit > 0 ? line.debit.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-slate-800">
                              {line.credit > 0 ? line.credit.toLocaleString('id-ID') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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