import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";

import Prompt from "../../src/models/Prompt.js";
import { setupInMemoryMongoDB, closeDatabase } from "../helpers/testSetup.js";

describe("Prompt Model", async () => {
  let mongod;

  before(async () => {
    // Set up an in-memory MongoDB server
    const mongoSetup = await setupInMemoryMongoDB();
    mongod = mongoSetup.mongod;
  });

  after(async () => {
    // Tear down the in-memory MongoDB server
    await closeDatabase(mongod);
  });

  it("should create a prompt with valid data", async () => {
    // Arrange
    const promptData = {
      title: "Test Prompt",
      content: "This is a test prompt content.",
      tags: ["test", "prompt", "example"],
    };

    // Act
    const prompt = new Prompt(promptData);
    const savedPrompt = await prompt.save();

    // Assert
    assert.ok(savedPrompt._id);
    assert.equal(savedPrompt.title, promptData.title);
    assert.equal(savedPrompt.content, promptData.content);
    assert.deepEqual(savedPrompt.tags, promptData.tags);
    assert.ok(savedPrompt.createdAt);
    assert.ok(savedPrompt.updatedAt);
  });

  it("should not create a prompt without a title", async () => {
    // Arrange
    const promptData = {
      content: "This is a test prompt content without a title.",
      tags: ["test"],
    };

    // Act & Assert
    const prompt = new Prompt(promptData);
    try {
      await prompt.save();
      assert.fail("Expected validation error for missing title");
    } catch (error) {
      assert.ok(error instanceof mongoose.Error.ValidationError);
      assert.ok(error.errors.title);
    }
  });

  it("should not create a prompt without content", async () => {
    // Arrange
    const promptData = {
      title: "Test Prompt Without Content",
      tags: ["test"],
    };

    // Act & Assert
    const prompt = new Prompt(promptData);
    try {
      await prompt.save();
      assert.fail("Expected validation error for missing content");
    } catch (error) {
      assert.ok(error instanceof mongoose.Error.ValidationError);
      assert.ok(error.errors.content);
    }
  });

  it("should create a prompt without tags", async () => {
    // Arrange
    const promptData = {
      title: "Test Prompt Without Tags",
      content: "This is a test prompt content without tags.",
    };

    // Act
    const prompt = new Prompt(promptData);
    const savedPrompt = await prompt.save();

    // Assert
    assert.ok(savedPrompt._id);
    assert.equal(savedPrompt.title, promptData.title);
    assert.equal(savedPrompt.content, promptData.content);
    assert.deepEqual(savedPrompt.tags, []);
  });

  it("should trim whitespace from title and tags", async () => {
    // Arrange
    const promptData = {
      title: "  Trimmed Title  ",
      content: "This is a test prompt for trimming.",
      tags: ["  tag1  ", " tag2 "],
    };

    // Act
    const prompt = new Prompt(promptData);
    const savedPrompt = await prompt.save();

    // Assert
    assert.equal(savedPrompt.title, "Trimmed Title");
    assert.deepEqual(savedPrompt.tags, ["tag1", "tag2"]);
  });

  it("should update the updatedAt timestamp when modified", async () => {
    // Arrange
    const promptData = {
      title: "Original Title",
      content: "Original content",
    };

    // Act - Create prompt
    const prompt = new Prompt(promptData);
    const savedPrompt = await prompt.save();
    const originalUpdatedAt = savedPrompt.updatedAt;

    // Wait a moment to ensure timestamp would change
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Act - Update prompt
    savedPrompt.title = "Updated Title";
    const updatedPrompt = await savedPrompt.save();

    // Assert
    assert.notEqual(
      updatedPrompt.updatedAt.getTime(),
      originalUpdatedAt.getTime(),
    );
    assert.equal(updatedPrompt.title, "Updated Title");
  });
});
