import { useState, useEffect, useMemo } from 'react';
import { certificationAPI } from '../../api/certifications';
import { useLanguage } from '../../context/LanguageContext';
import { useDialog } from '../../context/DialogContext';
import { Button, Card } from '../../components/ui';
import './CertificationList.css';

const CertificationList = () => {
    const { showAlert, showError } = useDialog();
    const { t } = useLanguage();
    const [certifications, setCertifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState({}); // { [formationId]: boolean }

    useEffect(() => {
        fetchCertifications();
    }, [filter, search]);

    const fetchCertifications = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter !== 'all') params.statut = filter;
            if (search) params.search = search;
            const response = await certificationAPI.getAll(params);
            setCertifications(response.data.certifications);
        } catch (error) {
            console.error('Error fetching certifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCertifications();
    };

    const handleDownload = async (cert) => {
        try {
            const response = await certificationAPI.download(cert._id);
            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificat-${cert.numero_certificat || cert._id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            showAlert(t('certification.downloadSuccess'));
        } catch (error) {
            console.error('Error downloading certificate:', error);
            let msg = t('certification.downloadError');
            try {
                if (error?.response?.data) {
                    const data = error.response.data;
                    if (data instanceof Blob) {
                        const text = await data.text();
                        try {
                            const json = JSON.parse(text);
                            msg = json.message || text || msg;
                        } catch {
                            msg = text || msg;
                        }
                    } else if (typeof data === 'string') {
                        msg = data;
                    } else if (data.message) {
                        msg = data.message;
                    }
                } else if (error?.message) {
                    msg = error.message;
                }
            } catch { }
            showError(msg);
        }
    };

    const handleValidate = async (cert) => {
        try {
            const payload = {
                eleve_id: cert.eleve_id?._id || cert.eleve_id,
                formation_id: cert.formation_id?._id || cert.formation_id,
                remarques: 'Validation manuelle',
            };
            const resp = await certificationAPI.validate(payload);
            showAlert(resp.message || t('certification.validateSuccess'));
            fetchCertifications();
        } catch (error) {
            console.error('Error validating certificate:', error);
            showError(t('certification.validateError'));
        }
    };

    // Group certifications by formation at top-level to respect hooks rules
    const groupedByFormation = useMemo(() => {
        const map = new Map();
        for (const cert of certifications) {
            const fid = cert.formation_id?._id || 'sans-formation';
            const fname = cert.formation_id?.nom || t('certification.noFormation');
            if (!map.has(fid)) {
                map.set(fid, { id: fid, name: fname, items: [] });
            }
            map.get(fid).items.push(cert);
        }
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [certifications, t]);

    const toggleExpand = (formationId) => {
        setExpanded((prev) => ({ ...prev, [formationId]: !prev[formationId] }));
    };

    return (
        <div className="certification-list" style={{ maxWidth: 'var(--max-width)' }}>
            <div className="page-header">
                <div>
                    <h1>{t('certification.title')}</h1>
                    <p>{t('certification.manageSubtitle')}</p>
                </div>
            </div>

            <Card className="search-card">
                <div className="search-form-cert">
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder={t('certification.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                        <Button type="submit">{t('common.search')}</Button>
                    </form>
                    <select
                        className="input"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: 'auto', minWidth: '150px' }}
                    >
                        <option value="all">{t('certification.allStatuses')}</option>
                        <option value="valide">{t('certification.statusValidated')}</option>
                        <option value="en_attente">{t('certification.statusPending')}</option>
                    </select>
                </div>
            </Card>

            {loading ? (
                <div className="loading-state">{t('common.loading')}</div>
            ) : certifications.length > 0 ? (
                <div>
                    {groupedByFormation.map((group) => (
                        <Card key={group.id} style={{ marginBottom: '16px' }}>
                            <div
                                onClick={() => toggleExpand(group.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    padding: '8px 4px'
                                }}
                            >
                                <h2 style={{ margin: 0, fontSize: '18px' }}>
                                    {group.name}
                                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                        ({group.items.length})
                                    </span>
                                </h2>
                                <span style={{ fontSize: '18px' }}>{expanded[group.id] ? '▾' : '▸'}</span>
                            </div>

                            {expanded[group.id] && (
                                <div className="certification-grid" style={{ marginTop: '8px' }}>
                                    {group.items.map((cert) => (
                                        <Card key={cert._id} className="certification-card">
                                            <div className="cert-header">
                                                {cert.numero_certificat && (
                                                    <div className="cert-number">{cert.numero_certificat}</div>
                                                )}
                                            </div>
                                            <div className="cert-body">
                                                <h3>{cert.eleve_id?.nom} {cert.eleve_id?.prenom}</h3>
                                                <div className="cert-meta">
                                                    <span>📅 {new Date(cert.date_obtention).toLocaleDateString()}</span>
                                                    <span>📊 {cert.pourcentage_presence_total}% {t('student.attendance')}</span>
                                                </div>
                                            </div>
                                            <div className="cert-footer" style={{ display: 'flex', gap: 8 }}>
                                                <Button
                                                    size="small"
                                                    variant="secondary"
                                                    fullWidth
                                                    onClick={() => handleDownload(cert)}
                                                >
                                                    📄 {t('common.download')}
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="empty-state">
                    <p>{t('certification.noCertifications')}</p>
                </Card>
            )}
        </div>
    );
};

export default CertificationList;
