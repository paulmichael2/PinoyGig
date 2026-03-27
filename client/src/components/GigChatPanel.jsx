import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Paperclip, Send, X } from 'lucide-react';
import { chatsAPI } from '../services/api';
import { getSocket } from '../services/socket';

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const formatAttachmentLabel = (attachment) => {
    if (!attachment) {
        return '';
    }

    if (attachment.kind === 'image') {
        return attachment.name || 'Image';
    }

    return attachment.name || 'File';
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

const renderAttachment = (attachment) => {
    if (!attachment?.url) {
        return null;
    }

    if (attachment.kind === 'image') {
        return (
            <a href={attachment.url} target="_blank" rel="noreferrer" className="block mt-3">
                <img
                    src={attachment.url}
                    alt={attachment.name || 'Attachment'}
                    className="max-h-56 w-full rounded-xl object-cover border border-black/10"
                />
            </a>
        );
    }

    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            download={attachment.name || 'attachment'}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
            <Paperclip className="w-4 h-4" />
            {attachment.name || 'Attachment'}
        </a>
    );
};

const isMessageSeen = (message, currentUserId) => {
    if (!message || message.unsent) {
        return false;
    }

    return (message.readBy || []).some((user) => {
        const userId = user?._id || user;
        return userId?.toString() !== currentUserId?.toString();
    });
};

const normalizeGigId = (value) => value?._id?.toString?.() || value?.toString?.() || '';

const mergeMessages = (items) => {
    const merged = new Map();

    for (const item of items) {
        merged.set(item._id, item);
    }

    return Array.from(merged.values()).sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
};

