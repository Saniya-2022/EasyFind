import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Search, AlertCircle, Home, Bell, X, QrCode, FileText, Target } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/dashboard/report-item', icon: AlertCircle, label: 'Report Item' },
  { path: '/dashboard/lost-item', icon: Bell, label: 'Lost Item?' },
  { path: '/dashboard/search-item', icon: Search, label: 'Search Item' },
  { path: '/dashboard/my-matches', icon: Target, label: 'My Matches' },
  { path: '/dashboard/my-claims', icon: FileText, label: 'My Claims' },
  { path: '/dashboard/my-qr-pass', icon: QrCode, label: 'My QR Pass' },
  { path: '/dashboard/user-profile', icon: User, label: 'User Profile' },
];

const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Responsive handling
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu on Escape key
  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      setShowNotifications(false);
    }
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Smooth navigation
  const handleNavigation = (path) => {
    setMenuOpen(false);
    setShowNotifications(false);
    navigate(path);
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification._id);
    
    // Navigate based on notification type
    if (notification.type === 'QR_READY' && notification.data?.qrId) {
      navigate('/dashboard/my-qr-pass');
    }
    
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-white shadow-md">
      <h1 
        className="text-xl sm:text-2xl font-bold text-blue-600 cursor-pointer"
        onClick={() => navigate('/dashboard')}
      ><img 
         src="https://res.cloudinary.com/dxql68kht/image/upload/fl_preserve_transparency/v1744206896/Screenshot_2025-04-09_191750_kml7qq.jpg?_s=public-apps" 
         alt="Logo" 
         className="h-10 w-auto" 
 />
   </h1>

      {user && (
        <div className="relative" ref={menuRef}>
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden z-50">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>
                
                <div className="overflow-y-auto max-h-72">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notif.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 text-2xl">
                            {notif.type === 'QR_READY' && '🎉'}
                            {notif.type === 'ITEM_CLAIMED' && '📦'}
                            {notif.type === 'ITEM_EXPIRED' && '⏰'}
                            {notif.type === 'GENERAL' && '📢'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-gray-800 ${!notif.read ? 'font-semibold' : ''}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => handleNavigation('/dashboard/my-qr-pass')}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                    >
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isMobile ? (
            <button 
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={24} />
            </button>
          ) : (
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
              <button 
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          )}

          {/* Mobile Menu */}
          {menuOpen && isMobile && (
            <div 
              className="fixed inset-0 bg-black/50 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-modal="true"
              role="dialog"
            >
              <div 
                className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl p-4 transition-transform duration-300 translate-x-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-800">Menu</span>
                  <button aria-label="Close menu" className="p-2 rounded-md hover:bg-gray-100" onClick={() => setMenuOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-800 hover:bg-gray-100 rounded-lg"
                    >
                      <item.icon size={20} />
                      {item.label}
                    </button>
                  ))}
                  <button 
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg mt-2"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;