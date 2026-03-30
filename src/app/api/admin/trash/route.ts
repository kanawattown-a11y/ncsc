import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "DATA_ENTRY") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const trashedDocs = await (prisma as any).document.findMany({
      where: { NOT: { deletedAt: null } },
      include: { person: true },
      orderBy: { deletedAt: "desc" }
    });

    return NextResponse.json(trashedDocs);
  } catch (error) {
    console.error("Trash fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const { id, action } = await request.json();

    if (action === "RESTORE") {
      const doc = await (prisma as any).document.update({
        where: { id },
        data: { deletedAt: null }
      });

      await recordAudit(
        (session.user as any).id,
        "RESTORE_DOCUMENT",
        "Document",
        id,
        `Restored document ${doc.name} from trash.`
      );

      return NextResponse.json({ success: true, message: "تم استعادة المستند بنجاح" });
    }

    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
