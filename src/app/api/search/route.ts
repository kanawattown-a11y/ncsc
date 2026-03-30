import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const isBanned = person.records && person.records.length > 0;

    return NextResponse.json({
      status: isBanned ? "BANNED" : "CLEARED",
      person,
      records: person.records || []
    });

  } catch (error) {
    console.error("Search error", error);
    return NextResponse.json({ error: "Database Connection Error" }, { status: 500 });
  }
}
