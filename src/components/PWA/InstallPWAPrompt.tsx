import React, { useState, useEffect } from 'react';
import { X, Share, Plus, Check, MoreHorizontal } from 'lucide-react';

interface InstallPWAPromptProps {
  onClose?: () => void;
}

const InstallPWAPrompt: React.FC<InstallPWAPromptProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const checkShouldShow = () => {
      // Detectar se é iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

      // Detectar se é Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      // Detectar se já está instalado como PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true;

      // Verificar se já foi fechado antes
      const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');

      // Verificar engajamento (visitou pelo menos 2 páginas)
      const pageViews = parseInt(localStorage.getItem('page-views') || '0');

      // Mostrar apenas se: iOS + Safari + não instalado + não foi fechado + tem engajamento
      if (isIOS && isSafari && !isStandalone && !wasDismissed && pageViews >= 2) {
        // Delay de 2 segundos para não ser intrusivo
        setTimeout(() => {
          setIsVisible(true);
        }, 2000);
      }
    };

    checkShouldShow();

    // Incrementar contador de visualizações de página
    const currentViews = parseInt(localStorage.getItem('page-views') || '0');
    localStorage.setItem('page-views', (currentViews + 1).toString());
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    if (onClose) onClose();
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Não salvar no localStorage, então vai aparecer novamente na próxima sessão
    if (onClose) onClose();
  };

  const steps = [
    {
      icon: <MoreHorizontal size={32} className="text-gray-700" />,
      text: 'Toque nos "..." (três pontinhos)',
      detail: 'Na barra inferior do Safari'
    },
    {
      icon: <Share size={32} className="text-blue-600" />,
      text: 'Depois toque em "Compartilhar"',
      detail: 'No menu que aparecer'
    },
    {
      icon: <Plus size={32} className="text-green-600" />,
      text: 'Selecione "Adicionar à Tela de Início"',
      detail: 'Role para baixo se necessário'
    },
    {
      icon: <Check size={32} className="text-green-600" />,
      text: 'Confirme tocando em "Adicionar"',
      detail: 'Pronto! O app aparecerá na sua tela inicial'
    }
  ];

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-t-3xl md:rounded-t-2xl">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-white bg-black bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="flex items-center space-x-3 pt-2">
            <div className="bg-white rounded-xl p-2 shadow-lg">
              <span className="text-3xl">📱</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Instale o App!</h2>
              <p className="text-green-100 text-xs">Acesso rápido e fácil</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-4 bg-gradient-to-b from-green-50 to-white">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white rounded-lg p-2 shadow-sm border border-green-100">
              <div className="text-xl mb-1">🚀</div>
              <div className="text-xs font-semibold text-gray-800">Acesso Instantâneo</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm border border-blue-100">
              <div className="text-xl mb-1">📱</div>
              <div className="text-xs font-semibold text-gray-800">Como App Nativo</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm border border-purple-100">
              <div className="text-xl mb-1">⚡</div>
              <div className="text-xs font-semibold text-gray-800">Mais Rápido</div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm border border-orange-100">
              <div className="text-xl mb-1">🔔</div>
              <div className="text-xs font-semibold text-gray-800">Notificações</div>
            </div>
          </div>

          {/* Tutorial Steps */}
          <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-green-200">
            <h3 className="text-center font-bold text-gray-800 mb-3 text-sm">
              Como Instalar (4 passos simples)
            </h3>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 p-2 rounded-lg transition-all duration-500 ${
                    currentStep === index
                      ? 'bg-green-50 border-2 border-green-400 scale-105'
                      : 'bg-gray-50 border border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {React.cloneElement(step.icon as React.ReactElement, { size: 24 })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-xs">
                      {index + 1}. {step.text}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {step.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-1.5 mt-3">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === index
                      ? 'w-6 bg-green-600'
                      : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2 pb-6">
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm"
          >
            Entendi! Vou instalar agora
          </button>

          <button
            onClick={handleRemindLater}
            className="w-full text-gray-600 font-medium py-2 hover:text-gray-800 transition-colors text-sm"
          >
            Lembrar depois
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InstallPWAPrompt;
