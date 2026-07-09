type HeaderValue = string | string[] | number | undefined;

interface VercelRequestLike extends AsyncIterable<Buffer | string> {
  method?: string;
  url?: string;
  headers?: Record<string, HeaderValue>;
  body?: unknown;
  on?(event: string, listener: (...args: unknown[]) => void): void;
}

interface VercelResponseLike {
  status(code: number): VercelResponseLike;
  setHeader(name: string, value: string): void;
  send(body?: Buffer | string): void;
  write?(chunk: Buffer | Uint8Array | string): boolean;
  end?(chunk?: Buffer | Uint8Array | string): void;
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

// A streaming body is piped chunk-by-chunk so token streaming survives the
// Node (req, res) path. Buffering the whole Response would defeat it. Non-stream
// JSON keeps the original buffer-and-send behavior.
function isStreamingResponse(response: Response, res: VercelResponseLike): boolean {
  if (!response.body) return false;
  if (typeof res.write !== "function" || typeof res.end !== "function") return false;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("text/plain") || contentType.includes("text/event-stream");
}

async function streamWebResponse(
  req: VercelRequestLike,
  res: VercelResponseLike,
  response: Response,
): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  let aborted = false;
  // If the client hangs up, cancel the upstream reader so we stop pulling (and
  // paying for) tokens for an abandoned tab.
  const onClose = () => {
    if (aborted) return;
    aborted = true;
    reader.cancel().catch(() => {});
  };
  req.on?.("close", onClose);
  req.on?.("aborted", onClose);

  try {
    while (!aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) res.write!(Buffer.from(value));
    }
  } catch {
    // Upstream failed mid-stream; nothing safe to append. Close the response below.
  } finally {
    if (!aborted) res.end!();
  }
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
    const nodeReq = req as VercelRequestLike;
    const webRequest = await nodeToWebRequest(nodeReq);
    const webResponse = await handler(webRequest);
    if (isStreamingResponse(webResponse, res)) {
      await streamWebResponse(nodeReq, res, webResponse);
      return;
    }
    await sendWebResponse(res, webResponse);
  };
}
