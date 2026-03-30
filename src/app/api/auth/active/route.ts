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
    await (prisma as any).user.update({
      where: { id: session.user.id },
      data: { lastActive: new Date() }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error", error);
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
  }
}
