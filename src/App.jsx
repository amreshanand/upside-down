import { useState, useEffect } from 'react';
import { auth, signInAnonymously, onAuthStateChanged } from './firebase';
import Home from './pages/Home';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        signInAnonymously(auth)
          .then(() => {
            // onAuthStateChanged will fire again with the user
          })
          .catch((error) => {
            console.error('Anonymous auth failed:', error);
            setLoading(false);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-resq-dark">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-resq-border border-t-resq-accent animate-spin" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-resq-safe animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gradient">ResQ</h1>
            <p className="text-resq-muted text-sm mt-1">Initializing disaster response system...</p>
          </div>
        </div>
      </div>
    );
  }

  return <Home user={user} />;
}

export default App;
