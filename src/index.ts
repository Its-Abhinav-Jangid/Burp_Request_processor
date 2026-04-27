import "dotenv/config";
import * as path from "path";
import * as fs from "fs";
import { parseBurpExport } from "./parser/xml-parser";
import { parseRawRequest } from "./parser/http-parser";
import { normalizePath } from "./normalization/ai-normalizer";
import { generateSignature } from "./utils/signature";
import { routeToKey } from "./router/router";
import { getNotes } from "./store/context-store";

async function main() {
  const burpFilePath = process.argv[2] || "burp";
  const fullPath = path.resolve(burpFilePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }

  console.log(`Processing Burp export: ${fullPath}`);

  try {
    const items = parseBurpExport(fullPath);
    console.log(`Found ${items.length} items.`);

    const results = [];

    for (const item of items) {
      // 1. Parse raw HTTP request
      const parsedReq = parseRawRequest(item.request);
      
      // 2. Normalize path and identify params
      const normalization = await normalizePath(parsedReq.method, parsedReq.path, item.request, item.response);

      // 3. Generate stable endpoint key
      const signature = generateSignature(parsedReq.method, normalization.normalizedPath);
      const endpointKey = routeToKey(signature);
      
      // 4. Get/Create endpoint metadata
      const notes = getNotes(endpointKey, normalization.normalizedPath);

      const finalOutput = {
        endpoint_key: endpointKey,
        method: parsedReq.method,
        normalized_path: normalization.normalizedPath,
        raw_path: parsedReq.path,
        host: `${item.protocol}://${item.host}`,
        params: {
          ...normalization.params,
          ...extractQueryParams(parsedReq.path)
        },
        body: parsedReq.body,
        headers: parsedReq.headers,
        notes: notes
      };

      results.push(finalOutput);
    }

    const outputPath = path.join(process.cwd(), "processed_requests.json");
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${outputPath}`);
  } catch (error) {
    console.error("Error processing Burp export:", error);
  }
}

function extractQueryParams(fullPath: string): Record<string, string> {
  const queryIndex = fullPath.indexOf("?");
  if (queryIndex === -1) return {};

  const queryString = fullPath.substring(queryIndex + 1);
  const params: Record<string, string> = {};
  
  queryString.split("&").forEach(pair => {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
  });

  return params;
}

main();
