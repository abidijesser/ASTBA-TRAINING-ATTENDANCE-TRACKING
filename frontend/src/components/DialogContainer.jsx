import { useDialog } from '../context/DialogContext';
import './DialogContainer.css';

const DialogContainer = () => {
    const { dialogs } = useDialog();

    if (dialogs.length === 0) return null;

    return (
        <div className="dialog-container">
            {dialogs.map((dialog) => (
                <Dialog key={dialog.id} dialog={dialog} />
            ))}
        </div>
    );
};

const Dialog = ({ dialog }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'confirm':
                return '?';
            default:
                return 'ℹ';
        }
    };

    const getClassName = (type) => {
        switch (type) {
            case 'success':
                return 'dialog-success';
            case 'error':
                return 'dialog-error';
            case 'confirm':
                return 'dialog-confirm';
            default:
                return 'dialog-alert';
        }
    };

    return (
        <>
            <div className="dialog-backdrop" />
            <div
                className={`dialog ${getClassName(dialog.type)}`}
                role={dialog.type === 'error' ? 'alert' : dialog.type === 'confirm' ? 'alertdialog' : 'status'}
                aria-live={dialog.type === 'success' ? 'polite' : dialog.type === 'error' ? 'assertive' : 'off'}
                aria-atomic="true"
            >
                <div className="dialog-content">
                    <div className={`dialog-icon dialog-icon-${dialog.type}`} aria-hidden="true">
                        {getIcon(dialog.type)}
                    </div>
                    <div className="dialog-body">
                        <h2 className="dialog-title">{dialog.title}</h2>
                        <p className="dialog-message">{dialog.message}</p>
                    </div>
                </div>
                <div className="dialog-footer">
                    {dialog.type === 'confirm' ? (
                        <>
                            <button
                                type="button"
                                className="dialog-btn dialog-btn-cancel"
                                onClick={dialog.onCancel}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                className="dialog-btn dialog-btn-confirm"
                                onClick={dialog.onConfirm}
                            >
                                Confirmer
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="dialog-btn dialog-btn-close"
                            onClick={dialog.onConfirm}
                            aria-label="Fermer le message"
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default DialogContainer;
