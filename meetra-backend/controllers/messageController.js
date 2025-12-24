// controllers/messageController.js
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages for a conversation
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user._id;

        // Validate if user exists
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const conversationId = [currentUserId, otherUserId].sort().join('_');

        const messages = await Message.find({
            conversationId: conversationId
        })
        .populate('sender', 'username profile profilePicture')
        .populate('receiver', 'username profile profilePicture')
        .sort({ createdAt: 1 })
        .limit(100);

        // Mark messages as read
        await Message.updateMany(
            {
                sender: otherUserId,
                receiver: currentUserId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching messages'
        });
    }
};

// @desc    Get user conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { 
                                    $and: [
                                        { $eq: ["$receiver", userId] },
                                        { $eq: ["$isRead", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalMessages: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'lastMessage.sender',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'lastMessage.receiver',
                    foreignField: '_id',
                    as: 'receiverInfo'
                }
            },
            {
                $project: {
                    lastMessage: 1,
                    unreadCount: 1,
                    totalMessages: 1,
                    otherUser: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$senderInfo._id", 0] }, userId] },
                            { $arrayElemAt: ["$receiverInfo", 0] },
                            { $arrayElemAt: ["$senderInfo", 0] }
                        ]
                    },
                    lastActivity: "$lastMessage.createdAt"
                }
            },
            {
                $sort: { lastActivity: -1 }
            }
        ]);

        // Populate otherUser details
        const populatedConversations = await User.populate(conversations, {
            path: 'otherUser',
            select: 'username profile.fullName profile.branch profile.profilePicture'
        });

        res.json({
            success: true,
            data: populatedConversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching conversations'
        });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read
// @access  Private
const markMessagesAsRead = async (req, res) => {
    try {
        const { senderId } = req.body;

        await Message.updateMany(
            {
                sender: senderId,
                receiver: req.user._id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark messages as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while marking messages as read'
        });
    }
};

module.exports = {
    getMessages,
    getConversations,
    markMessagesAsRead
};

// @desc    Send a message via REST (fallback when socket unavailable)
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { receiverId, content, messageType = 'text' } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ success: false, message: 'Missing receiverId or content' });
        }

        const normalizedReceiverId = receiverId && receiverId.toString ? receiverId.toString() : String(receiverId);
        const conversationId = [senderId.toString(), normalizedReceiverId].sort().join('_');

        const message = await Message.create({
            sender: senderId,
            receiver: normalizedReceiverId,
            content,
            messageType
        });

        // Build populated message explicitly with complete user info
        const senderUser = await User.findById(senderId).select('username profile profilePicture');
        const receiverUser = await User.findById(normalizedReceiverId).select('username profile profilePicture');
        const populatedMessage = message.toObject();
        populatedMessage.sender = senderUser ? { _id: senderUser._id.toString(), username: senderUser.username, profile: senderUser.profile, profilePicture: senderUser.profilePicture } : null;
        populatedMessage.receiver = receiverUser ? { _id: receiverUser._id.toString(), username: receiverUser.username, profile: receiverUser.profile, profilePicture: receiverUser.profilePicture } : null;

        // Emit via Socket.io if available
        const io = req.app.get('io');
        if (io) {
            try {
                // Emit to sender's user room
                io.to(`user_${senderId}`).emit('message-sent', populatedMessage);

                // Emit to receiver's user room
                io.to(`user_${normalizedReceiverId}`).emit('receive-message', populatedMessage);

                // Emit to conversation room
                io.to(conversationId).emit('new-message', populatedMessage);
                
                console.log(`[REST] ✅ Delivered - From: ${populatedMessage.sender?.username} To: ${populatedMessage.receiver?.username}`);
            } catch (emitErr) {
                console.error('[REST] Error emitting:', emitErr);
            }
        }

        res.json({ success: true, data: populatedMessage });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

module.exports = {
    getMessages,
    getConversations,
    markMessagesAsRead,
    sendMessage
};