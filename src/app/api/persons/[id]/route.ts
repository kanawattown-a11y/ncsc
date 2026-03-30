import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { analyzeSecurity } from "@/lib/intelligence";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const person = await (prisma as any).person.findUnique({
      where: { id: params.id },
      include: { 
        records: { where: { deletedAt: null } }, 
        documents: { where: { deletedAt: null } } 
      }
    });

    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    const report = analyzeSecurity(person);
    return NextResponse.json({ ...report, person });
  } catch (error) {
    console.error("Fetch person error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
      physicalMarks, photoUrl, photoId, civilRecord, civilRegistry,
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
        photoId,
        civilRecord,
        civilRegistry,
        notes,
      },
    });

    // 2. Handle SecurityRecord Updates/Creates
    if (records && Array.isArray(records)) {
      for (const rec of records) {
        if (rec.id) {
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

    // Standardized Auditing Logic
    await recordAudit(
      (session.user as any).id,
      "UPDATE_PERSON",
      "Person",
      params.id,
      `Updated profile for citizen ${oldPerson?.nationalId}.`,
      { updatedFields: Object.keys(data).filter(k => k !== 'records') }
    );

    // Return full updated person with Intelligence Report
    const updatedPerson = await (prisma as any).person.findUnique({
      where: { id: params.id },
      include: { 
        records: { where: { deletedAt: null } }, 
        documents: { where: { deletedAt: null } } 
      }
    });

    const report = analyzeSecurity(updatedPerson);

    return NextResponse.json({ ...report, person: updatedPerson });
  } catch (error) {
    console.error("Update person error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
