import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPresignedViewUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    const document = await prisma.document.findFirst({
      where: { id, deletedAt: null }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or soft-deleted" }, { status: 404 });
    }

    const url = await getPresignedViewUrl(document.fileKey);
    return NextResponse.json({ url, document });

  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Retrieval System Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "DATA_ENTRY") {
     return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const doc = await prisma.document.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    });

    await recordAudit(
      (session.user as any).id,
      "DELETE_DOCUMENT",
      "Document",
      doc.id,
      `Soft-deleted document ${doc.name} (Archived for Traceability).`,
      { fileName: doc.name }
    );

    return NextResponse.json({ success: true, message: "تمت أرشفة المستند بنجاح" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
