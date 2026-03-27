import Modal from './Modal';
import GigChatPanel from './GigChatPanel';

const GigChatModal = ({ gigId, gigTitle, currentUser, isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gig Chat${gigTitle ? ` • ${gigTitle}` : ''}`}>
            <GigChatPanel gigId={gigId} currentUser={currentUser} />
        </Modal>
    );
};

export default GigChatModal;