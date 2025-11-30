import { NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

const BACKEND_BASE_URL =
  process.env.NEXT_INTERNAL_API_URL ||
  process.env.API_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:3001';

const buildTargetUrl = (path: string[], search: string) => {
  const sanitizedBase = BACKEND_BASE_URL.replace(/\/+$/, '');
  const joinedPath = path.length ? `/${path.map((segment) => segment.trim()).join('/')}` : '';
  const url = new URL(`${sanitizedBase}${joinedPath}`);
  if (search) {
    url.search = search;
  }
  return url;
};

const filterHeaders = (headers: Headers) => {
  const filtered = new Headers();
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      filtered.set(key, value);
    }
  });
  return filtered;
};

const isBodylessMethod = (method: string) => method === 'GET' || method === 'HEAD';

const forwardRequest = async (request: NextRequest, params: { path?: string[] }) => {
  const targetUrl = buildTargetUrl(params.path || [], request.nextUrl.search);
  const method = request.method.toUpperCase();
  const headers = filterHeaders(request.headers);

  let body: BodyInit | null | undefined = undefined;
  if (!isBodylessMethod(method)) {
    const contentType = headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = formData;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        params.append(key, typeof value === 'string' ? value : value.name);
      }
      body = params;
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      body = JSON.stringify(json);
    } else {
      const buffer = await request.arrayBuffer();
      body = buffer;
    }
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  const responseHeaders = filterHeaders(response.headers);
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest(request, context.params);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest(request, context.params);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest(request, context.params);
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest(request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest(request, context.params);
}

export async function OPTIONS(request: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest(request, context.params);
}

