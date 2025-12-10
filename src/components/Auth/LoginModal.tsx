import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { t } from '../../i18n';
import toast from 'react-hot-toast';

interface LoginModalProps {
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'convert';
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, initialMode }) => {
  const { login, register, loginAsGuest, convertGuestToUser, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'convert'>(
    initialMode || (user?.isAnonymous ? 'convert' : 'login')
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'register') {
        await register(email, password, displayName);
        onClose();
      } else if (mode === 'convert') {
        await convertGuestToUser(email, password, displayName);
        onClose();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
      onClose();
    } catch (error) {
      console.error('Guest login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'login' && t('common.login')}
            {mode === 'register' && t('common.register')}
            {mode === 'convert' && 'Criar Conta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(mode === 'register' || mode === 'convert') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="********"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : (
              mode === 'login' ? t('common.login') :
              mode === 'register' ? t('common.register') : 'Criar Conta'
            )}
          </button>

          <div className="text-center space-y-2">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-green-600 hover:text-green-700 text-sm"
                >
                  Não tem conta? Cadastre-se
                </button>
                {!user?.isAnonymous && (
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="block w-full text-center text-gray-600 hover:text-gray-700 text-sm"
                  >
                    Continuar como visitante
                  </button>
                )}
              </>
            )}
            
            {mode === 'register' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                Já tem conta? Faça login
              </button>
            )}

            {mode === 'convert' && user?.isAnonymous && (
              <p className="text-sm text-gray-600">
                Converta sua conta de visitante para ter acesso completo
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;