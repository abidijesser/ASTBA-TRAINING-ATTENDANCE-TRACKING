import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button, Card } from './ui';

const FormationCard = ({ formation, handleDelete, isResponsable }) => {
    const { t } = useLanguage();

    return (
        <Card className="formation-card">
            <div className="formation-header">
                <h3>{formation.nom}</h3>
                <span className="formation-price">
                    {formation.prix > 0 ? `${formation.prix} MAD` : t('common.free')}
                </span>
            </div>

            <p className="formation-desc">
                {formation.description?.substring(0, 100)}
                {formation.description?.length > 100 ? '...' : ''}
            </p>

            <div className="formation-meta">
                <span className="badge-info">
                    {formation.niveau_requis}
                </span>
                <span>
                    📅 {formation.duree_estimee} {t('formation.months')}
                </span>
                <span>
                    👨‍🏫 {formation.responsable_id ? `${formation.responsable_id.prenom} ${formation.responsable_id.nom}` : t('common.unknown')}
                </span>
            </div>

            <div className="formation-actions">
                <Link to={`/formations/${formation._id}`} style={{ flex: 1 }}>
                    <Button variant="primary" fullWidth>
                        {t('formation.viewDetails')}
                    </Button>
                </Link>
                {isResponsable && (
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(formation._id)}
                        className="btn-icon"
                        aria-label={t('common.delete')}
                    >
                        🗑️
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default FormationCard;
