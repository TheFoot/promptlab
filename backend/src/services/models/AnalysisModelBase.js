/**
 * Base class for all analysis models
 *
 * Defines the interface that all provider-specific analysis models must implement
 */

class AnalysisModelBase {
  constructor(providerConfig = {}) {
    this.providerConfig = providerConfig;
  }

  /* eslint-disable no-unused-vars */
  async generateAnalysis(messages, options) {
    throw new Error("Not implemented");
  }

  async generateContent(messages, options) {
    throw new Error("Not implemented");
  }
  /* eslint-enable no-unused-vars */
}

export default AnalysisModelBase;
