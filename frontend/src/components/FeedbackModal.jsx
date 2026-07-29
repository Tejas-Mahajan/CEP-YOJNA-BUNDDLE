import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, Send, Check } from 'lucide-react';

export default function FeedbackModal({ schemeId, defaultRating, onClose, onSubmitFeedback }) {
  const [rating, setRating] = useState(defaultRating || 'up');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmitFeedback({ scheme_id: schemeId, rating, comment });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Thank You for Your Feedback!</h3>
            <p className="text-xs text-slate-500">Your rating helps optimize YojanaBundle's scheme recommendation engine.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Feedback & Rating</h3>
              <p className="text-xs text-slate-500 mt-1">Help us improve scheme bundling recommendations for farmers & students.</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setRating('up')}
                className={`flex-1 p-4 rounded-2xl border text-center font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                  rating === 'up'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
                <span>Helpful Match</span>
              </button>

              <button
                type="button"
                onClick={() => setRating('down')}
                className={`flex-1 p-4 rounded-2xl border text-center font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                  rating === 'down'
                    ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ThumbsDown className="w-4 h-4 text-red-500" />
                <span>Not Relevant</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Optional Comments</label>
              <textarea
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Suggest improvements or share document application experience..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-medium text-slate-900"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Feedback</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
