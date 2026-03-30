import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams, origin } = new URL(request.url);
  let imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  // Handle relative URLs
  if (imageUrl.startsWith("/")) {
    imageUrl = `${origin}${imageUrl}`;
  }

  try {
    // 1. RADICAL FIX (JAZRI): If the URL is an internal document, bypass the API and Cookie system entirely.
    // Parse /api/documents/[id]/view
    if (imageUrl.includes("/api/documents/")) {
      const parts = imageUrl.split("/");
      const docIdIndex = parts.indexOf("documents") + 1;
      const documentId = parts[docIdIndex];

      if (documentId) {
        // Query Prisma directly
        const { prisma } = await import("@/lib/prisma");
        const { getPresignedViewUrl } = await import("@/lib/s3");

        const document = await (prisma as any).document.findUnique({ where: { id: documentId } });
        if (document) {
          // Generate S3 URL directly
          imageUrl = await getPresignedViewUrl(document.fileKey);
          // Fetch the S3 URL DIRECTLY (no cookies needed for S3 signed URLs)
          const s3Response = await fetch(imageUrl);
          if (s3Response.ok) {
            const blob = await s3Response.blob();
            const contentType = s3Response.headers.get("content-type") || "image/jpeg";
            return new NextResponse(blob, {
              headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400",
              },
            });
          }
        }
      }
    }

    // 2. FORWARD IDENTITY: Fallback for generic external or other internal requests
    const cookie = request.headers.get("cookie") || "";
    const response = await fetch(imageUrl, {
      headers: { cookie },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxy Fetch Error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse(`Failed to proxy image: ${error instanceof Error ? error.message : 'Unknown'}`, { status: 500 });
  }
}
