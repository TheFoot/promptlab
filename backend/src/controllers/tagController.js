import Prompt from "../models/Prompt.js";

/**
 * Get all unique tags from prompts
 */
const getAllTags = async (req, res) => {
  try {
    const tags = await Prompt.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, name: "$_id" } },
    ]);

    res.json(tags.map((tag) => tag.name));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getAllTags };
