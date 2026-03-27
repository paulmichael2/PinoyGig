import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, FileText, Layout, AlertCircle, IndianRupee } from 'lucide-react';
import api from '../services/api';

const PostGig = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: 'Graphics & Design'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/gigs', formData);
      console.log('Gig Created:', response.data);
      
      navigate('/gigs');
    } catch (err) {
      console.error('Error posting gig:', err);
      const msg = err.response?.data?.message || 'Failed to post gig. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Post a New Gig</h1>
            <p className="text-slate-400 mt-1">Fill in the details to find the perfect freelancer.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 border-b border-red-100 flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Gig Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Layout className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g Design a React Dashboard"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={formData.title}
                  onChange={handleChange}
                  minLength={5}
                  maxLength={100}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Keep it short and descriptive. Min 5 characters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-slate-400" />
                    </div>
                    <select
                      name="category"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors bg-white appearance-none"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="Graphics & Design">Graphics & Design</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Writing & Translation">Writing & Translation</option>
                      <option value="Video & Animation">Video & Animation</option>
                      <option value="Programming & Tech">Programming & Tech</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Budget (₱)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-lg">₱</span>                    </div>
                    <input
                      type="number"
                      name="budget"
                      required
                      min="1"
                      placeholder="50"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors"
                      value={formData.budget}
                      onChange={handleChange}
                    />
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <textarea
                  name="description"
                  required
                  rows="6"
                  placeholder="Describe your service in detail..."
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={formData.description}
                  onChange={handleChange}
                  minLength={20}
                  maxLength={2000}
                ></textarea>
              </div>
              <p className="mt-1 text-xs text-slate-500">Min 20 characters. Be detailed to attract the best talent.</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Publishing...' : 'Publish Gig'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PostGig;