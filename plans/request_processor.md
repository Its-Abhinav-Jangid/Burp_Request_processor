# Implementation Plan - Request Processor

This plan outlines the development of a Request Processor that parses Burp Suite XML exports and uses Gemini 1.5 Flash to normalize dynamic path segments with a human-in-the-loop fallback.

## Objective
Convert raw Burp XML exports into a structured JSON format with normalized paths and extracted parameters.

## Key Files & Context
- `src/index.ts`: Main entry point and orchestration.
- `src/parser/xml-parser.ts`: Handles streaming XML parsing of the Burp export.
- `src/parser/http-parser.ts`: Decomposes raw HTTP request strings.
- `src/normalization/ai-normalizer.ts`: Integrates Gemini 1.5 Flash for path parameter identification and naming.
- `src/utils/cli-helper.ts`: Manages interactive CLI prompts for human feedback.

## Implementation Steps

### 1. Project Setup
- Initialize a Node.js TypeScript project.
- Install dependencies: `fast-xml-parser`, `@google/generative-ai`, `inquirer`, `zod`.

### 2. XML & HTTP Parsing
- **XML Parser:** Extract `<request>` CDATA from Burp export.
- **HTTP Parser:** Parse raw HTTP into method, path, headers, and body.

### 3. AI-Driven Normalization
- **Gemini Integration:** Use Gemini 1.5 Flash to identify and name dynamic path segments (e.g., `{goal_id}`).
- **Confidence Threshold:** Use 0.8 as the cut-off for automated naming.

### 4. Human-in-the-Loop Fallback
- Prompt the user in the CLI for segment names when AI confidence is low.

### 5. Final Assembly & Output
- Output structured JSON for each request.

## Verification & Testing
- Limited integration test using the provided Burp export sample.
