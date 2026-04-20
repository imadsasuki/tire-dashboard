import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    signInAnonymously(auth);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  return user;
};
