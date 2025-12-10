import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Maximize2, Plus, Heart, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Hide bottom navigation on fullscreen map
  if (location.pathname === '/mapa') {
    return null;
  }

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Início',
      active: location.pathname === '/'
    },
    {
      path: '/mapa',
      icon: Maximize2,
      label: 'Mapa',
      active: location.pathname === '/mapa'
    },
    {
      path: '/cadastrar',
      icon: Plus,
      label: 'Anunciar',
      active: location.pathname === '/cadastrar',
      requiresAuth: true
    },
    {
      path: '/favoritos',
      icon: Heart,
      label: 'Favoritos',
      active: location.pathname === '/favoritos',
      requiresAuth: true
    },
    {
      path: '/perfil',
      icon: User,
      label: 'Perfil',
      active: location.pathname === '/perfil'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isDisabled = item.requiresAuth && (!user || user.isAnonymous);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 ${
                item.active
                  ? 'text-green-600'
                  : isDisabled
                  ? 'text-gray-300'
                  : 'text-gray-600 hover:text-green-600'
              } transition-colors`}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                }
              }}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;