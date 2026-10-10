'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  try {
    let sid = localStorage.getItem('rentify_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('rentify_session_id', sid);
    }
    return sid;
  } catch (e) {
    return 'guest_session';
  }
}

export default function PropertySocialBar({ propertyId, initialLikes = 0, initialDislikes = 0, initialCommentsCount = 0, defaultExpanded = false }) {
  const { user } = useAuth();
  const toast = useToast();

  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState(null); // 'like' | 'dislike' | null
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  const [showComments, setShowComments] = useState(defaultExpanded);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load initial reaction state
  useEffect(() => {
    let isMounted = true;
    const sid = getSessionId();

    async function fetchReactions() {
      try {
        const res = await fetch(`/api/properties/${propertyId}/reactions?sessionId=${sid}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLikes(data.likes);
            setDislikes(data.dislikes);
            setUserReaction(data.userReaction);
          }
        }
      } catch (err) {
        // silent fallback
      }
    }

    if (propertyId) {
      fetchReactions();
    }

    return () => { isMounted = false; };
  }, [propertyId, user]);

  // Load comments when opened
  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setCommentsCount((data.comments || []).length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      loadComments();
    }
  };

  // Handle Like / Dislike
  const handleReaction = async (type, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const sid = getSessionId();
    const previousReaction = userReaction;
    const previousLikes = likes;
    const previousDislikes = dislikes;

    // Optimistic Update
    if (userReaction === type) {
      // Toggle off
      setUserReaction(null);
      if (type === 'like') setLikes((prev) => Math.max(0, prev - 1));
      if (type === 'dislike') setDislikes((prev) => Math.max(0, prev - 1));
    } else {
      // Switching or adding
      setUserReaction(type);
      if (type === 'like') {
        setLikes((prev) => prev + 1);
        if (previousReaction === 'dislike') setDislikes((prev) => Math.max(0, prev - 1));
      } else {
        setDislikes((prev) => prev + 1);
        if (previousReaction === 'like') setLikes((prev) => Math.max(0, prev - 1));
      }
    }

    try {
      const res = await fetch(`/api/properties/${propertyId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, sessionId: sid }),
      });

      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setUserReaction(data.userReaction);
      } else {
        // Revert on error
        setUserReaction(previousReaction);
        setLikes(previousLikes);
        setDislikes(previousDislikes);
      }
    } catch (err) {
      setUserReaction(previousReaction);
      setLikes(previousLikes);
      setDislikes(previousDislikes);
    }
  };

  // Handle Post Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newComment.trim()) return;

    setSubmitting(true);
    const content = newComment.trim();

    try {
      const res = await fetch(`/api/properties/${propertyId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorName: user ? undefined : (guestName.trim() || 'Student'),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to post question');
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setCommentsCount((prev) => prev + 1);
      setNewComment('');
      toast?.addToast('Question posted! Landlord or other students will reply.', 'success');
    } catch (err) {
      toast?.addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="property-social-container"
      onClick={(e) => e.stopPropagation()}
      style={{
        borderTop: '1px solid #E2E8F0',
        background: '#FAFBFD',
        padding: '0.65rem 1rem',
        borderRadius: '0 0 var(--radius) var(--radius)',
        fontSize: '0.85rem',
      }}
    >
      {/* Facebook / YouTube Style Action Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        {/* Bottom Left: Like & Dislike Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* Like Button */}
          <button
            type="button"
            onClick={(e) => handleReaction('like', e)}
            className={`social-action-btn ${userReaction === 'like' ? 'active-like' : ''}`}
            title="Like this property listing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '20px',
              border: userReaction === 'like' ? '1px solid #2563EB' : '1px solid #CBD5E1',
              background: userReaction === 'like' ? '#EFF6FF' : '#ffffff',
              color: userReaction === 'like' ? '#1D4ED8' : '#475569',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '0.95rem', transform: userReaction === 'like' ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s ease' }}>
              👍
            </span>
            <span>{likes > 0 ? likes : 'Like'}</span>
          </button>

          {/* Dislike Button */}
          <button
            type="button"
            onClick={(e) => handleReaction('dislike', e)}
            className={`social-action-btn ${userReaction === 'dislike' ? 'active-dislike' : ''}`}
            title="Dislike"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '20px',
              border: userReaction === 'dislike' ? '1px solid #64748B' : '1px solid #CBD5E1',
              background: userReaction === 'dislike' ? '#F1F5F9' : '#ffffff',
              color: userReaction === 'dislike' ? '#0F172A' : '#64748B',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '0.95rem', transform: userReaction === 'dislike' ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s ease' }}>
              👎
            </span>
            {dislikes > 0 && <span>{dislikes}</span>}
          </button>
        </div>

        {/* Bottom Right: Questions / Comment Button */}
        <div>
          <button
            type="button"
            onClick={handleToggleComments}
            className="social-action-btn"
            title="Ask questions or read student comments"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              border: showComments ? '1px solid #3B82F6' : '1px solid #CBD5E1',
              background: showComments ? '#EFF6FF' : '#ffffff',
              color: showComments ? '#1D4ED8' : '#334155',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>💬</span>
            <span>
              {commentsCount > 0 ? `${commentsCount} ${commentsCount === 1 ? 'Question' : 'Questions'}` : 'Ask Question'}
            </span>
            <span style={{ fontSize: '0.7rem', marginLeft: '0.1rem', color: '#64748B' }}>
              {showComments ? '▲' : '▼'}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Facebook / YouTube Style Discussion Drawer */}
      {showComments && (
        <div 
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px dashed #E2E8F0',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>💬</span> Student Questions & Answers
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              {comments.length} {comments.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Existing comments list */}
          <div 
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              paddingRight: '0.25rem',
            }}
          >
            {commentsLoading ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                Loading questions...
              </div>
            ) : comments.length === 0 ? (
              <div style={{
                background: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '0.85rem',
                textAlign: 'center',
                color: '#64748B',
                fontSize: '0.8rem',
              }}>
                No questions yet. Be the first student to ask about constant water, light, or security!
              </div>
            ) : (
              comments.map((comment) => {
                const isLandlord = comment.authorRole === 'landlord';
                const isAdmin = comment.authorRole === 'admin';
                return (
                  <div
                    key={comment.id}
                    style={{
                      background: isLandlord ? '#F0FDF4' : isAdmin ? '#EFF6FF' : '#ffffff',
                      border: isLandlord ? '1px solid #BBF7D0' : isAdmin ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span 
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isLandlord ? '#16A34A' : isAdmin ? '#2563EB' : '#64748B',
                            color: '#fff',
                            fontSize: '0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {comment.authorName?.[0] || 'S'}
                        </span>
                        <strong style={{ fontSize: '0.78rem', color: '#0F172A' }}>
                          {comment.authorName}
                        </strong>
                        {isLandlord && (
                          <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.65rem', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            Landlord
                          </span>
                        )}
                        {isAdmin && (
                          <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '0.65rem', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            Admin
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.35, wordBreak: 'break-word' }}>
                      {comment.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* New comment input form */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {!user && (
              <input
                type="text"
                placeholder="Your name or nickname (e.g. ABU Student)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8rem',
                  outline: 'none',
                  background: '#ffffff',
                }}
              />
            )}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                placeholder="Ask about water, light, security..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={500}
                required
                style={{
                  flex: 1,
                  padding: '0.45rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  outline: 'none',
                  background: '#ffffff',
                }}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                style={{
                  background: 'var(--primary, #0B2545)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !newComment.trim() ? 0.6 : 1,
                  transition: 'background 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {submitting ? '...' : 'Ask'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
