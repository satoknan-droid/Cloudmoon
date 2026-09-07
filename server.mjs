import http from "node:http";
import { Readable } from "node:stream";
import worker from "./worker.js";

const port = Number(process.env.PORT || 5000);

function requestHeaders(incomingHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(incomingHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }
  return headers;
}

const server = http.createServer(async (incomingRequest, outgoingResponse) => {
  try {
    const host = incomingRequest.headers.host || `127.0.0.1:${port}`;
    const request = new Request(`http://${host}${incomingRequest.url || "/"}`, {
      method: incomingRequest.method || "GET",
      headers: requestHeaders(incomingRequest.headers),
      body: ["GET", "HEAD"].includes(incomingRequest.method || "GET")
        ? undefined
        : incomingRequest,
      duplex: "half",
    });

    const response = await worker.fetch(request);
    const responseHeaders = {};
    response.headers.forEach((value, name) => {
      // Node fetch transparently decompresses upstream responses. Do not send
      // stale upstream encoding/length metadata to the browser.
      if (!["content-encoding", "content-length", "transfer-encoding"].includes(name)) {
        responseHeaders[name] = value;
      }
    });
    outgoingResponse.writeHead(response.status, responseHeaders);

    if (!response.body) {
      outgoingResponse.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(outgoingResponse);
  } catch (error) {
    console.error("Request failed:", error);
    if (!outgoingResponse.headersSent) {
      outgoingResponse.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    outgoingResponse.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Replit Worker adapter listening on http://0.0.0.0:${port}`);
});