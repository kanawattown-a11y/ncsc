import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  try {
    const { id } = await request.json(); // Use ID from body if not in params

    const person = await prisma.person.update({
      where: { id: id },
      data: { deletedAt: null }
    });

    // Log the restoration
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "RESTORE_PERSON",
        entity: "Person",
        entityId: id,
        details: `Restored person ${person.fullName} from trash.`
      }
    });

    return NextResponse.json({ success: true, person });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
