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

// Helper functions to reduce duplication
const setupPromptQueryMock = (results) => {
  const mockQuery = {
    sort: sinon.stub().returnsThis(),
    select: sinon.stub().resolves(results),
  };
  sinon.stub(Prompt, "find").returns(mockQuery);
  return mockQuery;
};

const assertErrorHandling = (res, statusCode, errorMessage) => {
  assert.ok(
    res.status.calledWith(statusCode),
    `Should return ${statusCode} status code`,
  );
  assert.ok(
    res.json.calledWith({ message: errorMessage }),
    "Should return correct error message",
  );
};

describe("Prompt Controller", () => {
  beforeEach(() => {
    // Reset any stubs/mocks before each test
  });

  afterEach(() => {
    // Restore all sinon stubs/mocks after each test
    sinon.restore();
  });

  describe("getPrompts", () => {
    const runGetPromptsTest = async (
      queryParams,
      mockPrompts,
      expectedFilter,
    ) => {
      // Arrange
      const mockPromptQuery = setupPromptQueryMock(mockPrompts);
      const { req, res } = mockExpressReqRes({ query: queryParams });

      // Act
      await getPrompts(req, res);

      // Assert
      assert.ok(
        Prompt.find.calledWith(expectedFilter),
        "Should query with correct filter",
      );
      assert.ok(
        mockPromptQuery.sort.calledWith({ updatedAt: -1 }),
        "Should sort by updatedAt descending",
      );
      assert.ok(
        mockPromptQuery.select.calledWith("title tags updatedAt"),
        "Should select specific fields",
      );
      assert.ok(res.json.calledWith(mockPrompts), "Should return prompts list");
    };

    it("should return all prompts when no filters are provided", async () => {
      const mockPrompts = [
        { _id: "1", title: "Prompt 1", tags: ["tag1"], updatedAt: new Date() },
        { _id: "2", title: "Prompt 2", tags: ["tag2"], updatedAt: new Date() },
      ];
      await runGetPromptsTest({}, mockPrompts, {});
    });

    it("should apply text search filter when search param is provided", async () => {
      const mockPrompts = [
        { _id: "1", title: "Test Prompt", tags: [], updatedAt: new Date() },
      ];
      await runGetPromptsTest({ search: "test query" }, mockPrompts, {
        $text: { $search: "test query" },
      });
    });

    it("should apply tag filter when tag param is provided", async () => {
      const mockPrompts = [
        {
          _id: "1",
          title: "Tagged Prompt",
          tags: ["test-tag"],
          updatedAt: new Date(),
        },
      ];
      await runGetPromptsTest({ tag: "test-tag" }, mockPrompts, {
        tags: "test-tag",
      });
    });

    it("should apply both search and tag filters when both are provided", async () => {
      const mockPrompts = [
        {
          _id: "1",
          title: "Filtered Prompt",
          tags: ["filter-tag"],
          updatedAt: new Date(),
        },
      ];
      await runGetPromptsTest(
        { search: "filter", tag: "filter-tag" },
        mockPrompts,
        { $text: { $search: "filter" }, tags: "filter-tag" },
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
      assertErrorHandling(res, 500, dbError.message);
    });
  });

  describe("getPromptById", () => {
    const setupGetByIdTest = (mockResult) => {
      sinon.stub(Prompt, "findById").resolves(mockResult);
      const promptId = mockResult?._id || "nonexistent-id";
      return mockExpressReqRes({ params: { id: promptId } });
    };

    it("should return a prompt when valid ID is provided", async () => {
      // Arrange
      const mockPrompt = {
        _id: "valid-id",
        title: "Test Prompt",
        content: "Test content",
        tags: ["test"],
      };
      const { req, res } = setupGetByIdTest(mockPrompt);

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
      const { req, res } = setupGetByIdTest(null);

      // Act
      await getPromptById(req, res);

      // Assert
      assertErrorHandling(res, 404, "Prompt not found");
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
      assertErrorHandling(res, 500, dbError.message);
    });
  });

  describe("createPrompt", () => {
    const setupCreateTest = (promptData, savedPrompt) => {
      if (savedPrompt) {
        const saveStub = sinon.stub().resolves(savedPrompt);
        sinon.stub(Prompt.prototype, "save").callsFake(saveStub);
      }
      return mockExpressReqRes({ body: promptData });
    };

    const testSuccessfulCreate = async (promptData, savedPrompt) => {
      // Arrange
      const { req, res } = setupCreateTest(promptData, savedPrompt);

      // Act
      await createPrompt(req, res);

      // Assert
      assert.ok(res.status.calledWith(201), "Should return 201 status code");
      assert.ok(
        res.json.calledWith(savedPrompt),
        "Should return created prompt",
      );
    };

    it("should create a prompt with valid data", async () => {
      const promptData = {
        title: "New Prompt",
        content: "New content",
        tags: ["new", "test"],
      };

      const savedPrompt = {
        _id: "new-id",
        ...promptData,
      };

      await testSuccessfulCreate(promptData, savedPrompt);
    });

    it("should create a prompt with empty tags when tags are not provided", async () => {
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

      await testSuccessfulCreate(promptData, savedPrompt);
    });

    const testValidationFailure = async (promptData) => {
      // Arrange
      const { req, res } = setupCreateTest(promptData);

      // Act
      await createPrompt(req, res);

      // Assert
      assertErrorHandling(res, 400, "Title and content are required");
    };

    it("should return 400 when title is missing", async () => {
      await testValidationFailure({
        // Missing title
        content: "Content without title",
        tags: ["test"],
      });
    });

    it("should return 400 when content is missing", async () => {
      await testValidationFailure({
        title: "Title without content",
        // Missing content
        tags: ["test"],
      });
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
      assertErrorHandling(res, 500, dbError.message);
    });
  });

  describe("updatePrompt", () => {
    const setupUpdateTest = (promptId, updateData, result) => {
      sinon.stub(Prompt, "findByIdAndUpdate").resolves(result);
      return mockExpressReqRes({
        params: { id: promptId },
        body: updateData,
      });
    };

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

      const { req, res } = setupUpdateTest(promptId, updateData, updatedPrompt);

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
      const promptId = "nonexistent-id";
      const updateData = {
        title: "Won't Update",
        content: "This prompt doesn't exist",
        tags: [],
      };

      const { req, res } = setupUpdateTest(promptId, updateData, null);

      // Act
      await updatePrompt(req, res);

      // Assert
      assertErrorHandling(res, 404, "Prompt not found");
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
      assertErrorHandling(res, 500, dbError.message);
    });
  });

  describe("deletePrompt", () => {
    const setupDeleteTest = (promptId, result) => {
      sinon.stub(Prompt, "findByIdAndDelete").resolves(result);
      return mockExpressReqRes({
        params: { id: promptId },
      });
    };

    it("should delete a prompt when valid ID is provided", async () => {
      // Arrange
      const promptId = "delete-id";
      const deletedPrompt = {
        _id: promptId,
        title: "Deleted Prompt",
      };

      const { req, res } = setupDeleteTest(promptId, deletedPrompt);

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
      const { req, res } = setupDeleteTest("nonexistent-id", null);

      // Act
      await deletePrompt(req, res);

      // Assert
      assertErrorHandling(res, 404, "Prompt not found");
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
      assertErrorHandling(res, 500, dbError.message);
    });
  });
});
