import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPresignedViewUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  // High Security: Force Authentication Context
  if (!session || !session.user) {
    return NextResponse.json({ error: "Access Denied - Auth Missing" }, { status: 401 });
  }

  const role = (session.user as any)?.role;
  const { id } = params;

  if (!id) return NextResponse.json({ error: "Document ID required" }, { status: 400 });

  try {
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or soft-deleted" }, { status: 404 });
    }

    // Role Checks: All allowed roles can view documents, but Checkpoints must not modify
    if (role !== "ADMIN" && role !== "DATA_ENTRY" && role !== "CHECKPOINT") {
       return NextResponse.json({ error: "Unauthorized Layer" }, { status: 403 });
    }

    // Give secure volatile 15-min reading URL only
    const url = await getPresignedViewUrl(document.fileKey);

    return NextResponse.json({ url, document });

  } catch (error) {
    console.error("Presigned fetch error:", error);
    return NextResponse.json({ error: "S3 Key/Retrieval System Failed" }, { status: 500 });
  }
}
