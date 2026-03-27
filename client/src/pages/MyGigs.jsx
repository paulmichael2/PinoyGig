import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Eye, Plus, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { gigsAPI } from '../services/api';
import Loader from '../components/Loader';
import RatingModal from '../components/RatingModal';
import { formatPesoAmount } from '../utils/currency';

const MyGigs = () => {
  const [myGigs, setMyGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedGigId, setSelectedGigId] = useState(null);

  useEffect(() => {
    fetchMyGigs();
  }, []);

  const fetchMyGigs = async () => {
    try {
      setLoading(true);
      const response = await gigsAPI.getMyGigs();
      setMyGigs(response.data.gigs);
    } catch (err) {
      console.error("Error fetching my gigs:", err);
      setError("Failed to load your gigs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this gig? This action cannot be undone.')) {
        try {
            await gigsAPI.delete(id);
            setMyGigs(myGigs.filter(gig => gig._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete gig");
        }
    }
  };


  const handleMarkComplete = async (gigId) => {
    if (!window.confirm("Confirm that the work has been delivered satisfactorily?")) return;

    try {
      const response = await gigsAPI.complete(gigId);
      const completedGig = response.data.gig;
      const payoutSummary = response.data.payoutSummary;
        

        setMyGigs(prev => prev.map(gig => 
        gig._id === gigId ? { ...gig, ...completedGig } : gig
        ));

      if (payoutSummary) {
        alert(`Contract completed. Freelancer payout: ${formatPesoAmount(payoutSummary.freelancerPayoutAmount)}. Platform tax: ${formatPesoAmount(payoutSummary.platformFeeAmount)}.`);
      }


        setSelectedGigId(gigId);
        setShowRatingModal(true);

    } catch (err) {
        alert(err.response?.data?.message || "Failed to mark as complete");
    }
  };


  const handleRateUser = (gigId) => {
      setSelectedGigId(gigId);
      setShowRatingModal(true);
  };

  const handleReviewSuccess = () => {
      fetchMyGigs(); 
      alert("Review submitted successfully!");
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Gigs</h1>
          <Link to="/post-gig">
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md">
              <Plus className="w-5 h-5" />
              Post New Gig
            </button>
          </Link>
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
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myGigs.map((gig) => (
                  <tr key={gig._id} className="hover:bg-slate-50/50 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{gig.title}</div>
                      <div className="text-xs text-slate-400 capitalize">{gig.category}</div>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {formatPesoAmount(gig.budget)}
                      {gig.status !== 'open' && gig.contractAmount > 0 && (
                        <div className="mt-1 text-xs text-slate-400">
                          Contract: {formatPesoAmount(gig.contractAmount)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${gig.status === 'open' ? 'bg-green-100 text-green-800' : 
                          gig.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-200 text-slate-800'}`}>
                        {gig.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {new Date(gig.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        
                        {gig.status === 'assigned' && (
                          <div className="flex items-center gap-2">
                            {gig.completionRequestedAt && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase text-amber-700">
                                Request Pending
                              </span>
                            )}
                            <button 
                              onClick={() => handleMarkComplete(gig._id)}
                              title={gig.completionRequestedAt ? 'Review request and mark as completed' : 'Mark as Completed'}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}

                        {gig.status === 'completed' && !gig.hasClientReviewed && (
                            <button 
                                onClick={() => handleRateUser(gig._id)}
                                title="Rate Freelancer"
                                className="text-yellow-500 hover:text-yellow-600 transition-colors"
                            >
                                <Star className="w-5 h-5" />
                            </button>
                        )}

                        <Link to={`/gigs/${gig._id}`} title="View">
                            <Eye className="w-5 h-5 text-slate-400 hover:text-green-600 cursor-pointer transition-colors" />
                        </Link>
                        
                        {gig.status === 'open' ? (
                             <button onClick={() => handleDelete(gig._id)} title="Delete">
                                <Trash2 className="w-5 h-5 text-slate-400 hover:text-red-600 cursor-pointer transition-colors" />
                            </button>
                        ) : (
                             <Trash2 className="w-5 h-5 text-slate-200 cursor-not-allowed" />
                        )}
                       
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!loading && myGigs.length === 0 && (
            <div className="text-center py-12">
               <p className="text-slate-500">You haven't posted any gigs yet.</p>
            </div>
          )}
        </div>

        {showRatingModal && (
            <RatingModal 
                gigId={selectedGigId}
                title="Rate Freelancer"
                onClose={() => setShowRatingModal(false)}
                onSuccess={handleReviewSuccess}
            />
        )}

      </div>
    </div>
  );
};

export default MyGigs;