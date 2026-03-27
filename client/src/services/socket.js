import { io } from 'socket.io-client';

let socketInstance;

export const getSocket = () => {
    if (!socketInstance) {
        socketInstance = io(
            import.meta.env.VITE_SOCKET_URL || '/', {
                autoConnect: false,
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });
    }

    return socketInstance;
};

export default getSocket;