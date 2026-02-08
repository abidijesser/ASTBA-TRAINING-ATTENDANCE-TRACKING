import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDialog } from '../../context/DialogContext';
import { attendanceAPI } from '../../api/attendance';
import { studentAPI } from '../../api/students';
import { Card, Button } from '../../components/ui';
import './StudentPresenceDetail.css';

const STATUS_OPTIONS = [
    { value: 'present', labelKey: 'presence.status.present' },
    { value: 'absent', labelKey: 'presence.status.absent' },
    { value: 'retard', labelKey: 'presence.status.retard' },
    { value: 'justifie', labelKey: 'presence.status.justifie' },
];

const formatDate = (iso) => {
    try {
        return iso ? new Date(iso).toLocaleDateString() : '-';
    } catch {
        return '-';
    }
};

const StudentPresenceDetail = () => {
    const { eleveId } = useParams();
    const navigate = useNavigate();
    const { isResponsable } = useAuth();
    const { t } = useLanguage();
    const { showError, showSuccess } = useDialog();

    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [search, setSearch] = useState('');

    const [student, setStudent] = useState(null);
    const [presences, setPresences] = useState([]);

    // Local editable state per presence id
    const [draft, setDraft] = useState({});

    useEffect(() => {
        if (!isResponsable) {
            navigate('/dashboard');
        }
    }, [isResponsable, navigate]);

    const hydrateDraft = (list) => {
        const next = {};
        for (const p of list) {
            if (!p?._id) continue;
            next[p._id] = {
                statut: p.statut || 'present',
                remarques: p.remarques || '',
            };
        }
        setDraft(next);
    };

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [studentRes, histRes] = await Promise.all([
                studentAPI.getById(eleveId),
                attendanceAPI.getStudentHistory(eleveId),
            ]);

            const s = studentRes?.data?.eleve || studentRes?.data?.student || null;
            const list = histRes?.data?.presences || histRes?.data?.data?.presences || [];

            setStudent(s);
            setPresences(list);
            hydrateDraft(list);
        } catch (e) {
            console.error('Error fetching student presence detail:', e);
            showError(e?.response?.data?.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isResponsable || !eleveId) return;
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isResponsable, eleveId]);

    const filtered = useMemo(() => {
        const term = String(search || '').trim().toLowerCase();
        if (!term) return presences;

        return presences.filter((p) => {
            const seanceNom = String(p?.seance_id?.nom || '').toLowerCase();
            const formationNom = String(p?.seance_id?.niveau_id?.formation_id?.nom || '').toLowerCase();
            const niveauNom = String(p?.seance_id?.niveau_id?.nom || '').toLowerCase();
            const statut = String(p?.statut || '').toLowerCase();
            return (
                seanceNom.includes(term) ||
                formationNom.includes(term) ||
                niveauNom.includes(term) ||
                statut.includes(term)
            );
        });
    }, [presences, search]);

    const handleSave = async (presenceId) => {
        try {
            setSavingId(presenceId);
            const rowDraft = draft[presenceId];
            await attendanceAPI.update(presenceId, {
                statut: rowDraft?.statut,
                remarques: rowDraft?.remarques,
            });
            showSuccess(t('presence.updateSuccess'));
            await fetchAll();
        } catch (e) {
            console.error('Error updating presence:', e);
            showError(e?.response?.data?.message || t('presence.updateError'));
        } finally {
            setSavingId(null);
        }
    };

    let content = null;
    if (loading) {
        content = <div className="loading-state">{t('common.loading')}</div>;
    } else if (filtered.length === 0) {
        content = (
            <Card className="empty-state">
                <p>{t('presence.noData')}</p>
            </Card>
        );
    } else {
        content = (
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('presence.columns.session')}</th>
                            <th>{t('presence.columns.date')}</th>
                            <th>{t('presence.columns.formation')}</th>
                            <th>{t('presence.columns.status')}</th>
                            <th>{t('presence.columns.remark')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => {
                            const pid = p?._id;
                            const rowDraft = draft[pid] || { statut: p?.statut, remarques: p?.remarques || '' };

                            const seanceNom = p?.seance_id?.nom || '-';
                            const date = formatDate(p?.seance_id?.date);
                            const formationNom = p?.seance_id?.niveau_id?.formation_id?.nom || '-';

                            return (
                                <tr key={pid}>
                                    <td>{seanceNom}</td>
                                    <td>{date}</td>
                                    <td>{formationNom}</td>
                                    <td>
                                        <select
                                            className="status-select"
                                            value={rowDraft.statut || 'present'}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    [pid]: { ...rowDraft, statut: e.target.value },
                                                }))
                                            }
                                        >
                                            {STATUS_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {t(opt.labelKey)}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            className="remark-input"
                                            value={rowDraft.remarques || ''}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    [pid]: { ...rowDraft, remarques: e.target.value },
                                                }))
                                            }
                                            placeholder={t('presence.remarkPlaceholder')}
                                        />
                                    </td>
                                    <td>
                                        <Button
                                            onClick={() => handleSave(pid)}
                                            loading={savingId === pid}
                                        >
                                            {t('common.save')}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="student-presence-detail">
            <div className="page-header">
                <div>
                    <h1>{t('presence.detailTitle')}</h1>
                    <p>
                        {student ? `${student.nom} ${student.prenom}` : t('presence.detailSubtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <Button variant="secondary" onClick={() => navigate('/presence')}>
                        {t('common.back')}
                    </Button>
                </div>
            </div>

            <Card className="search-card">
                <form onSubmit={(e) => e.preventDefault()} className="search-form">
                    <input
                        type="text"
                        placeholder={t('presence.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <Button type="submit">{t('common.search')}</Button>
                </form>
            </Card>

            {content}
        </div>
    );
};

export default StudentPresenceDetail;