const GigChatPanel = ({ gigId, conversationGigIds = [], currentUser, onConversationChange, onBack, emptyStateLabel = 'Select a conversation to start chatting.' }) => {
    const [messages, setMessages] = useState([]);
    const [participant, setParticipant] = useState(null);
    const [participantOnline, setParticipantOnline] = useState(false);
    const [participantTyping, setParticipantTyping] = useState(false);
    const [draft, setDraft] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState('');
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const fileInputRef = useRef(null);
    const participantRef = useRef(null);
    const participantOnlineRef = useRef(false);

    const currentUserId = currentUser?._id || currentUser?.user?._id;
    const currentUserName = currentUser?.name || currentUser?.user?.name || 'You';
    const activeGigIds = useMemo(
        () => Array.from(new Set([gigId, ...conversationGigIds].filter(Boolean))),
        [conversationGigIds, gigId]
    );

    useEffect(() => {
        participantRef.current = participant;
    }, [participant]);

    useEffect(() => {
        participantOnlineRef.current = participantOnline;
    }, [participantOnline]);

    useEffect(() => {
        if (!gigId || !currentUserId) {
            setMessages([]);
            setParticipant(null);
            participantRef.current = null;
            setParticipantOnline(false);
            participantOnlineRef.current = false;
            setParticipantTyping(false);
            setDraft('');
            setAttachment(null);
            setError('');
            return undefined;
        }

        let isMounted = true;
        const socket = getSocket();

        setMessages([]);
        setParticipant(null);
        participantRef.current = null;
        setParticipantOnline(false);
        participantOnlineRef.current = false;
        setParticipantTyping(false);
        setDraft('');
        setAttachment(null);

        const markAsRead = async (targetGigIds = activeGigIds) => {
            try {
                await Promise.all(targetGigIds.map((targetGigId) => chatsAPI.markGigRead(targetGigId)));
                onConversationChange?.({ gigId, unreadCount: 0 });
            } catch (markError) {
                console.error('Failed to mark messages as read', markError);
            }
        };

        const syncConversation = (message, overrides = {}) => {
            onConversationChange?.({
                gigId,
                lastMessage: message,
                lastMessagePreview: getMessagePreview(message),
                unreadCount: 0,
                participant: overrides.participant || participantRef.current,
                participantOnline: typeof overrides.participantOnline === 'boolean' ? overrides.participantOnline : participantOnlineRef.current,
                updatedAt: message?.createdAt,
            });
        };

        const syncConversationFromState = (conversationState) => {
            if (!conversationState) {
                return;
            }

            onConversationChange?.({
                gigId,
                lastMessage: conversationState.lastMessage || null,
                lastMessagePreview: conversationState.lastMessagePreview || 'No messages yet',
                unreadCount: typeof conversationState.unreadCount === 'number' ? conversationState.unreadCount : 0,
                participant: participantRef.current,
                participantOnline: participantOnlineRef.current,
                updatedAt: conversationState.updatedAt,
            });
        };

        const loadThread = async () => {
            try {
                setLoading(true);
                setError('');

                const threadResponses = await Promise.all(
                    activeGigIds.map(async(targetGigId) => {
                        const [accessResponse, messagesResponse] = await Promise.all([
                            chatsAPI.getGigAccess(targetGigId),
                            chatsAPI.getGigMessages(targetGigId),
                        ]);

                        return {
                            gigId: targetGigId,
                            accessResponse,
                            messagesResponse,
                        };
                    })
                );

                if (!isMounted) {
                    return;
                }

                const latestThread = threadResponses.find((thread) => thread.gigId === gigId) || threadResponses[0];
                const nextParticipant = latestThread?.accessResponse.data.participant || latestThread?.messagesResponse.data.participant || null;
                setParticipant(nextParticipant);
                participantRef.current = nextParticipant;
                setParticipantOnline(Boolean(latestThread?.accessResponse.data.participantOnline ?? latestThread?.messagesResponse.data.participantOnline));
                participantOnlineRef.current = Boolean(latestThread?.accessResponse.data.participantOnline ?? latestThread?.messagesResponse.data.participantOnline);
                setMessages(mergeMessages(threadResponses.flatMap((thread) => thread.messagesResponse.data.messages || [])));

                onConversationChange?.({
                    gigId,
                    participant: nextParticipant,
                    participantOnline: Boolean(latestThread?.accessResponse.data.participantOnline ?? latestThread?.messagesResponse.data.participantOnline),
                    unreadCount: 0,
                });

                await markAsRead();
            } catch (threadError) {
                if (!isMounted) {
                    return;
                }
                setError(threadError.response?.data?.message || 'Failed to load chat');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const joinGigRoom = () => {
            socket.emit('join_room', currentUserId);
            activeGigIds.forEach((targetGigId) => socket.emit('join_gig_chat', targetGigId));
        };

        if (!socket.connected) {
            socket.connect();
        }

        joinGigRoom();
        loadThread();

        const handleIncomingMessage = async ({ gigId: incomingGigId, message }) => {
            if (!activeGigIds.includes(incomingGigId)) {
                return;
            }

            setMessages((prev) => {
                if (prev.some((item) => item._id === message._id)) {
                    return prev;
                }
                return mergeMessages([...prev, message]);
            });

            const senderId = message.sender?._id || message.sender;
            const isMine = senderId?.toString() === currentUserId?.toString();

            if (!isMine) {
                await markAsRead([incomingGigId]);
            }

            syncConversation(message);
        };

        const handleTyping = ({ gigId: incomingGigId, userId, isTyping }) => {
            if (!activeGigIds.includes(incomingGigId) || userId?.toString() === currentUserId?.toString()) {
                return;
            }

            setParticipantTyping(Boolean(isTyping));
        };

        const handlePresence = ({ userId, isOnline }) => {
            if (!participantRef.current?._id || userId?.toString() !== participantRef.current._id.toString()) {
                return;
            }

            setParticipantOnline(Boolean(isOnline));
            participantOnlineRef.current = Boolean(isOnline);
            onConversationChange?.({ gigId, participantOnline: Boolean(isOnline) });
        };

        const handleUnsentMessage = ({ gigId: incomingGigId, message }) => {
            if (!activeGigIds.includes(incomingGigId)) {
                return;
            }

            setMessages((prev) => prev.map((item) => (item._id === message._id ? message : item)));
        };

        const handleReadReceipt = ({ gigId: incomingGigId, userId }) => {
            if (!activeGigIds.includes(incomingGigId) || userId?.toString() === currentUserId?.toString()) {
                return;
            }

            setMessages((prev) => prev.map((item) => {
                const senderId = item.sender?._id || item.sender;
                if (senderId?.toString() !== currentUserId?.toString()) {
                    return item;
                }

                const alreadySeen = (item.readBy || []).some((entry) => {
                    const entryId = entry?._id || entry;
                    return entryId?.toString() === userId?.toString();
                });

                if (alreadySeen) {
                    return item;
                }

                return {
                    ...item,
                    readBy: [...(item.readBy || []), userId],
                };
            }));
        };

        socket.on('gig_chat_message', handleIncomingMessage);
        socket.on('gig_chat_typing', handleTyping);
        socket.on('presence:update', handlePresence);
        socket.on('gig_chat_message_unsent', handleUnsentMessage);
        socket.on('gig_chat_read', handleReadReceipt);

        return () => {
            isMounted = false;
            activeGigIds.forEach((targetGigId) => socket.emit('leave_gig_chat', targetGigId));
            socket.off('gig_chat_message', handleIncomingMessage);
            socket.off('gig_chat_typing', handleTyping);
            socket.off('presence:update', handlePresence);
            socket.off('gig_chat_message_unsent', handleUnsentMessage);
            socket.off('gig_chat_read', handleReadReceipt);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [activeGigIds, currentUserId, gigId, onConversationChange]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, participantTyping]);

    useEffect(() => {
        if (!gigId || !currentUserId) {
            return undefined;
        }

        const socket = getSocket();
        const hasDraft = Boolean(draft.trim());

        if (!hasDraft) {
            if (isTypingRef.current) {
                socket.emit('gig_chat_typing', { gigId, userId: currentUserId, isTyping: false });
                isTypingRef.current = false;
            }
            return undefined;
        }

        if (!isTypingRef.current) {
            socket.emit('gig_chat_typing', { gigId, userId: currentUserId, isTyping: true });
            isTypingRef.current = true;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('gig_chat_typing', { gigId, userId: currentUserId, isTyping: false });
            isTypingRef.current = false;
        }, 1200);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [draft, gigId, currentUserId]);

    const handleAttachmentPick = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (file.size > MAX_ATTACHMENT_SIZE) {
            setError('Attachment must be 5MB or smaller');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setAttachment({
                name: file.name,
                url: reader.result,
                mimeType: file.type,
                size: file.size,
                kind: file.type.startsWith('image/') ? 'image' : 'file',
            });
            setError('');
        };
        reader.onerror = () => {
            setError('Failed to read attachment');
        };
        reader.readAsDataURL(file);
    };

    const clearAttachment = () => {
        setAttachment(null);
    };

    const handleSend = async (event) => {
        event.preventDefault();

        const content = draft.trim();
        if (!content && !attachment) {
            return;
        }

        try {
            setSending(true);
            setError('');

            const response = await chatsAPI.sendGigMessage(gigId, {
                content,
                attachment,
            });

            setDraft('');
            setAttachment(null);
            onConversationChange?.({
                gigId,
                lastMessage: response.data.message,
                lastMessagePreview: getMessagePreview(response.data.message),
                unreadCount: 0,
                updatedAt: response.data.message.createdAt,
            });
        } catch (sendError) {
            setError(sendError.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleUnsend = async (messageId) => {
        if (!gigId || !messageId) {
            return;
        }

        const confirmed = window.confirm('Unsend this message?');
        if (!confirmed) {
            return;
        }

        try {
            setDeletingMessageId(messageId);
            setError('');
            const messageGigId = normalizeGigId(messages.find((item) => item._id === messageId)?.gig) || gigId;
            const response = await chatsAPI.deleteGigMessage(messageGigId, messageId);
            setMessages((prev) => prev.map((item) => (item._id === messageId ? response.data.message : item)));
            syncConversationFromState(response.data.conversation);
        } catch (deleteError) {
            setError(deleteError.response?.data?.message || 'Failed to unsend message');
        } finally {
            setDeletingMessageId('');
        }
    };

    if (!gigId) {
        return (
            <div className="flex h-[calc(100dvh-4rem)] min-h-[420px] items-center justify-center bg-white px-6 text-center text-slate-500 sm:h-[calc(100dvh-14rem)] sm:rounded-3xl sm:border sm:border-dashed sm:border-slate-300 xl:h-full">
                {emptyStateLabel}
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden overscroll-none bg-white sm:h-[calc(100dvh-14rem)] sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-sm xl:h-full xl:min-h-[520px]">
            <div className="border-b border-slate-200 px-4 pb-4 pt-6 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="mb-4 mt-1 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 xl:hidden"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to conversations
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900">{participant?.name || 'Conversation'}</h2>
                            <span className={`h-2.5 w-2.5 rounded-full ${participantOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            {participantTyping ? `${participant?.name || 'Participant'} is typing...` : participantOnline ? 'Online now' : 'Offline'}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
                    {error}
                </div>
            )}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-slate-50 px-3 py-4 sm:px-6 sm:py-5">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-slate-500 px-6">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">No messages yet</p>
                            <p className="mt-1 text-xs">Start the conversation for this gig.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => {
                        const senderId = message.sender?._id || message.sender;
                        const isMine = senderId?.toString() === currentUserId?.toString();
                        const hasSeen = isMine && isMessageSeen(message, currentUserId);

                        return (
                            <div key={message._id} className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[93%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[88%] ${isMine ? 'bg-green-600 text-white rounded-br-lg' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-lg'}`}>
                                    <div className={`text-xs font-semibold ${isMine ? 'text-green-100' : 'text-slate-500'}`}>
                                        {isMine ? currentUserName : message.sender?.name || participant?.name || 'Participant'}
                                    </div>
                                    {message.unsent ? (
                                        <p className={`mt-1 text-sm italic ${isMine ? 'text-white/85' : 'text-slate-500'}`}>Message was unsent</p>
                                    ) : message.content ? (
                                        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.content}</p>
                                    ) : null}
                                    {!message.unsent && renderAttachment(message.attachment)}
                                    <div className={`mt-2 flex items-center gap-3 text-[11px] ${isMine ? 'text-green-100' : 'text-slate-400'}`}>
                                        <span>{new Date(message.createdAt).toLocaleString()}</span>
                                        {isMine && !message.unsent && (
                                            <button
                                                type="button"
                                                onClick={() => handleUnsend(message._id)}
                                                disabled={deletingMessageId === message._id}
                                                className={`font-semibold transition ${isMine ? 'text-white/90 hover:text-white' : 'text-slate-500 hover:text-slate-700'} disabled:cursor-not-allowed disabled:opacity-60`}
                                            >
                                                {deletingMessageId === message._id ? 'Unsending...' : 'Unsend'}
                                            </button>
                                        )}
                                        {hasSeen && <span className="font-semibold">Seen</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                {attachment && (
                    <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                            {attachment.kind === 'image' ? <ImageIcon className="w-4 h-4 shrink-0" /> : <Paperclip className="w-4 h-4 shrink-0" />}
                            <span className="truncate">{formatAttachmentLabel(attachment)}</span>
                        </div>
                        <button type="button" onClick={clearAttachment} className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder="Write a message..."
                            className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar" onChange={handleAttachmentPick} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto">
                                <Paperclip className="w-4 h-4" />
                                Add File or Image
                            </button>
                            <span className="w-full text-center text-xs text-slate-400 sm:w-auto sm:text-left">Max 5MB</span>
                        </div>
                    </div>
                    <button type="submit" disabled={sending || (!draft.trim() && !attachment)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                        <Send className="w-4 h-4" />
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GigChatPanel;