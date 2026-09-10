import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/cn';
import { timeAgo } from '../../lib/timeAgo';
import type { Conversation } from '../../services/messagesService';

interface Props {
  readonly conversation: Conversation;
  readonly isActive: boolean;
  readonly currentUserId: string;
  readonly onClick: (conversationId: string) => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  currentUserId: _currentUserId,
  onClick,
}: Props) {
  const other = conversation.otherUser;
  const displayName = other?.name ?? 'Student';
  const displayAvatar = other?.avatar_url ?? undefined;
  const lastMsg = conversation.lastMessage;
  const lastAt = conversation.lastMessageAt;
  const unread = conversation.unreadCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onClick(conversation.id)}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all duration-150 cursor-pointer border',
        isActive
          ? 'bg-primary/10 border-primary/25 shadow-2xs'
          : 'border-transparent hover:bg-surface-container-high/60 hover:border-card-border/50 text-on-surface',
      )}
    >
      {/* Avatar with active indicator */}
      <div className="relative shrink-0">
        <Avatar
          name={displayName}
          src={displayAvatar}
          size={42}
          className={cn(
            'rounded-full transition-transform group-hover:scale-105',
            isActive ? 'ring-2 ring-primary/40' : '',
          )}
        />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-xs">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <p
            className={cn(
              'truncate text-xs sm:text-sm font-semibold tracking-tight',
              isActive ? 'text-primary' : 'text-on-surface',
            )}
          >
            {displayName}
          </p>
          {lastAt && (
            <span className="shrink-0 text-[11px] font-medium text-on-surface-variant/80">
              {timeAgo(lastAt)}
            </span>
          )}
        </div>

        <p
          className={cn(
            'mt-0.5 truncate text-xs',
            unread > 0
              ? 'font-semibold text-on-surface'
              : 'text-on-surface-variant/80 font-normal',
          )}
        >
          {lastMsg ?? 'Connected · Start chatting'}
        </p>
      </div>
    </button>
  );
}

export default ConversationListItem;
