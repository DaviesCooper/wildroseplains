import { Link } from 'react-router-dom';
import './HomePage.css';

const highlightCards = [
  {
    title: 'Deck Boxes',
    to: '/deck_boxes',
    accent: 'var(--color-oak)',
    background: `url("/${Math.random() < 0.5 ? '1' : '5'}.png")`,
  },
  {
    title: 'Gallery',
    to: '/gallery',
    accent: 'var(--color-ink)',
    background: 'url("/10.png")',
    clipCircle: true,
  },
];

export const HomePage = () => {
  return (
    <div className="page home">
      <section className="hero hero--center">
        <img src="/logo.svg" alt="Wildrose Plains crest" className="hero-logo" />
        <h1>Wildrose Plains</h1>
      </section>

      <div className="home-portal-wrap">
        <div className="home-grid">
          {highlightCards.map((card) => (
                <Link
                  key={card.title}
                  to={card.to}
                  className={`portal-card ${card.title === 'Deck Boxes' ? 'portal-card--deck-boxes' : ''}`}
                >
            <div
              className="portal-card__media"
              style={{
                backgroundImage: card.background,
                ...(card.clipCircle
                  ? {
                      clipPath: 'ellipse(35% 40% at 50% 50%)',
                      backgroundPosition: 'center 50%',
                    }
                  : {}),
              }}
            />
              <div className="portal-card__body">
                <h2>{card.title}</h2>
              </div>
              <div className="portal-card__glow" style={{ background: card.accent }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

