import { describe, it } from "node:test";
import assert from "node:assert";

import promptRoutes from "../../src/routes/promptRoutes.js";

describe("Prompt Routes", async () => {
  it("should have routes for all CRUD operations", () => {
    // Get an array of routes
    const routes = promptRoutes.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    // Check for basic CRUD routes
    assert.ok(
      routes.find((r) => r.path === "/" && r.methods.includes("get")),
      "GET / route should exist",
    );
    assert.ok(
      routes.find((r) => r.path === "/:id" && r.methods.includes("get")),
      "GET /:id route should exist",
    );
    assert.ok(
      routes.find((r) => r.path === "/" && r.methods.includes("post")),
      "POST / route should exist",
    );
    assert.ok(
      routes.find((r) => r.path === "/:id" && r.methods.includes("put")),
      "PUT /:id route should exist",
    );
    assert.ok(
      routes.find((r) => r.path === "/:id" && r.methods.includes("delete")),
      "DELETE /:id route should exist",
    );
  });
});
