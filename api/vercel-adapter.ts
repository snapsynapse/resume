type HeaderValue = string | string[] | number | undefined;

interface VercelRequestLike extends AsyncIterable<Buffer | string> {
  method?: string;
  url?: string;
  headers?: Record<string, HeaderValue>;
  body?: unknown;
}

interface VercelResponseLike {
  status(code: number): VercelResponseLike;
  setHeader(name: string, value: string): void;
  send(body?: Buffer | string): void;
}

type WebHandler = (req: Request) => Promise<Response>;

function headersFromNode(req: VercelRequestLike): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers ?? {})) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  }
  return headers;
}

async function bodyFromNode(
  req: VercelRequestLike,
  headers: Headers,
): Promise<BodyInit | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (typeof req.body === "string") return req.body;
  if (req.body instanceof Buffer) return req.body;
  if (req.body !== undefined && req.body !== null) {
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return JSON.stringify(req.body);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function nodeToWebRequest(req: VercelRequestLike): Promise<Request> {
  const headers = headersFromNode(req);
  const host = headers.get("host") ?? "resume.sam-rogers.com";
  const url = req.url?.startsWith("http")
    ? req.url
    : `https://${host}${req.url ?? "/"}`;
  const body = await bodyFromNode(req, headers);

  return new Request(url, {
    method: req.method ?? "GET",
    headers,
    body,
  });
}

async function sendWebResponse(res: VercelResponseLike, response: Response): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = Buffer.from(await response.arrayBuffer());
  res.send(body.length ? body : undefined);
}

export function withVercelAdapter(handler: WebHandler) {
  return async function adaptedHandler(
    req: Request | VercelRequestLike,
    res?: VercelResponseLike,
  ): Promise<Response | void> {
    if (!res) return handler(req as Request);
    const webRequest = await nodeToWebRequest(req as VercelRequestLike);
    const webResponse = await handler(webRequest);
    await sendWebResponse(res, webResponse);
  };
}
