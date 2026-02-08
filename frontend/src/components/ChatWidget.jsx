import { useEffect, useRef, useState } from 'react';
import { getChatQuestions, sendChatQuestion } from '../api/chat';
import './ChatWidget.css';

const STORAGE_KEY = 'astba_chat_messages_v1';

function nowId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [questions, setQuestions] = useState([]);
    const [qSearch, setQSearch] = useState('');
    const listRef = useRef(null);

    const [messages, setMessages] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
        } catch {}
    }, [messages]);

    useEffect(() => {
        if (!open) return;
        // scroll after open render
        requestAnimationFrame(() => {
            try {
                listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
            } catch {}
        });
    }, [open, messages.length]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await getChatQuestions();
                const list = Array.isArray(data?.questions) ? data.questions : [];
                if (!cancelled) setQuestions(list);
            } catch (e) {
                if (!cancelled) setError(String(e?.message || 'Impossible de charger les questions.'));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open]);

    const clearHistory = () => {
        setMessages([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {}
    };

    const filteredQuestions = (() => {
        const q = qSearch.trim().toLowerCase();
        if (!q) return questions;
        return questions.filter((it) => {
            const title = String(it?.title || '').toLowerCase();
            const cat = String(it?.category || '').toLowerCase();
            const desc = String(it?.description || '').toLowerCase();
            return title.includes(q) || cat.includes(q) || desc.includes(q);
        });
    })();

    const grouped = (() => {
        const map = new Map();
        for (const it of filteredQuestions) {
            const cat = it?.category ? String(it.category) : 'Autre';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat).push(it);
        }
        return Array.from(map.entries());
    })();

    const ask = async (q) => {
        if (!q?.id || loading) return;

        setError('');

        const userMsg = { id: nowId(), role: 'user', content: q.title || q.id, ts: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const data = await sendChatQuestion({ questionId: q.id });

            if (!data?.success) {
                throw new Error(data?.message || 'AI error');
            }

            const botMsg = {
                id: nowId(),
                role: 'assistant',
                content: data.reply || "Désolé, je n'ai pas de réponse.",
                ts: Date.now(),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            const msg = String(err?.message || '').trim();
            setError(msg || "Désolé, je n'arrive pas à répondre maintenant. Réessayez.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className="chat-bubble"
                aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
                title={open ? 'Fermer' : 'Chat'}
                onClick={() => setOpen((v) => !v)}
            >
                {open ? (
                    '×'
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                            d="M7 18l-3 3V6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3H10l-3 1z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                        />
                        <path d="M8 8h8M8 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )}
            </button>

            {open && (
                <dialog className="chat-panel" open aria-label="Chatbot">
                    <div className="chat-header">
                        <div className="chat-title">Assistant</div>
                        <div className="chat-header-actions">
                            <button
                                type="button"
                                className="chat-clear"
                                onClick={clearHistory}
                                disabled={loading || messages.length === 0}
                                title="Effacer l'historique"
                            >
                                Effacer
                            </button>
                        <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Fermer">
                            ×
                        </button>
                        </div>
                    </div>

                    <div className="chat-messages" ref={listRef}>
                        {messages.length === 0 ? (
                            <div className="chat-empty">
                                Choisissez une question prédéfinie (ou utilisez la recherche en bas).
                            </div>
                        ) : (
                            messages.map((m) => (
                                <div key={m.id} className={`chat-msg ${m.role === 'user' ? 'me' : 'bot'}`}>
                                    <div className="chat-bubble-msg">{m.content}</div>
                                </div>
                            ))
                        )}

                        {loading && (
                            <div className="chat-msg bot">
                                <div className="chat-bubble-msg">…</div>
                            </div>
                        )}
                    </div>

                    {error && <div className="chat-error">{error}</div>}

                    <div className="chat-input-row">
                        <div className="chat-footer">
                            <div className="chat-search-row">
                                <input
                                    className="chat-search"
                                    value={qSearch}
                                    onChange={(e) => setQSearch(e.target.value)}
                                    placeholder="Rechercher une question…"
                                    aria-label="Rechercher une question"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="chat-search-clear"
                                    onClick={() => setQSearch('')}
                                    disabled={loading || !qSearch.trim()}
                                    title="Effacer la recherche"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="chat-questions" aria-label="Questions prédéfinies">
                                {questions.length === 0 ? (
                                    <button type="button" className="chat-qcard" disabled>
                                        Chargement…
                                    </button>
                                ) : grouped.length === 0 ? (
                                    <div className="chat-empty-mini">Aucune question ne correspond à la recherche.</div>
                                ) : (
                                    grouped.map(([cat, items]) => (
                                        <div className="chat-qgroup" key={cat}>
                                            <div className="chat-qgroup-title">{cat}</div>
                                            <div className="chat-qgrid">
                                                {items.map((q) => (
                                                    <button
                                                        key={q.id}
                                                        type="button"
                                                        className="chat-qcard"
                                                        onClick={() => ask(q)}
                                                        disabled={loading}
                                                        title={q.title}
                                                    >
                                                        <div className="chat-qtitle">{q.title}</div>
                                                        {q.description ? (
                                                            <div className="chat-qdesc">{q.description}</div>
                                                        ) : null}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </dialog>
            )}
        </>
    );
}
