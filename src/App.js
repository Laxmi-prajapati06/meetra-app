// src/App.js
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Events from './components/Events';
import Explore from './components/Explore';
import People from './components/People';
import Messages from './components/Messages';
import Profile from './components/Profile';
import SignIn from './components/SignIn';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Listen for global navigation events so components can trigger SPA navigation
  useEffect(() => {
    const handler = (e) => {
      const page = e.detail?.page;
      if (page) setCurrentPage(page);
    };

    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} />;
      case 'events':
        return <Events />;
      case 'explore':
        return <Explore />;
      case 'people':
        return <People />;
      case 'messages':
        return <Messages />;
      case 'profile':
        return <Profile />;
      case 'signin':
        return <SignIn setCurrentPage={setCurrentPage} setIsLoggedIn={setIsLoggedIn} />;
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      <SocketProvider>
        <div className="App">
          <Navbar 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
          {renderPage()}
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;