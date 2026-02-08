import api from './axios';

export async function getChatQuestions() {
    try {
        const res = await api.get('/chat/questions');
        return res.data;
    } catch (err) {
        const serverMessage = err?.response?.data?.message;
        if (serverMessage) throw new Error(String(serverMessage));
        const status = err?.response?.status;
        if (status) throw new Error(`Erreur serveur (${status}).`);
        throw err;
    }
}

export async function sendChatQuestion({ questionId }) {
    try {
        const res = await api.post('/chat', { questionId });
        return res.data;
    } catch (err) {
        const serverMessage = err?.response?.data?.message;
        if (serverMessage) throw new Error(String(serverMessage));

        const status = err?.response?.status;
        if (status) throw new Error(`Erreur serveur (${status}).`);

        throw err;
    }
}
