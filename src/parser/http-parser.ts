export interface ParsedRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: any;
}

export function parseRawRequest(rawRequest: string): ParsedRequest {
  const lines = rawRequest.split(/\r?\n/);
  if (lines.length === 0) throw new Error("Empty request");

  const requestLine = lines[0];
  const [method, fullPath] = requestLine.split(" ");
  
  const headers: Record<string, string> = {};
  let bodyStartIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      bodyStartIndex = i + 1;
      break;
    }
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  let body: any = null;
  if (bodyStartIndex !== -1 && bodyStartIndex < lines.length) {
    const rawBody = lines.slice(bodyStartIndex).join("\n").trim();
    if (rawBody) {
      if (headers["content-type"]?.includes("application/json")) {
        try {
          body = JSON.parse(rawBody);
        } catch (e) {
          body = rawBody;
        }
      } else {
        body = rawBody;
      }
    }
  }

  return {
    method,
    path: fullPath,
    headers,
    body
  };
}
