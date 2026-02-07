import { useEffect, useRef } from 'react';
import './Modal.css';

/**
 * Modal Component
 * Professional modal dialog with accessibility features
 */
const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Save current focus
            previousFocusRef.current = document.activeElement;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Focus modal
            if (modalRef.current) {
                modalRef.current.focus();
            }
        } else {
            document.body.style.overflow = 'unset';

            // Restore focus
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            role="presentation"
        >
            <div
                ref={modalRef}
                className={`modal modal-${size}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
            >
                <div className="modal-header">
                    <h3 id="modal-title" className="modal-title">{title}</h3>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Fermer la boîte de dialogue"
                        type="button"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="modal-content">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
