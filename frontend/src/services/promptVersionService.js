/**
 * Prompt Version Service
 * Manages version control for prompts, including saving, comparing, and restoring versions
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Save a new version of a prompt
 *
 * @param {string} promptId - The ID of the prompt
 * @param {string} content - The prompt content to save as a new version
 * @param {Object} metadata - Additional metadata for the version
 * @param {string} metadata.description - Optional description of changes
 * @returns {Promise<Object>} Saved version data
 */
async function saveVersion(promptId, content, metadata = {}) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${promptId}/versions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          metadata,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to save prompt version: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in saveVersion:", error);
    throw error;
  }
}

/**
 * Get all versions of a prompt
 *
 * @param {string} promptId - The ID of the prompt
 * @returns {Promise<Array>} Array of version summaries
 */
async function getVersions(promptId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${promptId}/versions`,
    );

    if (!response.ok) {
      throw new Error(`Failed to get prompt versions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getVersions:", error);
    throw error;
  }
}

/**
 * Get a specific version of a prompt
 *
 * @param {string} promptId - The ID of the prompt
 * @param {string} versionId - The ID of the version to retrieve
 * @returns {Promise<Object>} Complete version data
 */
async function getVersion(promptId, versionId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${promptId}/versions/${versionId}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to get prompt version: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getVersion:", error);
    throw error;
  }
}

/**
 * Compare two versions of a prompt
 *
 * @param {string} promptId - The ID of the prompt
 * @param {string} versionId1 - The ID of the first version
 * @param {string} versionId2 - The ID of the second version
 * @returns {Promise<Object>} Comparison data including diff
 */
async function compareVersions(promptId, versionId1, versionId2) {
  try {
    // Fetch both versions in parallel
    const [version1, version2] = await Promise.all([
      getVersion(promptId, versionId1),
      getVersion(promptId, versionId2),
    ]);

    // In a real implementation, we might call a dedicated backend endpoint
    // that performs the diff server-side, but for now we'll return the raw versions

    return {
      version1,
      version2,
      // In a real implementation, this would include diff data
      // diff: { ... }
    };
  } catch (error) {
    console.error("Error in compareVersions:", error);
    throw error;
  }
}

/**
 * Restore a prompt to a previous version
 *
 * @param {string} promptId - The ID of the prompt
 * @param {string} versionId - The ID of the version to restore
 * @returns {Promise<Object>} Updated prompt data
 */
async function restoreVersion(promptId, versionId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${promptId}/versions/${versionId}/restore`,
      {
        method: "PUT",
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to restore prompt version: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in restoreVersion:", error);
    throw error;
  }
}

// Helper function to create a simple diff between two text strings
function createTextDiff(text1, text2) {
  if (!text1 || !text2) {
    return { added: text2, removed: text1 };
  }

  // This is a very simple diff implementation
  // In a real application, you would use a proper diff library

  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");

  const diff = {
    unchanged: [],
    added: [],
    removed: [],
  };

  // Find added and removed lines
  for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
    if (i >= lines1.length) {
      // Line was added
      diff.added.push({ line: i, content: lines2[i] });
    } else if (i >= lines2.length) {
      // Line was removed
      diff.removed.push({ line: i, content: lines1[i] });
    } else if (lines1[i] !== lines2[i]) {
      // Line was changed
      diff.removed.push({ line: i, content: lines1[i] });
      diff.added.push({ line: i, content: lines2[i] });
    } else {
      // Line is unchanged
      diff.unchanged.push({ line: i, content: lines1[i] });
    }
  }

  return diff;
}

// Local storage fallback for offline/development use
const STORAGE_KEY_PREFIX = "promptlab_versions_";

/**
 * Save a version to local storage
 */
function saveVersionToLocalStorage(promptId, content, metadata = {}) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${promptId}`;
    let versions = JSON.parse(localStorage.getItem(key) || "[]");

    // Get the next version number
    const versionNumber =
      versions.length > 0
        ? Math.max(...versions.map((v) => v.versionNumber)) + 1
        : 1;

    // Create the version object
    const version = {
      id: `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      promptId,
      versionNumber,
      content,
      createdAt: new Date().toISOString(),
      metadata: {
        ...metadata,
        changedBy: "local-user",
      },
    };

    versions.push(version);
    localStorage.setItem(key, JSON.stringify(versions));

    return version;
  } catch (error) {
    console.error("Error saving version to localStorage:", error);
    return null;
  }
}

/**
 * Get versions from local storage
 */
function getVersionsFromLocalStorage(promptId) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${promptId}`;
    const versions = JSON.parse(localStorage.getItem(key) || "[]");

    // Sort by version number descending
    return versions.sort((a, b) => b.versionNumber - a.versionNumber);
  } catch (error) {
    console.error("Error reading versions from localStorage:", error);
    return [];
  }
}

/**
 * Get a specific version from local storage
 */
function getVersionFromLocalStorage(promptId, versionId) {
  try {
    const versions = getVersionsFromLocalStorage(promptId);
    return versions.find((v) => v.id === versionId) || null;
  } catch (error) {
    console.error("Error getting version from localStorage:", error);
    return null;
  }
}

// Fallback functions that try API first, then fall back to localStorage
async function getVersionsWithFallback(promptId) {
  try {
    return await getVersions(promptId);
  } catch (error) {
    console.warn(
      "Failed to get versions from API, falling back to localStorage:",
      error,
    );
    return getVersionsFromLocalStorage(promptId);
  }
}

async function saveVersionWithFallback(promptId, content, metadata = {}) {
  try {
    return await saveVersion(promptId, content, metadata);
  } catch (error) {
    console.warn(
      "Failed to save version to API, falling back to localStorage:",
      error,
    );
    return saveVersionToLocalStorage(promptId, content, metadata);
  }
}

// Export service
export const promptVersionService = {
  saveVersion,
  getVersions,
  getVersion,
  compareVersions,
  restoreVersion,
  createTextDiff,

  // Local storage fallbacks
  saveVersionToLocalStorage,
  getVersionsFromLocalStorage,
  getVersionFromLocalStorage,

  // Combined methods with fallback
  getVersionsWithFallback,
  saveVersionWithFallback,
};
