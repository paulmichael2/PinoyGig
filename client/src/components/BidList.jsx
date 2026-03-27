import React, { useEffect, useState } from 'react';
import { useBids } from '../context/BidsContext';
import { Star, CheckCircle, Clock, User } from 'lucide-react';
import { formatPesoAmount } from '../utils/currency';

const BidList = ({ gigId, gigStatus }) => {
  const { fetchBidsByGigId, hireBid, gigBids, loading, error } = useBids();
  const [hiringId, setHiringId] = useState(null);

  useEffect(() => {
    if (gigId) {
        fetchBidsByGigId(gigId);
    }
  }, [gigId, fetchBidsByGigId]);

  const handleHire = async (bidId) => {
    if (!window.confirm("Are you sure you want to hire this freelancer? This will mark the gig as assigned and reject all other bids.")) return;
    
    setHiringId(bidId);
    try {
      await hireBid(bidId);
      // Ideally, trigger a refresh of the Gig details parent component here to update status to 'assigned'
      // For now, the UI will update locally via context
    } catch (err) {
      alert(err.message);
    } finally {
      setHiringId(null);
    }
  };

  if (loading && gigBids.length === 0) return <div className="mt-8 text-center py-4 text-slate-500">Loading bids...</div>;
  if (error) return <div className="mt-8 text-red-500 text-sm">Error loading bids: {error}</div>;
  
  if (gigBids.length === 0) {
    return (
        <div className="mt-8 bg-slate-50 rounded-xl p-8 text-center border border-dashed border-slate-300">
            <p className="text-slate-500 italic">No bids received yet. Check back later!</p>
        </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-4">
        Received Bids <span className="text-slate-500 text-base font-normal ml-1">({gigBids.length})</span>
      </h3>
      
      <div className="space-y-4">
        {gigBids.map((bid) => (
          <div key={bid._id} className={`p-6 rounded-xl border transition-all ${bid.status === 'hired' ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
            <div className="flex justify-between items-start mb-4">
              {/* Freelancer Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-lg uppercase border border-slate-200">
                  {bid.freelancer?.name?.charAt(0) || <User className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">{bid.freelancer?.name || 'Unknown User'}</div>
                  <div className="flex items-center text-xs text-yellow-500 font-bold mt-0.5">
                    <Star className="w-3 h-3 fill-current mr-1" />
                    {bid.freelancer?.averageRating || 0} <span className="text-slate-400 font-normal ml-1">({bid.freelancer?.totalReviews || 0} reviews)</span>
                  </div>
                </div>
              </div>
              
              {/* Price & Date */}
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">{formatPesoAmount(bid.price)}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(bid.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Message */}
            <div className="bg-slate-50 p-4 rounded-lg mb-4 text-slate-700 text-sm leading-relaxed">
              {bid.message}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-bold uppercase tracking-wide">
                 {bid.status === 'hired' && <span className="text-green-600 flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full"><CheckCircle className="w-4 h-4" /> Hired</span>}
                 {bid.status === 'rejected' && <span className="text-red-500 bg-red-50 px-3 py-1 rounded-full">Rejected</span>}
                 {bid.status === 'pending' && <span className="text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full flex items-center gap-1"><Clock className="w-4 h-4" /> Pending Review</span>}
              </div>

              {/* Hire Button */}
              {bid.status === 'pending' && gigStatus === 'open' && (
                <button 
                  onClick={() => handleHire(bid._id)}
                  disabled={hiringId === bid._id}
                  className="bg-slate-900 hover:bg-green-600 text-white text-sm font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hiringId === bid._id ? 'Processing...' : 'Hire Freelancer'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BidList;