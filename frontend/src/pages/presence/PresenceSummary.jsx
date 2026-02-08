import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDialog } from '../../context/DialogContext';
import { attendanceAPI } from '../../api/attendance';
import { Card, Button } from '../../components/ui';
import './PresenceSummary.css';

const PresenceSummary = () => {
    const navigate = useNavigate();
    const { isResponsable } = useAuth();
    const { t } = useLanguage();
    const { showError } = useDialog();

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState([]);

    useEffect(() => {
        if (!isResponsable) {
            navigate('/dashboard');
        }
    }, [isResponsable, navigate]);

    useEffect(() => {
        let mounted = true;

        const fetchSummary = async () => {
            try {
                setLoading(true);
                const res = await attendanceAPI.getSummary();
                const list = res?.data?.summary || [];
                if (mounted) setRows(list);
            } catch (e) {
                console.error('Error fetching presence summary:', e);
                showError(e?.response?.data?.message || t('common.error'));
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (isResponsable) fetchSummary();
        return () => {
            mounted = false;
        };
    }, [isResponsable, showError, t]);

    const filtered = useMemo(() => {
        const term = String(search || '').trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((r) => {
            const nom = String(r?.nom || '').toLowerCase();
            const prenom = String(r?.prenom || '').toLowerCase();
            return nom.includes(term) || prenom.includes(term);
        });
    }, [rows, search]);

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
                            <th>{t('auth.lastName')}</th>
                            <th>{t('auth.firstName')}</th>
                            <th>{t('presence.presentCount')}</th>
                            <th>{t('presence.absentCount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r) => {
                            const total = Number(r?.total || 0);
                            const present = Number(r?.present || 0);
                            const absent = Number(r?.absent || 0);

                            return (
                                <tr key={String(r?.eleve_id || `${r?.nom}-${r?.prenom}`)}>
                                    <td>{r?.nom || '-'}</td>
                                    <td>{r?.prenom || '-'}</td>
                                    <td>{present}/{total}</td>
                                    <td>{absent}/{total}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="presence-summary">
            <div className="page-header">
                <div>
                    <h1>{t('presence.title')}</h1>
                    <p>{t('presence.subtitle')}</p>
                </div>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                    {t('common.back')}
                </Button>
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

export default PresenceSummary;
