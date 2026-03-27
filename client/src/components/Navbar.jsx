import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, Star, CheckCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatsAPI } from '../services/api';
import { getSocket } from '../services/socket';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const isHome = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  // Helper to safely get user name & rating
  const userName = currentUser?.name || currentUser?.user?.name || "User";
  const userEmail = currentUser?.email || currentUser?.user?.email || "";
  const initial = userName.charAt(0).toUpperCase();
  const userRating = currentUser?.averageRating || currentUser?.user?.averageRating || 0;
  const isVerified = Boolean(currentUser?.isVerified || currentUser?.user?.isVerified);
  const isAdmin = (currentUser?.role || currentUser?.user?.role) === 'admin';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!currentUser) {
      setUnreadMessages(0);
      return undefined;
    }

    let isMounted = true;
    const socket = getSocket();

    const loadSummary = async () => {
      try {
        const response = await chatsAPI.getSummary();
        if (isMounted) {
          setUnreadMessages(response.data.unreadMessages || 0);
        }
      } catch (error) {
        if (isMounted) {
          setUnreadMessages(0);
        }
      }
    };

    loadSummary();

    if (!socket.connected) {
      socket.connect();
    }

    const userId = currentUser._id || currentUser.user?._id;
    socket.emit('join_room', userId);
    socket.on('chat_inbox_update', loadSummary);

    return () => {
      isMounted = false;
      socket.off('chat_inbox_update', loadSummary);
    };
  }, [currentUser, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const isScrolledOrNotHome = scrolled || !isHome;

  const navClass = isScrolledOrNotHome 
    ? 'border-b border-slate-200 bg-white/95 py-2 shadow-sm backdrop-blur-md' 
    : 'bg-transparent py-2 shadow-none backdrop-blur-0';

  const textClass = isScrolledOrNotHome 
    ? 'text-slate-900' 
    : 'text-white';

  const hoverClass = isScrolledOrNotHome 
    ? 'text-slate-600 hover:text-green-500' 
    : 'text-white hover:text-green-400';

  const buttonClass = isScrolledOrNotHome 
    ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white' 
    : 'border-white text-white hover:bg-white hover:text-green-900';

  const mobileMenuButtonClass = isScrolledOrNotHome
    ? 'text-slate-900 hover:bg-slate-100'
    : 'text-white hover:bg-white/10';

  const brandWordmarkClass = isScrolledOrNotHome
    ? ''
    : 'text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.45)]';

  const desktopAuthLinkClass = (isActive) => {
    if (isActive) {
      return isScrolledOrNotHome
        ? 'text-green-600'
        : 'text-green-300';
    }

    return hoverClass;
  };

  const desktopAuthButtonClass = (isActive) => {
    if (isActive) {
      return isScrolledOrNotHome
        ? 'text-slate-900'
        : 'text-white';
    }

    return hoverClass;
  };

  return (
    <nav className={`fixed w-full z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out ${navClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <span className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out sm:h-11 sm:w-11 ${isScrolledOrNotHome ? 'border-slate-200 bg-white shadow-sm' : 'border-white/15 bg-white/10 backdrop-blur-sm'}`}>
              <img
                src="/pinoygig-mark.svg"
                alt="PinoyGig logo"
                className="h-8 w-8 object-contain sm:h-9 sm:w-9"
              />
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors duration-300 ease-out ${brandWordmarkClass}`}>
              {isScrolledOrNotHome ? (
                <span className="text-slate-900">PinoyGig</span>
              ) : (
                <span>PinoyGig</span>
              )}
              <span className="text-green-500">.</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/gigs" className={`text-base font-semibold transition-colors duration-300 ease-out ${hoverClass}`}>
              Find Gigs
            </Link>

            {currentUser && (
              <Link to="/messages" className={`inline-flex items-center gap-2 text-base font-semibold transition-colors duration-300 ease-out ${hoverClass}`}>
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
                {unreadMessages > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
            )}


            {currentUser ? (
              // Logged In State
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-2 font-semibold focus:outline-none transition-colors duration-300 ease-out ${hoverClass}`}
                >
                  {/* Rating Badge */}
                  {userRating > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full text-xs font-bold text-yellow-700 mr-2 border border-yellow-200">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          {userRating}
                      </div>
                  )}

                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold uppercase">
                    {initial}
                  </div>
                  <span>{userName}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-200">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsProfileOpen(false)}>Profile</Link>
                    <Link to="/messages" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsProfileOpen(false)}>Messages</Link>
                    <Link to="/wallet" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsProfileOpen(false)}>Wallet</Link>
                    {isAdmin && <Link to="/admin" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsProfileOpen(false)}>Admin Dashboard</Link>}
                    <Link to="/post-gig" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsProfileOpen(false)}>Post a Gig</Link>
                    <Link to="/my-gigs" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsProfileOpen(false)}>My Gigs</Link>
                    <Link to="/my-bids" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsProfileOpen(false)}>My Bids</Link>
                    <Link to="/" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setIsProfileOpen(false)}>Settings</Link>

                    <div className="border-t border-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Logged Out State
              <>
                <Link
                  to="/login"
                  aria-current={isLoginPage ? 'page' : undefined}
                  className={`text-base font-semibold transition-colors duration-300 ease-out ${desktopAuthLinkClass(isLoginPage)}`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  aria-current={isRegisterPage ? 'page' : undefined}
                  className={`text-base font-bold transition-colors duration-300 ease-out ${desktopAuthButtonClass(isRegisterPage)}`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className={`p-3 rounded-xl transition-colors ${mobileMenuButtonClass}`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full">
          <div
            className="fixed inset-0 top-16 bg-white/8 sm:top-[72px] sm:bg-white/6"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative border-b border-slate-200 bg-white shadow-2xl">
            <div className="mx-auto max-w-7xl px-4 pb-4 pt-0 sm:px-6 sm:pb-6 sm:pt-0 lg:px-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
               

                {currentUser ? (
                  <div className="mt-4 space-y-4">
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-green-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500 text-base font-bold uppercase text-white">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-slate-900">{userName}</span>
                            {isVerified && (
                              <span className="flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                            {userRating > 0 && (
                              <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                                <Star className="w-3 h-3 fill-current" />
                                {userRating}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-500">{userEmail}</p>
                        </div>
                      </div>
                    </Link>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link to="/messages" className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-green-600" onClick={() => setIsMenuOpen(false)}>
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>Messages</span>
                        </span>
                        {unreadMessages > 0 && (
                          <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-green-600 px-2 text-xs font-bold leading-none text-white">
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </span>
                        )}
                      </Link>
                      <Link to="/post-gig" className="rounded-xl bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Post a Gig</Link>
                      <Link to="/wallet" className="rounded-xl bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Wallet</Link>
                      {isAdmin && <Link to="/admin" className="rounded-xl bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>}
                      <Link to="/my-gigs" className="rounded-xl bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-green-600" onClick={() => setIsMenuOpen(false)}>My Gigs</Link>
                      <Link to="/my-bids" className="rounded-xl bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-green-600" onClick={() => setIsMenuOpen(false)}>My Bids</Link>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Account
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <Link
                          to="/login"
                          aria-current={isLoginPage ? 'page' : undefined}
                          className={`block rounded-xl border px-4 py-3 text-center text-base font-semibold transition ${isLoginPage ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:text-green-600'}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign In
                        </Link>

                        <Link
                          to="/register"
                          aria-current={isRegisterPage ? 'page' : undefined}
                          className={`block rounded-xl px-4 py-3 text-center text-base font-bold transition ${isRegisterPage ? 'bg-green-600 text-white shadow-sm' : 'bg-green-500 text-white shadow-sm hover:bg-green-600'}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;