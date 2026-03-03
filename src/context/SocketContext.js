// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
                withCredentials: true,
                auth: {
                    token: localStorage.getItem('meetra_token')
                }
            });

            newSocket.on('connect', () => {
                console.log('Connected to server');
                setIsConnected(true);
                
                // Authenticate socket with token
                const token = localStorage.getItem('meetra_token');
                if (token) {
                    newSocket.emit('authenticate', token);
                }
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from server');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [isAuthenticated, socket, user]);

    const value = {
        socket,
        isConnected
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};