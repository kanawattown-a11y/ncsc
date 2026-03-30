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
      physicalMarks, photoUrl 
    } = data as any;

    const oldPerson = await prisma.person.findUnique({
      where: { id: params.id }
    });

    const person = await prisma.person.update({
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
      },
    });

    // Log the audit action with diffs
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE_PERSON",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({
          message: `Updated person details for ${person.nationalId}.`,
          old: oldPerson,
          new: person
        })
      }
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("Update person error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
