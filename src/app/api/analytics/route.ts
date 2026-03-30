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
    const onlineDataEntry = await (prisma.user as any).count({ 
      where: { role: "DATA_ENTRY", lastActive: { gte: fiveMinsAgo } } 
    });
    const onlineCheckpoints = await (prisma.user as any).count({ 
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

    // 3. Weekly activity (filling gaps with 0 for a clean 7-day chart)
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const count = await prisma.person.count({
        where: {
          createdAt: {
            gte: new Date(dateStr + 'T00:00:00Z'),
            lte: new Date(dateStr + 'T23:59:59Z')
          },
          deletedAt: null
        }
      });
      
      weekly.push({ date: dateStr, count });
    }

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
