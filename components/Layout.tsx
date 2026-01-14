
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  Banknote, 
  Clock, 
  Settings, 
  LogOut,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive 
          ? 'bg-green-100 text-green-700' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  // Close sidebar automatically on route change for mobile
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay / Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-700 flex items-center space-x-2">
                <span className="w-8 h-8 bg-green-600 rounded-md"></span>
                <span>Dynamo IMS</span>
              </h1>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Management System</p>
            </div>
            {/* Close Button for Mobile Sidebar */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem to="/clients" icon={Users} label="Clients" />
            <SidebarItem to="/estates" icon={Map} label="Estates & Plots" />
            <SidebarItem to="/commissions" icon={Banknote} label="Commissions" />
            <SidebarItem to="/installments" icon={Clock} label="Installments" />
            <SidebarItem to="/whatsapp" icon={MessageCircle} label="WhatsApp CRM" />
          </nav>

          <div className="p-4 border-t border-gray-200">
            <SidebarItem to="/settings" icon={Settings} label="Admin Settings" />
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2">
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center">
            {/* Hamburger Button for Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 mr-3 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-gray-500 font-medium truncate">Welcome back, Admin</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-xs font-bold text-gray-400 uppercase">Role</p>
              <p className="text-sm font-semibold text-green-700">Super Admin</p>
            </div>
            <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold border-2 border-green-200">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
