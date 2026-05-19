import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await connectDB();
    const existing = await User.findOne({ username });
    if (existing)
      return NextResponse.json({ error: "User already exists" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
