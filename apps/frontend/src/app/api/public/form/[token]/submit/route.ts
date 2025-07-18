import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const backendUrl = process.env.NEXT_PUBLIC_API_HOST;
  if (!backendUrl) {
    return new NextResponse(
      JSON.stringify({ error: "Backend URL not configured" }),
      { status: 500 },
    );
  }
  const body = await req.text();
  const backendRes = await fetch(
    `${backendUrl}/public/form/${params.token}/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/json",
      },
      body,
    },
  );
  const data = await backendRes.text();
  return new NextResponse(data, {
    status: backendRes.status,
    headers: {
      "content-type":
        backendRes.headers.get("content-type") || "application/json",
    },
  });
}
