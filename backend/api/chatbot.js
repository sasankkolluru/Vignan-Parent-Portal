const axios = require('axios');

// Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192'; // or 'mixtral-8x7b-32768', 'gemma-7b-it'

class AIChatbotService {
  constructor() {
    this.conversationHistory = new Map(); // Store conversation context per session
    this.maxHistoryLength = 10;
  }

  // System prompt for the student results assistant
  getSystemPrompt(studentData = null) {
    let basePrompt = `You are a helpful AI assistant for a Student Results Portal. 
Your role is to help students and parents with:
1. Understanding their academic results and grades
2. Explaining fee structure and payment details
3. Answering questions about attendance and performance
4. Providing guidance on academic matters
5. Directing users to appropriate counsellors when needed

Guidelines:
- Be professional, friendly, and concise
- Always prioritize accuracy over speculation
- If you don't know something, say so and suggest contacting the counsellor
- Keep responses under 150 words when possible
- Use simple language that parents can understand
- Do not share any student's private information with other users`;

    if (studentData) {
      basePrompt += `\n\nCurrent Student Context:\nName: ${studentData.name || 'N/A'}\nRegd.No.: ${studentData.registrationNumber || 'N/A'}\nBranch: ${studentData.branch || 'N/A'}\nSemester: ${studentData.semester || 'N/A'}\nCGPA: ${studentData.cgpa || 'N/A'}\nCounsellor: ${studentData.counsellor || 'N/A'}`;
    }

    return basePrompt;
  }

  // Get or create conversation history
  getConversationHistory(sessionId) {
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }
    return this.conversationHistory.get(sessionId);
  }

  // Add message to history
  addToHistory(sessionId, role, content) {
    const history = this.getConversationHistory(sessionId);
    history.push({ role, content, timestamp: Date.now() });
    
    // Keep only last N messages
    if (history.length > this.maxHistoryLength) {
      this.conversationHistory.set(sessionId, history.slice(-this.maxHistoryLength));
    }
  }

  // Clear conversation history
  clearHistory(sessionId) {
    this.conversationHistory.delete(sessionId);
  }

  // Clean up old sessions
  cleanupOldSessions() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [sessionId, history] of this.conversationHistory.entries()) {
      const lastMessage = history[history.length - 1];
      if (lastMessage && (now - lastMessage.timestamp) > maxAge) {
        this.conversationHistory.delete(sessionId);
      }
    }
  }

  // Send message to Groq API
  async sendMessage(message, sessionId, studentData = null) {
    try {
      if (!GROQ_API_KEY) {
        return {
          success: false,
          error: 'GROQ_API_KEY_NOT_CONFIGURED',
          message: 'AI chatbot is not configured. Please contact support.'
        };
      }

      // Get conversation history
      const history = this.getConversationHistory(sessionId);

      // Build messages array
      const messages = [
        { role: 'system', content: this.getSystemPrompt(studentData) },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: GROQ_MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content || 
        'I apologize, but I could not generate a response. Please try again.';

      // Update conversation history
      this.addToHistory(sessionId, 'user', message);
      this.addToHistory(sessionId, 'assistant', aiResponse);

      return {
        success: true,
        message: aiResponse,
        model: GROQ_MODEL,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('[AI Chatbot] Error:', error.message);
      
      if (error.response) {
        // API error
        const status = error.response.status;
        if (status === 401) {
          return {
            success: false,
            error: 'API_KEY_INVALID',
            message: 'AI service authentication failed. Please contact support.'
          };
        } else if (status === 429) {
          return {
            success: false,
            error: 'RATE_LIMITED',
            message: 'AI service is busy. Please try again in a moment.'
          };
        }
      }

      return {
        success: false,
        error: 'AI_SERVICE_ERROR',
        message: 'Unable to process your request. Please try again later.'
      };
    }
  }

  // Quick predefined responses for common queries
  getQuickResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    const quickResponses = {
      'hello': 'Hello! Welcome to the Student Results Portal. How can I assist you today?',
      'hi': 'Hi there! How can I help you with your academic queries?',
      'help': 'I can help you with:\n- Understanding your results\n- Fee details\n- Attendance information\n- Contacting your counsellor\nWhat would you like to know?',
      'contact': 'You can reach out to your assigned counsellor through the Contact & Communication page.',
      'bye': 'Goodbye! Feel free to return if you have more questions.',
      'thank': 'You\'re welcome! Is there anything else I can help you with?'
    };

    for (const [key, response] of Object.entries(quickResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return null;
  }
}

// Create singleton instance
const aiChatbotService = new AIChatbotService();

// Periodic cleanup of old sessions
setInterval(() => aiChatbotService.cleanupOldSessions(), 600000); // Every 10 minutes

module.exports = aiChatbotService;
