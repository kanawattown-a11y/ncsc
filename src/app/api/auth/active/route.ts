import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { lastActive: true } });
    
    // Only update if last active was more than 45 seconds ago (debounce)
    const fortyFiveSecsAgo = new Date(Date.now() - 45 * 1000);
    if (!user?.lastActive || user.lastActive < fortyFiveSecsAgo) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActive: new Date() }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error", error);
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
  }
}
