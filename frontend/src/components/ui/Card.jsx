import './Card.css';

/**
 * Card Component
 * Professional card container for content
 */
const Card = ({ children, className = '', onClick, hover = false }) => {
    const classNames = ['card', hover && 'card-hover', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classNames} onClick={onClick}>
            {children}
        </div>
    );
};

export default Card;
