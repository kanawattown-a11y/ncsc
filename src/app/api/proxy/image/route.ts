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
    // 1. FORWARD IDENTITY: Pass the user's cookie to the internal request
    // This is the "Jazri" (Radical) fix for 500 errors caused by internal 401s.
    const cookie = request.headers.get("cookie") || "";

    const response = await fetch(imageUrl, {
      headers: {
        cookie, // Forward the session!
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxy Fetch Full Error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch image: ${response.status} ${errorText}`);
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
    return new NextResponse("Failed to proxy image", { status: 500 });
  }
}
