// src/components/Messages.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Messages.css';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations (stable reference)
  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('meetra_token');
      const response = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        let serverConvs = data.data || [];

        // Merge connected users (from auth `user.connections`) so they appear in sidebar
        const convMap = new Map();
        serverConvs.forEach(c => convMap.set(c._id, c));

        const myId = getId(user?._id);
        const connectedEntries = (user?.connections || []).filter(Boolean);

        connectedEntries.forEach(entry => {
          const connUser = entry.user || entry;
          const otherId = getId(connUser._id || connUser);
          const conversationId = [myId, otherId].sort().join('_');
          if (!convMap.has(conversationId)) {
            convMap.set(conversationId, {
              _id: conversationId,
              otherUser: connUser,
              lastMessage: null,
              lastActivity: entry.connectedAt || Date.now(),
              unreadCount: 0
            });
          }
        });

        // Sort conversations by lastActivity (descending)
        const merged = Array.from(convMap.values()).sort((a, b) => {
          const ta = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const tb = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return tb - ta;
        });

        setConversations(merged);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  // Socket event listeners

  const getId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val._id) return val._id.toString ? val._id.toString() : String(val._id);
    return String(val);
  };

  const updateConversationsList = useCallback((newMessage) => {
    setConversations(prev => {
      const senderId = getId(newMessage.sender);
      const receiverId = getId(newMessage.receiver);
      const conversationId = [senderId, receiverId].sort().join('_');
      const existingConvIndex = prev.findIndex(conv => conv._id === conversationId);

      const otherUser = (senderId === getId(user?._id))
        ? { _id: receiverId, username: newMessage.receiver?.username || (typeof newMessage.receiver === 'string' ? newMessage.receiver : '') }
        : { _id: senderId, username: newMessage.sender?.username || (typeof newMessage.sender === 'string' ? newMessage.sender : '') };

      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updated = [...prev];
        updated[existingConvIndex] = {
          ...updated[existingConvIndex],
          lastMessage: newMessage,
          lastActivity: newMessage.createdAt,
          unreadCount: receiverId === getId(user?._id) ? 
            (updated[existingConvIndex].unreadCount || 0) + 1 : 0,
          otherUser: otherUser
        };
        // Move to top
        const [moved] = updated.splice(existingConvIndex, 1);
        return [moved, ...updated];
      } else {
        // Add new conversation
        return [{
          _id: conversationId,
          lastMessage: newMessage,
          lastActivity: newMessage.createdAt,
          unreadCount: receiverId === getId(user?._id) ? 1 : 0,
          otherUser: otherUser
        }, ...prev];
      }
    });
  }, [user]);


  useEffect(() => {
    if (!socket || !isConnected) return;

    // Helper: append or replace optimistic temp message
    const appendOrReplaceMessage = (message) => {
      setMessages(prev => {
        // If last message is a temp message from this user with same content, replace it
        const last = prev[prev.length - 1];
        if (last && typeof last._id === 'string' && last._id.startsWith('temp-') && last.content === message.content && getId(last.sender) === getId(user?._id)) {
          const copy = prev.slice(0, prev.length - 1);
          return [...copy, message];
        }

        // Avoid duplicate messages by _id
        if (prev.some(m => getId(m._id) === getId(message._id))) return prev;
        return [...prev, message];
      });
    };

    // Listen for receive-message (incoming to this client)
    socket.on('receive-message', (message) => {
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);

      if (activeChat && (senderId === activeChat || receiverId === activeChat)) {
        appendOrReplaceMessage(message);
      }

      // Update conversations list
      updateConversationsList(message);
    });

    // Listen for message acknowledgement for the sender
    socket.on('message-sent', (message) => {
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);

      if (activeChat && (senderId === activeChat || receiverId === activeChat)) {
        appendOrReplaceMessage(message);
      }

      updateConversationsList(message);
    });

    // Listen for new-message emitted to the conversation room
    socket.on('new-message', (message) => {
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);

      if (activeChat && (senderId === activeChat || receiverId === activeChat)) {
        appendOrReplaceMessage(message);
      }

      updateConversationsList(message);
    });

    // Listen for typing indicators
    socket.on('user-typing', (data) => {
      if (data.typing) {
        setTypingUsers(prev => {
          const s = new Set(prev);
          s.add(data.userId);
          return s;
        });
      } else {
        setTypingUsers(prev => {
          const s = new Set(prev);
          s.delete(data.userId);
          return s;
        });
      }
    });

    // Listen for read receipts
    socket.on('messages-read', (data) => {
      // Update messages as read in UI
      setMessages(prev => 
        prev.map(msg => {
          const senderId = msg.sender?._id || msg.sender;
          return senderId === data.readerId ? { ...msg, isRead: true } : msg;
        })
      );
    });

    return () => {
      socket.off('receive-message');
      socket.off('user-typing');
      socket.off('messages-read');
      socket.off('message-sent');
      socket.off('new-message');
    };
  }, [socket, isConnected, activeChat, updateConversationsList, user]);

  // Listen for app-level open-conversation events (dispatched from People component)
  useEffect(() => {
    const handler = async (e) => {
      const { userId } = e.detail || {};
      if (userId) {
        setActiveChat(userId);
        // Clear previous messages while loading fresh conversation
        setMessages([]);
        // Inline fetch to avoid effect dependency
        try {
          setLoading(true);
          const token = localStorage.getItem('meetra_token');
          const resp = await fetch(`http://localhost:5000/api/messages/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await resp.json();
          if (data.success) {
            setMessages(data.data);
            // Join conversation room
            if (socket) {
              const conversationId = [user._id, userId].sort().join('_');
              socket.emit('join-conversation', conversationId);
            }
          }
        } catch (err) {
          console.error('Error fetching messages:', err);
        } finally {
          setLoading(false);
        }

        // Mark read via socket if available
        if (socket) socket.emit('mark-messages-read', { senderId: userId });
      }
    };

    window.addEventListener('open-conversation', handler);
    return () => window.removeEventListener('open-conversation', handler);
  }, [socket, user]);

  // Listen for external clear-conversation events (clear stale chat state)
  useEffect(() => {
    const clearHandler = (e) => {
      const { userId } = e.detail || {};
      if (!userId) return;
      // Remove conversation from list and clear messages if active
      const conversationId = [getId(user?._id), getId(userId)].sort().join('_');
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      if (getId(activeChat) === getId(userId)) {
        setMessages([]);
      }
    };

    window.addEventListener('clear-conversation', clearHandler);
    return () => window.removeEventListener('clear-conversation', clearHandler);
  }, [activeChat, user]);

  

  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('meetra_token');
      const response = await fetch(`http://localhost:5000/api/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        
        // Join conversation room
        if (socket) {
          const conversationId = [user._id, userId].sort().join('_');
          socket.emit('join-conversation', conversationId);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleSelectConversation = (conversation) => {
    const otherUserId = conversation.otherUser?._id || conversation.otherUser;
    setActiveChat(otherUserId);
    fetchMessages(otherUserId);
    
    // Mark messages as read
    if (socket) {
      socket.emit('mark-messages-read', { senderId: otherUserId });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat || !isAuthenticated) return;

    const messageData = {
      receiverId: activeChat,
      content: newMessage.trim(),
      messageType: 'text'
    };

    // Optimistic UI: append a temporary message immediately
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, username: user.username },
      receiver: { _id: activeChat },
      content: newMessage.trim(),
      messageType: 'text',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, tempMessage]);
    updateConversationsList(tempMessage);

    setNewMessage('');

    // If socket connected, use socket; otherwise fallback to REST
    if (socket && isConnected) {
      socket.emit('send-message', messageData);

      // Stop typing indicator
      socket.emit('typing-stop', { 
        conversationId: [user._id, activeChat].sort().join('_'),
        userId: user._id
      });
      return;
    }

    // REST fallback
    (async () => {
      try {
        const token = localStorage.getItem('meetra_token');
        const resp = await fetch('http://localhost:5000/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify(messageData)
        });

        const data = await resp.json();
        if (data.success && data.data) {
          const returned = data.data;
          // Replace temp message with returned one
          setMessages(prev => prev.map(m => m._id === tempMessage._id ? returned : m));
          updateConversationsList(returned);
        } else {
          console.error('Failed to send message via REST', data);
        }
      } catch (err) {
        console.error('REST send message error:', err);
      }
    })();

  };

  const handleTyping = () => {
    if (socket && activeChat) {
      const conversationId = [user._id, activeChat].sort().join('_');
      socket.emit('typing-start', { conversationId, userId: user._id });
      
      // Clear typing indicator after 2 seconds
      setTimeout(() => {
        socket.emit('typing-stop', { conversationId, userId: user._id });
      }, 2000);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getOtherUser = () => {
    return conversations.find(conv => 
      getId(conv.otherUser?._id) === getId(activeChat)
    )?.otherUser;
  };

  return (
    <div className="messages-page">
      <div className="conversations-list">
        <h2>Conversations</h2>
        <div className="conversations-container">
          {conversations.map(conversation => (
            <div 
              key={conversation._id} 
              className={`conversation-item ${getId(conversation.otherUser?._id) === getId(activeChat) ? 'active' : ''}`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="avatar">
                {conversation.otherUser?.profile?.profilePicture ? (
                  <img src={conversation.otherUser.profile.profilePicture} alt={conversation.otherUser.username} />
                ) : (
                  conversation.otherUser.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="conversation-info">
                <h3>{conversation.otherUser.username}</h3>
                <p className="last-message">
                  {conversation.lastMessage?.content}
                </p>
                <span className="message-time">
                  {conversation.lastMessage ? 
                    formatTime(conversation.lastMessage.createdAt) : ''}
                </span>
              </div>
              {conversation.unreadCount > 0 && (
                <div className="unread-badge">
                  {conversation.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        {activeChat ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="avatar">
                  {getOtherUser()?.profile?.profilePicture ? (
                    <img src={getOtherUser().profile.profilePicture} alt={getOtherUser()?.username} />
                  ) : (
                    getOtherUser()?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h2>{getOtherUser()?.username}</h2>
                  <p className="user-status">
                    {typingUsers.has(activeChat) ? 'typing...' : 'Online'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="messages-container">
              {loading ? (
                <div className="loading">Loading messages...</div>
              ) : (
                <>
                  {messages.map(message => {
                    const isSentByMe = getId(message.sender) === getId(user?._id);
                    return (
                      <div 
                        key={message._id} 
                        className={`message ${isSentByMe ? 'sent' : 'received'}`}
                      >
                        {!isSentByMe && (
                          <div className="message-avatar">
                            {message.sender?.profile?.profilePicture ? (
                              <img src={message.sender.profile.profilePicture} alt={message.sender?.username} />
                            ) : (
                              message.sender?.username?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
                        )}
                        <div className="message-bubble">
                          {!isSentByMe && (
                            <div className="message-sender">
                              {message.sender?.username || message.sender}
                            </div>
                          )}
                          <div className="message-content">
                            <p>{message.content}</p>
                            <span className="message-time">
                              {formatTime(message.createdAt)}
                              {isSentByMe && (
                                <span className="read-status">
                                  {message.isRead ? '✓✓' : '✓'}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUsers.has(activeChat) && (
                    <div className="message received">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!isAuthenticated}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isAuthenticated}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <h3>Welcome to Messages</h3>
              <p>Select a conversation to start messaging</p>
              {!isConnected && (
                <p className="connection-warning">Connecting to server...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;