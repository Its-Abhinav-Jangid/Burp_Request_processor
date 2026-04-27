# Request Processor

A Node.js/TypeScript tool designed to parse Burp Suite XML exports and use Gemini CLI to normalize dynamic path segments. The tool transforms raw HTTP requests into a structured JSON format with normalized paths and extracted parameters.

## Features

- **Burp XML Parsing:** Reads and extracts raw HTTP requests and responses from Burp Suite XML export files.
- **HTTP Request Parsing:** Decomposes raw HTTP request strings into methods, paths, headers, and bodies.
- **AI-Driven Path Normalization:** Utilizes Gemini CLI to identify and assign meaningful names to dynamic path segments (e.g., changing `/api/users/123/profile` to `/api/users/{user_id}/profile`).
- **Human-in-the-Loop Fallback:** Prompts the user via the CLI for manual parameter naming when the AI's confidence is low.
- **Structured JSON Output:** Assembles the processed endpoints into a clean `processed_requests.json` file, grouping by stable endpoint keys and capturing context notes.

## Prerequisites

- Node.js (v18+ recommended)
- TypeScript and `ts-node` (for running the source directly)
- gemini cli installed and logged in

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

## Usage

To run the processor, use `ts-node` to execute the main entry point and pass the path to your Burp XML export file. If no file path is provided, it defaults to a file named `burp` in the root directory.

```bash
npx ts-node src/index.ts [path-to-burp-xml-file]
```

### Example:

```bash
npx ts-node src/index.ts data/my_burp_export.xml
```

## Output

The script will generate a `processed_requests.json` file in the current working directory containing the normalized and structured endpoint data.

Example of processed request output:

```json
{
  "endpoint_key": "GET /api/users/{user_id}",
  "method": "GET",
  "normalized_path": "/api/users/{user_id}",
  "raw_path": "/api/users/123",
  "host": "https://example.com",
  "params": {
    "user_id": "123"
  },
  "body": "",
  "headers": {
    "Host": "example.com"
  },
  "notes": {}
}
```

## Project Structure

- `src/index.ts`: Main entry point and orchestration.
- `src/parser/xml-parser.ts`: Handles parsing of the Burp XML export.
- `src/parser/http-parser.ts`: Decomposes raw HTTP request strings.
- `src/normalization/ai-normalizer.ts`: Integrates Gemini CLI for path parameter identification and naming.
- `src/router/router.ts`: Manages stable endpoint keys.
- `src/store/context-store.ts`: Handles endpoint metadata and notes.
- `src/utils/signature.ts`: Generates signatures for endpoint paths.
