import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Core counters
    const totalPersons = await prisma.person.count({ where: { deletedAt: null } });
    const bannedPersons = await prisma.person.count({
      where: { deletedAt: null, records: { some: { active: true, deletedAt: null } } }
    });
    
    // Online Logic: Users active in the last 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineDataEntry = await prisma.user.count({ 
      where: { role: "DATA_ENTRY", lastActive: { gte: fiveMinsAgo } } 
    });
    const onlineCheckpoints = await prisma.user.count({ 
      where: { role: "CHECKPOINT", lastActive: { gte: fiveMinsAgo } } 
    });
    
    const activeUsers = await prisma.user.count({ where: { status: "ACTIVE" } });
    const pendingRequests = await prisma.editRequest.count({ where: { status: "PENDING" } });

    // 2. Crime types distribution
    const recordsByType = await prisma.securityRecord.groupBy({
      by: ['type'],
      where: { deletedAt: null, active: true },
      _count: { _all: true },
    });

    // 3. Weekly activity (last 7 days aggregate)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Grouping by date in raw SQL or mapped logic since prisma groupBy by DateTime is per-second
    const weeklyDataRaw = await prisma.person.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null },
      select: { createdAt: true }
    });

    const dailyCounts = weeklyDataRaw.reduce((acc: any, curr) => {
      const date = curr.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const weekly = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      counters: {
        total: totalPersons,
        banned: bannedPersons,
        checkpoints: activeUsers,
        alerts: pendingRequests,
        online: {
          dataEntry: onlineDataEntry,
          checkpoint: onlineCheckpoints,
          total: onlineDataEntry + onlineCheckpoints
        }
      },
      distribution: recordsByType.map(r => ({ name: r.type, value: r._count._all })),
      weekly
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
