import React, { useState } from 'react';
import { Star, MessageSquarePlus, User, Trash2, Edit3, X, Image, Save } from 'lucide-react';
import { Review } from '../types';

interface ReviewSectionProps {
  productId: string;
  reviews: Review[];
  onAddReview: (comment: string, rating: number, images?: string[]) => void;
  onEditReview?: (reviewId: string, comment: string, rating: number, images?: string[]) => void;
  onDeleteReview?: (reviewId: string) => void;
  user: any;
  onLoginRequest: () => void;
}

export default function ReviewSection({
  productId,
  reviews,
  onAddReview,
  onEditReview,
  onDeleteReview,
  user,
  onLoginRequest,
}: ReviewSectionProps) {
  // Add review form state
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [attachedImagesText, setAttachedImagesText] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  // Edit review state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editImagesText, setEditImagesText] = useState('');

  // Full-screen image modal overlay
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Compute overall stats
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((reviews.reduce((acc, current) => acc + current.rating, 0) / totalReviews).toFixed(1))
      : 0;

  // Star groupings occurrence index
  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      starCounts[r.rating - 1]++;
    }
  });

  // Handle new review submissions
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    // Split image URLs by comma or space and filter out empty
    const imgs = attachedImagesText
      .split(',')
      .map(url => url.trim())
      .filter(url => url.startsWith('http') || url.startsWith('/'));

    onAddReview(comment, rating, imgs);
    setComment('');
    setRating(5);
    setAttachedImagesText('');
    setFormOpen(false);
  };

  // Trigger inline review editing
  const startEditing = (rev: Review) => {
    setEditingId(rev.id);
    setEditComment(rev.comment);
    setEditRating(rev.rating);
    setEditImagesText(rev.images ? rev.images.join(', ') : '');
  };

  // Submit inline edit changes
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editComment.trim() || !onEditReview) return;

    const imgs = editImagesText
      .split(',')
      .map(url => url.trim())
      .filter(url => url.startsWith('http') || url.startsWith('/'));

    onEditReview(editingId!, editComment, editRating, imgs);
    setEditingId(null);
  };

  // Determine if a user has modification access
  const canModify = (rev: Review) => {
    if (!user) return false;
    const isOwner = rev.userId === user.uid;
    const isAdmin = user.email === 'admin@zunomart.com' || user.email === 'dibakarchakma01@gmail.com';
    return isOwner || isAdmin;
  };

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Rating statistics dashboard layout */}
      <div className="flex flex-col md:flex-row items-stretch gap-6 border-b border-gray-150 dark:border-slate-800 pb-6">
        
        {/* Rating score big summary card */}
        <div className="md:w-1/3 flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-zinc-50 dark:bg-slate-900 border border-gray-205 dark:border-slate-800 shadow-sm">
          <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400 mb-1 tracking-tight">
            {averageRating}
          </p>
          <div className="flex text-amber-400 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(averageRating) ? 'fill-amber-450 text-amber-400' : 'text-gray-200 dark:text-slate-800'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-gray-500 font-mono">Based on {totalReviews} buyer reviews</p>
        </div>

        {/* Scoring bar distribution list */}
        <div className="flex-1 space-y-2.5 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starCounts[stars - 1];
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs text-gray-650 dark:text-gray-400">
                <span className="w-12 font-semibold flex items-center gap-1 shrink-0">
                  <span>{stars}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-gray-150 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-gray-400 dark:text-gray-500 font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Opinions Title Row and Add CTA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Customer Opinions</span>
            <span className="bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 px-2 py-0.5 rounded text-xs text-gray-500 font-mono">
              {totalReviews}
            </span>
          </h3>

          {!formOpen && (
            <button
              onClick={() => (user ? setFormOpen(true) : onLoginRequest())}
              className="text-xs bg-indigo-650 hover:bg-indigo-705 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Write Feedback</span>
            </button>
          )}
        </div>

        {/* NEW REVIEW CREATION FORM BLOCK */}
        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="p-5 border border-indigo-150 dark:border-slate-800 rounded-2xl bg-indigo-50/5 dark:bg-slate-900/40 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-950 dark:text-white uppercase tracking-wider">Leave Verified feedback</span>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold font-sans">Give Rating:</span>
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setRating(stars)}
                    className="p-1 hover:scale-115 duration-100 focus:outline-none cursor-pointer"
                  >
                    <Star className={`w-5.5 h-5.5 ${stars <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-250 dark:text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase block tracking-wider">Review Comments</label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share detail specifications, shipping speed, stitching, sizing, performance..."
                className="w-full text-xs border border-gray-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4.5 py-3 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-gray-905 dark:text-white shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase block tracking-wider flex items-center gap-1">
                <Image className="w-3.5 h-3.5" />
                <span>Review Images (Optional URLs)</span>
              </label>
              <input
                type="text"
                value={attachedImagesText}
                onChange={(e) => setAttachedImagesText(e.target.value)}
                placeholder="E.g. https://images.com/my_snap.jpg, /review_snaps/product_2.jpg"
                className="w-full text-xs border border-gray-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4.5 py-3 rounded-xl focus:outline-none focus:border-indigo-600 text-gray-905 dark:text-white shadow-inner"
              />
              <span className="text-[10px] text-gray-450 block italic">Provide one or more web addresses separated by commas to display snapshot attachments.</span>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold border border-gray-250 dark:border-slate-750 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-605 hover:bg-indigo-705 text-white rounded-xl transition-all shadow shadow-indigo-650/20 hover:scale-103"
              >
                Submit Review
              </button>
            </div>
          </form>
        )}

        {/* FEEDBACK LIST ITERATOR */}
        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-6">
            <p className="text-xs font-bold text-gray-750 dark:text-gray-300">No client reviews logged yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Be the first authenticated user to purchase and publish feedback.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isEditingThis = editingId === rev.id;
              return (
                <div
                  key={rev.id}
                  className="p-4.5 border border-gray-150 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900/60 shadow-sm hover:shadow transition-shadow flex flex-col md:flex-row gap-4 justify-between"
                >
                  {/* Left Column: Avatar icon and contents */}
                  <div className="flex-1 flex gap-3.5">
                    <div className="w-8.5 h-8.5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black shrink-0 border border-indigo-100/50 dark:border-slate-700">
                      <User className="w-4 h-4" />
                    </div>

                    <div className="flex-1 space-y-2">
                      
                      {/* Sub-header author meta details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-black text-gray-900 dark:text-white capitalize">{rev.userName}</span>
                          {(rev.userId === 'seeded' || rev.id.startsWith('rev-')) && (
                            <span className="bg-teal-100 dark:bg-teal-950/45 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900/30 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase scale-90">Verified Buyer</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono tracking-tight font-medium">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Editing state vs display reviews state */}
                      {isEditingThis ? (
                        <form onSubmit={handleSaveEdit} className="space-y-3 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-500 uppercase">Adjust Rating:</span>
                            <div className="flex text-amber-400 scale-90">
                              {[1, 2, 3, 4, 5].map((stars) => (
                                <button
                                  key={stars}
                                  type="button"
                                  onClick={() => setEditRating(stars)}
                                  className="p-0.5"
                                >
                                  <Star className={`w-5 h-5 ${stars <= editRating ? 'fill-amber-400' : 'text-gray-250 dark:text-slate-705'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            required
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            className="w-full text-xs border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 text-gray-905 dark:text-white"
                          />

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 block uppercase">Review Photo URLs:</span>
                            <input
                              type="text"
                              value={editImagesText}
                              onChange={(e) => setEditImagesText(e.target.value)}
                              className="w-full text-xs border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-855 px-3.5 py-1.8 rounded-xl focus:outline-none"
                            />
                          </div>

                          <div className="flex gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-[10px] uppercase font-bold border border-gray-205 dark:border-slate-700 rounded-lg text-gray-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3.5 py-1.5 text-[10px] uppercase font-black bg-indigo-650 hover:bg-indigo-705 text-white rounded-lg flex items-center gap-1 shadow"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {/* Display Star row */}
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? 'fill-amber-400' : 'text-gray-150 dark:text-slate-800'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Review comment line */}
                          <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed font-normal whitespace-pre-line break-words">
                            {rev.comment}
                          </p>

                          {/* Optional customer images attached in review */}
                          {rev.images && rev.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {rev.images.map((img, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setPreviewImageUrl(img)}
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-gray-150 dark:border-slate-800 hover:scale-105 duration-200 transition bg-slate-50 relative group/thumb cursor-zoom-in"
                                  title="View large review snapshot"
                                >
                                  <img
                                    referrerPolicy="no-referrer"
                                    src={img}
                                    alt={`Review thumbnail ${i}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column Action tools (Edit, Delete buttons) */}
                  {!isEditingThis && canModify(rev) && (
                    <div className="md:border-l border-gray-100 dark:border-slate-800 md:pl-4 flex md:flex-col items-center justify-end gap-2 shrink-0 h-full self-end md:self-stretch">
                      <button
                        onClick={() => startEditing(rev)}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Review comments"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteReview && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this verified customer review feedback permanently?')) {
                              onDeleteReview(rev.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete reviews response record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POPUP FULLSIZE IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="relative max-w-3xl max-h-[85vh] w-full flex items-center justify-center">
            {/* Close button overlay */}
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full focus:outline-none transition-all cursor-pointer"
              title="Close image overlay"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              referrerPolicy="no-referrer"
              src={previewImageUrl}
              alt="Customer snapshot fullsize"
              className="object-contain max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/5 animate-scaleIn"
            />
          </div>
        </div>
      )}
    </div>
  );
}
