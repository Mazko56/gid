import { NextRequest, NextResponse } from "next/server";

function backendBase() {
  const raw = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1").trim().replace(/\/$/, "");
  return /\/api\/v1$/i.test(raw) ? raw : `${raw}/api/v1`;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${backendBase()}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");
  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  try {
    const response = await fetch(target, { method: request.method, headers, body, cache: "no-store", redirect: "follow" });
    const buffer = await response.arrayBuffer();
    const responseHeaders = new Headers();
    responseHeaders.set("content-type", response.headers.get("content-type") || "application/octet-stream");
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) responseHeaders.set("cache-control", cacheControl);
    return new NextResponse(buffer, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json({ message: `Backend недоступний: ${error instanceof Error ? error.message : "network error"}`, target }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
