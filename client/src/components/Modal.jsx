import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === modalRef.current) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
            ref={modalRef}
            onClick={handleOverlayClick}
        >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slideUp">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <button
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
