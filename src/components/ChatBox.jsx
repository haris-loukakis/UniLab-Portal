import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function ChatBox({ currentUser, chatWith, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef();

  const chatId = [currentUser.uid, chatWith.uid].sort().join("_");

  useEffect(() => {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // 1. Αποθήκευση μηνύματος
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMessage,
      senderId: currentUser.uid,
      senderEmail: currentUser.email,
      createdAt: serverTimestamp()
    });

    // 2. Ειδοποίηση παραλήπτη
    await addDoc(collection(db, "users", chatWith.uid, "notifications"), {
      type: "new_message",
      fromEmail: currentUser.email,
      createdAt: new Date(),
      message: `Νέο μήνυμα από: ${currentUser.email}`
    });

    setNewMessage('');
  };

  return (
    <div className="fixed bottom-0 right-4 w-80 bg-white shadow-2xl rounded-t-xl border border-gray-200 flex flex-col z-50">
      <div className="bg-blue-600 p-3 rounded-t-xl flex justify-between items-center text-white">
        <span className="text-sm font-bold truncate">{chatWith.email}</span>
        <button onClick={onClose} className="hover:text-gray-200">✕</button>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.senderId === currentUser.uid ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={sendMessage} className="p-2 border-t flex gap-2">
        <input type="text" className="flex-grow text-sm p-2 border rounded-lg outline-none" placeholder="Πληκτρολογήστε..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit" className="text-blue-600 font-bold px-2 text-sm">OK</button>
      </form>
    </div>
  );
}