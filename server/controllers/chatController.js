import mongoose from 'mongoose';
import { ChatMessage, Gig, User } from '../models/index.js';

const validateGigAccess = async(gigId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
        return { status: 400, message: 'Invalid gig id' };
    }

    const gig = await Gig.findById(gigId)
        .populate('owner', 'name')
        .populate('hiredFreelancer', 'name');

    if (!gig) {
        return { status: 404, message: 'Gig not found' };
    }

    if (!gig.hiredFreelancer) {
        return { status: 400, message: 'Chat is available only after a freelancer is hired' };
    }

    const ownerId = gig.owner?._id?.toString?.() || gig.owner?.toString?.();
    const freelancerId = gig.hiredFreelancer?._id?.toString?.() || gig.hiredFreelancer?.toString?.();
    const requesterId = userId.toString();

    const isParticipant = requesterId === ownerId || requesterId === freelancerId;

    if (!isParticipant) {
        return { status: 403, message: 'Not authorized to access this chat' };
    }

    return { gig };
};

const getParticipantMeta = (gig, currentUserId) => {
    const ownerId = gig.owner?._id?.toString?.() || gig.owner?.toString?.();
    const freelancerId = gig.hiredFreelancer?._id?.toString?.() || gig.hiredFreelancer?.toString?.();
    const isOwner = currentUserId.toString() === ownerId;
    const otherParticipant = isOwner ? gig.hiredFreelancer : gig.owner;

    return {
        isOwner,
        ownerId,
        freelancerId,
        otherParticipant,
    };
};

const getMessagePreview = (message) => {
    if (!message) {
        return 'No messages yet';
    }

    if (message.unsent) {
        return 'Message was unsent';
    }

    if (message.content) {
        return message.content;
    }

    if (message.attachment?.kind === 'image') {
        return 'Sent an image';
    }

    if (message.attachment?.name) {
        return `Sent ${message.attachment.name}`;
    }

    return 'Sent an attachment';
};

const getConversationState = async(gigId, userId, fallbackUpdatedAt) => {
    const lastMessage = await ChatMessage.findOne({ gig: gigId })
        .populate('sender', 'name')
        .sort({ createdAt: -1 });

    const unreadCount = await ChatMessage.countDocuments({
        gig: gigId,
        unsent: { $ne: true },
        sender: { $ne: userId },
        readBy: { $ne: userId },
    });

    return {
        lastMessage,
        lastMessagePreview: getMessagePreview(lastMessage),
        unreadCount,
        updatedAt: lastMessage?.createdAt || fallbackUpdatedAt,
    };
};

const buildConversation = async(gig, userId, onlineUsers) => {
    const { otherParticipant } = getParticipantMeta(gig, userId);
    const conversationState = await getConversationState(gig._id, userId, gig.updatedAt);

    return {
        gig: {
            _id: gig._id,
            title: gig.title,
            status: gig.status,
            updatedAt: gig.updatedAt,
        },
        participant: otherParticipant,
        participantOnline: onlineUsers.has(otherParticipant?._id?.toString?.() || ''),
        gigIds: [gig._id.toString()],
        ...conversationState,
    };
};

const groupConversationsByParticipant = (conversations) => {
    const groupedConversations = new Map();

    for (const conversation of conversations) {
        const participantId = conversation.participant?._id?.toString?.();

        if (!participantId) {
            continue;
        }

        const existingConversation = groupedConversations.get(participantId);
        const conversationTime = new Date(conversation.lastMessage?.createdAt || conversation.gig.updatedAt || 0).getTime();

        if (!existingConversation) {
            groupedConversations.set(participantId, {
                ...conversation,
                gigIds: Array.from(new Set([...(conversation.gigIds || []), conversation.gig._id.toString()])),
            });
            continue;
        }

        const existingTime = new Date(existingConversation.lastMessage?.createdAt || existingConversation.gig.updatedAt || 0).getTime();
        const mergedGigIds = Array.from(new Set([
            ...(existingConversation.gigIds || []),
            ...(conversation.gigIds || []),
            conversation.gig._id.toString(),
        ]));

        if (conversationTime > existingTime) {
            groupedConversations.set(participantId, {
                ...conversation,
                unreadCount: existingConversation.unreadCount + conversation.unreadCount,
                participantOnline: existingConversation.participantOnline || conversation.participantOnline,
                gigIds: mergedGigIds,
            });
            continue;
        }

        groupedConversations.set(participantId, {
            ...existingConversation,
            unreadCount: existingConversation.unreadCount + conversation.unreadCount,
            participantOnline: existingConversation.participantOnline || conversation.participantOnline,
            gigIds: mergedGigIds,
        });
    }

    return Array.from(groupedConversations.values()).sort((left, right) => {
        const leftTime = new Date(left.lastMessage?.createdAt || left.gig.updatedAt || 0).getTime();
        const rightTime = new Date(right.lastMessage?.createdAt || right.gig.updatedAt || 0).getTime();
        return rightTime - leftTime;
    });
};

