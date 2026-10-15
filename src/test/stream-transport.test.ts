// @vitest-environment node
import http from "node:http";
import type { AddressInfo } from "node:net";
import { expect, it, vi } from "vitest";
import { withVercelAdapter } from "../../api/vercel-adapter";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

async function serve(stream: ReadableStream<Uint8Array>, parsedBody = false) {
  const responseClosed = deferred();
  const handler = withVercelAdapter(async () => new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  }));
  const server = http.createServer((req, res) => {
    res.on("close", responseClosed.resolve);
    // Use a real IncomingMessage and ServerResponse lifecycle. The compatibility
    // surface adds only Vercel's status/send helpers, not artificial close events.
    const response = Object.assign(res, {
      status(code: number) { res.statusCode = code; return response; },
      send(body?: Buffer | string) { res.end(body); },
    });
    if (parsedBody) {
      Object.assign(req, { body: {} });
      req.resume();
    }
    void handler(req, response);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chat`,
    responseClosed: responseClosed.promise,
    async close() {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

it.each([
  { mode: "raw body", parsedBody: false },
  { mode: "pre-parsed body", parsedBody: true },
])("continues a healthy response after the POST completes with $mode", async ({ parsedBody }) => {
  const later = deferred();
  const server = await serve(new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode("first "));
      await later.promise;
      controller.enqueue(new TextEncoder().encode("second"));
      controller.close();
    },
  }), parsedBody);
  try {
    const response = await fetch(server.url, { method: "POST", body: "{}", signal: AbortSignal.timeout(2000) });
    const reader = response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe("first ");
    later.resolve();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe("second");
    expect((await reader.read()).done).toBe(true);
  } finally { later.resolve(); await server.close(); }
});

it("cancels upstream production when the real response consumer disconnects", async () => {
  const later = deferred();
  const cancel = vi.fn();
  let pulls = 0;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (pulls++ === 0) {
        controller.enqueue(new TextEncoder().encode("first"));
        return;
      }
      await later.promise;
      if (!cancel.mock.calls.length) controller.close();
    },
    cancel,
  });
  const server = await serve(stream);
  try {
    const response = await fetch(server.url, { method: "POST", body: "{}", signal: AbortSignal.timeout(2000) });
    const reader = response.body!.getReader();
    await reader.read();
    await reader.cancel();
    await server.responseClosed;
    await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1), { timeout: 500 });
  } finally { later.resolve(); await server.close(); }
});
