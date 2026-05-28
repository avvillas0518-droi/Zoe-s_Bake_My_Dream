import React from "react";
import { Cookie, ShoppingBag, Menu, X, User } from "lucide-react";
import ZoeLogo from "./ZoeLogo";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { loggedIn: boolean; isAdmin: boolean; name: string; email: string; role?: string };
  onLogout: () => void;
  cartCount: number;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  orders?: any[];
  inquiries?: any[];
  customLogo?: string;
}

export default function Header({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  cartCount,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  orders = [],
  inquiries = [],
  customLogo
}: HeaderProps) {
  const pendingOrdersCount = user.isAdmin 
    ? orders.filter(o => o.status !== 'Delivered').length 
    : orders.filter(o => o.email.toLowerCase() === user.email.toLowerCase() && o.status !== 'Delivered').length;

  const activeInquiriesCount = inquiries.filter(inq => !inq.read).length;

  return (
    <header className="sticky top-0 z-40 bg-alabaster/95 backdrop-blur-md border-b border-putty">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Branding Logo element */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }}
          >
            <ZoeLogo className="w-14 h-14 transition duration-300 group-hover:scale-105" customLogo={customLogo} />
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-charcoal block leading-none">Zoe's</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-clay mt-1">Bake My Dream</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            {[
              { id: 'home', label: 'Home' },
              { id: 'menu', label: 'Pastry Menu' },
              { id: 'about', label: 'Our Story' },
              { id: 'contact', label: 'Contact Us' },
              ...(user.loggedIn ? [{ id: 'tracking', label: 'Track Orders', count: pendingOrdersCount }] : []),
              ...(user.loggedIn && user.isAdmin ? [
                { id: 'inquiries', label: 'Inquiries', count: activeInquiriesCount },
                { id: 'analytics_tab', label: 'Visual Analytics' }
              ] : []),
              ...(user.loggedIn && !user.isAdmin ? [{ id: 'profile', label: 'My Profile' }] : [])
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`relative text-sm font-medium transition-colors py-2 flex items-center gap-1.5 ${
                  activeTab === link.id ? 'text-burgundy' : 'text-clay hover:text-burgundy'
                }`}
              >
                <span>{link.label}</span>
                {('count' in link) && link.count !== undefined && link.count > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full animate-pulse shadow-sm">
                    {link.count}
                  </span>
                )}
                {activeTab === link.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-burgundy rounded-full animate-fade-in"></span>
                )}
              </button>
            ))}
            
            {user.loggedIn && user.isAdmin && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`text-sm font-bold uppercase tracking-wider text-rose-605 hover:text-rose-500 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'dashboard' ? 'underline decoration-2' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-505 animate-ping inline-block"></span>
                Owner Dashboard
              </button>
            )}
          </nav>

          {/* Header Right Actions panel */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Basket trigger button */}
            <button 
              onClick={() => { 
                setActiveTab('menu'); 
                setIsMobileMenuOpen(false); 
                setTimeout(() => {
                  const basketEl = document.getElementById('my-basket-section');
                  if (basketEl) {
                     basketEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 120);
              }}
              className="relative p-2.5 text-zinc-650 hover:text-burgundy bg-white border border-putty rounded-full shadow-sm hover:shadow transition-all flex items-center"
              title="View Pre-order list"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-burgundy text-white font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Login State elements */}
            {user.loggedIn ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:block text-right">
                  {user.isAdmin ? (
                    <p className="text-xs font-semibold text-burgundy">{user.name}</p>
                  ) : (
                    <button 
                      onClick={() => setActiveTab('profile')} 
                      className="block text-xs font-semibold text-burgundy hover:text-burgundy/85 font-sans transition text-right cursor-pointer"
                    >
                      {user.name}
                    </button>
                  )}
                  <button onClick={onLogout} className="text-[10px] text-clay hover:text-red-500 underline cursor-pointer">Logout</button>
                </div>
                {user.isAdmin ? (
                  <div className="bg-cream text-burgundy w-10 h-10 rounded-full flex items-center justify-center font-bold border border-putty shadow-sm select-none">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                ) : (
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`bg-cream text-burgundy w-10 h-10 rounded-full flex items-center justify-center font-bold border shadow-sm transition-all hover:border-burgundy hover:text-burgundy cursor-pointer ${
                      activeTab === 'profile' ? 'border-burgundy' : 'border-putty'
                    }`}
                    title="View Profile & Order History"
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setActiveTab('auth'); setIsMobileMenuOpen(false); }}
                className="px-4.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold border border-putty bg-white text-charcoal hover:bg-burgundy hover:text-white rounded-full transition-all duration-200 cursor-pointer shadow-sm"
              >
                Join
              </button>
            )}

            {/* Mobile Navigation Toggle Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 text-zinc-650 hover:text-burgundy bg-white border border-putty rounded-full focus:outline-none transition-all shadow-sm"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-alabaster border-t border-putty py-4 px-6 space-y-2 shadow-xl">
          {[
            { id: 'home', label: 'Home' },
            { id: 'menu', label: 'Pastry Menu' },
            { id: 'about', label: 'Our Story' },
            { id: 'contact', label: 'Contact Us' },
            ...(user.loggedIn ? [{ id: 'tracking', label: 'Track Orders', count: pendingOrdersCount }] : []),
            ...(user.loggedIn && user.isAdmin ? [
              { id: 'inquiries', label: 'Inquiries', count: activeInquiriesCount },
              { id: 'analytics_tab', label: 'Visual Analytics' }
            ] : []),
            ...(user.loggedIn && !user.isAdmin ? [{ id: 'profile', label: 'My Profile' }] : [])
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                activeTab === link.id 
                  ? 'text-burgundy bg-cream px-3.5 rounded-xl font-bold font-sans' 
                  : 'text-clay hover:text-burgundy px-3.5 font-sans'
              }`}
            >
              <span>{link.label}</span>
              {('count' in link) && link.count !== undefined && link.count > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full animate-pulse shadow-sm">
                  {link.count}
                </span>
              )}
            </button>
          ))}
          
          {user.loggedIn && user.isAdmin && (
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2.5 text-sm font-extrabold uppercase tracking-wider text-rose-505 hover:text-rose-455 transition-colors px-3.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-505 animate-ping inline-block mr-2"></span>
              Owner Dashboard
            </button>
          )}

          {user.loggedIn && (
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2.5 text-sm font-extrabold uppercase text-red-600 hover:text-red-700 transition-colors px-3.5 border-t border-cream/50 mt-3 pt-3"
            >
              Logout ({user.name})
            </button>
          )}
        </div>
      )}
    </header>
  );
}
