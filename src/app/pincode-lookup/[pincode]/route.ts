import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Pincode: string;
}

interface PincodeResponse {
  Message: string;
  Status: string;
  PostOffice: PostOffice[] | null;
}

interface RouteContext {
  params: Promise<{ pincode: string }>;
}

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; GauraajApp/1.0)",
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// Primary: postalpincode.in (gives District + State)
async function fromPostalPincode(
  pincode: string
): Promise<PincodeResponse[] | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      if (!res.ok) throw new Error(`postalpincode status ${res.status}`);

      const data: PincodeResponse[] = await res.json();
      if (
        data?.[0]?.Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        return data;
      }
      // API ne bola pincode invalid hai, retry ka fayda nahi
      return data;
    } catch (error) {
      console.error(`postalpincode attempt ${attempt} failed:`, error);
    }
  }
  return null;
}

// Fallback: zippopotam.us (same shape me convert karte hain)
async function fromZippopotam(
  pincode: string
): Promise<PincodeResponse[] | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.zippopotam.us/in/${pincode}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;

    return [
      {
        Message: "Number of pincode(s) found:1",
        Status: "Success",
        PostOffice: [
          {
            Name: place["place name"] || "",
            District: place["place name"] || "",
            State: place["state"] || "",
            Pincode: pincode,
          },
        ],
      },
    ];
  } catch (error) {
    console.error("zippopotam failed:", error);
    return null;
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { pincode } = await context.params;

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Invalid PIN code" }, { status: 400 });
  }

  const primary = await fromPostalPincode(pincode);
  if (primary) {
    return NextResponse.json(primary);
  }

  const fallback = await fromZippopotam(pincode);
  if (fallback) {
    return NextResponse.json(fallback);
  }

  return NextResponse.json(
    { error: "Failed to fetch PIN code data" },
    { status: 502 }
  );
}