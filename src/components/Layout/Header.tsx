import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, User, Plus, Home, Settings, Smartphone, MessageSquare } from 'lucide-react';
import { t } from '../../i18n';
import LoginModal from '../Auth/LoginModal';
import { useCustomization } from '../../hooks/useCustomization';

const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { headerLogo } = useCustomization();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleAddItem = () => {
    if (!user || user.isAnonymous) {
      setShowLoginModal(true);
      return;
    }
    navigate('/cadastrar');
  };

  const handleProfile = () => {
    if (!user || user.isAnonymous) {
      setShowLoginModal(true);
      return;
    }
    navigate('/perfil');
  };

  return (
    <>
      <header className="bg-green-600 text-white shadow-lg sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              {headerLogo ? (
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={headerLogo}
                    alt="US LOCAL"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-green-800 font-bold text-lg">UL</span>
                </div>
              )}
              <span className="text-xl font-bold">US LOCAL</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-1 hover:text-yellow-400 transition-colors">
                <Home size={20} />
                <span>{t('nav.home')}</span>
              </Link>
              
              <button
                onClick={handleAddItem}
                className="flex items-center space-x-1 hover:text-yellow-400 transition-colors"
              >
                <Plus size={20} />
                <span>{t('nav.addItem')}</span>
              </button>
              
              <button
                onClick={handleProfile}
                className="flex items-center space-x-1 hover:text-yellow-400 transition-colors"
              >
                <User size={20} />
                <span>{user?.isAnonymous ? t('common.guest') : t('nav.profile')}</span>
              </button>
              
              {isAdmin && (
                <Link to="/admin" className="flex items-center space-x-1 hover:text-yellow-400 transition-colors">
                  <Settings size={20} />
                  <span>{t('nav.admin')}</span>
                </Link>
              )}
              
              {user && !user.isAnonymous && (
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
                >
                  {t('common.logout')}
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-green-500">
              <nav className="flex flex-col space-y-3">
                <Link
                  to="/"
                  className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home size={20} />
                  <span>{t('nav.home')}</span>
                </Link>
                
                <button
                  onClick={() => {
                    handleAddItem();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 hover:text-yellow-400 transition-colors text-left"
                >
                  <Plus size={20} />
                  <span>{t('nav.addItem')}</span>
                </button>
                
                <button
                  onClick={() => {
                    handleProfile();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 hover:text-yellow-400 transition-colors text-left"
                >
                  <User size={20} />
                  <span>{user?.isAnonymous ? t('common.guest') : t('nav.profile')}</span>
                </button>

                <Link
                  to="/instalar"
                  className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Smartphone size={20} />
                  <span>Instalar App</span>
                </Link>

                <Link
                  to="/feedback"
                  className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare size={20} />
                  <span>Enviar Feedback</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings size={20} />
                    <span>{t('nav.admin')}</span>
                  </Link>
                )}
                
                {user && !user.isAnonymous && (
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors text-left"
                  >
                    {t('common.logout')}
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default Header;