import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { recoverLegacyEncodedJson, rejectNonUtf8JsonBody } from "../middleware/legacy-json-encoding.js";

function buildApp() {
  const app = express();
  app.use(express.json({ verify: (_req, _res, buf) => rejectNonUtf8JsonBody(buf) }));
  app.use(recoverLegacyEncodedJson);
  app.post("/echo", (req, res) => res.json(req.body));
  app.use((err: { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status ?? 500).json({ error: "failed" });
  });
  return app;
}

const post = (body: Buffer) =>
  request(buildApp()).post("/echo").type("json").serialize((value) => value).send(body);

describe("legacy JSON encoding recovery", () => {
  it("leaves valid UTF-8 untouched", async () => {
    const res = await post(Buffer.from(JSON.stringify({ title: "Referências — ação" }), "utf8"));
    expect(res.body).toEqual({ title: "Referências — ação" });
  });

  it("recovers a body sent as CP1252 instead of replacing accents with U+FFFD", async () => {
    const res = await post(Buffer.from(JSON.stringify({ title: "Referências de seleção" }), "latin1"));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ title: "Referências de seleção" });
  });

  it("still rejects malformed JSON in a legacy-encoded body", async () => {
    const res = await post(Buffer.from('{"title": "ação"', "latin1"));
    expect(res.status).toBe(400);
  });
});
