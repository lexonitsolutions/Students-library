import { Search, MoreVertical, Send, Smile, X, ArrowLeft, BellOff, Trash2, Eraser, Ban } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../components/ui/Avatar';
import UserProfilePanel, { type UploaderProfile } from '../components/ui/UserProfilePanel';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  text: string;
  fromMe: boolean;
  time: string;
  read: boolean;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  targetUserId?: string;
  quickId?: string;
  messages: ChatMessage[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let _msgId = 100;
function newId() {
  return ++_msgId;
}

import { mockMaterials } from '../data/mockData';
import { generateQuickId } from '../lib/idUtils';

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_USERS = [
  { id: 'user-alex-1', name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80' },
  { id: 'user-david-3', name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
  { id: 'user-emily-4', name: 'Emily Chen', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
];

const ALL_MOCK_USERS = Array.from(
  new Map(
    [
      ...mockMaterials.map((m) => ({ id: m.uploaderId, name: m.uploaderName, avatar: m.uploaderAvatar })),
      ...INITIAL_USERS
    ].map((u) => [
      u.id,
      { id: u.id, quickId: generateQuickId(u.id), name: u.name, avatar: u.avatar },
    ])
  ).values()
);

const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    name: 'Alex Johnson',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80',
    lastMessage: 'Did you finish the DBMS assignment?',
    time: '10:42 AM',
    unread: 2,
    messages: [
      { id: 1, text: 'Hey! How are you?', fromMe: false, time: '10:30 AM', read: true },
      { id: 2, text: 'I am great, thanks! Working on the DBMS assignment.', fromMe: true, time: '10:31 AM', read: true },
      { id: 3, text: 'Nice! I found some great materials on Lexon for that topic.', fromMe: true, time: '10:32 AM', read: true },
      { id: 4, text: 'Did you finish the DBMS assignment?', fromMe: false, time: '10:42 AM', read: false },
    ],
  },
  {
    id: 3,
    name: 'David Lee',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    lastMessage: 'Thanks for the help!',
    time: 'Mon',
    unread: 0,
    messages: [
      { id: 7, text: 'Can you explain the network layers again?', fromMe: false, time: 'Mon', read: true },
      { id: 8, text: 'Sure! OSI has 7 layers...', fromMe: true, time: 'Mon', read: true },
      { id: 9, text: 'Thanks for the help!', fromMe: false, time: 'Mon', read: true },
    ],
  },
  {
    id: 4,
    name: 'Emily Chen',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    lastMessage: 'Are we meeting at the library?',
    time: 'Sun',
    unread: 0,
    messages: [
      { id: 10, text: 'Are we meeting at the library?', fromMe: false, time: 'Sun', read: true },
    ],
  },
];

const EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '😎', '🤔', '😅', '🥳', '📚', '✅', '🚀', '💯', '👏', '🎉'];

import { useAuth } from '../hooks/useAuth';

// ─── Component ────────────────────────────────────────────────────────────────
export function MessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UploaderProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Close options on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowChatOptions(false);
      }
    }
    if (showChatOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatOptions]);

  // ── Resizable panel ──
  const MIN_PANEL = 240;
  const MAX_PANEL = 560;
  const DEFAULT_PANEL = 320;
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ev.clientX - rect.left;
      setPanelWidth(Math.min(MAX_PANEL, Math.max(MIN_PANEL, newWidth)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages.length]);

  // Mark messages as read when switching chats
  const openChat = (chatId: number) => {
    setActiveChatId(chatId);
    setShowChatList(false);
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
          : c
      )
    );
  };

  const handleStartChat = (user: typeof ALL_MOCK_USERS[0]) => {
    const existingChat = chats.find(c => c.quickId === user.quickId);
    if (existingChat) {
      openChat(existingChat.id);
    } else {
      const newChat: Chat = {
        id: Date.now(),
        name: user.name,
        avatar: user.avatar,
        lastMessage: 'Conversation started',
        time: now(),
        unread: 0,
        targetUserId: user.id,
        quickId: user.quickId,
        messages: [],
      };
      setChats(prev => [newChat, ...prev]);
      openChat(newChat.id);
    }
    setSearch('');
  };

  const handleClearChat = () => {
    setChats(prev => prev.map(c => (c.id === activeChatId ? { ...c, messages: [] } : c)));
    setShowChatOptions(false);
  };

  const handleDeleteChat = () => {
    setChats(prev => {
      const updated = prev.filter(c => c.id !== activeChatId);
      if (updated.length > 0) {
        setActiveChatId(updated[0].id);
      }
      return updated;
    });
    setShowChatOptions(false);
  };

  const handleMuteChat = () => {
    // Just close for now since UI doesn't have mute state indicator yet
    setShowChatOptions(false);
  };

  const handleBlockUser = () => {
    // Just close for now
    setShowChatOptions(false);
  };

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;

    const timeStr = now();
    const newMsg: ChatMessage = { id: newId(), text, fromMe: true, time: timeStr, read: false };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, time: timeStr }
          : c
      )
    );
    setMessage('');
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const totalUnread = chats.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden bg-surface select-none">

      {/* ── LEFT: Chat List ── */}
      <div
        style={{ width: panelWidth, minWidth: MIN_PANEL, maxWidth: MAX_PANEL }}
        className={`
          flex flex-col border-r border-card-border bg-surface-soft shrink-0
          ${showChatList ? 'flex' : 'hidden lg:flex'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-title-lg font-bold text-on-surface">Messages</h2>
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">
                {totalUnread}
              </span>
            )}
          </div>
          <button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-card-border !bg-transparent px-3.5 py-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <Search size={16} className="shrink-0 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Enter ID to message"
              className="w-full !bg-transparent text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant/70"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Chat Items / Search Results */}
        <div className="flex-1 overflow-y-auto divide-y divide-card-border/30">
          {search ? (
            // Search Results Mode
            (() => {
              const isNineDigits = /^\d{9}$/.test(search.trim());
              if (!isNineDigits) {
                return <p className="p-8 text-center text-body-sm text-on-surface-variant">Enter a valid 9-digit ID.</p>;
              }
              
              // Combine ALL_MOCK_USERS with current user for search
              const allSearchableUsers = [...ALL_MOCK_USERS];
              if (user && !allSearchableUsers.some(u => u.id === user.id)) {
                allSearchableUsers.push({
                  id: user.id,
                  quickId: user.quickId || generateQuickId(user.id),
                  name: user.name + ' (You)',
                  avatar: user.avatar,
                });
              }

              const foundUser = allSearchableUsers.find((u) => u.quickId === search.trim());
              if (!foundUser) {
                return <p className="p-8 text-center text-body-sm text-on-surface-variant">User not found.</p>;
              }
              return (
                <button
                  type="button"
                  onClick={() => handleStartChat(foundUser)}
                  className="flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-surface-container"
                >
                  <Avatar name={foundUser.name} src={foundUser.avatar} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md font-semibold text-on-surface">{foundUser.name}</p>
                    <p className="truncate text-label-sm text-primary font-medium mt-0.5">Start Chat</p>
                  </div>
                </button>
              );
            })()
          ) : (
            // Recent Chats Mode
            chats.length === 0 ? (
              <p className="p-8 text-center text-body-sm text-on-surface-variant">No chats yet</p>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => openChat(chat.id)}
                  className={`flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-surface-container
                    ${activeChatId === chat.id ? 'bg-primary/10 border-l-3 border-l-primary' : ''}
                  `}
                >
              <div className="relative shrink-0">
                <Avatar name={chat.name} src={chat.avatar} size={48} />
                {chat.id === 1 && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="truncate text-label-md font-bold text-on-surface">{chat.name}</span>
                  <span className={`ml-2 shrink-0 text-[11px] ${chat.unread > 0 ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}>
                    {chat.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-body-sm text-on-surface-variant">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-on-primary">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
              ))
            )
          )}
        </div>
      </div>

      {/* ── RESIZER HANDLE ── */}
      <div
        onMouseDown={onMouseDown}
        className="hidden lg:flex relative w-1 shrink-0 cursor-col-resize items-center justify-center group z-10"
      >
        {/* The visible thin line */}
        <div className="h-full w-px bg-card-border group-hover:bg-primary/50 group-active:bg-primary transition-colors duration-150" />
        {/* Pill indicator in the centre */}
        <div className="absolute flex h-8 w-3 items-center justify-center rounded-full bg-surface-soft border border-card-border shadow-sm group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-150 pointer-events-none">
          <div className="flex flex-col gap-0.5">
            <div className="h-3 w-0.5 rounded-full bg-on-surface-variant/40 group-hover:bg-primary/60" />
            <div className="h-3 w-0.5 rounded-full bg-on-surface-variant/40 group-hover:bg-primary/60" />
          </div>
        </div>
      </div>

      {/* ── RIGHT: Chat Window ── */}
      <div
        className={`
          flex flex-1 flex-col h-full bg-surface
          ${!showChatList ? 'flex' : 'hidden lg:flex'}
        `}
      >
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b border-card-border bg-surface-soft px-5 py-3.5 shadow-xs z-10">
          {/* Back button on mobile */}
          <button
            type="button"
            onClick={() => setShowChatList(true)}
            className="mr-1 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          
          <button
            type="button"
            onClick={() => {
              setSelectedProfile({
                uploaderId: activeChat.targetUserId || String(activeChat.id),
                uploaderName: activeChat.name,
                uploaderAvatar: activeChat.avatar,
              });
            }}
            className="flex flex-1 items-center gap-3 min-w-0 text-left hover:bg-surface-container-low rounded-lg p-1 -ml-1 transition-colors cursor-pointer"
          >
            <div className="relative">
              <Avatar name={activeChat.name} src={activeChat.avatar} size={42} />
              {activeChat.id === 1 && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface-soft bg-emerald-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-label-lg font-bold text-on-surface">{activeChat.name}</p>
              <p className="text-label-sm text-emerald-500 font-medium">Online</p>
            </div>
          </button>

          <div className="relative" ref={optionsRef}>
            <button 
              type="button" 
              onClick={() => setShowChatOptions(prev => !prev)}
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            
            {showChatOptions && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-card-border bg-surface shadow-lg z-50 overflow-hidden py-1">
                <button
                  type="button"
                  onClick={handleMuteChat}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-body-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <BellOff size={16} className="text-on-surface-variant" />
                  Mute
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-body-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <Eraser size={16} className="text-on-surface-variant" />
                  Clear Chat
                </button>
                <button
                  type="button"
                  onClick={handleDeleteChat}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-body-sm text-error hover:bg-error/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} className="text-error" />
                  Delete Chat
                </button>
                <button
                  type="button"
                  onClick={handleBlockUser}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-body-sm text-error hover:bg-error/10 transition-colors cursor-pointer border-t border-card-border/50"
                >
                  <Ban size={16} className="text-error" />
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2 bg-surface">
          {activeChat.messages.map((msg, idx) => {
            const showTime =
              idx === 0 || activeChat.messages[idx - 1].fromMe !== msg.fromMe || idx % 5 === 0;
            return (
              <div key={msg.id} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`
                    max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 text-body-md shadow-xs
                    ${msg.fromMe
                      ? 'rounded-tr-xs bg-primary text-on-primary font-medium'
                      : 'rounded-tl-xs bg-surface-container text-on-surface border border-card-border/60'
                    }
                  `}
                >
                  {msg.text}
                </div>
                {showTime && (
                  <span className="mt-1 text-[11px] text-on-surface-variant px-1.5">{msg.time}</span>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Picker */}
        {showEmoji && (
          <div className="border-t border-card-border bg-surface-soft px-5 py-3 shadow-inner">
            <div className="flex flex-wrap gap-2.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-2xl hover:scale-125 transition-transform cursor-pointer p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-3 border-t border-card-border bg-surface-soft px-5 py-3.5">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className={`shrink-0 rounded-full p-2.5 transition-colors cursor-pointer ${showEmoji ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <Smile size={22} />
          </button>

          <div className="flex-1 rounded-full border border-card-border !bg-transparent px-4 py-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              className="w-full !bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button
            type="button"
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer
              ${message.trim()
                ? 'bg-primary text-on-primary shadow-md hover:bg-primary-container scale-100'
                : 'bg-surface-container text-on-surface-variant scale-95 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <Send size={18} className={message.trim() ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>

      <UserProfilePanel profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
}
