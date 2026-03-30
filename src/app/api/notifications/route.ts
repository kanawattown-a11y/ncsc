import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    const userRole = (session.user as any).role;

    // Fetch notifications:
    // 1. Where targetUserId = me
    // 2. Where targetRole = my role
    // 3. Where both are null (General broadcast - though we use targetRole for that)
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          { targetRole: userRole },
          { AND: [{ targetUserId: null }, { targetRole: null }] }
        ]
      },
      include: {
        sender: { select: { username: true } },
        receipts: { where: { userId } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Map to include 'isRead' locally for the user
    const formatted = notifications.map(n => ({
      ...n,
      isRead: n.receipts.length > 0
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content, priority, targetRole, targetUserId } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        priority: priority || "NORMAL",
        targetRole: targetRole || null,
        targetUserId: targetUserId || null,
        senderId: session.user.id
      }
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
