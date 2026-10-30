import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Menggunakan tabel contact yang sudah pasti ada di schema.prisma
    const jumlah = await prisma.contact.count();
    return Response.json({
      status: "ok",
      database: "connected",
      contactRows: jumlah,
    });
  } catch {
    return Response.json(
      { status: "error", database: "unreachable" },
      { status: 500 },
    );
  }
}
