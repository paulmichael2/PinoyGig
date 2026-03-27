import React, { useEffect, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import GigCard from '../components/GigCard';
import Loader from '../components/Loader';
import { gigsAPI } from '../services/api';

const BrowseGigs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || '';
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        setError(null);
        const query = searchParams.get('search') || '';
        const response = await gigsAPI.getAll(query);

        if (Array.isArray(response.data)) {
          setGigs(response.data);
        } else if (response.data.gigs && Array.isArray(response.data.gigs)) {
          setGigs(response.data.gigs);
        } else {
          console.error("Unexpected data format:", response.data);
          setGigs([]);
        }
      } catch (err) {
        console.error("Error fetching gigs:", err);
        setError('Failed to load gigs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGigs();
  }, [searchParams]);

  const safeGigs = Array.isArray(gigs) ? gigs : [];

  const handleSearchChange = (value) => {
    setSearchTerm(value);

    const trimmedValue = value.trim();
    if (trimmedValue) {
      setSearchParams({ search: trimmedValue });
      return;
    }

    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">All Gigs</h1>

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm shadow-sm"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <div className="text-center py-20 text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-10 h-10" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            {searchParams.get('search') && (
              <p className="mb-6 text-sm text-slate-500">
                Showing results for <span className="font-semibold text-slate-900">&quot;{searchParams.get('search')}&quot;</span>
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {safeGigs.map((gig) => (
                <GigCard key={gig._id} gig={gig} />
              ))}
            </div>

            {safeGigs.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No gigs found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseGigs;