import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function CRMPage() {
  // ==========================================
  // 1. BACKEND LOGIC: SERVER ACTIONS
  // ==========================================

  // A. Tambah Lead / Prospek Baru
  async function createLead(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const contactName = formData.get('contactName') as string;
    const value = parseFloat(formData.get('value') as string) || 0;

    if (!title || !contactName) return;

    await prisma.lead.create({
      data: {
        title,
        contactName,
        value,
        stage: 'New'
      }
    });

    revalidatePath('/crm');
  }

  // B. Geser Stage Lead (New -> Qualified -> Proposition -> Won)
  async function updateLeadStage(formData: FormData) {
    'use server';
    const leadId = formData.get('leadId') as string;
    const nextStage = formData.get('nextStage') as string;

    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: nextStage }
    });

    revalidatePath('/crm');
  }


  // ==========================================
  // 2. FETCH DATA LEADS
  // ==========================================
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const stages = [
    { id: 'New', label: '🆕 Prospek Baru', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'Qualified', label: '🎯 Terkualifikasi', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { id: 'Proposition', label: '💼 Negosiasi / Proposal', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { id: 'Won', label: '🎉 Deal (Won)', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Odoo style */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium">← Home</Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-lg font-bold text-slate-800">CRM / Pipeline Peluang Penjualan</h1>
        </div>
        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-mono font-semibold">
          Total Leads: {leads.length}
        </span>
      </div>

      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        
        {/* --- FORM TAMBAH LEAD BARU --- */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 text-sm mb-3">➕ Input Peluang / Prospek Baru</h2>
          <form action={createLead} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input 
              type="text" 
              name="title" 
              placeholder="Judul Prospek (misal: Pengadaan Meja Kantor)" 
              required 
              className="bg-slate-50 border border-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input 
              type="text" 
              name="contactName" 
              placeholder="Nama Klien / Perusahaan" 
              required 
              className="bg-slate-50 border border-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input 
              type="number" 
              name="value" 
              placeholder="Estimasi Nilai (Rp)" 
              className="bg-slate-50 border border-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-all"
            >
              + Simpan Prospek
            </button>
          </form>
        </div>

        {/* --- PAPAN KANBAN (BOARD STAGES) --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {stages.map(stg => {
            const stageLeads = leads.filter(l => l.stage === stg.id);
            const totalValue = stageLeads.reduce((acc, curr) => acc + curr.value, 0);

            return (
              <div key={stg.id} className="bg-slate-100 rounded-xl p-3 border border-slate-200 min-h-[450px] flex flex-col justify-between">
                <div>
                  {/* Stage Header */}
                  <div className={`p-3 rounded-lg border font-bold text-xs flex justify-between items-center mb-3 ${stg.color}`}>
                    <span>{stg.label}</span>
                    <span className="bg-white/80 px-2 py-0.5 rounded-full text-[10px]">{stageLeads.length}</span>
                  </div>
                  
                  <div className="text-[11px] text-slate-500 font-semibold mb-3 px-1">
                    Est Total: <span className="text-slate-800 font-bold">Rp {totalValue.toLocaleString('id-ID')}</span>
                  </div>

                  {/* List Cards in Stage */}
                  <div className="space-y-3">
                    {stageLeads.map(lead => (
                      <div key={lead.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-purple-300 transition-all">
                        <h3 className="font-bold text-slate-800 text-xs">{lead.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">👤 {lead.contactName}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100 font-extrabold text-slate-800 text-xs">
                          Rp {lead.value.toLocaleString('id-ID')}
                        </div>

                        {/* Tombol Geser Stage */}
                        <div className="mt-3 flex gap-1 pt-2 border-t border-slate-100">
                          {stg.id === 'New' && (
                            <form action={updateLeadStage} className="w-full">
                              <input type="hidden" name="leadId" value={lead.id} />
                              <input type="hidden" name="nextStage" value="Qualified" />
                              <button type="submit" className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[10px] py-1 rounded">
                                Lanjut Qualified ➔
                              </button>
                            </form>
                          )}
                          {stg.id === 'Qualified' && (
                            <form action={updateLeadStage} className="w-full">
                              <input type="hidden" name="leadId" value={lead.id} />
                              <input type="hidden" name="nextStage" value="Proposition" />
                              <button type="submit" className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-[10px] py-1 rounded">
                                Kirim Proposal ➔
                              </button>
                            </form>
                          )}
                          {stg.id === 'Proposition' && (
                            <form action={updateLeadStage} className="w-full">
                              <input type="hidden" name="leadId" value={lead.id} />
                              <input type="hidden" name="nextStage" value="Won" />
                              <button type="submit" className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] py-1 rounded">
                                Mark as Won (Deal) 🎉
                              </button>
                            </form>
                          )}
                          {stg.id === 'Won' && (
                            <span className="w-full text-center text-emerald-600 font-bold text-[10px] bg-emerald-50 py-1 rounded border border-emerald-200">
                              ✓ Siap Jadi Quotation Sales
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}