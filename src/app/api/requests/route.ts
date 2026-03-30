import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Submit a new request (Data Entry) or fetch pending (Admin)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const { personId, proposedChanges } = data;

    if (!personId || !proposedChanges) {
      return NextResponse.json({ error: "بيانات الطلب غير مكتملة" }, { status: 400 });
    }

    const editRequest = await prisma.editRequest.create({
      data: {
        dataEntryId: (session.user as any).id,
        entity: "Person",
        entityId: personId,
        proposedChanges: JSON.stringify(proposedChanges),
        status: "PENDING"
      }
    });

    // Log the request creation
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE_EDIT_REQUEST",
        entity: "EditRequest",
        entityId: editRequest.id,
        details: `Submitted edit request for person ${personId}.`
      }
    });

    return NextResponse.json(editRequest);
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const requests = await prisma.editRequest.findMany({
      include: { dataEntry: true },
      orderBy: { createdAt: "desc" }
    });

    // Merge current data for persons
    const enrichedRequests = await Promise.all(requests.map(async (req) => {
      if (req.entity === "Person" && req.entityId) {
        const currentData = await prisma.person.findUnique({
          where: { id: req.entityId }
        });
        return { ...req, currentData };
      }
      return req;
    }));

    return NextResponse.json(enrichedRequests);
  } catch (error) {
    console.error("Fetch requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
