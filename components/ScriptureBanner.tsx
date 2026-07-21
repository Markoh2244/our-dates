import { CrossIcon, DoveIcon, OliveBranchIcon } from './ChristianIcons';

const VERSE =
  'Love suffers long and is kind; love does not envy; love does not parade itself, is not puffed up; does not behave rudely, does not seek its own, is not provoked, thinks no evil; does not rejoice in iniquity, but rejoices in the truth; bears all things, believes all things, hopes all things, endures all things. Love never fails. But whether there are prophecies, they will fail; whether there are tongues, they will cease; whether there is knowledge, it will vanish away.';

export function ScriptureBanner() {
  return (
    <section className="scripture-banner" aria-label="Scripture reading">
      <div className="scripture-banner__ornament scripture-banner__ornament--left">
        <OliveBranchIcon size={28} />
      </div>
      <div className="scripture-banner__ornament scripture-banner__ornament--right">
        <OliveBranchIcon size={28} />
      </div>

      <div className="scripture-banner__icons">
        <CrossIcon size={22} />
        <DoveIcon size={22} />
        <CrossIcon size={22} />
      </div>

      <blockquote className="scripture-banner__text">{VERSE}</blockquote>
      <p className="scripture-banner__ref">I Corinthians 13:4-8</p>
    </section>
  );
}
