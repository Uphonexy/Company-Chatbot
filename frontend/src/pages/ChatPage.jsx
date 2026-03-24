import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendMessage, getHistory } from '../api/chatApi';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

const ChatPage = () => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let sid = localStorage.getItem('chatSessionId');
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem('chatSessionId', sid);
    }
    setSessionId(sid);

    const loadHistory = async () => {
      try {
        const history = await getHistory(sid);
        const formatted = [];
        history.forEach(item => {
          formatted.push({ text: item.question, isUser: true });
          formatted.push({ text: item.answer, isUser: false });
        });
        setMessages(formatted);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    loadHistory();
  }, []);

  const handleSend = async (question) => {
    setMessages(prev => [...prev, { text: question, isUser: true }]);
    setLoading(true);
    setError('');

    try {
      const response = await sendMessage(question, sessionId);
      if (response.error) {
        setError(response.error);
      } else {
        setMessages(prev => [...prev, { text: response.answer, isUser: false }]);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError('Error: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>Company Policy Assistant</h1>
      </header>
      <div className="chat-container glass-panel">
        <ChatWindow messages={messages} />
        {loading && <div className="loading-indicator">Assistant is thinking...</div>}
        {error && <div className="error-message">{error}</div>}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
};

export default ChatPage;
