import { useState } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ onSearch, placeholder = 'Search gigs by title...', initialValue = '' }) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form className="flex gap-3 w-full max-w-lg" onSubmit={handleSubmit}>
      <div className="flex-1 relative flex items-center">
        <Search size={20} className="absolute left-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          className="w-full py-3 px-4 pl-12 pr-10 text-sm text-slate-900 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="absolute right-4 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            onClick={handleClear}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
