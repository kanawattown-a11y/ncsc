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
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Access Denied - Direct edit is for Admin only" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { 
      fullName, motherName, dateOfBirth, placeOfBirth, 
      gender, address, job, maritalStatus, bloodType, 
      physicalMarks, photoUrl, civilRecord, civilRegistry,
      notes, records
    } = data as any;

    const oldPerson = await prisma.person.findUnique({
      where: { id: params.id },
      include: { records: true }
    });

    // 1. Update Person Basic Info
    await (prisma as any).person.update({
      where: { id: params.id },
      data: {
        fullName,
        motherName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        placeOfBirth,
        gender,
        address,
        job,
        maritalStatus,
        bloodType,
        physicalMarks,
        photoUrl,
        civilRecord,
        civilRegistry,
        notes,
      },
    });

    // 2. Handle SecurityRecord Updates/Creates (including branch field)
    if (records && Array.isArray(records)) {
      for (const rec of records) {
        if (rec.id) {
          // Update existing record
          await prisma.securityRecord.update({
            where: { id: rec.id },
            data: {
              type: rec.type,
              reason: rec.reason,
              severity: rec.severity,
              branch: rec.branch || null,
              active: rec.active !== undefined ? rec.active : true,
              source: rec.source || "INTERNAL"
            } as any
          });
        } else {
          // Create new record from edit form
          await prisma.securityRecord.create({
            data: {
              personId: params.id,
              type: rec.type,
              reason: rec.reason,
              severity: rec.severity,
              branch: rec.branch || null,
              source: rec.source || "INTERNAL",
              active: true
            } as any
          });
        }
      }
    }

    // Log the audit action
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE_PERSON_AND_RECORDS",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({
          message: `Updated person details and security records for ${oldPerson?.nationalId}.`,
        })
      }
    });

    // Return full updated person with records + documents for immediate UI refresh
    const updatedPerson = await (prisma as any).person.findUnique({
      where: { id: params.id },
      include: { records: true, documents: true }
    });

    return NextResponse.json(updatedPerson);
  } catch (error) {
    console.error("Update person error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
