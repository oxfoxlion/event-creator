import type { NextRequest } from "next/server";

export const runtime = "nodejs";

function getProxyTarget() {
  return (process.env.EVENT_CREATOR_PROXY_TARGET || "http://localhost:3001").replace(/\/+$/, "");
}

function buildTargetUrl(request: NextRequest, path: string[]) {
  const target = getProxyTarget();
  const url = new URL(request.url);
  const pathname = path.map(encodeURIComponent).join("/");
  const search = url.search || "";

  return `${target}/event_creator/${pathname}${search}`;
}

async function proxyRequest(request: NextRequest, path: string[]) {
  const targetUrl = buildTargetUrl(request, path);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.delete("host");
  requestHeaders.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers: requestHeaders,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl, init);
  const responseHeaders = new Headers(upstream.headers);

  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
