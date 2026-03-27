import React, { createContext, useContext, useState, useCallback } from 'react';
import { bidsAPI } from '../services/api';
// import { useGigs } from './GigsContext'; // Commented out until GigsContext is created

const BidsContext = createContext(null);

export const useBids = () => {
    const context = useContext(BidsContext);
    if (!context) {
        throw new Error('useBids must be used within a BidsProvider');
    }
    return context;
};

export const BidsProvider = ({ children }) => {
    const [gigBids, setGigBids] = useState([]); // Bids for current gig
    const [myBids, setMyBids] = useState([]); // Current user's bids
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // const { updateGigStatus } = useGigs(); // Commented out

    const fetchBidsByGigId = useCallback(async (gigId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await bidsAPI.getByGigId(gigId);
            setGigBids(response.data.bids);
            return response.data.bids;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMyBids = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await bidsAPI.getMyBids();
            setMyBids(response.data.bids);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createBid = useCallback(async (bidData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await bidsAPI.create(bidData);
            // Append new bid to list
            setGigBids((prev) => [...prev, response.data.bid]);
            setMyBids((prev) => [...prev, response.data.bid]);
            return response.data.bid;
        } catch (err) {
            // Extract error message from backend response if available
            const msg = err.response?.data?.message || err.message;
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const hireBid = useCallback(async (bidId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await bidsAPI.hire(bidId);
            const { hiredBid, gigId } = response.data;

            // Update local state - mark hired bid and reject others
            setGigBids((prev) =>
                prev.map((bid) => {
                    if (bid._id === bidId) {
                        return { ...bid, status: 'hired' };
                    }
                    return { ...bid, status: 'rejected' };
                })
            );

            // Update gig status (Would normally call GigsContext here)
            // updateGigStatus(gigId, 'assigned'); 

            return hiredBid;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update bid status locally
    const updateBidStatus = useCallback((bidId, status) => {
        setGigBids((prev) =>
            prev.map((bid) => (bid._id === bidId ? { ...bid, status } : bid))
        );
        setMyBids((prev) =>
            prev.map((bid) => (bid._id === bidId ? { ...bid, status } : bid))
        );
    }, []);

    const value = {
        gigBids,
        myBids,
        loading,
        error,
        fetchBidsByGigId,
        fetchMyBids,
        createBid,
        hireBid,
        updateBidStatus,
        setGigBids,
    };

    return (
        <BidsContext.Provider value={value}>
            {children}
        </BidsContext.Provider>
    );
};

export default BidsContext;