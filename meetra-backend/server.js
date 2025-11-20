// server.js - Main server file with Socket.io setup
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');
const { protectSocket } = require('./middleware/socketAuth');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/users', require('./routes/users'));
app.use('/api/explore', require('./routes/explore'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/upload', require('./routes/upload'));

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handling
// Authenticate on handshake if token provided, set user and join user room
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (token) {
            try {
                const user = await protectSocket(token);
                if (user) {
                    socket.userId = user._id.toString();
                    socket.username = user.username;
                    connectedUsers.set(socket.userId, socket.id);
                    socket.join(`user_${socket.userId}`);
                    console.log(`Socket handshake authenticated: user=${user.username} socket=${socket.id}`);
                }
            } catch (err) {
                console.warn('Handshake token invalid:', err.message || err);
            }
        }
        return next();
    } catch (err) {
        console.error('Socket auth middleware error:', err);
        return next();
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id, 'userId=', socket.userId || 'unauthenticated');

    // Also support explicit authenticate event for older clients
    socket.on('authenticate', async (token) => {
        try {
            const user = await protectSocket(token);
            if (user) {
                connectedUsers.set(user._id.toString(), socket.id);
                socket.userId = user._id.toString();
                socket.username = user.username;
                console.log(`User ${user.username} authenticated with socket ${socket.id}`);
                socket.join(`user_${user._id}`);
            }
        } catch (error) {
            console.error('Socket authentication failed:', error.message || error);
            socket.disconnect();
        }
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.userId} joined conversation: ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send-message', async (data) => {
        try {
            const { receiverId, content, messageType = 'text' } = data;
            
            if (!socket.userId) {
                socket.emit('message-error', { error: 'Not authenticated' });
                return;
            }

            // Save message to database
            const message = await Message.create({
                sender: socket.userId,
                receiver: receiverId,
                content,
                messageType
            });

            // Build populated message explicitly to avoid populate mismatches
            const senderUser = await User.findById(socket.userId).select('username profile profilePicture');
            const receiverUser = await User.findById(receiverId).select('username profile profilePicture');
            const populatedMessage = message.toObject();
            populatedMessage.sender = senderUser;
            populatedMessage.receiver = receiverUser;

            // Generate conversation ID
            const conversationId = [socket.userId, receiverId].sort().join('_');

            // Save to both users' conversation
            await message.save();

            // Emit to sender
            socket.emit('message-sent', populatedMessage);

            // Emit to receiver room (supports multiple sockets per user)
            io.to(`user_${receiverId}`).emit('receive-message', populatedMessage);
            io.to(`user_${receiverId}`).emit('new-conversation', populatedMessage);

            // Emit to conversation room
            io.to(conversationId).emit('new-message', populatedMessage);

            console.log(`Message sent from ${socket.userId} to ${receiverId} -- populated sender=${populatedMessage.sender?.username} receiver=${populatedMessage.receiver?.username}`);

        } catch (error) {
            console.error('Send message error:', error);
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
            const { senderId } = data;
            
            await Message.updateMany(
                {
                    sender: senderId,
                    receiver: socket.userId,
                    isRead: false
                },
                {
                    isRead: true,
                    readAt: new Date()
                }
            );

            // Notify sender that messages were read
            const senderSocketId = connectedUsers.get(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('messages-read', { 
                    readerId: socket.userId,
                    conversationId: [socket.userId, senderId].sort().join('_')
                });
            }
        } catch (error) {
            console.error('Mark messages read error:', error);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            console.log(`User ${socket.userId} disconnected`);
        }
    });
});

// Basic routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Meetra API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Handle unhandled routes (catch-all)
// Use an unbound middleware instead of `app.use('*', ...)` to avoid
// path-to-regexp parsing issues for the '*' path on some dependency versions.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found: ' + req.originalUrl
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    console.log(`🔌 Socket.io is enabled for real-time communication`);
});

// Attach io to app so controllers/routes can emit via REST endpoints
app.set('io', io);