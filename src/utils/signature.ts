export function generateSignature(method: string, normalizedPath: string): string {
  // Remove query string if present (though normalizedPath shouldn't have it)
  const pathOnly = normalizedPath.split("?")[0];
  
  // Replace {param_name} with VAR
  const signaturePath = pathOnly
    .replace(/\{[^}]+\}/g, "VAR")
    .replace(/\/+/g, "::") // Replace slashes with double-colons
    .replace(/^::+|::+$/g, ""); // Trim leading/trailing double-colons

  return `${method.toUpperCase()}::${signaturePath}`;
}
