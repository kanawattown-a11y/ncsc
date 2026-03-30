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
    // 1. RADICAL BYPASS (JAZRI): Extract ID directly from the raw URL parameter
    // Pattern: matches /api/documents/ID/view
    const docMatch = imageUrl.match(/\/api\/documents\/([a-zA-Z0-9]+)/);
    if (docMatch && docMatch[1]) {
      const documentId = docMatch[1];
      try {
        const { prisma } = await import("@/lib/prisma");
        const { getPresignedViewUrl } = await import("@/lib/s3");

        const document = await (prisma as any).document.findUnique({ where: { id: documentId } });
        if (document) {
          // GENERATE SIGNED URL
          const s3Url = await getPresignedViewUrl(document.fileKey);
          
          // FETCH DIRECTLY FROM S3 (Bypasses site SSL/Auth)
          const s3Response = await fetch(s3Url);
          if (s3Response.ok) {
            const blob = await s3Response.blob();
            const contentType = s3Response.headers.get("content-type") || "image/jpeg";
            return new NextResponse(blob, {
              headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400",
                "X-Proxy-Source": "S3-Bypass-Final"
              },
            });
          } else {
            console.error(`S3 Direct Fetch Failed: ${s3Response.status}`);
          }
        }
      } catch (innerError) {
        console.error("Internal Bypass Logic Error:", innerError);
      }
    }

    // 2. FORWARD IDENTITY: Fallback for generic external or other internal requests
    // Important: Use a FULL URL for internal fetch
    const finalUrl = imageUrl.startsWith("/") ? `${origin}${imageUrl}` : imageUrl;
    const cookie = request.headers.get("cookie") || "";
    
    const response = await fetch(finalUrl, { headers: { cookie } });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxy Fallback Error (${response.status}): ${errorText}`);
      throw new Error(`Fallback fetch failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
        "X-Proxy-Source": "Fallback-Fetch"
      },
    });
  } catch (error) {
    console.error("ULTIMATE PROXY ERROR:", error);
    return new NextResponse(`CRITICAL_PROXY_FAILURE: ${error instanceof Error ? error.message : 'Unknown Reason'}`, { status: 500 });
  }
}
