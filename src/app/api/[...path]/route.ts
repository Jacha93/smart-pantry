import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import { URL } from 'url';

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

// Backend URL für Server-Side Requests (Next.js API Routes)
// Verwende 127.0.0.1 statt localhost um IPv4 zu erzwingen (wichtig wenn Backend auf 0.0.0.0 hört)
const BACKEND_BASE_URL =
  process.env.NEXT_INTERNAL_API_URL ||
  process.env.API_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  `http://127.0.0.1:${process.env.BACKEND_PORT || 3001}`;

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

type RouteParams = { path?: string[] };

const resolveParams = async (params: RouteParams | Promise<RouteParams>): Promise<RouteParams> =>
  Promise.resolve(params).catch(() => ({ path: [] }));

const forwardRequest = async (
  request: NextRequest,
  params: RouteParams | Promise<RouteParams>
): Promise<NextResponse> => {
  const resolvedParams = await resolveParams(params);
  const targetUrl = buildTargetUrl(resolvedParams.path || [], request.nextUrl.search);
  const method = request.method.toUpperCase();
  const headers = filterHeaders(request.headers);

  let body: Buffer | string | null | undefined = undefined;
  if (!isBodylessMethod(method)) {
    const contentType = headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      // Für multipart/form-data: Body direkt als Buffer weiterleiten
      // (FormData-Parsing würde die Boundary zerstören)
      const buffer = await request.arrayBuffer();
      body = Buffer.from(buffer);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        params.append(key, typeof value === 'string' ? value : value.name);
      }
      body = params.toString();
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      body = JSON.stringify(json);
    } else {
      const buffer = await request.arrayBuffer();
      body = Buffer.from(buffer);
    }
  }

  try {
    // Verwende Node.js http/https statt fetch für bessere Docker DNS-Unterstützung
    const url = new URL(targetUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const response = await new Promise<{
      statusCode: number;
      statusMessage: string;
      headers: Record<string, string | string[]>;
      body: Buffer;
    }>((resolve, reject) => {
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: Object.fromEntries(headers.entries()),
        timeout: 30000, // 30 Sekunden Timeout
      };

      const req = httpModule.request(requestOptions, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 500,
            statusMessage: res.statusMessage || 'Internal Server Error',
            headers: res.headers as Record<string, string | string[]>,
            body: Buffer.concat(chunks),
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        if (typeof body === 'string') {
          req.write(body, 'utf8');
        } else if (body instanceof Buffer) {
          req.write(body);
        } else {
          // Fallback für andere Typen
          req.write(String(body));
        }
      }
      req.end();
    });

    const responseHeaders = filterHeaders(new Headers(response.headers as any));
    // Konvertiere Buffer zu Uint8Array für NextResponse
    const body = new Uint8Array(response.body);
    return new NextResponse(body, {
      status: response.statusCode,
      statusText: response.statusMessage,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy Error:', {
      targetUrl: targetUrl.toString(),
      backendBaseUrl: BACKEND_BASE_URL,
      method,
      error: String(error),
      errorCode: (error as any)?.code,
      errorStack: (error as any)?.stack,
    });
    return NextResponse.json(
      { 
        detail: 'Proxy Error: Failed to connect to backend', 
        targetUrl: targetUrl.toString(),
        backendBaseUrl: BACKEND_BASE_URL,
        error: String(error),
        errorCode: (error as any)?.code,
      },
      { status: 502 }
    );
  }
};

export const dynamic = 'force-dynamic';

type Context =
  | { params: RouteParams }
  | { params: Promise<RouteParams> };

export async function GET(request: NextRequest, context: Context) {
  return forwardRequest(request, context.params);
}

export async function POST(request: NextRequest, context: Context) {
  return forwardRequest(request, context.params);
}

export async function PUT(request: NextRequest, context: Context) {
  return forwardRequest(request, context.params);
}

export async function PATCH(request: NextRequest, context: Context) {
  return forwardRequest(request, context.params);
}

export async function DELETE(request: NextRequest, context: Context) {
  return forwardRequest(request, context.params);
}

export async function OPTIONS(request: NextRequest, context: Context) {
  return forwardRequest(request, context.params);
}

