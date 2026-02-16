import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';

export default function Contacts({ currentUser, onSelectChat }) {
  const [allUsers, setAllUsers] = useState([]);
  const [myContacts, setMyContacts] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // Φόρτωση χρηστών
  useEffect(() => {
    const q = query(collection(db, "users"), where("uid", "!=", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Φόρτωση φίλων
  useEffect(() => {
    const q = collection(db, "users", currentUser.uid, "my_contacts");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyContacts(snapshot.docs.map(doc => doc.id));
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Αποστολή αιτήματος
  const sendRequest = async (targetUser) => {
    if (sentRequests.includes(targetUser.uid)) return;
    try {
      await addDoc(collection(db, "users", targetUser.uid, "notifications"), {
        fromUid: currentUser.uid,
        fromEmail: currentUser.email,
        type: "friend_request",
        createdAt: new Date()
      });
      setSentRequests([...sentRequests, targetUser.uid]);
      alert("Το αίτημα στάλθηκε!");
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 sticky top-4">
      <h3 className="mb-4 text-lg font-bold border-b pb-2">👥 Συμφοιτητές</h3>
      <div className="space-y-3">
        {allUsers.map(u => (
          <div key={u.uid} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
            <span className="text-sm truncate w-24 font-medium">{u.email}</span>
            <div className="flex gap-2">
              {myContacts.includes(u.uid) ? (
                <button onClick={() => onSelectChat(u)} className="text-[10px] bg-green-500 text-white px-3 py-1 rounded-full font-bold">💬 Chat</button>
              ) : sentRequests.includes(u.uid) ? (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full border">⏳ Στάλθηκε</span>
              ) : (
                <button onClick={() => sendRequest(u)} className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 font-bold">+ Προσθήκη</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}