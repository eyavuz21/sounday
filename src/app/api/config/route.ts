import { NextResponse } from "next/server";
import { publicConfig } from "@/lib/config";

export async function GET() {
  return NextResponse.json(publicConfig());
}
