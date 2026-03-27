import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGigs } from '../context/GigsContext';
import { useBids } from '../context/BidsContext';
import { Star, Mail, FileText, Edit2, Save, X, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { gigsAPI, reviewsAPI, usersAPI } from '../services/api';
import { formatPesoAmount } from '../utils/currency';

const Profile = () => {
  const { id: profileId } = useParams();
  const { currentUser, updateProfile } = useAuth();
  const { fetchMyGigs, myGigs, loading: gigsLoading } = useGigs();
  const { fetchMyBids, myBids, loading: bidsLoading } = useBids();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicGigs, setPublicGigs] = useState([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState(null);
  const [profileReviews, setProfileReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const currentUserId = currentUser?._id || currentUser?.user?._id;
  const isPublicView = Boolean(profileId) && profileId !== currentUserId;

  // Log currentUser to debug
  useEffect(() => {
    console.log('Current User:', currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!isPublicView && currentUser) {
      fetchMyGigs();
      fetchMyBids();
      setEditData({ name: currentUser?.name || currentUser?.user?.name || '' });
    }
  }, [currentUser, fetchMyGigs, fetchMyBids, isPublicView]);

  useEffect(() => {
    if (!isPublicView) {
      setPublicProfile(null);
      setPublicGigs([]);
      setPublicError(null);
      return;
    }

    const loadPublicProfile = async () => {
      try {
        setPublicLoading(true);
        setPublicError(null);

        const [profileResponse, gigsResponse] = await Promise.all([
          usersAPI.getPublicProfile(profileId),
          gigsAPI.getByOwner(profileId),
        ]);

        setPublicProfile(profileResponse.data.user);
        setPublicGigs(gigsResponse.data.gigs || []);
      } catch (error) {
        console.error('Error loading public profile:', error);
        setPublicError(error.response?.data?.message || 'Failed to load profile');
      } finally {
        setPublicLoading(false);
      }
    };

    loadPublicProfile();
  }, [profileId, isPublicView]);

  useEffect(() => {
    const targetUserId = isPublicView ? profileId : currentUserId;

    if (!targetUserId) {
      setProfileReviews([]);
      return;
    }

    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await reviewsAPI.getByUserId(targetUserId);
        setProfileReviews(response.data.reviews || []);
      } catch (error) {
        console.error('Error loading profile reviews:', error);
        setProfileReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [currentUserId, isPublicView, profileId]);

  if (isPublicView && publicLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          <p className="text-slate-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (isPublicView && (publicError || !publicProfile)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-slate-600">{publicError || 'This user profile is not available.'}</p>
        </div>
      </div>
    );
  }

  if (!isPublicView && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">No Profile Found</h1>
          <p className="text-slate-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  // Safely get user data
  const profileSource = isPublicView ? publicProfile : (currentUser?.user || currentUser);
  const userName = profileSource?.name || 'User';
  const userEmail = isPublicView ? '' : (profileSource?.email || 'No email');
  const userCreatedAt = profileSource?.createdAt || new Date().toISOString();
  const userRating = profileSource?.averageRating || 0;
  const userReviews = profileSource?.totalReviews || 0;
  const isVerified = Boolean(profileSource?.isVerified);
  const displayedGigs = isPublicView ? publicGigs : myGigs;

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setSaveError(null);
    try {
      await updateProfile({ name: editData.name });
      setIsEditing(false);
      alert('Profile Updated Successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-8 pb-12 sm:pb-16">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#013d18] via-[#014d1f] to-[#025c26] text-white pt-20 pb-6 sm:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-900 text-3xl sm:text-4xl border-4 border-white shadow-lg flex-shrink-0">
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              {/* User Info */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <h1 className="text-3xl sm:text-4xl font-bold break-words">{userName}</h1>
                  {isVerified && (
                    <span className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2.5 py-1 rounded-full font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-300 text-sm sm:justify-start">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{userRating?.toFixed(1) || '0.0'}</span>
                  <span className="text-slate-400">({userReviews || 0} reviews)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isPublicView && (
              <div className="flex w-full lg:w-auto gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full lg:w-auto justify-center bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
                >
                  <Edit2 className="w-4 h-4" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {!isPublicView && isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {saveError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Your name"

/>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={() => setIsEditing(false)}
                disabled={savingProfile}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !editData.name.trim()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 min-w-[140px] px-4 sm:px-6 py-4 font-bold whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('gigs')}
              className={`flex-1 min-w-[140px] px-4 sm:px-6 py-4 font-bold whitespace-nowrap transition-colors ${
                activeTab === 'gigs'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isPublicView ? 'Posted Gigs' : 'My Gigs'} {displayedGigs.length > 0 && <span className="ml-2 bg-slate-200 text-slate-900 text-xs font-bold px-2 py-1 rounded-full">{displayedGigs.length}</span>}
            </button>
            {!isPublicView && (
              <button
                onClick={() => setActiveTab('bids')}
                className={`flex-1 min-w-[140px] px-4 sm:px-6 py-4 font-bold whitespace-nowrap transition-colors ${
                  activeTab === 'bids'
                    ? 'text-slate-900 border-b-2 border-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Bids {myBids.length > 0 && <span className="ml-2 bg-slate-200 text-slate-900 text-xs font-bold px-2 py-1 rounded-full">{myBids.length}</span>}
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Account Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">{isPublicView ? 'Profile Type' : 'Email'}</p>
                      <p className="text-slate-900 font-semibold">{isPublicView ? 'Public profile' : userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Member Since</p>
                      <p className="text-slate-900 font-semibold">
                        {new Date(userCreatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Ratings & Reviews</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {userReviews || 0} total
                  </span>
                </div>

                {reviewsLoading ? (
                  <div className="text-sm text-slate-500">Loading reviews...</div>
                ) : profileReviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No reviews yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileReviews.map((review) => (
                      <div key={review._id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{review.reviewer?.name || 'Anonymous'}</p>
                              <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span>{Number(review.rating || 0).toFixed(1)}</span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(review.createdAt).toLocaleDateString()} {review.gig?.title ? `• ${review.gig.title}` : ''}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reputation Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm border border-yellow-200 p-5 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Your Reputation</h3>
              <div className="text-center mb-6">
                <div className="text-4xl sm:text-5xl font-bold text-yellow-600 mb-2">
                  {userRating?.toFixed(1) || '0.0'}
                </div>
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(userRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-slate-300 text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600">Based on {userReviews || 0} reviews</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gigs' && (
          <div>
            {!isPublicView && gigsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                <p className="text-slate-600 mt-4">Loading your gigs...</p>
              </div>
            ) : displayedGigs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-12 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{isPublicView ? 'No Public Gigs Yet' : 'No Gigs Posted'}</h3>
                <p className="text-slate-600 mb-6">{isPublicView ? 'This user has not posted any gigs yet.' : 'Start earning by posting your first gig!'}</p>
                {!isPublicView && (
                  <a
                    href="/post-gig"
                    className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Post a Gig
                  </a>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedGigs.map((gig) => (
                  <div key={gig._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-900 flex-1">{gig.title}</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        gig.status === 'open' ? 'bg-green-100 text-green-700' :
                        gig.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {gig.status?.charAt(0).toUpperCase() + gig.status?.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{gig.description}</p>
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-center text-sm font-bold text-slate-500">₱</span>
                        <span className="font-bold text-slate-900">{Number(gig.budget || 0).toLocaleString('en-PH')}</span>
                      </div>
                      <a
                        href={`/gigs/${gig._id}`}
                        className="text-slate-900 hover:text-slate-600 font-semibold text-sm"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bids' && (
          <div>
            {bidsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                <p className="text-slate-600 mt-4">Loading your bids...</p>
              </div>
            ) : myBids.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-12 text-center">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Bids Submitted</h3>
                <p className="text-slate-600 mb-6">Browse available gigs and submit bids to get started!</p>
                <a
                  href="/browse-gigs"
                  className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Browse Gigs
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {myBids.map((bid) => (
                  <div
                    key={bid._id}
                    className={`p-5 sm:p-6 rounded-xl border transition-all ${
                      bid.status === 'hired'
                        ? 'bg-green-50 border-green-200'
                        : bid.status === 'rejected'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-slate-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">Bid Proposal</h3>
                        <p className="text-sm text-slate-600 mt-1">{bid.message?.substring(0, 80)}...</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                        bid.status === 'hired' ? 'bg-green-100 text-green-700 flex items-center gap-1' :
                        bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {bid.status === 'hired' && <CheckCircle className="w-3 h-3" />}
                        {bid.status?.charAt(0).toUpperCase() + bid.status?.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {bid.price}
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(bid.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
