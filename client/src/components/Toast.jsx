import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((message) => addToast(message, 'success'), [addToast]);
    const error = useCallback((message) => addToast(message, 'error'), [addToast]);
    const info = useCallback((message) => addToast(message, 'info'), [addToast]);
    const warning = useCallback((message) => addToast(message, 'warning'), [addToast]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <XCircle size={20} className="text-red-500" />,
        warning: <AlertTriangle size={20} className="text-amber-500" />,
        info: <Info size={20} className="text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-amber-50 border-amber-200',
        info: 'bg-blue-50 border-blue-200',
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg cursor-pointer animate-slideUp ${bgColors[toast.type]}`}
                        onClick={() => removeToast(toast.id)}
                    >
                        {icons[toast.type]}
                        <p className="text-sm text-slate-700">{toast.message}</p>
                        <button className="ml-2 text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
