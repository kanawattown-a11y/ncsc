import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const { password, username } = data;
    const userId = (session.user as any).id;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (password) {
      if (password.length < 6) return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: "UPDATE_PROFILE",
        entity: "User",
        entityId: userId,
        details: "Updated account settings/password."
      }
    });

    return NextResponse.json({ success: true, user: { username: updatedUser.username, role: updatedUser.role } });
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
