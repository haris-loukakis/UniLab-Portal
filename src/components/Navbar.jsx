import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from 'firebase/firestore';

export default function Navbar({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  //Ακούμε για ειδοποιήσεις σε πραγματικό χρόνο
  useEffect(() => {
    const q = query(collection(db, "users", user.uid, "notifications"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user.uid]);

  //Αποδοχή Αιτήματος Φιλίας
  const handleAccept = async (notification) => {
    try {
      // Προσθήκη του άλλου στις δικές μου επαφές
      await setDoc(doc(db, "users", user.uid, "my_contacts", notification.fromUid), {
        email: notification.fromEmail,
        uid: notification.fromUid
      });

      // Προσθήκη εμού στις επαφές του άλλου (Αμφίδρομη φιλία)
      await setDoc(doc(db, "users", notification.fromUid, "my_contacts", user.uid), {
        email: user.email,
        uid: user.uid
      });

      // Διαγραφή της ειδοποίησης
      await deleteDoc(doc(db, "users", user.uid, "notifications", notification.id));
      alert(`Είστε πλέον φίλοι με τον/την ${notification.fromEmail}!`);
    } catch (error) {
      console.error("Σφάλμα αποδοχής:", error);
    }
  };

  //Απόρριψη ή Διαγραφή ειδοποίησης
  const handleDismiss = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "notifications", id));
  };

  return (
    <nav className="relative flex items-center justify-between bg-blue-600 px-6 py-4 text-white shadow-md z-50">
      <h1 className="text-xl font-bold tracking-tight">🎓 UniPortal</h1>
      
      <div className="flex items-center gap-6">
        
        {/* ΚΟΥΜΠΙ ΕΙΔΟΠΟΙΗΣΕΩΝ */}
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-1 hover:text-gray-200 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Λίστα Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl text-gray-800 border overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b font-bold text-sm text-gray-600 uppercase">Ειδοποιήσεις</div>
              
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-sm text-gray-400 text-center italic">Καμία νέα ειδοποίηση.</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-3 border-b hover:bg-blue-50 transition flex flex-col gap-1">
                      
                      {/* ΑΙΤΗΜΑ ΦΙΛΙΑΣ */}
                      {notif.type === 'friend_request' && (
                        <>
                          <p className="text-sm">👤 Ο/Η <span className="font-bold text-blue-600">{notif.fromEmail}</span> έστειλε αίτημα φιλίας.</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleAccept(notif)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded font-bold hover:bg-blue-700">Αποδοχή</button>
                            <button onClick={() => handleDismiss(notif.id)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded font-bold hover:bg-gray-300">Απόρριψη</button>
                          </div>
                        </>
                      )}

                      {/* ΝΕΟ POST */}
                      {notif.type === 'new_post' && (
                        <>
                          <p className="text-sm">📝 {notif.message}</p>
                          <button onClick={() => handleDismiss(notif.id)} className="self-end text-[10px] text-gray-400 hover:text-blue-500 mt-1">OK</button>
                        </>
                      )}

                      {/* ΝΕΟ ΜΗΝΥΜΑ */}
                      {notif.type === 'new_message' && (
                        <>
                          <p className="text-sm">💬 {notif.message}</p>
                          <button onClick={() => handleDismiss(notif.id)} className="self-end text-[10px] text-gray-400 hover:text-blue-500 mt-1">OK</button>
                        </>
                      )}

                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm font-medium opacity-90">{user?.email}</span>
          <button onClick={() => signOut(auth)} className="bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded text-sm font-bold transition">Έξοδος</button>
        </div>
      </div>
    </nav>
  );
}