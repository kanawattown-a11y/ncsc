import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Core counters
    const totalPersons = await prisma.person.count();
    const bannedPersons = await prisma.person.count({
      where: { records: { some: { active: true } } }
    });
    const activeUsers = await prisma.user.count({ where: { status: "ACTIVE" } });
    const pendingRequests = await prisma.editRequest.count({ where: { status: "PENDING" } });

    // 2. Crime types distribution
    const recordsByType = await prisma.securityRecord.groupBy({
      by: ['type'],
      _count: { _all: true },
    });

    // 3. Weekly activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyData = await prisma.person.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
    });

    return NextResponse.json({
      counters: {
        total: totalPersons,
        banned: bannedPersons,
        checkpoints: activeUsers,
        alerts: pendingRequests
      },
      distribution: recordsByType.map(r => ({ name: r.type, value: r._count._all })),
      weekly: weeklyData.map(w => ({ date: w.createdAt, count: w._count._all }))
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
