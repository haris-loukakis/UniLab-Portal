import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Contacts from '../components/Contacts';
import ChatBox from '../components/ChatBox';

export default function Dashboard({ user }) {
  const [newPost, setNewPost] = useState('');
  const [category, setCategory] = useState('Γενικά');
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('Όλα');
  const [activeChat, setActiveChat] = useState(null);

  const categories = ['Γενικά', 'Προγραμματισμός', 'Μαθηματικά', 'Δίκτυα', 'Βάσεις Δεδομένων'];

  // Φόρτωση Posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Δημιουργία Post & Αποστολή Ειδοποιήσεων
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      //Δημιουργία Post
      await addDoc(collection(db, 'posts'), {
        text: newPost,
        category: category,
        uid: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp()
      });

      //Ειδοποίηση Φίλων
      const contactsSnapshot = await getDocs(collection(db, "users", user.uid, "my_contacts"));
      contactsSnapshot.forEach(async (contactDoc) => {
        const friendId = contactDoc.id; 
        await addDoc(collection(db, "users", friendId, "notifications"), {
          type: "new_post",
          fromEmail: user.email,
          createdAt: new Date(),
          message: `Ο/Η ${user.email} ανέβασε νέο post!`
        });
      });

      setNewPost('');
      setCategory('Γενικά');
    } catch (err) {
      console.error("Error adding post:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar user={user} />
      
      <div className="mx-auto max-w-6xl p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <textarea 
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Μοιραστείτε κάτι με τους συμφοιτητές σας..." 
              rows="3" 
              value={newPost} 
              onChange={(e) => setNewPost(e.target.value)} 
            />
            <div className="mt-4 flex justify-between items-center">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border p-2 text-sm bg-white">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleSubmit} className="rounded-xl bg-blue-600 px-8 py-2 font-bold text-white hover:bg-blue-700">Δημοσίευση</button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Ροή</h2>
              <select onChange={(e) => setFilter(e.target.value)} className="text-sm bg-gray-200 px-3 py-1 rounded-full border-none">
                <option value="Όλα">Όλα</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              {posts.filter(p => filter === 'Όλα' || p.category === filter).map(post => (
                <div key={post.id} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-50">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-900">{post.userEmail}</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">{post.category}</span>
                  </div>
                  <p className="text-gray-700">{post.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        
        <div className="hidden lg:block">
          <Contacts currentUser={user} onSelectChat={setActiveChat} />
        </div>
      </div>

      {activeChat && <ChatBox currentUser={user} chatWith={activeChat} onClose={() => setActiveChat(null)} />}
    </div>
  );
}