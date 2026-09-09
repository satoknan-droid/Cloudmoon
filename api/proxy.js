import worker from "../worker.js";

export default async function handler(req, res) {
  try {
    const host = req.headers.host || "localhost";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const url = `${protocol}://${host}${req.url}`;

    // Create a Request object compatible with the worker
    const request = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers),
      body:
        ["GET", "HEAD"].includes(req.method) || !req.body
          ? undefined
          : JSON.stringify(req.body),
    });

    const response = await worker.fetch(request);

    // Set response headers
    response.headers.forEach((value, name) => {
      if (
        ![
          "content-encoding",
          "content-length",
          "transfer-encoding",
        ].includes(name)
      ) {
        res.setHeader(name, value);
      }
    });

    res.status(response.status);

    if (!response.body) {
      res.end();
      return;
    }

    // Stream the response body
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    console.error("Request failed:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
