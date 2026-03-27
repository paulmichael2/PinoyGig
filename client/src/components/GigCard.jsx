import React from 'react';
import { Star } from 'lucide-react'; // Ensure Star is imported
import { Link } from 'react-router-dom';
import { formatPesoAmount } from '../utils/currency';

const GigCard = ({ gig }) => {
  // Destructure with safe defaults
  const { 
    _id, 
    title = "Untitled Gig", 
    price = 0, 
    budget = 0, 
    owner = {},
    category = "General"
  } = gig;

  const displayPrice = price || budget;
  const ownerId = owner?._id;
  const ownerName = owner?.name || "Unknown User";
  const ownerRating = owner?.averageRating || 0;
  const ownerReviews = owner?.totalReviews || 0;

  // Generate a consistent random image
  const randomImageId = _id ? _id.slice(-1).charCodeAt(0) % 10 : 1; 
  const staticImage = "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=400&q=80";

  return (
    <div className="bg-white p-3 pb-4 rounded-xl shadow-lg border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col group">
      <Link to={`/gigs/${_id}`} className="block">
        
        {/* Gig Image Placeholder */}
        <div 
          className="h-40 bg-slate-200 rounded-lg mb-3 bg-cover bg-center relative overflow-hidden" 
          style={{ backgroundImage: `url('${staticImage}')` }}
        >
             <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                {category}
             </div>
        </div>
      </Link>

        {/* Freelancer Profile */}
        <Link
          to={ownerId ? `/profile/${ownerId}` : '/profile'}
          className="flex items-center gap-2 mb-2 px-1 w-fit rounded-lg transition hover:bg-slate-50"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden text-xs font-bold text-slate-500 uppercase">
             {ownerName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">{ownerName}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                {ownerRating > 0 ? (
                    <>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{ownerRating} ({ownerReviews})</span>
                    </>
                ) : (
                    'New Seller'
                )}
            </div>
          </div>
        </Link>

        {/* Gig Title */}
        <Link to={`/gigs/${_id}`} className="block px-1 mb-4">
          <h3 className="text-sm font-medium text-slate-700 leading-snug line-clamp-2 h-10 group-hover:text-green-600 transition-colors">
            {title}
          </h3>
        </Link>

        {/* Footer: Rating & Price */}
        <Link to={`/gigs/${_id}`} className="mt-auto block px-1 pt-2 border-t border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-yellow-400">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs text-slate-400 font-bold ml-1">{ownerRating > 0 ? ownerRating : "New"}</span>
            </div>
            <div className="text-xs font-bold text-slate-500">
              BUDGET <span className="text-slate-900 text-sm">{formatPesoAmount(displayPrice)}</span>
            </div>
          </div>
        </Link>
      </div>
  );
};

export default GigCard;