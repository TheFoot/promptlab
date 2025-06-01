import AgentChatService from "../services/agentChatService.js";
import config from "../config/index.js";

// Controller for chat API endpoints
const chatController = {
  // Handle regular chat requests
  async sendMessage(req, res) {
    // Define variables outside try/catch to make them available in the catch block
    let provider = "openai";
    let model = "";
    let agentType = "chat";
    const clientIp = req.ip || "0.0.0.0";

    try {
      // Extract request data
      const { messages, temperature, promptContent, promptTitle } = req.body;

      // Extract and normalize provider, model, and agent type
      provider = req.body.provider?.toLowerCase() || config.providers.default;
      model = req.body.model || "";
      agentType = req.body.agentType?.toLowerCase() || "chat";

      if (!messages || !Array.isArray(messages)) {
        return res
          .status(400)
          .json({ error: "Messages are required and must be an array" });
      }

      global.logger.debug("Processing agent chat request", {
        clientIp,
        provider,
        model,
        agentType,
        messageCount: messages.length,
        hasPromptContent: !!promptContent,
      });

      // Use agent chat service for processing
      const response = await AgentChatService.processChat({
        messages,
        agentType,
        provider,
        model,
        temperature,
        promptContent,
        promptTitle,
      });

      global.logger.info("Agent chat request successful", {
        clientIp,
        provider,
        model,
        agentType,
        tokens: response.usage?.total_tokens,
      });

      return res.json(response);
    } catch (error) {
      global.logger.error("Agent chat request failed", {
        error: error.message,
        stack: error.stack,
        clientIp,
        provider, // Now safely defined
        model, // Now safely defined
        agentType, // Now safely defined
        requestBody: req.body, // Log the request body for debugging
      });

      return res.status(500).json({
        error: "Failed to process chat request",
        message: error.message,
      });
    }
  },

  // Handle WebSocket connections for streaming responses
  handleWebSocket(ws, req) {
    const clientIp = req.socket.remoteAddress;

    global.logger.debug("WebSocket handler initialized", {
      clientIp,
      userAgent: req.headers["user-agent"],
    });

    // Handle WebSocket errors
    ws.on("error", (error) => {
      global.logger.error("WebSocket error", {
        error: error.message,
        stack: error.stack,
        clientIp,
      });
    });

    // Handle WebSocket closing
    ws.on("close", () => {
      global.logger.info("WebSocket connection closed", {
        clientIp,
      });
    });

    ws.on("message", async (message) => {
      // Store provider, model, and agent type outside try/catch for error handling access
      let provider = config.providers.default;
      let model = "";
      let agentType = "chat";
      let clientRequestData = null;

      try {
        // Parse the incoming data
        let data;
        try {
          data = JSON.parse(message);
        } catch (parseError) {
          // Handle JSON parsing errors
          ws.send(
            JSON.stringify({
              type: "error",
              error: `Invalid JSON: ${parseError.message}`,
            }),
          );
          return;
        }

        clientRequestData = data;
        // Extract with explicit check for undefined to differentiate between missing and false
        const { messages, temperature, promptContent, promptTitle } = data;
        // Only default to true if stream is completely missing from the data
        const stream = "stream" in data ? data.stream : false;

        // Extract and normalize provider, model, and agent type
        provider = data.provider?.toLowerCase() || config.providers.default;
        model = data.model || "";
        agentType = data.agentType?.toLowerCase() || "chat";

        global.logger.debug("WebSocket agent message received", {
          clientIp,
          messageCount: messages?.length,
          provider,
          model,
          agentType,
          stream,
          hasPromptContent: !!promptContent,
        });

        if (!messages || !Array.isArray(messages)) {
          return ws.send(
            JSON.stringify({
              type: "error",
              error: "Messages are required and must be an array",
            }),
          );
        }

        // Start the message
        ws.send(JSON.stringify({ type: "start" }));

        if (stream) {
          // Stream the response using agent service
          const response = await AgentChatService.processStreamingChat(
            {
              messages,
              agentType,
              provider,
              model,
              temperature,
              promptContent,
              promptTitle,
            },
            (content) => {
              ws.send(JSON.stringify({ type: "stream", content }));
            },
          );

          // End the message with the complete response text
          ws.send(
            JSON.stringify({
              type: "end",
              content: response.message,
              agentType: response.agentType,
            }),
          );
          global.logger.info("WebSocket agent stream completed", {
            clientIp,
            provider,
            model,
            agentType,
          });
        } else {
          // Get the full response at once using agent service
          const response = await AgentChatService.processChat({
            messages,
            agentType,
            provider,
            model,
            temperature,
            promptContent,
            promptTitle,
          });

          ws.send(
            JSON.stringify({
              type: "stream",
              content: response.message,
            }),
          );
          ws.send(
            JSON.stringify({
              type: "end",
              content: response.message,
              agentType: response.agentType,
            }),
          );
          global.logger.info("WebSocket agent non-streaming response completed", {
            clientIp,
            provider,
            model,
            agentType,
            tokens: response.usage?.total_tokens,
          });
        }
      } catch (error) {
        // Log the error with available context
        global.logger.error("WebSocket agent chat request failed", {
          error: error.message,
          stack: error.stack,
          clientIp: req.socket.remoteAddress,
          provider, // Now safely defined
          model, // Now safely defined
          agentType, // Now safely defined
          requestData: clientRequestData, // Include the original request data for debugging
        });

        // Send error response to client
        ws.send(
          JSON.stringify({
            type: "error",
            error: error.message || "Failed to process chat request",
          }),
        );
      }
    });

    // Handle connection opened
    ws.send(
      JSON.stringify({
        type: "info",
        message: "Chat WebSocket connection established",
      }),
    );
  },

  // Get available provider and model configurations
  async getProviderConfig(req, res) {
    try {
      // Create a configuration object for the frontend with only what it needs
      const frontendConfig = {
        providers: {
          available: config.providers.available,
          default: config.providers.default,
          displayNames: config.providers.ui.displayNames,
        },
        models: {},
        agents: {
          available: AgentChatService.getAvailableAgentTypes(),
          metadata: AgentChatService.getAllAgentMetadata(),
        },
      };

      // Add model configurations for each provider
      config.providers.available.forEach((provider) => {
        const providerConfig = config[provider];
        if (providerConfig && providerConfig.models) {
          frontendConfig.models[provider] = {
            available: providerConfig.models.available,
            default: providerConfig.models.default,
            displayNames: providerConfig.models.displayNames,
          };
        }
      });

      return res.json(frontendConfig);
    } catch (error) {
      global.logger.error("Error getting provider config", {
        error: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        error: "Failed to retrieve provider configuration",
        message: error.message,
      });
    }
  },

  // Get available agent configurations
  async getAgentConfig(req, res) {
    try {
      const agentConfig = {
        available: AgentChatService.getAvailableAgentTypes(),
        metadata: AgentChatService.getAllAgentMetadata(),
      };

      return res.json(agentConfig);
    } catch (error) {
      global.logger.error("Error getting agent config", {
        error: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        error: "Failed to retrieve agent configuration",
        message: error.message,
      });
    }
  },
};

export default chatController;
