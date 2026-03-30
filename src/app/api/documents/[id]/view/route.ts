import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPresignedViewUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  const { id } = params;
  if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });

  try {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 1. Get signed URL
    const url = await getPresignedViewUrl(document.fileKey);

    // 2. Direct Redirect - this is why images weren't showing! 
    // They were hitting an API that returned JSON instead of binary or a redirect.
    return NextResponse.redirect(url, { status: 302 });

  } catch (error) {
    console.error("Document redirect error:", error);
    return NextResponse.json({ error: "Server Failed" }, { status: 500 });
  }
}
