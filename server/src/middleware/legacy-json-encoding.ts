import { isUtf8 } from "node:buffer";
import type { ErrorRequestHandler } from "express";

/**
 * Windows shells send non-ASCII text in the system ANSI code page (CP1252)
 * rather than UTF-8 — `curl.exe` re-encodes its UTF-16 arguments that way, and
 * PowerShell 5.1 sends string bodies as ISO-8859-1. Every accented letter then
 * arrives as one byte that is not valid UTF-8, and the JSON parser replaces it
 * with U+FFFD, which is how agent comments and documents ended up reading
 * "Refer�ncias".
 *
 * JSON is always UTF-8, so a body that is not valid UTF-8 can only be one of
 * these. The verify hook refuses it before parsing, with the raw bytes
 * attached, and `recoverLegacyEncodedJson` decodes them as CP1252 and carries
 * on as if the parser had succeeded. Valid UTF-8 never takes this path.
 */
const LEGACY_ENCODING_ERROR_TYPE = "legacy.json.encoding";

export function rejectNonUtf8JsonBody(buf: Buffer) {
  if (buf.length === 0 || isUtf8(buf)) return;
  throw Object.assign(new Error("JSON body is not valid UTF-8"), {
    type: LEGACY_ENCODING_ERROR_TYPE,
  });
}

export const recoverLegacyEncodedJson: ErrorRequestHandler = (err, req, _res, next) => {
  if (!err || err.type !== LEGACY_ENCODING_ERROR_TYPE || !Buffer.isBuffer(err.body)) {
    next(err);
    return;
  }
  try {
    const text = new TextDecoder("windows-1252").decode(err.body);
    const parsed: unknown = JSON.parse(text);
    // Mirror express.json's strict mode: only objects and arrays are bodies.
    if (parsed === null || typeof parsed !== "object") throw new SyntaxError("Unexpected JSON body");
    req.body = parsed;
    next();
  } catch (parseError) {
    next(Object.assign(parseError instanceof Error ? parseError : new Error(String(parseError)), {
      status: 400,
      statusCode: 400,
      type: "entity.parse.failed",
    }));
  }
};
