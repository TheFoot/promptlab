import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import sinon from "sinon";

import {
  getPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from "../../src/controllers/promptController.js";

import Prompt from "../../src/models/Prompt.js";
import { mockExpressReqRes } from "../helpers/testSetup.js";

describe("Prompt Controller", () => {
  beforeEach(() => {
    // Reset any stubs/mocks before each test
  });

  afterEach(() => {
    // Restore all sinon stubs/mocks after each test
    sinon.restore();
  });

  describe("getPrompts", () => {
    it("should return all prompts when no filters are provided", async () => {
      // Arrange
      const mockPrompts = [
        { _id: "1", title: "Prompt 1", tags: ["tag1"], updatedAt: new Date() },
        { _id: "2", title: "Prompt 2", tags: ["tag2"], updatedAt: new Date() },
      ];

      const mockPromptQuery = {
        sort: sinon.stub().returnsThis(),
        select: sinon.stub().resolves(mockPrompts),
      };

      sinon.stub(Prompt, "find").returns(mockPromptQuery);

      const { req, res } = mockExpressReqRes({
        query: {}, // No search or tag filters
      });

      // Act
      await getPrompts(req, res);

      // Assert
      assert.ok(Prompt.find.calledWith({}), "Should query with empty filter");
      assert.ok(
        mockPromptQuery.sort.calledWith({ updatedAt: -1 }),
        "Should sort by updatedAt descending",
      );
      assert.ok(
        mockPromptQuery.select.calledWith("title tags updatedAt"),
        "Should select specific fields",
      );
      assert.ok(res.json.calledWith(mockPrompts), "Should return prompts list");
    });

    it("should apply text search filter when search param is provided", async () => {
      // Arrange
      const mockPrompts = [
        { _id: "1", title: "Test Prompt", tags: [], updatedAt: new Date() },
      ];

      const mockPromptQuery = {
        sort: sinon.stub().returnsThis(),
        select: sinon.stub().resolves(mockPrompts),
      };

      sinon.stub(Prompt, "find").returns(mockPromptQuery);

      const { req, res } = mockExpressReqRes({
        query: { search: "test query" },
      });

      // Act
      await getPrompts(req, res);

      // Assert
      assert.ok(
        Prompt.find.calledWith({ $text: { $search: "test query" } }),
        "Should apply text search filter",
      );
      assert.ok(
        res.json.calledWith(mockPrompts),
        "Should return filtered prompts",
      );
    });

    it("should apply tag filter when tag param is provided", async () => {
      // Arrange
      const mockPrompts = [
        {
          _id: "1",
          title: "Tagged Prompt",
          tags: ["test-tag"],
          updatedAt: new Date(),
        },
      ];

      const mockPromptQuery = {
        sort: sinon.stub().returnsThis(),
        select: sinon.stub().resolves(mockPrompts),
      };

      sinon.stub(Prompt, "find").returns(mockPromptQuery);

      const { req, res } = mockExpressReqRes({
        query: { tag: "test-tag" },
      });

      // Act
      await getPrompts(req, res);

      // Assert
      assert.ok(
        Prompt.find.calledWith({ tags: "test-tag" }),
        "Should apply tag filter",
      );
      assert.ok(
        res.json.calledWith(mockPrompts),
        "Should return tagged prompts",
      );
    });

    it("should apply both search and tag filters when both are provided", async () => {
      // Arrange
      const mockPrompts = [
        {
          _id: "1",
          title: "Filtered Prompt",
          tags: ["filter-tag"],
          updatedAt: new Date(),
        },
      ];

      const mockPromptQuery = {
        sort: sinon.stub().returnsThis(),
        select: sinon.stub().resolves(mockPrompts),
      };

      sinon.stub(Prompt, "find").returns(mockPromptQuery);

      const { req, res } = mockExpressReqRes({
        query: { search: "filter", tag: "filter-tag" },
      });

      // Act
      await getPrompts(req, res);

      // Assert
      assert.ok(
        Prompt.find.calledWith({
          $text: { $search: "filter" },
          tags: "filter-tag",
        }),
        "Should apply both search and tag filters",
      );
      assert.ok(
        res.json.calledWith(mockPrompts),
        "Should return filtered prompts",
      );
    });

    it("should handle database errors properly", async () => {
      // Arrange
      const dbError = new Error("Database error");
      sinon.stub(Prompt, "find").throws(dbError);

      const { req, res } = mockExpressReqRes();

      // Act
      await getPrompts(req, res);

      // Assert
      assert.ok(res.status.calledWith(500), "Should return 500 status code");
      assert.ok(
        res.json.calledWith({ message: dbError.message }),
        "Should return error message",
      );
    });
  });

  describe("getPromptById", () => {
    it("should return a prompt when valid ID is provided", async () => {
      // Arrange
      const mockPrompt = {
        _id: "valid-id",
        title: "Test Prompt",
        content: "Test content",
        tags: ["test"],
      };

      sinon.stub(Prompt, "findById").resolves(mockPrompt);

      const { req, res } = mockExpressReqRes({
        params: { id: "valid-id" },
      });

      // Act
      await getPromptById(req, res);

      // Assert
      assert.ok(
        Prompt.findById.calledWith("valid-id"),
        "Should query with correct ID",
      );
      assert.ok(res.json.calledWith(mockPrompt), "Should return the prompt");
    });

    it("should return 404 when prompt is not found", async () => {
      // Arrange
      sinon.stub(Prompt, "findById").resolves(null);

      const { req, res } = mockExpressReqRes({
        params: { id: "nonexistent-id" },
      });

      // Act
      await getPromptById(req, res);

      // Assert
      assert.ok(res.status.calledWith(404), "Should return 404 status code");
      assert.ok(
        res.json.calledWith({ message: "Prompt not found" }),
        "Should return not found message",
      );
    });

    it("should handle database errors properly", async () => {
      // Arrange
      const dbError = new Error("Database error");
      sinon.stub(Prompt, "findById").throws(dbError);

      const { req, res } = mockExpressReqRes({
        params: { id: "some-id" },
      });

      // Act
      await getPromptById(req, res);

      // Assert
      assert.ok(res.status.calledWith(500), "Should return 500 status code");
      assert.ok(
        res.json.calledWith({ message: dbError.message }),
        "Should return error message",
      );
    });
  });

  describe("createPrompt", () => {
    it("should create a prompt with valid data", async () => {
      // Arrange
      const promptData = {
        title: "New Prompt",
        content: "New content",
        tags: ["new", "test"],
      };

      const savedPrompt = {
        _id: "new-id",
        ...promptData,
      };

      const saveStub = sinon.stub().resolves(savedPrompt);
      sinon.stub(Prompt.prototype, "save").callsFake(saveStub);

      const { req, res } = mockExpressReqRes({
        body: promptData,
      });

      // Act
      await createPrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(201), "Should return 201 status code");
      assert.ok(
        res.json.calledWith(savedPrompt),
        "Should return created prompt",
      );
    });

    it("should create a prompt with empty tags when tags are not provided", async () => {
      // Arrange
      const promptData = {
        title: "New Prompt",
        content: "New content",
        // No tags
      };

      const savedPrompt = {
        _id: "new-id",
        ...promptData,
        tags: [], // Empty tags array
      };

      const saveStub = sinon.stub().resolves(savedPrompt);
      sinon.stub(Prompt.prototype, "save").callsFake(saveStub);

      const { req, res } = mockExpressReqRes({
        body: promptData,
      });

      // Act
      await createPrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(201), "Should return 201 status code");
      assert.ok(
        res.json.calledWith(savedPrompt),
        "Should return created prompt with empty tags",
      );
    });

    it("should return 400 when title is missing", async () => {
      // Arrange
      const promptData = {
        // Missing title
        content: "Content without title",
        tags: ["test"],
      };

      const { req, res } = mockExpressReqRes({
        body: promptData,
      });

      // Act
      await createPrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(400), "Should return 400 status code");
      assert.ok(
        res.json.calledWith({ message: "Title and content are required" }),
        "Should return validation error message",
      );
    });

    it("should return 400 when content is missing", async () => {
      // Arrange
      const promptData = {
        title: "Title without content",
        // Missing content
        tags: ["test"],
      };

      const { req, res } = mockExpressReqRes({
        body: promptData,
      });

      // Act
      await createPrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(400), "Should return 400 status code");
      assert.ok(
        res.json.calledWith({ message: "Title and content are required" }),
        "Should return validation error message",
      );
    });

    it("should handle database errors properly", async () => {
      // Arrange
      const promptData = {
        title: "New Prompt",
        content: "New content",
        tags: ["test"],
      };

      const dbError = new Error("Database error");
      sinon.stub(Prompt.prototype, "save").throws(dbError);

      const { req, res } = mockExpressReqRes({
        body: promptData,
      });

      // Act
      await createPrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(500), "Should return 500 status code");
      assert.ok(
        res.json.calledWith({ message: dbError.message }),
        "Should return error message",
      );
    });
  });

  describe("updatePrompt", () => {
    it("should update a prompt with valid data", async () => {
      // Arrange
      const promptId = "update-id";
      const updateData = {
        title: "Updated Title",
        content: "Updated content",
        tags: ["updated", "test"],
      };

      const updatedPrompt = {
        _id: promptId,
        ...updateData,
      };

      sinon.stub(Prompt, "findByIdAndUpdate").resolves(updatedPrompt);

      const { req, res } = mockExpressReqRes({
        params: { id: promptId },
        body: updateData,
      });

      // Act
      await updatePrompt(req, res);

      // Assert
      assert.ok(
        Prompt.findByIdAndUpdate.calledWith(promptId, updateData, {
          new: true,
          runValidators: true,
        }),
        "Should call findByIdAndUpdate with correct arguments",
      );
      assert.ok(
        res.json.calledWith(updatedPrompt),
        "Should return updated prompt",
      );
    });

    it("should return 404 when prompt is not found", async () => {
      // Arrange
      sinon.stub(Prompt, "findByIdAndUpdate").resolves(null);

      const { req, res } = mockExpressReqRes({
        params: { id: "nonexistent-id" },
        body: {
          title: "Won't Update",
          content: "This prompt doesn't exist",
          tags: [],
        },
      });

      // Act
      await updatePrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(404), "Should return 404 status code");
      assert.ok(
        res.json.calledWith({ message: "Prompt not found" }),
        "Should return not found message",
      );
    });

    it("should handle database errors properly", async () => {
      // Arrange
      const dbError = new Error("Database error");
      sinon.stub(Prompt, "findByIdAndUpdate").throws(dbError);

      const { req, res } = mockExpressReqRes({
        params: { id: "error-id" },
        body: {
          title: "Error Prompt",
          content: "Error content",
          tags: ["error"],
        },
      });

      // Act
      await updatePrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(500), "Should return 500 status code");
      assert.ok(
        res.json.calledWith({ message: dbError.message }),
        "Should return error message",
      );
    });
  });

  describe("deletePrompt", () => {
    it("should delete a prompt when valid ID is provided", async () => {
      // Arrange
      const promptId = "delete-id";
      const deletedPrompt = {
        _id: promptId,
        title: "Deleted Prompt",
      };

      sinon.stub(Prompt, "findByIdAndDelete").resolves(deletedPrompt);

      const { req, res } = mockExpressReqRes({
        params: { id: promptId },
      });

      // Act
      await deletePrompt(req, res);

      // Assert
      assert.ok(
        Prompt.findByIdAndDelete.calledWith(promptId),
        "Should call findByIdAndDelete with correct ID",
      );
      assert.ok(
        res.json.calledWith({ message: "Prompt deleted successfully" }),
        "Should return success message",
      );
    });

    it("should return 404 when prompt is not found", async () => {
      // Arrange
      sinon.stub(Prompt, "findByIdAndDelete").resolves(null);

      const { req, res } = mockExpressReqRes({
        params: { id: "nonexistent-id" },
      });

      // Act
      await deletePrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(404), "Should return 404 status code");
      assert.ok(
        res.json.calledWith({ message: "Prompt not found" }),
        "Should return not found message",
      );
    });

    it("should handle database errors properly", async () => {
      // Arrange
      const dbError = new Error("Database error");
      sinon.stub(Prompt, "findByIdAndDelete").throws(dbError);

      const { req, res } = mockExpressReqRes({
        params: { id: "error-id" },
      });

      // Act
      await deletePrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(500), "Should return 500 status code");
      assert.ok(
        res.json.calledWith({ message: dbError.message }),
        "Should return error message",
      );
    });
  });
});
