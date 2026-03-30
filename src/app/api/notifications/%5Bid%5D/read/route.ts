import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    const notificationId = params.id;

    // Check if receipt already exists
    const existing = await prisma.notificationReadReceipt.findUnique({
      where: {
        notificationId_userId: { notificationId, userId }
      }
    });

    if (!existing) {
      await prisma.notificationReadReceipt.create({
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
