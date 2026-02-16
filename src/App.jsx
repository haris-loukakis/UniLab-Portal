import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ελέγχουμε αν ο χρήστης είναι συνδεδεμένος
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Φόρτωση...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Αν υπάρχει χρήστης, δείξε Dashboard, αλλιώς πήγαινε Login */}
        <Route 
          path="/" 
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
        />
        
        {/* Αν υπάρχει χρήστης, μην τον αφήνεις να μπει στο Login, στείλτον Dashboard */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}