import { spawnSync } from "child_process";
import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";

export interface NormalizationResult {
  normalizedPath: string;
  params: Record<string, string>;
}

const KNOWN_IDS_FILE = path.join(process.cwd(), "known_ids.json");
let knownIds: Record<string, string> = {};

if (fs.existsSync(KNOWN_IDS_FILE)) {
  try {
    knownIds = JSON.parse(fs.readFileSync(KNOWN_IDS_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to load known_ids.json");
  }
}

function saveKnownIds() {
  fs.writeFileSync(KNOWN_IDS_FILE, JSON.stringify(knownIds, null, 2));
}

const normalizationCache: Record<string, NormalizationResult> = {};

export async function normalizePath(
  method: string,
  fullPath: string,
  rawRequest: string,
  rawResponse: string,
): Promise<NormalizationResult> {
  const [pathPart, queryPart] = fullPath.split("?");
  const queryString = queryPart ? `?${queryPart}` : "";

  const segments = pathPart.split("/");
  const dynamicSegments: string[] = [];

  for (const segment of segments) {
    if (segment.match(/^[0-9a-fA-F-]{8,}$/) || segment.match(/^\d+$/)) {
      dynamicSegments.push(segment);
    }
  }

  if (dynamicSegments.length === 0) {
    return { normalizedPath: fullPath, params: {} };
  }

  const params: Record<string, string> = {};
  let currentNormalizedPath = pathPart;
  let allKnown = true;

  for (const segment of dynamicSegments) {
    if (knownIds[segment]) {
      params[knownIds[segment]] = segment;
      currentNormalizedPath = currentNormalizedPath.replace(
        segment,
        `{${knownIds[segment]}}`,
      );
    } else {
      allKnown = false;
    }
  }

  if (allKnown) {
    return { normalizedPath: currentNormalizedPath + queryString, params };
  }

  if (normalizationCache[fullPath]) {
    return normalizationCache[fullPath];
  }

  const prompt = `
Analyze the following HTTP request/response to identify dynamic segments in the path and name them appropriately (e.g., {user_id}, {goal_id}).

Known mappings: ${JSON.stringify(knownIds)}
Method: ${method}
Path: ${pathPart}

Request: ${rawRequest.substring(0, 500).replace(/"/g, "'")}
Response: ${rawResponse.substring(0, 500).replace(/"/g, "'")}

Return ONLY a JSON object with:
1. "normalizedPath": The path with placeholders (no query string).
2. "params": A mapping from name to original value (e.g., {"user_id": "123"}).
3. "confidence": Score 0-1.
`.trim();

  try {
    // Using stdin via the 'input' property is the most reliable way to pass
    // large prompts while ensuring headless execution.
    const result = spawnSync(
      "gemini",
      ["--approval-mode", "plan", "--output-format", "text", "--raw-output", "--accept-raw-output-risk"],
      {
        input: prompt,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        shell: true,
      },
    );

    if (result.error) throw result.error;

    const output = (result.stdout || "").trim();
    const errorOutput = (result.stderr || "").trim();

    if (errorOutput && !output) {
      console.error("CLI Error Output:", errorOutput);
    }

    const jsonMatch = output.match(/\{.*\}/s);
    if (!jsonMatch) {
      if (output) console.log("CLI Raw Output:", output);
      throw new Error("Invalid CLI response: No JSON found in output");
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    if (aiResult.confidence < 0.8) {
      return await humanFallback(pathPart, queryString, rawRequest, rawResponse);
    }

    Object.entries(aiResult.params as Record<string, string>).forEach(
      ([name, val]) => {
        knownIds[val] = name;
      },
    );
    saveKnownIds();

    normalizationCache[fullPath] = {
      normalizedPath: aiResult.normalizedPath + queryString,
      params: aiResult.params,
    };

    return normalizationCache[fullPath];
  } catch (error) {
    console.error("Normalization failed:", error);
    return await humanFallback(pathPart, queryString, rawRequest, rawResponse);
  }
}

async function humanFallback(
  pathPart: string,
  queryString: string,
  rawRequest: string,
  rawResponse: string,
): Promise<NormalizationResult> {
  console.log("\n" + "=".repeat(50));
  console.log("HUMAN INTERVENTION REQUIRED");
  console.log("Path:", pathPart + queryString);
  console.log("=".repeat(50));

  const segments = pathPart.split("/");
  const params: Record<string, string> = {};
  let normalizedPath = pathPart;

  for (const segment of segments) {
    if (
      (segment.match(/^[0-9a-fA-F-]{8,}$/) || segment.match(/^\d+$/)) &&
      !knownIds[segment]
    ) {
      const { name } = await (inquirer as any).prompt([
        {
          type: "input",
          name: "name",
          message: `Enter parameter name for segment "${segment}":`,
          default: "id",
        },
      ]);
      knownIds[segment] = name;
      params[name] = segment;
      normalizedPath = normalizedPath.replace(segment, `{${name}}`);
    } else if (knownIds[segment]) {
      params[knownIds[segment]] = segment;
      normalizedPath = normalizedPath.replace(
        segment,
        `{${knownIds[segment]}}`,
      );
    }
  }

  saveKnownIds();
  const result = { normalizedPath: normalizedPath + queryString, params };
  normalizationCache[pathPart + queryString] = result;
  return result;
}