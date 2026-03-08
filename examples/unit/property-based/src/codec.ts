/**
 * Functions with roundtrip properties — perfect for property-based testing.
 * Each encode/decode pair should satisfy: decode(encode(x)) === x
 */

export function base64Encode(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

export function base64Decode(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

export function hexEncode(str: string): string {
  return Buffer.from(str, "utf-8").toString("hex");
}

export function hexDecode(hex: string): string {
  return Buffer.from(hex, "hex").toString("utf-8");
}

export function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

export function urlDecode(encoded: string): string {
  return decodeURIComponent(encoded);
}
