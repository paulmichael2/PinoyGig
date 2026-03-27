import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '../services/api';

const RatingModal = ({ gigId, onClose, onSuccess, title = "Rate Your Experience" }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a star rating");
    
    setLoading(true);
    try {
        await api.post('/reviews', { gigId, rating, comment });
        onSuccess();
        onClose();
    } catch (err) {
        alert(err.response?.data?.message || "Failed to submit review");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 mb-6">Your feedback helps build trust in the community.</p>

            {/* Star Input */}
            <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className="transition-transform hover:scale-110 focus:outline-none"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(rating)}
                    >
                        <Star 
                            className={`w-10 h-10 ${star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                        />
                    </button>
                ))}
            </div>

            {/* Comment Input */}
            <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm mb-4"
                rows="4"
                placeholder="Share details of your own experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            ></textarea>

            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
                {loading ? 'Submitting...' : 'Submit Review'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;