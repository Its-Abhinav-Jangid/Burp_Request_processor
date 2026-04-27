import { parseRawRequest } from "../parser/http-parser";

const rawRequest = `POST /api/v2/reading/goals/123 HTTP/1.1
Host: teach.classdojo.com
Content-Type: application/json
Authorization: Bearer token123

{"goal_type": "reading"}`;

const parsed = parseRawRequest(rawRequest);
console.log("Parsed Request:", JSON.stringify(parsed, null, 2));

if (parsed.method === "POST" && parsed.path === "/api/v2/reading/goals/123" && parsed.body.goal_type === "reading") {
  console.log("Test Passed!");
} else {
  console.log("Test Failed!");
  process.exit(1);
}
