import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
    }

    // Check if receipt already exists
    // We use any cast here to resolve a temporary Prisma client generation discrepancy
    const existing = await (prisma as any).notificationReadReceipt.findUnique({
      where: {
        notificationId_userId: { notificationId, userId }
      }
    });

    if (!existing) {
      await (prisma as any).notificationReadReceipt.create({
        data: {
          notificationId,
          userId,
          readAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
