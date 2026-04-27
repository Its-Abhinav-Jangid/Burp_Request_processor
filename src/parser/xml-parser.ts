import { XMLParser } from "fast-xml-parser";
import * as fs from "fs";

export interface BurpItem {
  method: string;
  path: string;
  url: string;
  protocol: string;
  host: string;
  request: string;
  response: string;
}

export function parseBurpExport(filePath: string): BurpItem[] {
  const xmlContent = fs.readFileSync(filePath, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: "__cdata",
  });
  const jsonObj = parser.parse(xmlContent);
  
  const items = jsonObj.items.item;
  const burpItems = Array.isArray(items) ? items : [items];

  return burpItems.map((item: any) => {
    const protocol = item.protocol?.__cdata || item.protocol;
    const host = item.host?.__cdata || item.host["#text"] || item.host;
    const path = item.path?.__cdata || item.path;
    
    // Debug log
    // console.log(`Extracted: protocol=${protocol}, host=${host}, path=${path}`);

    return {
      method: item.method?.__cdata || item.method,
      path: path,
      url: item.url?.__cdata || item.url,
      protocol: protocol,
      host: host,
      request: item.request?.__cdata || item.request,
      response: item.response?.__cdata || item.response,
    };
  });
}
