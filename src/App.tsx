import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import Header from './components/Layout/Header';
import Home from './pages/Home';
import ItemDetail from './pages/ItemDetail';
import AddItem from './pages/AddItem';
import EditItem from './pages/EditItem';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import FullscreenMap from './pages/FullscreenMap';
import Favorites from './pages/Favorites';
import InstallGuide from './pages/InstallGuide';
import Feedback from './pages/Feedback';
import BottomNavigation from './components/Layout/BottomNavigation';
import InstallPWAPrompt from './components/PWA/InstallPWAPrompt';
import { initializeCategories } from './utils/initCategories';
import { addMissingCategories } from './utils/addTatuadorCategory';

// Simple Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontFamily: 'system-ui',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <h1 style={{ color: '#009739', marginBottom: '20px' }}>US LOCAL</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Erro na aplicação: {this.state.error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#009739',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    initializeCategories().catch(console.error);
    addMissingCategories().catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LocationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 pb-safe">
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/item/:id" element={<ItemDetail />} />
                <Route path="/cadastrar" element={<AddItem />} />
                <Route path="/editar/:id" element={<EditItem />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/mapa" element={<FullscreenMap />} />
                <Route path="/favoritos" element={<Favorites />} />
                <Route path="/instalar" element={<InstallGuide />} />
                <Route path="/feedback" element={<Feedback />} />
              </Routes>

              <BottomNavigation />

              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#10B981',
                    },
                  },
                  error: {
                    style: {
                      background: '#EF4444',
                    },
                  },
                }}
              />

              <InstallPWAPrompt />
            </div>
          </Router>
        </LocationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;