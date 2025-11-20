// utils/socketHandler.js
const Message = require('../models/Message');

const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join user's personal room
        socket.on('join-user', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their room`);
        });

        // Join conversation room
        socket.on('join-conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`User joined conversation: ${conversationId}`);
        });

        // Handle sending messages
        socket.on('send-message', async (data) => {
            try {
                const { senderId, receiverId, content, messageType = 'text' } = data;

                // Save message to database
                const message = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    messageType
                });

                // Populate message with user data
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username profile')
                    .populate('receiver', 'username profile');

                // Emit to both users
                io.to(`user_${receiverId}`).emit('receive-message', populatedMessage);
                socket.emit('message-sent', populatedMessage);

                console.log(`Message sent from ${senderId} to ${receiverId}`);
            } catch (error) {
                console.error('Socket send message error:', error);
                socket.emit('message-error', { error: 'Failed to send message' });
            }
        });

        // Handle typing indicators
        socket.on('typing-start', (data) => {
            const { conversationId, userId } = data;
            socket.to(conversationId).emit('user-typing', { userId, typing: true });
        });

        socket.on('typing-stop', (data) => {
            const { conversationId, userId } = data;
            socket.to(conversationId).emit('user-typing', { userId, typing: false });
        });

        // Handle message read receipts
        socket.on('mark-messages-read', async (data) => {
            try {
                const { senderId, readerId } = data;
                
                await Message.updateMany(
                    {
                        sender: senderId,
                        receiver: readerId,
                        isRead: false
                    },
                    {
                        isRead: true,
                        readAt: new Date()
                    }
                );

                // Notify sender that messages were read
                io.to(`user_${senderId}`).emit('messages-read', { readerId });
            } catch (error) {
                console.error('Mark messages read error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = setupSocket;