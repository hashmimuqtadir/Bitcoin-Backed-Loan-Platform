import React from 'react';
import { Link } from 'react-router-dom';
import { Principal } from '@dfinity/principal';
import { Bitcoin, User, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  principal: Principal | null;
  onLogin: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, principal, onLogin, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 text-blue-600 font-bold text-xl">
            <Bitcoin size={28} />
            <span>BBL DeFi</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link 
              to="/loan/new" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              New Loan
            </Link>
            <a 
              href="http://127.0.0.1:8000/_/candid" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              API
            </a>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-3 bg-gray-100 px-4 py-2 rounded-lg">
                  <User size={18} className="text-blue-600" />
                  <div className="text-sm">
                    <p className="text-gray-500">Connected</p>
                    <p className="font-mono text-xs text-gray-700">
                      {principal?.toString().slice(0, 12)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
              >
                Connect Wallet
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t">
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/loan/new" 
                className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                New Loan
              </Link>
              <a 
                href="http://127.0.0.1:8000/_/candid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                API
              </a>
            </nav>
            {isAuthenticated && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User size={16} />
                  <span className="font-mono">{principal?.toString().slice(0, 16)}...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;