import React from 'react';
import { Briefcase, Star, Video, Github } from 'lucide-react'; // Added Github icon

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-100 pt-8">
          
          {/* Left Side: Logo & Copyright */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-700">
              PinoyGig<span className="text-green-500">.</span>
            </span>
            <span className="text-slate-400 text-sm ml-4">© PinoyGig Ltd. 2026</span>
          </div>

          {/* Right Side: Creator Link */}
          <div className="flex gap-6">
            <a
              href="https://github.com/paulmichael2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors text-sm font-medium group"
            >
              Paul
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/AdityaAryan-1408/GigFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors text-sm font-medium group"
            >
              Aditya
              <Github className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;