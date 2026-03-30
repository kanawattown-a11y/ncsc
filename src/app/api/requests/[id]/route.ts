import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  try {
    const data = await request.json();
    const { status } = data; // APPROVED or REJECTED

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "حالة الطلب غير صالحة" }, { status: 400 });
    }

    const editRequest = await prisma.editRequest.findUnique({
      where: { id: params.id }
    });

    if (!editRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (status === "APPROVED") {
      const changes = JSON.parse(editRequest.proposedChanges) as any;
      
      // 1. Update the actual Person record
      await prisma.person.update({
        where: { id: editRequest.entityId! },
        data: {
          fullName: changes.fullName,
          motherName: changes.motherName,
          dateOfBirth: changes.dateOfBirth ? new Date(changes.dateOfBirth) : undefined,
          placeOfBirth: changes.placeOfBirth,
          job: changes.job,
          physicalMarks: changes.physicalMarks,
        }
      });
    }

    // 2. Mark request as finalized
    const updatedRequest = await prisma.editRequest.update({
      where: { id: params.id },
      data: {
        status,
        adminId: (session.user as any).id
      }
    });

    // 3. Log the decision
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: `DECIDE_EDIT_REQUEST_${status}`,
        entity: "EditRequest",
        entityId: updatedRequest.id,
        details: `${status} request for person ${editRequest.entityId}.`
      }
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Decide request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
