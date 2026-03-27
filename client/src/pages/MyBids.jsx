import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Clock, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react';
import { useBids } from '../context/BidsContext'; 
import Loader from '../components/Loader';
import RatingModal from '../components/RatingModal'; 
import { gigsAPI } from '../services/api';
import { formatPesoAmount } from '../utils/currency';

const MyBids = () => {
  const { myBids, fetchMyBids, loading, error } = useBids();
  

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [requestingGigId, setRequestingGigId] = useState(null);

  useEffect(() => {
    fetchMyBids();
  }, [fetchMyBids]);

 const getStatusBadge = (bid) => {

    if (bid.status === 'hired' && bid.gigId?.status === 'completed') {
       return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase"><CheckCircle className="w-3 h-3" /> Completed</span>;
    }


    switch(bid.status) {
      case 'hired':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase"><CheckCircle className="w-3 h-3" /> Hired</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 uppercase"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  const handleRateClient = (gigId) => {
      setSelectedGigId(gigId);
      setShowRatingModal(true);
  };

  const handleReviewSuccess = () => {
      fetchMyBids();
      alert("Review submitted successfully!");
  };

  const handleRequestCompletion = async (gigId) => {
    if (!window.confirm('Send a completion request to the client?')) return;

    try {
      setRequestingGigId(gigId);
      await gigsAPI.requestComplete(gigId);
      await fetchMyBids();
      alert('Completion request sent to the client.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send completion request');
    } finally {
      setRequestingGigId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Bids</h1>
          <p className="text-slate-500 mt-1">Track the status of your sent proposals.</p>
        </div>


        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
        )}


        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gig Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">My Bid</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myBids.map((bid) => (
                  <tr key={bid._id} className="hover:bg-slate-50/50 transition-colors">
                    

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {bid.gigId ? (
                            <>
                                {bid.gigId.title}
                                {bid.gigId.status === 'completed' && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Completed
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-red-400 italic">Gig Deleted</span>
                        )}
                      </div>
                    </td>


                    <td className="px-6 py-4 font-medium text-slate-700">
                      {formatPesoAmount(bid.price)}
                    </td>


                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </td>


                    <td className="px-6 py-4">
                      {getStatusBadge(bid)}
                    </td>


                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                          {bid.status === 'hired' && bid.gigId?.status === 'assigned' && (
                            <button
                              onClick={() => handleRequestCompletion(bid.gigId._id)}
                              disabled={Boolean(bid.gigId?.completionRequestedAt) || requestingGigId === bid.gigId._id}
                              className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                              title="Request Completion"
                            >
                              <CheckCircle className="w-5 h-5" />
                              {bid.gigId?.completionRequestedAt
                              ? 'Requested'
                              : requestingGigId === bid.gigId._id
                                ? 'Requesting...'
                                : 'Request Done'}
                            </button>
                          )}
                          

                          {bid.status === 'hired' && 
                           bid.gigId?.status === 'completed' && 
                           !bid.gigId?.hasFreelancerReviewed && (
                              <button 
                                  onClick={() => handleRateClient(bid.gigId._id)}
                                  className="inline-flex items-center gap-1 text-sm font-bold text-yellow-500 hover:text-yellow-600"
                                  title="Rate Client"
                              >
                                  <Star className="w-5 h-5 fill-current" /> Rate Client
                              </button>
                          )}

                          {bid.gigId && (
                            <Link to={`/gigs/${bid.gigId._id}`} className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 hover:underline">
                                View Gig <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
  
          {!loading && myBids.length === 0 && (
            <div className="text-center py-12">
               <p className="text-slate-500">You haven't submitted any bids yet.</p>
               <Link to="/" className="text-green-600 font-bold hover:underline mt-2 inline-block">Find work now</Link>
            </div>
          )}
        </div>


        {showRatingModal && (
            <RatingModal 
                gigId={selectedGigId}
                title="Rate Client"
                onClose={() => setShowRatingModal(false)}
                onSuccess={handleReviewSuccess}
            />
        )}

      </div>
    </div>
  );
};

export default MyBids;