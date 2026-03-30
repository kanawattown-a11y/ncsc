import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_CONFIGS = {
  WARRANT_TYPES: ["أمنية", "جنائية", "سياسية", "منع سفر", "مطلوب للتحقيق", "أخرى"],
  BRANCHES: ["فرع فلسطين (235)", "مخابرات الجوية", "الأمن الجنائي", "الأمن السياسي", "فرع المنطقة (227)", "إدارة المخابرات العامة"],
  SEVERITIES: [
    { label: "عالية الخطورة (توقيف)", value: "HIGH", color: "#EF4444" },
    { label: "متوسطة (تدقيق)", value: "MEDIUM", color: "#F59E0B" },
    { label: "منخفضة (مراقبة)", value: "LOW", color: "#3B82F6" }
  ]
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const configs = await (prisma as any).systemConfig.findMany();
    const configMap = configs.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

    // Fallback to defaults if not in DB
    const finalConfig = {
      WARRANT_TYPES: configMap["WARRANT_TYPES"] || DEFAULT_CONFIGS.WARRANT_TYPES,
      BRANCHES: configMap["BRANCHES"] || DEFAULT_CONFIGS.BRANCHES,
      SEVERITIES: configMap["SEVERITIES"] || DEFAULT_CONFIGS.SEVERITIES,
    };

    return NextResponse.json(finalConfig);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const { key, value } = await request.json();
    if (!key || !value) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const config = await (prisma as any).systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
