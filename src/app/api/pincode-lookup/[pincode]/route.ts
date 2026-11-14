// app/pincode-lookup/[pincode]/route.ts
import { NextRequest, NextResponse } from "next/server";

interface PincodeResponse {
  Message: string;
  Status: string;
  PostOffice: Array<{
    Name: string;
    District: string;
    State: string;
    Pincode: string;
  }>;
}

interface RouteContext {
  params: Promise<{
    pincode: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { pincode } = await context.params;

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Invalid PIN code" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data: PincodeResponse[] = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching PIN code data:", error);
    return NextResponse.json({ error: "Failed to fetch PIN code data" }, { status: 500 });
  }
}