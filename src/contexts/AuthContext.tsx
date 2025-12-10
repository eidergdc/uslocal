import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

// Admin emails configuration
const ADMIN_EMAILS = ['eidergdc@gmail.com'];

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  convertGuestToUser: (email: string, password: string, displayName: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDocListener, setUserDocListener] = useState<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!mounted) return;
        
        setFirebaseUser(firebaseUser);
        
        if (firebaseUser) {
          // Clean up previous listener
          if (userDocListener) {
            userDocListener();
            setUserDocListener(null);
          }
          
          let currentUserData: User;
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            currentUserData = { 
              ...userData, 
              uid: firebaseUser.uid,
              photoURL: firebaseUser.photoURL || userData.photoURL,
              createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
            };
          } else {
            // Create user document if it doesn't exist
            currentUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              isAnonymous: firebaseUser.isAnonymous,
              role: ADMIN_EMAILS.includes(firebaseUser.email || '') ? 'admin' : 'user',
              createdAt: new Date(),
              favorites: [],
              viewHistory: [],
              distanceUnit: 'miles'
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), currentUserData);
          }
          
          // Set initial user data
          if (mounted) setUser(currentUserData);
          
          // Set up real-time listener for user document changes
          const unsubscribeUserDoc = onSnapshot(
            doc(db, 'users', firebaseUser.uid),
            (doc) => {
              if (doc.exists() && mounted) {
                const userData = doc.data() as User;
                const updatedUserData = {
                  ...userData,
                  uid: firebaseUser.uid,
                  photoURL: userData.photoURL || firebaseUser.photoURL,
                  createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
                };
                setUser(updatedUserData);
              }
            },
            (error) => {
              console.error('Error listening to user document:', error);
            }
          );
          
          setUserDocListener(() => unsubscribeUserDoc);
          
          // Update role if user is admin
          if (currentUserData && ADMIN_EMAILS.includes(firebaseUser.email || '') && currentUserData.role !== 'admin') {
            await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' });
          }
        } else {
          // Clean up listener when user logs out
          if (userDocListener) {
            userDocListener();
            setUserDocListener(null);
          }
          if (mounted) setUser(null);
        }
        
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('Auth state change error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      if (userDocListener) {
        userDocListener();
      }
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error('Erro no login. Verifique suas credenciais.');
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUser: User = {
        uid: firebaseUser.uid,
        email,
        displayName,
        isAnonymous: false,
        role: 'user',
        createdAt: new Date(),
        favorites: [],
        viewHistory: [],
        distanceUnit: 'miles'
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      toast.success('Conta criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar conta.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout.');
      throw error;
    }
  };

  const loginAsGuest = async () => {
    try {
      await signInAnonymously(auth);
      toast.success('Entrando como visitante...');
    } catch (error) {
      toast.error('Erro ao entrar como visitante.');
      throw error;
    }
  };

  const convertGuestToUser = async (email: string, password: string, displayName: string) => {
    try {
      if (!firebaseUser || !firebaseUser.isAnonymous) {
        throw new Error('Usuário não é anônimo');
      }

      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(firebaseUser, credential);
      
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        displayName,
        isAnonymous: false,
        distanceUnit: 'miles'
      });
      
      toast.success('Conta convertida com sucesso!');
    } catch (error) {
      toast.error('Erro ao converter conta.');
      throw error;
    }
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    loginAsGuest,
    convertGuestToUser,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};