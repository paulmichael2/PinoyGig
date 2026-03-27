import { createContext, useContext, useState, useCallback } from 'react';
import { gigsAPI } from '../services/api';

const GigsContext = createContext(null);

export const useGigs = () => {
    const context = useContext(GigsContext);
    if (!context) {
        throw new Error('useGigs must be used within a GigsProvider');
    }
    return context;
};

export const GigsProvider = ({ children }) => {
    const [gigs, setGigs] = useState([]);
    const [myGigs, setMyGigs] = useState([]);
    const [currentGig, setCurrentGig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGigs = useCallback(async (search = '') => {
        setLoading(true);
        setError(null);
        try {
            const response = await gigsAPI.getAll(search);
            setGigs(response.data.gigs);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchGigById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await gigsAPI.getById(id);
            setCurrentGig(response.data.gig);
            return response.data.gig;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMyGigs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await gigsAPI.getMyGigs();
            setMyGigs(response.data.gigs);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createGig = useCallback(async (gigData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await gigsAPI.create(gigData);
            setGigs((prev) => [response.data.gig, ...prev]);
            setMyGigs((prev) => [response.data.gig, ...prev]);
            return response.data.gig;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateGig = useCallback(async (id, gigData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await gigsAPI.update(id, gigData);
            const updatedGig = response.data.gig;
            setGigs((prev) => prev.map((g) => (g._id === id ? updatedGig : g)));
            setMyGigs((prev) => prev.map((g) => (g._id === id ? updatedGig : g)));
            if (currentGig?._id === id) {
                setCurrentGig(updatedGig);
            }
            return updatedGig;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentGig]);

    const deleteGig = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            await gigsAPI.delete(id);
            setGigs((prev) => prev.filter((g) => g._id !== id));
            setMyGigs((prev) => prev.filter((g) => g._id !== id));
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update gig status locally (used after hiring)
    const updateGigStatus = useCallback((gigId, status) => {
        const updateFn = (g) => (g._id === gigId ? { ...g, status } : g);
        setGigs((prev) => prev.map(updateFn));
        setMyGigs((prev) => prev.map(updateFn));
        if (currentGig?._id === gigId) {
            setCurrentGig((prev) => ({ ...prev, status }));
        }
    }, [currentGig]);

    const value = {
        gigs,
        myGigs,
        currentGig,
        loading,
        error,
        fetchGigs,
        fetchGigById,
        fetchMyGigs,
        createGig,
        updateGig,
        deleteGig,
        updateGigStatus,
        setCurrentGig,
    };

    return (
        <GigsContext.Provider value={value}>
            {children}
        </GigsContext.Provider>
    );
};

export default GigsContext;
