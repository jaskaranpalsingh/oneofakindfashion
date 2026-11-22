import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("GET /api/v1/health", () => {
  it("returns service health payload", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.integrations).toBeDefined();
  });
});
