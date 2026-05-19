import api from './api';

const chatbotService = {
  sendMessage: async (message, language = 'fr') => {
    const response = await api.post('/admin-client/chatbot/message', {
      message,
      language,
    });
    return response.data;
  },
};

export default chatbotService;
