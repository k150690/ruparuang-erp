import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0;

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { contactId: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Control Panel / Navigation Navbar Odoo style */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium">
            ← Home
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-slate-800">Contacts / Master Kontak</h1>
        </div>
        <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md font-mono">
          Total Kontak: {contacts.length}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-purple-300 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                  {c.contactId}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    c.type === 'VENDOR'
                      ? 'bg-amber-100 text-amber-800'
                      : c.type === 'BUSINESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {c.type}
                </span>
              </div>

              <h2 className="font-bold text-slate-800 text-base mb-1">{c.name}</h2>
              <p className="text-xs text-slate-500 mb-4">📍 {c.city}</p>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                {c.type !== 'VENDOR' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Limit Kredit:</span>
                    <span className="font-semibold text-slate-800">
                      Rp {c.creditLimit.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Termin Bayar:</span>
                  <span className="font-medium text-slate-700">{c.paymentTerms}</span>
                </div>
                {c.category && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kategori Vendor:</span>
                    <span className="font-medium text-slate-700">{c.category}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}