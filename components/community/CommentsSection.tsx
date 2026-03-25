'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronUp, ChevronDown, Reply, Trash2, MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CommentAuthor {
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface Comment {
  id: string
  app_id: string
  user_id: string
  parent_id: string | null
  body: string
  upvotes: number
  downvotes: number
  created_at: string
  author: CommentAuthor
  replies?: Comment[]
  userVote?: number | null
}

interface CommentsSectionProps {
  appId: string
  currentUserId: string | null
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function Avatar({ author }: { author: CommentAuthor }) {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF2D9B] to-[#6B21E8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden relative">
      {author.avatar_url ? (
        <Image src={author.avatar_url} alt={author.username} fill className="object-cover" />
      ) : (
        (author.display_name || author.username).charAt(0).toUpperCase()
      )}
    </div>
  )
}

function VoteButton({
  direction,
  count,
  active,
  onClick,
}: {
  direction: 'up' | 'down'
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-0.5 transition-colors text-xs font-medium',
        direction === 'up'
          ? active ? 'text-orange-400' : 'text-[var(--text-muted)] hover:text-orange-400'
          : active ? 'text-blue-400' : 'text-[var(--text-muted)] hover:text-blue-400'
      )}
      aria-label={direction === 'up' ? 'Upvote' : 'Downvote'}
    >
      {direction === 'up' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      <span>{count}</span>
    </button>
  )
}

function CommentItem({
  comment,
  appId,
  currentUserId,
  isReply = false,
  onVote,
  onDelete,
  onReply,
}: {
  comment: Comment
  appId: string
  currentUserId: string | null
  isReply?: boolean
  onVote: (commentId: string, vote: 1 | -1) => void
  onDelete: (commentId: string, parentId?: string) => void
  onReply: (commentId: string) => void
}) {
  return (
    <div className={cn('flex gap-3', isReply && 'ml-8 mt-3')}>
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <VoteButton
          direction="up"
          count={comment.upvotes}
          active={comment.userVote === 1}
          onClick={() => onVote(comment.id, 1)}
        />
        <VoteButton
          direction="down"
          count={comment.downvotes}
          active={comment.userVote === -1}
          onClick={() => onVote(comment.id, -1)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Avatar author={comment.author} />
          <Link
            href={`/creators/${comment.author.username}`}
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            @{comment.author.username}
          </Link>
          <span className="text-xs text-[var(--text-muted)]">{timeAgo(comment.created_at)}</span>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words">
          {comment.body}
        </p>

        <div className="flex items-center gap-3 mt-1.5">
          {!isReply && currentUserId && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Reply size={11} /> Reply
            </button>
          )}
          {currentUserId === comment.user_id && (
            <button
              onClick={() => onDelete(comment.id, comment.parent_id || undefined)}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              <Trash2 size={11} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommentsSection({ appId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [postingReply, setPostingReply] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch(`/api/apps/${appId}/comments`)
      .then(r => r.json())
      .then(d => { setComments(d.comments || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [appId])

  async function submitComment() {
    if (!commentText.trim()) return
    setPosting(true)
    const res = await fetch(`/api/apps/${appId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentText.trim() }),
    })
    if (res.ok) {
      const { comment } = await res.json()
      setComments(prev => [{ ...comment, replies: [], userVote: null }, ...prev])
      setCommentText('')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to post')
    }
    setPosting(false)
  }

  async function submitReply(parentId: string) {
    if (!replyText.trim()) return
    setPostingReply(true)
    const res = await fetch(`/api/apps/${appId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyText.trim(), parent_id: parentId }),
    })
    if (res.ok) {
      const { comment } = await res.json()
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), { ...comment, userVote: null }] }
          : c
      ))
      setReplyingTo(null)
      setReplyText('')
    } else {
      toast.error('Failed to post reply')
    }
    setPostingReply(false)
  }

  async function handleVote(commentId: string, vote: 1 | -1) {
    if (!currentUserId) { toast.error('Sign in to vote'); return }
    const res = await fetch(`/api/apps/${appId}/comments/${commentId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    })
    if (res.ok) {
      const { upvotes, downvotes, userVote } = await res.json()
      function updateComment(c: Comment): Comment {
        if (c.id === commentId) return { ...c, upvotes, downvotes, userVote }
        if (c.replies) return { ...c, replies: c.replies.map(updateComment) }
        return c
      }
      setComments(prev => prev.map(updateComment))
    }
  }

  async function handleDelete(commentId: string, parentId?: string) {
    const res = await fetch(`/api/apps/${appId}/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId
            ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }
            : c
        ))
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    }
  }

  const visibleComments = showAll ? comments : comments.slice(0, 10)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={16} className="text-[var(--text-muted)]" />
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Discussion {comments.length > 0 && <span className="text-[var(--text-muted)] font-normal text-sm">({comments.length})</span>}
        </h2>
      </div>

      {/* Comment form */}
      {currentUserId ? (
        <div className="mb-6">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
            }}
            placeholder="Join the conversation..."
            rows={3}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] focus:ring-1 focus:ring-[#6B21E8]/30 resize-none transition-all"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={submitComment}
              disabled={!commentText.trim() || posting}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {posting ? <Loader2 size={14} className="animate-spin" /> : null}
              Post Comment
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-muted)] text-center">
          <Link href="/login" className="text-[#6B21E8] hover:underline font-medium">Sign in</Link> to join the discussion
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-muted)]">
          <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {visibleComments.map(comment => (
            <div key={comment.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
              <CommentItem
                comment={comment}
                appId={appId}
                currentUserId={currentUserId}
                onVote={handleVote}
                onDelete={handleDelete}
                onReply={id => { setReplyingTo(id); setReplyText('') }}
              />

              {/* Replies */}
              {(comment.replies || []).map(reply => (
                <div key={reply.id} className="border-t border-[var(--border)] mt-3 pt-3">
                  <CommentItem
                    comment={reply}
                    appId={appId}
                    currentUserId={currentUserId}
                    isReply
                    onVote={handleVote}
                    onDelete={(id) => handleDelete(id, comment.id)}
                    onReply={() => {}}
                  />
                </div>
              ))}

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-3 ml-8 border-t border-[var(--border)] pt-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    autoFocus
                    placeholder={`Reply to @${comment.author.username}...`}
                    rows={2}
                    className="w-full bg-[var(--muted-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] resize-none"
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText('') }}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitReply(comment.id)}
                      disabled={!replyText.trim() || postingReply}
                      className="text-xs bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {postingReply ? <Loader2 size={12} className="animate-spin" /> : 'Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {comments.length > 10 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors py-2"
            >
              Show {comments.length - 10} more comments
            </button>
          )}
        </div>
      )}
    </div>
  )
}
