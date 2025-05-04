import ChatModelFactory from '../services/chatService.js';

// Controller for chat API endpoints
const chatController = {
  // Handle regular chat requests
  async sendMessage(req, res) {
    // Define variables outside try/catch to make them available in the catch block
    let provider = 'openai';
    let model = '';
    let clientIp = req.ip || '0.0.0.0';
    
    try {
      // Extract request data
      const {messages, temperature} = req.body;
      
      // Extract and normalize provider and model 
      provider = req.body.provider?.toLowerCase() || 'openai';
      model = req.body.model || '';

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({error: 'Messages are required and must be an array'});
      }

      global.logger.debug('Processing chat request', {
        clientIp,
        provider,
        model,
        messageCount: messages.length,
      });
      
      const chatModel = ChatModelFactory.createModel(provider);
      const response = await chatModel.chat(messages, {model, temperature});
      
      global.logger.info('Chat request successful', {
        clientIp,
        provider,
        model,
        tokens: response.usage?.total_tokens,
      });

      return res.json(response);
    } catch (error) {
      global.logger.error('Chat request failed', {
        error: error.message,
        stack: error.stack,
        clientIp,
        provider,  // Now safely defined
        model,     // Now safely defined
        requestBody: req.body, // Log the request body for debugging
      });
      
      return res.status(500).json({
        error: 'Failed to process chat request',
        message: error.message,
      });
    }
  },

  // Handle WebSocket connections for streaming responses
  handleWebSocket(ws, req) {
    const clientIp = req.socket.remoteAddress;
    
    global.logger.debug('WebSocket handler initialized', {
      clientIp,
      userAgent: req.headers['user-agent'],
    });
    
    ws.on('message', async (message) => {
      // Store provider and model outside try/catch for error handling access
      let provider = 'openai';
      let model = '';
      let clientRequestData = null;
      
      try {
        // Parse the incoming data
        const data = JSON.parse(message);
        clientRequestData = data;
        const {messages, temperature, stream = true} = data;
        
        // Extract and normalize provider and model
        provider = data.provider?.toLowerCase() || 'openai';
        model = data.model || '';
        
        global.logger.debug('WebSocket message received', {
          clientIp,
          messageCount: messages?.length,
          provider,
          model,
          stream,
        });

        if (!messages || !Array.isArray(messages)) {
          return ws.send(JSON.stringify({
            type: 'error',
            error: 'Messages are required and must be an array',
          }));
        }

        // Start the message
        ws.send(JSON.stringify({type: 'start'}));

        const chatModel = ChatModelFactory.createModel(provider);

        if (stream) {
          // Stream the response
          await chatModel.streamChat(
              messages,
              (content) => {
                ws.send(JSON.stringify({type: 'stream', content}));
              },
              {model, temperature},
          );

          // End the message
          ws.send(JSON.stringify({type: 'end'}));
          global.logger.info('WebSocket stream completed', {
            clientIp,
            provider,
            model,
          });
        } else {
          // Get the full response at once
          const response = await chatModel.chat(messages, {model, temperature});
          ws.send(JSON.stringify({
            type: 'stream',
            content: response.message,
          }));
          ws.send(JSON.stringify({type: 'end'}));
          global.logger.info('WebSocket non-streaming response completed', {
            clientIp,
            provider,
            model,
            tokens: response.usage?.total_tokens,
          });
        }
      } catch (error) {
        // Log the error with available context
        global.logger.error('WebSocket chat request failed', {
          error: error.message,
          stack: error.stack,
          clientIp: req.socket.remoteAddress,
          provider, // Now safely defined
          model,    // Now safely defined
          requestData: clientRequestData, // Include the original request data for debugging
        });
        
        // Send error response to client
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message || 'Failed to process chat request',
        }));
      }
    });

    // Handle connection opened
    ws.send(JSON.stringify({
      type: 'info',
      message: 'Chat WebSocket connection established',
    }));
  },
};

export default chatController;