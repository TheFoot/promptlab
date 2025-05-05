# Database Models

This directory contains Mongoose schema definitions for the MongoDB database used in the PromptLab application.

## Models

### Prompt

The `Prompt.js` model defines the schema for LLM prompts stored in the application.

```javascript
// Prompt schema structure
{
  title: String,        // Title of the prompt
  content: String,      // The actual prompt text
  tags: [String],       // Array of associated tags
  createdAt: Date,      // Creation timestamp
  updatedAt: Date       // Last update timestamp
}
```

## Usage

```javascript
import Prompt from "../models/Prompt.js";

// Create a new prompt
const prompt = new Prompt({
  title: "Example Prompt",
  content: "This is a prompt for an LLM.",
  tags: ["example", "documentation"],
});

// Save to database
await prompt.save();

// Find prompts
const prompts = await Prompt.find({ tags: "example" });
```

## Validation

The model includes validation for required fields and data types. See the schema definitions for specific validation rules.

## Indexes

The models define indexes for fields frequently used in queries to improve performance:

- Text index on `title` and `content` fields for full-text search
- Index on `tags` for efficient filtering

## Related Documentation

- [Backend README](../../README.md)
- [Controllers](../controllers/README.md)
