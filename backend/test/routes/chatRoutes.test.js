import { describe, it } from "node:test";
import assert from "node:assert";

import chatRoutes from "../../src/routes/chatRoutes.js";

describe("Chat Routes", async () => {
  it("should have routes for chat operations", () => {
    // Get an array of routes
    const routes = chatRoutes.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    // Check for chat routes
    assert.ok(
      routes.find((r) => r.path === "/" && r.methods.includes("post")),
      "POST / route should exist for sending messages",
    );
    assert.ok(
      routes.find((r) => r.path === "/config" && r.methods.includes("get")),
      "GET /config route should exist for provider config",
    );
  });
});
