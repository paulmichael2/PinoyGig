import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, CheckCircle, AlertCircle, Briefcase, Info, MessageSquare } from 'lucide-react';
import api from '../services/api';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useBids } from '../context/BidsContext';
import BidList from '../components/BidList';
import RatingModal from '../components/RatingModal';
import { gigsAPI } from '../services/api';
import { formatPesoAmount } from '../utils/currency';

const GigDetails = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
    const [requestingCompletion, setRequestingCompletion] = useState(false);


  const [bidMessage, setBidMessage] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [localBidSubmitted, setLocalBidSubmitted] = useState(false); 


  const { createBid, myBids, fetchMyBids } = useBids(); 
  const [successMsg, setSuccessMsg] = useState('');


  const currentUserId = currentUser?._id || currentUser?.user?._id;

  useEffect(() => {
    const loadData = async () => {
        try {
            setLoading(true);
            const gigRes = await api.get(`/gigs/${id}`);
            const fetchedGig = gigRes.data.gig;
            setGig(fetchedGig);
            
            if (fetchedGig) {
                setBidPrice(fetchedGig.budget);
                const ownerId = fetchedGig.owner?._id || fetchedGig.owner;
                if (currentUserId && ownerId && currentUserId.toString() !== ownerId.toString()) {
                    await fetchMyBids(); 
                }
            }
        } catch (err) {
            console.error("Error loading data:", err);
            setError('Failed to load gig details.');
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [id, currentUserId, fetchMyBids]); 

  const handleMarkComplete = async () => {
        if(!window.confirm("Confirm that this gig is completed? This will verify the work is done.")) return;
        
        try {
                        const response = await gigsAPI.complete(id);
                        setGig(response.data.gig);
                        if (response.data.payoutSummary) {
                            const { freelancerPayoutAmount, platformFeeAmount } = response.data.payoutSummary;
                            alert(`Contract completed. Freelancer payout: ${formatPesoAmount(freelancerPayoutAmount)}. Platform tax: ${formatPesoAmount(platformFeeAmount)}.`);
                        }
            setShowRatingModal(true);
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        }
  };

    const handleRequestCompletion = async () => {
        if (!window.confirm('Send a completion request to the client?')) return;

        try {
            setRequestingCompletion(true);
            const response = await gigsAPI.requestComplete(id);
            setGig(response.data.gig);
            alert('Completion request sent to the client.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send completion request');
        } finally {
            setRequestingCompletion(false);
        }
    };
  
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    
    try {
        await createBid({
            gigId: id,
            message: bidMessage,
            price: bidPrice
        });
        
        setSuccessMsg('Bid submitted successfully!');
        setBidMessage('');
        setLocalBidSubmitted(true); 
        
        fetchMyBids(); 
    } catch (err) {
        console.error("Bid submission failed", err);
        alert(err.message); 
    }
  };

  if (loading) return <Loader />;
  if (error) return (
      <div className="text-center py-20 text-red-500 flex flex-col items-center gap-2">
        <AlertCircle className="w-10 h-10" />
        <p>{error}</p>
        <Link to="/gigs" className="text-green-600 hover:underline">Back to Gigs</Link>
      </div>
  );
  if (!gig) return <div className="text-center py-20">Gig not found</div>;


  const gigOwnerId = gig.owner?._id || gig.owner;
    const hiredFreelancerId = gig.hiredFreelancer?._id || gig.hiredFreelancer;
  const isOwner = currentUserId && gigOwnerId && currentUserId.toString() === gigOwnerId.toString();
    const isHiredFreelancer = currentUserId && hiredFreelancerId && currentUserId.toString() === hiredFreelancerId.toString();
    const canOpenChat = Boolean((isOwner || isHiredFreelancer) && hiredFreelancerId && gig.status !== 'open');
    const completionRequested = Boolean(gig.completionRequestedAt);


  const hasUserBidded = localBidSubmitted || (myBids && myBids.some(bid => 
      (bid.gigId?._id === id || bid.gigId === id)
  ));

  
    const ownerName = gig.owner?.name || "Unknown User";
  const ownerRating = gig.owner?.averageRating || 0;
  const ownerReviews = gig.owner?.totalReviews || 0;
  const staticImage = "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=1000&q=80";

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{gig.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500">
                             <Link to={`/profile/${gigOwnerId}`} className="flex items-center gap-1 rounded-md transition hover:text-green-600">
                                 <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold uppercase text-slate-500">
                                        {ownerName.charAt(0)}
                                 </div>
                                 <span className="font-semibold text-slate-900 hover:text-green-600">{ownerName}</span>
                             </Link>
               <span>|</span>
               <div className="flex items-center text-yellow-500">
                 <Star className="w-4 h-4 fill-current" />
                 <span className="font-bold ml-1">{ownerRating > 0 ? ownerRating : "New"}</span>
                 <span className="text-slate-400 font-normal ml-1">({ownerReviews} reviews)</span>
               </div>
               <span>|</span>
               <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs">
                 <Briefcase className="w-3 h-3" /> {gig.category || "General"}
               </span>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-sm border border-slate-100">
            <img src={staticImage} alt={gig.title} className="w-full h-96 object-cover" />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">About This Gig</h2>
            <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line">
              {gig.description}
            </div>
          </div>
          {isOwner && (
            <BidList gigId={id} gigStatus={gig.status} />
          )}
        </div>


        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 sticky top-24">
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-medium">Budget</span>
                            <span className="text-2xl font-bold text-slate-900">{formatPesoAmount(gig.budget)}</span>
            </div>

            <p className="text-slate-600 text-sm mb-4">
              {gig.status === 'open' 
                ? "This gig is currently open for bidding." 
                : "This gig has already been assigned."}
            </p>

            <div className="space-y-3 mb-6">
               <div className="flex items-center gap-2 text-sm text-slate-500">
                 <Clock className="w-4 h-4 text-green-500" />
                 <span>Status: <span className="font-semibold capitalize">{gig.status}</span></span>
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-500">
                 <CheckCircle className="w-4 h-4 text-green-500" />
                 <span>Verified Payment</span>
               </div>
                             {gig.contractAmount > 0 && (
                                 <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                     <div className="flex items-center justify-between gap-3">
                                         <span>Contract amount</span>
                                         <span className="font-semibold text-slate-900">{formatPesoAmount(gig.contractAmount)}</span>
                                     </div>
                                     <div className="mt-2 flex items-center justify-between gap-3">
                                         <span>10% platform tax</span>
                                         <span className="font-semibold text-amber-600">{formatPesoAmount(gig.platformFeeAmount || 0)}</span>
                                     </div>
                                     <div className="mt-2 flex items-center justify-between gap-3">
                                         <span>Freelancer receives</span>
                                         <span className="font-semibold text-green-600">{formatPesoAmount(gig.freelancerPayoutAmount || 0)}</span>
                                     </div>
                                 </div>
                             )}
            </div>

            <div className="border-t border-slate-100 pt-6 mt-2">
                {canOpenChat && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Private Gig Chat</p>
                                <p className="mt-1 text-xs text-slate-600">
                                    Only the client and hired freelancer can message each other here.
                                </p>
                            </div>
                            <Link
                                to={`/messages/${id}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-600"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Open Chat
                            </Link>
                        </div>
                    </div>
                )}

                {isOwner ? (
                    <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2">Manage Your Gig</h3>

                        {gig.status === 'open' && (
                            <>
                                <p className="text-xs text-slate-500 mb-4">Waiting for proposals...</p>
                                <Link to="/my-gigs">
                                    <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                                        View Bids / Edit
                                    </button>
                                </Link>
                            </>
                        )}

 
                        {gig.status === 'assigned' && (
                            <div className="space-y-3">
                                <p className="text-xs text-green-600 font-bold bg-green-50 py-1 rounded border border-green-100">
                                    Freelancer Hired & Working
                                </p>
                                {completionRequested && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-700">
                                        The freelancer requested completion on {new Date(gig.completionRequestedAt).toLocaleString()}.
                                    </div>
                                )}
                                <button 
                                    onClick={handleMarkComplete}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors text-sm shadow-sm"
                                >
                                    {completionRequested ? 'Review and Mark Complete' : 'Mark as Complete'}
                                </button>
                                <Link to="/my-gigs" className="block text-xs text-slate-400 hover:text-slate-600">
                                    View Contract
                                </Link>
                            </div>
                        )}

                        {gig.status === 'completed' && (
                            <div className="space-y-3">
                                <div className="text-green-600 flex items-center justify-center gap-1 font-bold">
                                    <CheckCircle className="w-5 h-5" /> Completed
                                </div>
                                
                                {!gig.hasClientReviewed ? (
                                    <button 
                                        onClick={() => setShowRatingModal(true)}
                                        className="w-full border-2 border-green-600 text-green-600 hover:bg-green-50 font-bold py-2 rounded-lg transition-colors text-sm"
                                    >
                                        Rate Freelancer
                                    </button>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">You have rated this freelancer.</p>
                                )}
                                
                                <Link to="/my-gigs" className="block mt-2 text-xs text-slate-500 hover:underline">
                                    Back to Dashboard
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (

                    <>
                        {isHiredFreelancer && gig.status !== 'open' ? (
                            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <h3 className="font-bold text-slate-900">Active Contract</h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        You are the hired freelancer for this gig.
                                    </p>
                                </div>

                                {gig.status === 'assigned' && completionRequested && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                        Completion request sent on {new Date(gig.completionRequestedAt).toLocaleString()}.
                                    </div>
                                )}

                                {gig.status === 'assigned' && (
                                    <button
                                        onClick={handleRequestCompletion}
                                        disabled={completionRequested || requestingCompletion}
                                        className="w-full rounded-lg bg-green-600 py-3 font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        {completionRequested
                                            ? 'Completion Requested'
                                            : requestingCompletion
                                              ? 'Sending Request...'
                                              : 'Request Completion'}
                                    </button>
                                )}

                                {gig.status === 'completed' && (
                                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                                        This contract has been completed.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                        <h3 className="font-bold text-slate-900 mb-3">Place a Bid</h3>
                        
                        {hasUserBidded ? (
                             <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200 text-center">
                                <div className="flex justify-center mb-2">
                                    <Info className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-sm">Proposal Submitted</p>
                                <p className="text-xs mt-1">You have already placed a bid on this gig. View status in My Bids.</p>
                                <Link to="/my-bids" className="block mt-3 text-blue-600 text-xs font-bold hover:underline">
                                    Go to My Bids
                                </Link>
                            </div>
                        ) : (
 
                            <>
                                {successMsg && (
                                    <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 border border-green-200">
                                        <CheckCircle className="w-4 h-4" />
                                        {successMsg}
                                    </div>
                                )}
                                <form onSubmit={handleBidSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">YOUR PRICE (₱)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                            value={bidPrice}
                                            onChange={(e) => setBidPrice(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">PROPOSAL MESSAGE</label>
                                        <textarea 
                                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                                            rows="3"
                                            placeholder="I can do this because..."
                                            value={bidMessage}
                                            onChange={(e) => setBidMessage(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>
                                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">
                                        Submit Bid
                                    </button>
                                </form>
                            </>
                        )}
                            </>
                        )}
                    </>
                )}
            </div>

          </div>
        </div>

      </div>
      {showRatingModal && (
           <RatingModal 
              gigId={id} 
              onClose={() => setShowRatingModal(false)}
              onSuccess={() => {
                  setGig({...gig, hasClientReviewed: true}); 
                  alert("Review submitted!");
              }}
              title="Rate the Freelancer"
           />
       )}
    </div>
    
  );
};

export default GigDetails;