export const getChatSummary = async(req, res) => {
    try {
        const gigs = await Gig.find({
            hiredFreelancer: { $ne: null },
            $or: [
                { owner: req.user._id },
                { hiredFreelancer: req.user._id },
            ],
        }).select('_id');

        const gigIds = gigs.map((gig) => gig._id);
        const unreadMessages = await ChatMessage.countDocuments({
            gig: { $in: gigIds },
            unsent: { $ne: true },
            sender: { $ne: req.user._id },
            readBy: { $ne: req.user._id },
        });

        const conversationSummaries = await Promise.all(
            gigs.map((gig) => buildConversation(gig, req.user._id, req.onlineUsers))
        );

        const unreadConversations = groupConversationsByParticipant(conversationSummaries)
            .filter((conversation) => conversation.unreadCount > 0)
            .length;

        res.json({
            success: true,
            unreadMessages,
            unreadConversations,
        });
    } catch (error) {
        console.error('Get chat summary error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const getChatConversations = async(req, res) => {
    try {
        const gigs = await Gig.find({
                hiredFreelancer: { $ne: null },
                $or: [
                    { owner: req.user._id },
                    { hiredFreelancer: req.user._id },
                ],
            })
            .populate('owner', 'name')
            .populate('hiredFreelancer', 'name')
            .sort({ updatedAt: -1 });

        const conversations = await Promise.all(
            gigs.map((gig) => buildConversation(gig, req.user._id, req.onlineUsers))
        );

        res.json({
            success: true,
            conversations: groupConversationsByParticipant(conversations),
        });
    } catch (error) {
        console.error('Get chat conversations error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const getGigChatMessages = async(req, res) => {
    try {
        const access = await validateGigAccess(req.params.gigId, req.user._id);

        if (access.message) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const messages = await ChatMessage.find({ gig: access.gig._id })
            .populate('sender', 'name')
            .sort({ createdAt: 1 });

        const { otherParticipant } = getParticipantMeta(access.gig, req.user._id);

        res.json({
            success: true,
            gig: {
                _id: access.gig._id,
                title: access.gig.title,
                owner: access.gig.owner,
                hiredFreelancer: access.gig.hiredFreelancer,
            },
            participant: otherParticipant,
            participantOnline: req.onlineUsers.has(otherParticipant?._id?.toString?.() || ''),
            messages,
        });
    } catch (error) {
        console.error('Get gig chat messages error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const sendGigChatMessage = async(req, res) => {
    try {
        const access = await validateGigAccess(req.params.gigId, req.user._id);

        if (access.message) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const content = req.body.content?.trim() || '';
        const attachment = req.body.attachment;
        const hasAttachment = Boolean(attachment?.url);

        if (!content && !hasAttachment) {
            return res.status(400).json({ success: false, message: 'Message content or attachment is required' });
        }

        const message = await ChatMessage.create({
            gig: access.gig._id,
            sender: req.user._id,
            content,
            attachment: hasAttachment ?
                {
                    name: attachment.name,
                    url: attachment.url,
                    mimeType: attachment.mimeType,
                    size: attachment.size,
                    kind: attachment.kind,
                } :
                undefined,
            readBy: [req.user._id],
        });

        const populatedMessage = await ChatMessage.findById(message._id).populate('sender', 'name');

        const { ownerId, freelancerId } = getParticipantMeta(access.gig, req.user._id);
        const recipientId = req.user._id.toString() === ownerId ? freelancerId : ownerId;

        req.io.to(`gig:${access.gig._id.toString()}`).emit('gig_chat_message', {
            gigId: access.gig._id,
            message: populatedMessage,
        });

        if (recipientId) {
            req.io.to(recipientId).emit('chat_inbox_update', {
                gigId: access.gig._id,
                message: populatedMessage,
            });

            req.io.to(recipientId).emit('notification', {
                type: 'message',
                message: `${populatedMessage.sender?.name || 'Someone'} sent you a message${access.gig?.title ? ` about "${access.gig.title}"` : ''}`,
                gigId: access.gig._id,
                chatMessageId: populatedMessage._id,
                timestamp: new Date(),
            });
        }

        res.status(201).json({
            success: true,
            message: populatedMessage,
        });
    } catch (error) {
        console.error('Send gig chat message error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const canAccessGigChat = async(req, res) => {
    try {
        const access = await validateGigAccess(req.params.gigId, req.user._id);

        if (access.message) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const ownerId = access.gig.owner?._id?.toString?.() || access.gig.owner?.toString?.();
        const otherUserId = req.user._id.toString() === ownerId ?
            access.gig.hiredFreelancer._id.toString() :
            ownerId;

        const otherUser = await User.findById(otherUserId).select('name');

        res.json({
            success: true,
            allowed: true,
            participant: otherUser,
            participantOnline: req.onlineUsers.has(otherUserId),
            gig: {
                _id: access.gig._id,
                title: access.gig.title,
                status: access.gig.status,
            },
        });
    } catch (error) {
        console.error('Check gig chat access error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const markGigChatRead = async(req, res) => {
    try {
        const access = await validateGigAccess(req.params.gigId, req.user._id);

        if (access.message) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const result = await ChatMessage.updateMany({
            gig: access.gig._id,
            sender: { $ne: req.user._id },
            readBy: { $ne: req.user._id },
            unsent: { $ne: true },
        }, {
            $addToSet: { readBy: req.user._id },
        });

        if (result.modifiedCount > 0) {
            req.io.to(`gig:${access.gig._id.toString()}`).emit('gig_chat_read', {
                gigId: access.gig._id,
                userId: req.user._id,
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Mark gig chat read error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const deleteGigChatMessage = async(req, res) => {
    try {
        const access = await validateGigAccess(req.params.gigId, req.user._id);

        if (access.message) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
            return res.status(400).json({ success: false, message: 'Invalid message id' });
        }

        const message = await ChatMessage.findOne({
            _id: req.params.messageId,
            gig: access.gig._id,
        }).populate('sender', 'name');

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (message.sender?._id?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only unsend your own messages' });
        }

        message.content = '';
        message.attachment = undefined;
        message.unsent = true;
        message.unsentAt = new Date();
        await message.save();

        const { ownerId, freelancerId } = getParticipantMeta(access.gig, req.user._id);
        const senderConversation = await getConversationState(access.gig._id, req.user._id, access.gig.updatedAt);
        const recipientId = req.user._id.toString() === ownerId ? freelancerId : ownerId;
        const recipientConversation = recipientId ?
            await getConversationState(access.gig._id, recipientId, access.gig.updatedAt) :
            senderConversation;

        req.io.to(`gig:${access.gig._id.toString()}`).emit('gig_chat_message_unsent', {
            gigId: access.gig._id,
            message,
        });

        if (ownerId) {
            req.io.to(ownerId).emit('chat_inbox_update', { gigId: access.gig._id });
        }

        if (freelancerId && freelancerId !== ownerId) {
            req.io.to(freelancerId).emit('chat_inbox_update', { gigId: access.gig._id });
        }

        res.json({
            success: true,
            message,
            conversation: senderConversation,
            recipientConversation,
        });
    } catch (error) {
        console.error('Delete gig chat message error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};