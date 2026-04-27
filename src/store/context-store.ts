import * as fs from "fs";
import * as path from "path";

const NOTES_FILE = path.join(process.cwd(), "endpoint_notes.json");

export interface EndpointNotes {
  endpoint: string;
  auth: string;
  required_fields: string[];
  constraints: string[];
  interesting_params: string[];
  errors_seen: string[];
}

let allNotes: Record<string, EndpointNotes> = {};

if (fs.existsSync(NOTES_FILE)) {
  try {
    allNotes = JSON.parse(fs.readFileSync(NOTES_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to load endpoint_notes.json");
  }
}

function saveNotes() {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(allNotes, null, 2));
}

export function getNotes(endpointKey: string, defaultPath: string): EndpointNotes {
  if (allNotes[endpointKey]) {
    return allNotes[endpointKey];
  }

  // Template for new endpoints
  const template: EndpointNotes = {
    endpoint: defaultPath,
    auth: "unknown",
    required_fields: [],
    constraints: [],
    interesting_params: [],
    errors_seen: []
  };

  allNotes[endpointKey] = template;
  saveNotes();
  return template;
}

export function updateNotes(endpointKey: string, notes: EndpointNotes) {
  allNotes[endpointKey] = notes;
  saveNotes();
}
