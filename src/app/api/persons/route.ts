import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "DATA_ENTRY") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { 
      nationalId, fullName, motherName, dateOfBirth, 
      placeOfBirth, gender, address, job, 
      maritalStatus, bloodType, physicalMarks, photoUrl, records 
    } = data;

    if (!nationalId || !fullName) {
      return NextResponse.json({ error: "الرقم الوطني والاسم الكامل إجبارية" }, { status: 400 });
    }

    // Check existing
    const existing = await prisma.person.findUnique({ where: { nationalId } });
    if (existing) {
      return NextResponse.json({ error: "هذا الرقم الوطني مسجل مسبقاً" }, { status: 400 });
    }

    const newPerson = await prisma.person.create({
      data: {
        nationalId,
        fullName,
        motherName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        placeOfBirth,
        gender,
        address,
        job,
        maritalStatus,
        bloodType,
        physicalMarks,
        photoUrl,
        records: {
          create: records?.map((r: any) => ({
            type: r.type,
            reason: r.reason,
            source: r.source,
            severity: r.severity,
            active: true
          })) || []
        }
      },
      include: { records: true }
    });

    // Log the action securely
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE_PERSON",
        entity: "Person",
        entityId: newPerson.id,
        details: `Created person ${nationalId} with ${records?.length || 0} records.`
      }
    });

    return NextResponse.json(newPerson);
  } catch (error) {
    console.error("Create person error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
