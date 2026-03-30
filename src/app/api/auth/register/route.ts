import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, role } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "اسم المستخدم أو المعرف موجود مسبقاً" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role === "DATA_ENTRY" ? "DATA_ENTRY" : "CHECKPOINT",
        status: "PENDING" // As per policy
      }
    });

    return NextResponse.json(
      { message: "تم تسجيل طلبك بنجاح، يرجى انتظار مصادقة الإدارة." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء تسجيل الدخول." }, { status: 500 });
  }
}
