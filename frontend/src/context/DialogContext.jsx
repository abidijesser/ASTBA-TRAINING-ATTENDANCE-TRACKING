import { createContext, useContext, useState, useCallback } from 'react';

const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
    const [dialogs, setDialogs] = useState([]);

    const showAlert = useCallback((message, title = 'Information') => {
        return new Promise((resolve) => {
            const id = Date.now();
            const dialog = {
                id,
                type: 'alert',
                title,
                message,
                onConfirm: () => {
                    setDialogs(prev => prev.filter(d => d.id !== id));
                    resolve(true);
                }
            };
            setDialogs(prev => [...prev, dialog]);
        });
    }, []);

    const showConfirm = useCallback((message, title = 'Confirmation') => {
        return new Promise((resolve) => {
            const id = Date.now();
            const dialog = {
                id,
                type: 'confirm',
                title,
                message,
                onConfirm: () => {
                    setDialogs(prev => prev.filter(d => d.id !== id));
                    resolve(true);
                },
                onCancel: () => {
                    setDialogs(prev => prev.filter(d => d.id !== id));
                    resolve(false);
                }
            };
            setDialogs(prev => [...prev, dialog]);
        });
    }, []);

    const showSuccess = useCallback((message, title = 'Succès') => {
        return new Promise((resolve) => {
            const id = Date.now();
            const dialog = {
                id,
                type: 'success',
                title,
                message,
                onConfirm: () => {
                    setDialogs(prev => prev.filter(d => d.id !== id));
                    resolve(true);
                }
            };
            setDialogs(prev => [...prev, dialog]);
        });
    }, []);

    const showError = useCallback((message, title = 'Erreur') => {
        return new Promise((resolve) => {
            const id = Date.now();
            const dialog = {
                id,
                type: 'error',
                title,
                message,
                onConfirm: () => {
                    setDialogs(prev => prev.filter(d => d.id !== id));
                    resolve(true);
                }
            };
            setDialogs(prev => [...prev, dialog]);
        });
    }, []);

    const closeDialog = useCallback((id) => {
        setDialogs(prev => prev.filter(d => d.id !== id));
    }, []);

    return (
        <DialogContext.Provider value={{
            dialogs,
            showAlert,
            showConfirm,
            showSuccess,
            showError,
            closeDialog
        }}>
            {children}
        </DialogContext.Provider>
    );
};

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within DialogProvider');
    }
    return context;
};
