import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const sessionUrl = new URL(request.url);
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "غير مصرح الدخول" }, { status: 401 });
  }

  const role = (session.user as any)?.role;
  const userId = (session.user as any)?.id;

  try {
    let messages;
    
    if (role === "ADMIN") {
      // ADMIN sees everything
      messages = await prisma.chatMessage.findMany({
        include: { sender: true, receiver: true },
        orderBy: { timestamp: 'asc' }
      });
    } else {
      // Checkpoints only see General messages (receiverId = null) or messages sent directly to them
      messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { receiverId: null },
            { receiverId: userId },
            { senderId: userId }
          ]
        },
        include: { sender: true, receiver: true },
        orderBy: { timestamp: 'asc' }
      });
    }

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      sender: msg.sender.username,
      senderRole: msg.sender.role,
      receiver: msg.receiver ? msg.receiver.username : null,
      text: msg.content,
      time: new Date(msg.timestamp).toLocaleTimeString("ar-SA"),
      isPrivate: !!msg.receiverId
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Chat error", error);
    return NextResponse.json({ error: "DB Error", messages: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const userId = (session.user as any)?.id;
  const { content, receiverId } = await request.json();

  if (!content) return NextResponse.json({ error: "Empty content" }, { status: 400 });

  try {
    const newMessage = await prisma.chatMessage.create({
      data: {
        content,
        senderId: userId,
        receiverId: receiverId || null,
      },
      include: { sender: true, receiver: true }
    });

    return NextResponse.json({
      id: newMessage.id,
      sender: newMessage.sender.username,
      senderRole: newMessage.sender.role,
      receiver: newMessage.receiver ? newMessage.receiver.username : null,
      text: newMessage.content,
      time: new Date(newMessage.timestamp).toLocaleTimeString("ar-SA"),
      isPrivate: !!newMessage.receiverId
    });
  } catch (error) {
    return NextResponse.json({ error: "Error sending message" }, { status: 500 });
  }
}
