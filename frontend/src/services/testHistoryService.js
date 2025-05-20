/**
 * Test History Service
 * Manages saving, loading, and comparing test sessions for prompts
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Save a complete test session
 * 
 * @param {string} promptId - The ID of the prompt being tested
 * @param {Array} conversation - Array of message objects in the conversation
 * @param {Object} metrics - Performance metrics for the session
 * @returns {Promise<Object>} Saved session data
 */
async function saveTestSession(promptId, conversation, metrics = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompts/${promptId}/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation,
        metrics,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save test session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in saveTestSession:', error);
    throw error;
  }
}

/**
 * Get test history for a prompt with optional filtering
 * 
 * @param {string} promptId - The ID of the prompt
 * @param {Object} options - Optional filtering parameters
 * @param {number} options.limit - Maximum number of sessions to return
 * @param {number} options.offset - Number of sessions to skip
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {string} options.modelId - Filter by AI model
 * @returns {Promise<Array>} Array of test sessions
 */
async function getTestHistory(promptId, options = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.offset) queryParams.append('offset', options.offset);
    if (options.startDate) queryParams.append('startDate', options.startDate);
    if (options.endDate) queryParams.append('endDate', options.endDate);
    if (options.modelId) queryParams.append('modelId', options.modelId);
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/prompts/${promptId}/tests${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to get test history: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getTestHistory:', error);
    throw error;
  }
}

/**
 * Get details of a specific test session
 * 
 * @param {string} promptId - The ID of the prompt
 * @param {string} sessionId - The ID of the test session
 * @returns {Promise<Object>} Complete test session data
 */
async function getTestSession(promptId, sessionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompts/${promptId}/tests/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get test session: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getTestSession:', error);
    throw error;
  }
}

/**
 * Delete a test session
 * 
 * @param {string} promptId - The ID of the prompt
 * @param {string} sessionId - The ID of the test session to delete
 * @returns {Promise<Object>} Success confirmation
 */
async function deleteTestSession(promptId, sessionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompts/${promptId}/tests/${sessionId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete test session: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in deleteTestSession:', error);
    throw error;
  }
}

/**
 * Compare metrics between two test sessions
 * 
 * @param {string} promptId - The ID of the prompt
 * @param {string} sessionId1 - The ID of the first test session
 * @param {string} sessionId2 - The ID of the second test session
 * @returns {Promise<Object>} Comparison results
 */
async function compareTestSessions(promptId, sessionId1, sessionId2) {
  try {
    // First, get both sessions
    const [session1, session2] = await Promise.all([
      getTestSession(promptId, sessionId1),
      getTestSession(promptId, sessionId2)
    ]);
    
    // Compare metrics
    const comparison = {
      sessionIds: [sessionId1, sessionId2],
      metrics: {}
    };
    
    // Compare common metrics
    const allMetricKeys = new Set([
      ...Object.keys(session1.metrics || {}),
      ...Object.keys(session2.metrics || {})
    ]);
    
    allMetricKeys.forEach(key => {
      const val1 = session1.metrics?.[key] || 0;
      const val2 = session2.metrics?.[key] || 0;
      const difference = val2 - val1;
      const percentChange = val1 !== 0 ? (difference / val1) * 100 : null;
      
      comparison.metrics[key] = {
        values: [val1, val2],
        difference,
        percentChange
      };
    });
    
    return comparison;
  } catch (error) {
    console.error('Error in compareTestSessions:', error);
    throw error;
  }
}

/**
 * Continue testing from a previous session
 * 
 * @param {string} promptId - The ID of the prompt
 * @param {string} sessionId - The ID of the previous test session
 * @param {string} newUserMessage - New message to continue the conversation
 * @returns {Promise<Object>} Updated test session
 */
async function continueFromSession(promptId, sessionId, newUserMessage) {
  try {
    const session = await getTestSession(promptId, sessionId);
    
    // Add the new user message
    session.conversation.push({
      role: 'user',
      content: newUserMessage,
      timestamp: new Date().toISOString()
    });
    
    // Create a new session with this extended conversation
    return await saveTestSession(promptId, session.conversation, session.metrics);
  } catch (error) {
    console.error('Error in continueFromSession:', error);
    throw error;
  }
}

/**
 * Get the most recent test session for a prompt
 * 
 * @param {string} promptId - The ID of the prompt
 * @returns {Promise<Object>} Most recent test session
 */
async function getMostRecentTestSession(promptId) {
  try {
    const sessions = await getTestHistory(promptId, { limit: 1 });
    return sessions.length > 0 ? sessions[0] : null;
  } catch (error) {
    console.error('Error in getMostRecentTestSession:', error);
    throw error;
  }
}

// Local storage fallback functions for offline/development use
const STORAGE_KEY_PREFIX = 'promptlab_test_history_';

/**
 * Save test session to local storage
 */
function saveTestSessionToLocalStorage(promptId, session) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${promptId}`;
    let sessions = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Generate a simple ID for local storage
    const sessionWithId = {
      ...session,
      id: `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    
    sessions.unshift(sessionWithId); // Add to beginning of array
    
    // Keep only the most recent 50 sessions
    if (sessions.length > 50) {
      sessions = sessions.slice(0, 50);
    }
    
    localStorage.setItem(key, JSON.stringify(sessions));
    return sessionWithId;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return null;
  }
}

/**
 * Get test sessions from local storage
 */
function getTestHistoryFromLocalStorage(promptId, options = {}) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${promptId}`;
    let sessions = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Apply filters
    if (options.startDate) {
      const startDate = new Date(options.startDate).getTime();
      sessions = sessions.filter(session => new Date(session.timestamp).getTime() >= startDate);
    }
    
    if (options.endDate) {
      const endDate = new Date(options.endDate).getTime();
      sessions = sessions.filter(session => new Date(session.timestamp).getTime() <= endDate);
    }
    
    if (options.modelId) {
      sessions = sessions.filter(session => 
        session.modelId === options.modelId || 
        session.conversation.some(msg => msg.modelId === options.modelId)
      );
    }
    
    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || sessions.length;
    
    return sessions.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

// Fallback function that tries API first, then falls back to localStorage
async function getTestHistoryWithFallback(promptId, options = {}) {
  try {
    return await getTestHistory(promptId, options);
  } catch (error) {
    console.warn('Failed to get test history from API, falling back to localStorage:', error);
    return getTestHistoryFromLocalStorage(promptId, options);
  }
}

// Export service
export const testHistoryService = {
  saveTestSession,
  getTestHistory,
  getTestSession,
  deleteTestSession,
  compareTestSessions,
  continueFromSession,
  getMostRecentTestSession,
  
  // Local storage fallbacks
  saveTestSessionToLocalStorage,
  getTestHistoryFromLocalStorage,
  getTestHistoryWithFallback
};