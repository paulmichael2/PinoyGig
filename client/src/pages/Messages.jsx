import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GigChatPanel from '../components/GigChatPanel';
import { chatsAPI } from '../services/api';
import { getSocket } from '../services/socket';

const formatPreview = (conversation) => {
    return conversation.lastMessagePreview || 'No messages yet';
};

const formatTimestamp = (conversation) => {
    const value = conversation.lastMessage?.createdAt || conversation.gig?.updatedAt;
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    return sameDay ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : date.toLocaleDateString();
};

const Messages = () => {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const findConversationByGigId = useCallback((items, targetGigId) => {
        if (!targetGigId) {
            return null;
        }

        return items.find((conversation) => (
            conversation.gig?._id === targetGigId
            || (conversation.gigIds || []).includes(targetGigId)
        )) || null;
    }, []);

    const filteredConversations = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return conversations;
        }

        return conversations.filter((conversation) => {
            const participantName = conversation.participant?.name || '';
            const gigTitle = conversation.gig?.title || '';
            return participantName.toLowerCase().includes(query) || gigTitle.toLowerCase().includes(query);
        });
    }, [conversations, search]);

    useEffect(() => {
        if (loading || !currentUser) {
            setPageLoading(false);
            return undefined;
        }

        let isMounted = true;
        const socket = getSocket();

        const loadConversations = async () => {
            try {
                setPageLoading(true);
                setError('');
                const response = await chatsAPI.getConversations();

                if (!isMounted) {
                    return;
                }

                const nextConversations = response.data.conversations || [];
                setConversations(nextConversations);

                const matchedConversation = findConversationByGigId(nextConversations, gigId);

                if (gigId && !matchedConversation && nextConversations[0]?.gig?._id) {
                    navigate(`/messages/${nextConversations[0].gig._id}`, { replace: true });
                }
            } catch (loadError) {
                if (!isMounted) {
                    return;
                }
                setError(loadError.response?.data?.message || 'Failed to load messages');
            } finally {
                if (isMounted) {
                    setPageLoading(false);
                }
            }
        };

        loadConversations();

        const handleInboxUpdate = () => {
            loadConversations();
        };

        const handlePresenceUpdate = ({ userId, isOnline }) => {
            setConversations((prev) => prev.map((conversation) => (
                conversation.participant?._id?.toString() === userId?.toString()
                    ? { ...conversation, participantOnline: Boolean(isOnline) }
                    : conversation
            )));
        };

        if (!socket.connected) {
            socket.connect();
        }

        const userId = currentUser._id || currentUser.user?._id;
        socket.emit('join_room', userId);
        socket.on('chat_inbox_update', handleInboxUpdate);
        socket.on('presence:update', handlePresenceUpdate);

        return () => {
            isMounted = false;
            socket.off('chat_inbox_update', handleInboxUpdate);
            socket.off('presence:update', handlePresenceUpdate);
        };
    }, [currentUser, findConversationByGigId, gigId, loading, navigate]);

    const selectedConversation = findConversationByGigId(filteredConversations, gigId)
        || findConversationByGigId(conversations, gigId)
        || null;

    const activeGigId = gigId || null;

    const handleConversationChange = useCallback((update) => {
        setConversations((prev) => {
            const next = prev.map((conversation) => {
                if (conversation.gig?._id !== update.gigId && !(conversation.gigIds || []).includes(update.gigId)) {
                    return conversation;
                }

                const hasLastMessage = Object.prototype.hasOwnProperty.call(update, 'lastMessage');
                const hasLastMessagePreview = Object.prototype.hasOwnProperty.call(update, 'lastMessagePreview');

                return {
                    ...conversation,
                    participant: update.participant || conversation.participant,
                    participantOnline: typeof update.participantOnline === 'boolean' ? update.participantOnline : conversation.participantOnline,
                    unreadCount: typeof update.unreadCount === 'number' ? update.unreadCount : conversation.unreadCount,
                    lastMessage: hasLastMessage ? update.lastMessage : conversation.lastMessage,
                    lastMessagePreview: hasLastMessagePreview ? update.lastMessagePreview : conversation.lastMessagePreview,
                    gig: {
                        ...conversation.gig,
                        updatedAt: update.updatedAt || update.lastMessage?.createdAt || conversation.gig?.updatedAt,
                    },
                };
            });

            return [...next].sort((left, right) => {
                const leftTime = new Date(left.lastMessage?.createdAt || left.gig?.updatedAt || 0).getTime();
                const rightTime = new Date(right.lastMessage?.createdAt || right.gig?.updatedAt || 0).getTime();
                return rightTime - leftTime;
            });
        });
    }, []);

    if (loading) {
        return null;
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-400" />
                    <h1 className="mt-4 text-3xl font-bold text-slate-900">Log in to view messages</h1>
                    <p className="mt-2 text-slate-600">Your gig conversations are only available to signed-in clients and freelancers.</p>
                    <Link to="/login" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-600">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-slate-50 ${activeGigId ? 'h-[100dvh] overflow-hidden px-0 pb-0 pt-16 sm:min-h-screen sm:h-auto sm:px-6 sm:pb-12 sm:pt-24 lg:px-8' : 'min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-8'}`}>
            <div className={`mx-auto ${activeGigId ? 'h-full max-w-none sm:h-auto sm:max-w-7xl' : 'max-w-7xl'}`}>
                <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${activeGigId ? 'hidden sm:flex' : ''}`}>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
                        <p className="mt-1 text-slate-600">Private gig conversations between the client and the hired freelancer.</p>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search conversations"
                            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className={`grid min-h-0 grid-cols-1 ${activeGigId ? 'h-full gap-0 sm:gap-6' : 'gap-6'} xl:h-[calc(100vh-12rem)] xl:grid-cols-[360px_minmax(0,1fr)]`}>
                    <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${activeGigId ? 'hidden xl:block' : 'block'}`}>
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Conversations</h2>
                        </div>
                        <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto xl:max-h-none xl:h-[calc(100%-4.5rem)]">
                            {pageLoading ? (
                                <div className="px-5 py-12 text-center text-sm text-slate-500">Loading conversations...</div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="px-5 py-12 text-center text-sm text-slate-500">No conversations yet.</div>
                            ) : (
                                filteredConversations.map((conversation) => {
                                    const isActive = conversation.gig?._id === selectedConversation?.gig?._id;

                                    return (
                                        <button
                                            key={conversation.gig?._id}
                                            type="button"
                                            onClick={() => navigate(`/messages/${conversation.gig._id}`)}
                                            className={`w-full border-b border-slate-100 px-5 py-4 text-left transition ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>{conversation.participant?.name || 'Participant'}</span>
                                                        <span className={`h-2 w-2 rounded-full ${conversation.participantOnline ? 'bg-green-500' : isActive ? 'bg-slate-300' : 'bg-slate-200'}`} />
                                                    </div>
                                                    <p className={`mt-1 truncate text-xs font-medium ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{conversation.gig?.title}</p>
                                                    <p className={`mt-2 truncate text-sm ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>{formatPreview(conversation)}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{formatTimestamp(conversation)}</span>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className={`min-w-6 rounded-full px-2 py-1 text-center text-[11px] font-bold ${isActive ? 'bg-white text-slate-900' : 'bg-green-600 text-white'}`}>
                                                            {conversation.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className={`${activeGigId ? 'block h-full' : 'hidden xl:block'} min-h-0 ${activeGigId ? 'sm:mx-0 sm:h-auto' : ''}`}>
                        <GigChatPanel
                            gigId={activeGigId}
                            conversationGigIds={selectedConversation?.gigIds || []}
                            currentUser={currentUser}
                            onConversationChange={handleConversationChange}
                            onBack={() => navigate('/messages')}
                            emptyStateLabel="Choose a gig conversation from the left to start messaging."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;