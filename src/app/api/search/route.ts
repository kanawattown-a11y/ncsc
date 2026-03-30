import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPresignedViewUrl } from "@/lib/s3";

export async function GET(request: Request) {
  // 1. Session Protection Layer
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Access Denied - Auth Missing" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "معامل البحث مفقود" }, { status: 400 });
  }

  try {
    const person = await prisma.person.findFirst({
      where: {
        OR: [
          { nationalId: q },
          { fullName: { contains: q } }
        ]
      },
      include: {
        records: {
          where: { active: true },
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!person) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // Enhance documents with presigned URLs for previews
    const documentsWithUrls = await Promise.all(
      person.documents.map(async (doc) => {
        try {
          const viewUrl = await getPresignedViewUrl(doc.fileKey);
          return { ...doc, viewUrl };
        } catch (err) {
          console.error("Presigned URL error for doc:", doc.id, err);
          return doc;
        }
      })
    );

    const isBanned = person.records && person.records.length > 0;

    return NextResponse.json({
      status: isBanned ? "BANNED" : "CLEARED",
      person: { ...person, documents: documentsWithUrls },
      records: person.records || []
    });

  } catch (error) {
    console.error("Search error", error);
    return NextResponse.json({ error: "Database Connection Error" }, { status: 500 });
  }
}
