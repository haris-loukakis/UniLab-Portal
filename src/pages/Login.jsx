import { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Λειτουργία για την αποθήκευση/ενημέρωση του προφίλ χρήστη στη Firestore
  const saveUserToDb = async (user) => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving user:", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToDb(result.user);
      navigate('/');
    } catch (err) {
      setError("Αποτυχία σύνδεσης με Google.");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      await saveUserToDb(result.user);
      navigate('/');
    } catch (err) {
      setError("Λάθος στοιχεία ή ο κωδικός είναι πολύ μικρός.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-blue-600">
          {isSignUp ? 'Δημιουργία Λογαριασμού' : 'Καλωσήρθατε'}
        </h2>
        
        {error && <p className="mb-4 text-red-500 text-center text-sm font-medium bg-red-50 p-2 rounded">{error}</p>}
        
        <button 
          onClick={handleGoogleLogin} 
          className="w-full mb-4 flex items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 font-bold text-white hover:bg-red-600 transition shadow-md"
        >
          Συνέχεια με Google
        </button>

        <div className="flex items-center my-6 text-gray-400">
          <hr className="flex-grow border-gray-300"/>
          <span className="px-3 text-xs font-bold uppercase">ή με email</span>
          <hr className="flex-grow border-gray-300"/>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email</label>
            <input 
              type="email" 
              className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition" 
              placeholder="name@example.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Κωδικός</label>
            <input 
              type="password" 
              className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
          >
            {isSignUp ? 'Εγγραφή' : 'Είσοδος στο Portal'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isSignUp ? 'Έχετε ήδη λογαριασμό;' : 'Νέος χρήστης;'} 
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="ml-2 font-bold text-blue-600 hover:underline"
          >
            {isSignUp ? 'Συνδεθείτε' : 'Δημιουργήστε λογαριασμό'}
          </button>
        </p>
      </div>
    </div>
  );
}