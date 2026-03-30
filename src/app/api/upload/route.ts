import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Access Denied" }, { status: 401 });
  }

  const role = (session.user as any)?.role;
  // Only DATA_ENTRY and ADMIN should be uploading documents normally
  if (role !== "ADMIN" && role !== "DATA_ENTRY") {
    return NextResponse.json({ error: "Unauthorized role for uploads" }, { status: 403 });
  }

  try {
    const { personId, nationalId, fileName, fileType, docType, setAsPortrait } = await request.json();

    if (!personId || !nationalId || !fileName || !fileType) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate S3 URL securely
    const { url, key } = await getPresignedUploadUrl(nationalId, fileName, fileType);

    // Record the document in DB
    const newDoc = await prisma.document.create({
      data: {
        personId,
        name: fileName,
        type: docType || "OTHER",
        fileKey: key,
        mimeType: fileType,
        size: 0 
      }
    });

    // If set as portrait, update the Person's photoUrl with the S3 URL (Public or Presigned)
    if (setAsPortrait) {
       // Note: In production, photoUrl would be a public CloudFront URL or we'd serve via a proxy.
       // For this prototype, we store the key or the final planned URL.
       await prisma.person.update({
         where: { id: personId },
         data: { photoUrl: `/api/documents/view/${newDoc.id}` } // Using a hypothetical view proxy
       });
    }

    return NextResponse.json({ uploadUrl: url, key, documentId: newDoc.id });

  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
