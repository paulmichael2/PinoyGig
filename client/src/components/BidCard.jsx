import { useState } from 'react';
import { Check, User } from 'lucide-react';
import { formatPesoAmount } from '../utils/currency';

const BidCard = ({ bid, isGigOwner = false, onHire = null, loading = false }) => {
  const { _id, freelancer, message, price, status, createdAt } = bid;
  const [isHiring, setIsHiring] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleHire = async () => {
    if (!onHire) return;
    setIsHiring(true);
    try {
      await onHire(_id);
    } finally {
      setIsHiring(false);
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    hired: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const cardClasses = `p-6 bg-white border rounded-2xl shadow-sm transition-all ${status === 'hired' ? 'border-green-400 bg-green-50/30' :
      status === 'rejected' ? 'opacity-60 border-slate-100' : 'border-slate-100'
    }`;

  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full">
            <User size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-base font-semibold text-slate-900">
              {freelancer?.name || 'Freelancer'}
            </h4>
            <span className="text-xs text-slate-400">{formatDate(createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xl font-bold text-indigo-600">{formatPesoAmount(price)}</span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
            {status}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{message}</p>

      {isGigOwner && status === 'pending' && (
        <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleHire}
            disabled={loading || isHiring}
          >
            {isHiring ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Hiring...
              </>
            ) : (
              <>
                <Check size={16} />
                Hire
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BidCard;
