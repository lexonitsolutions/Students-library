import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Eraser,
  GraduationCap,
  Hash,
  Loader2,
  MessageSquare,
  MoreVertical,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import { timeAgo } from '../../lib/timeAgo';
import { generateQuickId } from '../../lib/idUtils';
import {
  listMessages,
  sendMessage,
  markMessagesRead,
  subscribeToMessages,
  subscribeToReadReceipts,
  clearChat,
  deleteConversation,
  deleteSingleMessage,
  type ChatMessage,
  type Conversation,
} from '../../services/messagesService';
import { triggerUnreadMessagesRefresh } from '../../hooks/useUnreadMessages';

interface Props {
  readonly conversation: Conversation;
  readonly currentUserId: string;
  readonly currentUserName: string;
  readonly currentUserAvatar?: string;
  readonly onBack?: () => void;
  readonly onDeleteConversation?: (conversationId: string) => void;
  readonly onClearChat?: (conversationId: string) => void;
  readonly onMessagesChanged?: (conversationId: string, remainingMessages: ChatMessage[]) => void;
}

export function ChatView({
  conversation,
  currentUserId,
  currentUserName: _currentUserName,
  currentUserAvatar,
  onBack,
  onDeleteConversation,
  onClearChat,
  onMessagesChanged,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const other = conversation.otherUser;
  const otherName = other?.name || 'Student';
  const otherAvatar = other?.avatar_url || undefined;
  const otherQuickId = other ? generateQuickId(other.id) : '';

  // ── Click outside menu to close ──────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // ── Load messages ──────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    listMessages(conversation.id)
      .then((msgs) => {
        if (active) {
          setMessages(msgs);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [conversation.id]);

  // ── Mark messages as read ──────────────────────────────────────────────────
  useEffect(() => {
    if (conversation.id && currentUserId) {
      markMessagesRead(conversation.id, currentUserId)
        .then(() => triggerUnreadMessagesRefresh())
        .catch(() => {});
    }
  }, [conversation.id, currentUserId, messages.length]);

  // ── Realtime: new messages & message clear & message delete ───────────────
  useEffect(() => {
    if (!conversation.id) return;
    const unsub = subscribeToMessages(
      conversation.id,
      (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          onMessagesChanged?.(conversation.id, next);
          return next;
        });
      },
      () => {
        // Chat was cleared
        setMessages([]);
        onClearChat?.(conversation.id);
        onMessagesChanged?.(conversation.id, []);
      },
      (deletedId) => {
        // Single message deleted
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== deletedId);
          onMessagesChanged?.(conversation.id, next);
          return next;
        });
      },
    );
    return unsub;
  }, [conversation.id, onClearChat, onMessagesChanged]);

  // ── Realtime: read receipts ────────────────────────────────────────────────
  useEffect(() => {
    if (!conversation.id) return;
    const unsub = subscribeToReadReceipts(conversation.id, (updated) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
    });
    return unsub;
  }, [conversation.id]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const body = inputValue.trim();
    if (!body || isSending) return;

    setIsSending(true);
    setInputValue('');

    try {
      const sent = await sendMessage(conversation.id, currentUserId, body);
      if (sent) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          const next = [...prev, sent];
          onMessagesChanged?.(conversation.id, next);
          return next;
        });
      }
    } catch (err) {
      console.error('Error in handleSend:', err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isSending, conversation.id, currentUserId, onMessagesChanged]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Clear Chat ─────────────────────────────────────────────────────────────
  const handleClearChat = async () => {
    setIsClearing(true);
    try {
      const res = await clearChat(conversation.id);
      if (res.success) {
        setMessages([]);
        setShowClearModal(false);
        setMenuOpen(false);
        triggerUnreadMessagesRefresh();
        onClearChat?.(conversation.id);
        onMessagesChanged?.(conversation.id, []);
      }
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setIsClearing(false);
    }
  };

  // ── Delete Conversation ────────────────────────────────────────────────────
  const handleDeleteConversation = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteConversation(conversation.id);
      if (res.success) {
        setShowDeleteModal(false);
        setMenuOpen(false);
        triggerUnreadMessagesRefresh();
        onDeleteConversation?.(conversation.id);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Delete Single Message ──────────────────────────────────────────────────
  const handleDeleteSingleMessage = async (messageId: string) => {
    // Optimistically remove from state
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== messageId);
      onMessagesChanged?.(conversation.id, next);
      return next;
    });
    try {
      await deleteSingleMessage(messageId);
    } catch (err) {
      console.error('Failed to delete single message:', err);
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface overflow-hidden">
      {/* ── Top Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-card-border/70 px-4 sm:px-5 py-3 bg-surface-container-low/90 backdrop-blur-sm relative z-20">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative shrink-0">
            <Avatar name={otherName} src={otherAvatar} size={38} className="rounded-full ring-2 ring-primary/20" />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-on-surface tracking-tight leading-tight truncate">
                {otherName}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5" />
                Connected
              </span>
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-on-surface-variant font-medium">
              {otherQuickId && (
                <span className="font-mono text-primary flex items-center gap-0.5 shrink-0">
                  <Hash className="w-3 h-3" />
                  {otherQuickId}
                </span>
              )}
              {Boolean(other?.university || other?.college) && (
                <>
                  <span className="text-outline/40">·</span>
                  <span className="truncate max-w-[180px] flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-primary/70 shrink-0" />
                    {other?.university ?? other?.college}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Actions Menu (More ⋮) ── */}
        <div className="relative shrink-0 flex items-center" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border/80 bg-surface-container/80 hover:bg-surface-container text-on-surface hover:text-primary transition-all cursor-pointer shadow-2xs"
            aria-label="Chat options"
            title="Chat options (Clear / Delete)"
          >
            <MoreVertical className="w-4 h-4 text-on-surface" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border border-card-border bg-surface-container-low p-1.5 shadow-xl backdrop-blur-md z-30"
              >
                {/* 7-day disappear policy info */}
                <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-on-surface-variant/80 border-b border-card-border/60">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Messages auto-disappear after 7 days</span>
                </div>

                {/* Clear chat button */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowClearModal(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer mt-1"
                >
                  <Eraser className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Clear Chat Messages</span>
                </button>

                {/* Delete conversation button */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowDeleteModal(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-error hover:bg-error/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-error" />
                  <span>Delete Conversation</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Messages Stream ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3.5 bg-surface"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs ring-4 ring-primary/5">
              <MessageSquare className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface tracking-tight">
                Conversation Active
              </p>
              <p className="mt-1 text-xs text-on-surface-variant max-w-xs leading-relaxed">
                You and <span className="font-semibold text-on-surface">{otherName}</span> can exchange messages. Notes and chats automatically clear after 7 days.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn('group flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}
                >
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSingleMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error/10 cursor-pointer self-center shrink-0"
                      title="Delete this message"
                      aria-label="Delete this message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!isMine && (
                    <Avatar
                      name={otherName}
                      src={otherAvatar}
                      size={28}
                      className="mb-1 rounded-full shrink-0 ring-1 ring-card-border"
                    />
                  )}

                  <div
                    className={cn(
                      'max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed break-words shadow-2xs',
                      isMine
                        ? 'rounded-br-xs bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                        : 'rounded-bl-xs bg-surface-container-low text-on-surface border border-card-border/80',
                    )}
                  >
                    {msg.body}

                    <div
                      className={cn(
                        'mt-1 flex items-center gap-1 text-[10px]',
                        isMine ? 'justify-end text-white/70' : 'justify-end text-on-surface-variant/70',
                      )}
                    >
                      <span>{timeAgo(msg.createdAt)}</span>
                      {isMine && (
                        msg.readAt ? (
                          <CheckCheck className="w-3 h-3 text-white/90" />
                        ) : (
                          <Check className="w-3 h-3 text-white/60" />
                        )
                      )}
                    </div>
                  </div>

                  {isMine && (
                    <Avatar
                      name="Me"
                      src={currentUserAvatar}
                      size={28}
                      className="mb-1 rounded-full shrink-0 ring-1 ring-primary/20"
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── Modern Floating Composer ── */}
      <div className="shrink-0 p-3 sm:p-4 bg-surface border-t border-card-border/70">
        <div className="rounded-2xl border border-card-border bg-surface-container-low p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all shadow-xs">
          <div className="flex items-end gap-2 px-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Write a message to ${otherName}…`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-outline/70 outline-none max-h-32 leading-relaxed py-1 font-sans"
              style={{ overflowY: inputValue.split('\n').length > 3 ? 'auto' : 'hidden' }}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              aria-label="Send message"
              className={cn(
                'shrink-0 flex h-9 w-9 items-center justify-center rounded-xl transition-all shadow-xs cursor-pointer',
                inputValue.trim() && !isSending
                  ? 'bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95'
                  : 'bg-surface-container-high text-outline/50 cursor-not-allowed',
              )}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-1 flex items-center justify-between px-2 pt-1 text-[10px] text-on-surface-variant/70">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary/70" />
              Auto-disappears in 7 days
            </span>
            <span className="hidden sm:inline">
              Press <kbd className="font-mono bg-surface-container-high px-1 py-0.5 rounded text-[9px]">Enter</kbd> to send
            </span>
          </div>
        </div>
      </div>

      {/* ── Clear Chat Confirmation Modal ── */}
      <Modal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Chat Messages"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Are you sure you want to clear all messages in this conversation with <strong className="text-on-surface">{otherName}</strong>? Your connection will remain active, but previous messages cannot be recovered.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowClearModal(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearChat}
              disabled={isClearing}
              icon={isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eraser className="w-3.5 h-3.5" />}
            >
              {isClearing ? 'Clearing…' : 'Yes, Clear Messages'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Conversation Confirmation Modal ── */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Conversation"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Are you sure you want to delete this chat with <strong className="text-on-surface">{otherName}</strong>? This will remove the conversation and reset the connection. You will need to send a new message request to chat again.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConversation}
              disabled={isDeleting}
              icon={isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            >
              {isDeleting ? 'Deleting…' : 'Yes, Delete Chat'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ChatView;
