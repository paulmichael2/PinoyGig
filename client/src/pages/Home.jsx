import React, { useState } from 'react';
import { Search, Briefcase, Star, ArrowRight, Video, PenTool, Code } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSearchSubmit = (event) => {
        event.preventDefault();

        const trimmedValue = searchTerm.trim();
        if (!trimmedValue) {
            return;
        }

        navigate(`/gigs?search=${encodeURIComponent(trimmedValue)}`);
    };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-green-100 selection:text-green-900 overflow-x-hidden">
      
      <main className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-4 sm:px-6 lg:px-8 bg-[#023a15]">
        
        <div className="absolute inset-0 bg-[#023a15] overflow-hidden">

            <div className="absolute right-0 top-0 h-full w-2/3 bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay hidden lg:block mask-image-linear-gradient"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#023a15] via-[#023a15]/90 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8 animate-fade-in-up z-10">
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.15]">
              Find the perfect <br />
              <i className="font-serif font-normal italic text-green-400">freelance</i> services <br />
              for your business.
            </h1>

            <form onSubmit={handleSearchSubmit} className="bg-white p-1.5 rounded-sm md:rounded-md max-w-xl w-full flex shadow-2xl transform transition-transform focus-within:scale-105 duration-200">
                <div className="flex-1 flex items-center px-4">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input 
                        type="text" 
                        placeholder='Try "Web3 Development"' 
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full py-3 focus:outline-none text-slate-700 font-medium placeholder:text-slate-400 text-base"
                    />
                </div>
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 font-bold rounded-sm md:rounded-md transition-colors text-base hidden sm:block">
                    Search
                </button>
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white p-3 font-bold rounded-sm md:rounded-md transition-colors text-base sm:hidden">
                    <Search className="w-5 h-5" />
                </button>
            </form>


            <div className="pt-2">
                                <Link
                                    to="/gigs"
                                    className="inline-flex items-center gap-2 rounded-md border-2 border-white bg-transparent px-8 py-3 font-bold text-white transition-all duration-300 hover:bg-white hover:text-green-900 group"
                                >
                                    Explore All Gigs
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
            </div>
          </div>


          <div className="hidden lg:block relative h-[500px]">
              <div className="absolute top-10 right-10 z-10 animate-float hover:z-20">
                  <div className="bg-white p-3 pb-4 rounded-xl shadow-2xl w-64 transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 border border-white/10">
                      <div className="h-32 bg-slate-200 rounded-lg mb-3 bg-[url('https://www.onlinelogomaker.com/blog/wp-content/uploads/2018/08/effective-logos.jpeg')] bg-cover bg-center"></div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                          <div className="w-8 h-8 rounded-full bg-slate-200 bg-[url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRir3K5YrI4ODUH12g5-yJ3_gW3VXqkJNQQ7g&s')] bg-cover border-2 border-white shadow-sm"></div>
                          <div>
                             <div className="text-xs font-bold text-slate-900">Paul</div>
                          </div>
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-snug px-1 mb-2">Create a Logo for my Starting Company</p>
                      <div className="flex items-center justify-between px-1">
                         <div className="flex text-yellow-400">
                             <Star className="w-3 h-3 fill-current" />
                             <span className="text-xs text-slate-400 font-bold ml-1">5.0</span>
                         </div>
                         <div className="text-xs font-bold text-slate-500">STARTING AT <span className="text-slate-900 text-sm">₱500</span></div>
                      </div>
                  </div>
              </div>

              <div className="absolute bottom-20 left-10 z-0 animate-float animation-delay-2000 hover:z-20">
                  <div className="bg-white p-3 pb-4 rounded-xl shadow-2xl w-64 transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-300 border border-white/10">
                      <div className="h-32 bg-slate-200 rounded-lg mb-3 bg-[url('https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3AtMjAwLWV5ZS0wMzQyNzAyLmpwZw.jpg')] bg-cover bg-center"></div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                          <div className="w-8 h-8 rounded-full bg-slate-200 bg-[url('https://thispersonnotexist.org/static/img/Random_female_face_1.jpeg')] bg-cover border-2 border-white shadow-sm"></div>
                          <div>
                             <div className="text-xs font-bold text-slate-900">Heart</div>
                             


                             
                          </div>
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-snug px-1 mb-2">Help Deploy My Website</p>
                      <div className="flex items-center justify-between px-1">
                         <div className="flex text-yellow-400">
                             <Star className="w-3 h-3 fill-current" />
                             <span className="text-xs text-slate-400 font-bold ml-1">4.9</span>
                         </div>
                         <div className="text-xs font-bold text-slate-500">STARTING AT <span className="text-slate-900 text-sm">₱85</span></div>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </main>
        

      <div className="py-20 max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-800 mb-10">Popular Professional Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
               {[
                   { icon: <Briefcase />, label: "Business" },
                   { icon: <PenTool />, label: "Graphics & Design" },
                   { icon: <Code />, label: "Programming" },
                   { icon: <ArrowRight />, label: "Digital Marketing" },
                   { icon: <Briefcase />, label: "Writing & Translation" },
                   { icon: <Video />, label: "Video & Animation" },
               ].map((item, idx) => (
                   <div key={idx} className="group p-6 rounded-xl border border-slate-200 hover:shadow-lg hover:border-green-500 transition-all  flex flex-col items-center gap-4 text-center bg-white hover:-translate-y-1 duration-300">
                       <div className="text-slate-400 group-hover:text-green-500 transition-colors">
                           {React.cloneElement(item.icon, { size: 32 })}
                       </div>
                       <span className="font-semibold text-slate-700 group-hover:text-slate-900 text-sm md:text-base">{item.label}</span>
                   </div>
               ))}
          </div>
      </div>
    </div>
  );
};

export default Home;