import { useState, useEffect } from 'react';
import { certificationAPI } from '../../api/certifications';
import { useDialog } from '../../context/DialogContext';
import { Button, Card } from '../../components/ui';
import './CertificationList.css';

const CertificationList = () => {
    const { showAlert, showError } = useDialog();
    const [certifications, setCertifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

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

    const handleDownload = async (id) => {
        try {
            const response = await certificationAPI.download(id);
            showAlert(response.message); // For now, just show the message
            if (response.data?.download_url) {
                window.open(response.data.download_url, '_blank');
            }
        } catch (error) {
            console.error('Error downloading certificate:', error);
            showError('Erreur lors du téléchargement');
        }
    };

    return (
        <div className="certification-list" style={{ maxWidth: 'var(--max-width)' }}>
            <div className="page-header">
                <div>
                    <h1>Certifications</h1>
                    <p>Gérer les certificats délivrés aux élèves</p>
                </div>
            </div>

            <Card className="search-card">
                <div className="search-form-cert">
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder="Rechercher par nom élève..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                        <Button type="submit">Rechercher</Button>
                    </form>
                    <select
                        className="input"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: 'auto', minWidth: '150px' }}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="valide">Validés</option>
                        <option value="en_attente">En attente</option>
                    </select>
                </div>
            </Card>

            {loading ? (
                <div className="loading-state">Chargement...</div>
            ) : certifications.length > 0 ? (
                <div className="certification-grid">
                    {certifications.map((cert) => (
                        <Card key={cert._id} className="certification-card">
                            <div className="cert-header">
                                <div className="cert-number">{cert.numero_certificat || 'N° en attente'}</div>
                                <span className={`status-badge ${cert.statut}`}>
                                    {cert.statut === 'valide' ? 'Validé' : 'En attente'}
                                </span>
                            </div>
                            <div className="cert-body">
                                <h3>{cert.eleve_id?.nom} {cert.eleve_id?.prenom}</h3>
                                <p className="formation-name">Formation: {cert.formation_id?.nom}</p>
                                <div className="cert-meta">
                                    <span>📅 {new Date(cert.date_obtention).toLocaleDateString()}</span>
                                    <span>📊 {cert.pourcentage_presence_total}% présence</span>
                                </div>
                            </div>
                            <div className="cert-footer">
                                <Button
                                    size="small"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownload(cert._id)}
                                >
                                    📄 Télécharger
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="empty-state">
                    <p>Aucune certification trouvée.</p>
                </Card>
            )}
        </div>
    );
};

export default CertificationList;
