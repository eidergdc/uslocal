import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Share, Plus, MoreVertical, Download, Home } from 'lucide-react';

const InstallGuide: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={24} className="mr-2" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <Smartphone size={40} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Instale o App no seu Celular
          </h1>
          <p className="text-gray-600 text-lg">
            Acesse rapidamente e receba notificações
          </p>
        </div>

        {/* Device Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'ios'
                ? 'bg-white shadow-lg text-green-600 scale-105'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <div className="text-2xl mb-2">🍎</div>
            iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'android'
                ? 'bg-white shadow-lg text-green-600 scale-105'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <div className="text-2xl mb-2">🤖</div>
            Android
          </button>
        </div>

        {/* iOS Instructions */}
        {activeTab === 'ios' && (
          <div className="space-y-6 animate-fadeIn">
            {/* App Store Download Option */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">🍎</div>
                  <div>
                    <h2 className="text-2xl font-bold">Baixe na App Store</h2>
                    <p className="text-blue-100 text-sm">Disponível agora!</p>
                  </div>
                </div>
              </div>
              <p className="text-white/90 mb-4">
                A forma mais fácil e rápida de instalar no iPhone ou iPad
              </p>
              <a
                href="https://apps.apple.com/app/id6740216861"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-white text-blue-600 hover:bg-blue-50 py-4 px-6 rounded-xl font-bold text-center transition-colors text-lg shadow-lg"
              >
                Abrir na App Store →
              </a>
            </div>

            {/* PWA Installation Alternative */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 font-medium mb-2">
                💡 Alternativa: Instalar como PWA
              </p>
              <p className="text-yellow-700 text-sm">
                Se preferir, você também pode instalar usando o Safari seguindo os passos abaixo.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  1
                </span>
                Abra no Safari
              </h2>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-gray-700">
                  <strong>Importante:</strong> O app só pode ser instalado usando o navegador <strong>Safari</strong>.
                  Se você estiver usando outro navegador, copie o link e cole no Safari.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  2
                </span>
                Toque no botão Compartilhar
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 text-lg">
                  Toque no botão de <strong>compartilhar</strong> (um quadrado com uma seta para cima) na parte inferior da tela.
                </p>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 flex justify-center">
                  <div className="bg-white rounded-2xl p-6 shadow-2xl">
                    <Share size={48} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center italic">
                  O botão fica na barra inferior do Safari
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  3
                </span>
                Adicionar à Tela de Início
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 text-lg">
                  No menu que aparecer, role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                </p>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8">
                  <div className="bg-white rounded-xl p-4 flex items-center space-x-4 shadow-xl">
                    <div className="bg-green-100 rounded-lg p-3">
                      <Plus size={32} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-lg">Adicionar à Tela de Início</div>
                      <div className="text-sm text-gray-500">Crie um atalho na tela inicial</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  4
                </span>
                Confirme a instalação
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 text-lg">
                  Toque em <strong>"Adicionar"</strong> no canto superior direito para confirmar.
                </p>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-green-800 font-medium">
                    ✅ Pronto! O app aparecerá na sua tela inicial como um aplicativo normal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Instructions */}
        {activeTab === 'android' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  1
                </span>
                Abra no Chrome
              </h2>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-gray-700">
                  Recomendamos usar o navegador <strong>Google Chrome</strong> para a melhor experiência.
                  Outros navegadores como Firefox e Edge também funcionam.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  2
                </span>
                Abra o menu do navegador
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 text-lg">
                  Toque nos <strong>três pontos</strong> no canto superior direito do navegador.
                </p>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 flex justify-center">
                  <div className="bg-white rounded-2xl p-6 shadow-2xl">
                    <MoreVertical size={48} className="text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  3
                </span>
                Instalar aplicativo
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 text-lg">
                  Procure e toque na opção <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </p>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8">
                  <div className="bg-white rounded-xl p-4 flex items-center space-x-4 shadow-xl">
                    <div className="bg-green-100 rounded-lg p-3">
                      <Download size={32} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-lg">Instalar app</div>
                      <div className="text-sm text-gray-500">Adicionar à tela inicial</div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Dica:</strong> Em alguns dispositivos, pode aparecer um banner automático na parte inferior
                    da tela perguntando se você deseja instalar o app.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  4
                </span>
                Confirme a instalação
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 text-lg">
                  Na janela que aparecer, toque em <strong>"Instalar"</strong> para confirmar.
                </p>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-green-800 font-medium">
                    ✅ Pronto! O app será instalado e aparecerá na sua lista de aplicativos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Vantagens de ter o app instalado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                <Home size={24} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Acesso Rápido</h4>
                <p className="text-gray-600 text-sm">
                  Ícone direto na tela inicial, sem precisar abrir o navegador
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                <Smartphone size={24} className="text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Experiência de App</h4>
                <p className="text-gray-600 text-sm">
                  Interface otimizada sem barras do navegador
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 rounded-lg p-3 flex-shrink-0">
                <Download size={24} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Funciona Offline</h4>
                <p className="text-gray-600 text-sm">
                  Acesse conteúdo mesmo sem conexão com internet
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 rounded-lg p-3 flex-shrink-0">
                <Share size={24} className="text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Compartilhe Facilmente</h4>
                <p className="text-gray-600 text-sm">
                  Envie anúncios e localizações para amigos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <div className="bg-gray-100 rounded-xl p-6">
            <p className="text-gray-600">
              Está com dificuldades? Entre em contato conosco e teremos prazer em ajudar!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallGuide;
