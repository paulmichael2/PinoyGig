import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-full w-full py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div>
    </div>
  );
};

export default Loader;