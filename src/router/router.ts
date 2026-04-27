import * as fs from "fs";
import * as path from "path";

const ROUTER_CONFIG_FILE = path.join(process.cwd(), "router_config.json");

export interface RouterConfig {
  mappings: Record<string, string>; // signature -> key
}

let routerConfig: RouterConfig = { mappings: {} };

if (fs.existsSync(ROUTER_CONFIG_FILE)) {
  try {
    routerConfig = JSON.parse(fs.readFileSync(ROUTER_CONFIG_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to load router_config.json");
  }
}

function saveRouterConfig() {
  fs.writeFileSync(ROUTER_CONFIG_FILE, JSON.stringify(routerConfig, null, 2));
}

export function routeToKey(signature: string): string {
  // If we have an approved mapping, use it
  if (routerConfig.mappings[signature]) {
    return routerConfig.mappings[signature];
  }

  // Fallback: use signature as key and save it (initial learning)
  routerConfig.mappings[signature] = signature;
  saveRouterConfig();
  return signature;
}
