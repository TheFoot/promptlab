import Prompt from '../models/Prompt.js';

/**
 * Get all prompts with optional search and tag filters
 */
const getPrompts = async (req, res) => {
  try {
    const { search, tag } = req.query;
    let query = {};

    // Apply search filter if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Apply tag filter if provided
    if (tag) {
      query.tags = tag;
    }

    const prompts = await Prompt.find(query)
      .sort({ updatedAt: -1 }) // Sort by most recently updated
      .select('title tags updatedAt');

    res.json(prompts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a specific prompt by ID
 */
const getPromptById = async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new prompt
 */
const createPrompt = async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const newPrompt = new Prompt({
      title,
      content,
      tags,
    });

    const savedPrompt = await newPrompt.save();
    res.status(201).json(savedPrompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing prompt
 */
const updatePrompt = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const updatedPrompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { title, content, tags },
      { new: true, runValidators: true }
    );

    if (!updatedPrompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    res.json(updatedPrompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a prompt
 */
const deletePrompt = async (req, res) => {
  try {
    const deletedPrompt = await Prompt.findByIdAndDelete(req.params.id);

    if (!deletedPrompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getPrompts, getPromptById, createPrompt, updatePrompt, deletePrompt };
