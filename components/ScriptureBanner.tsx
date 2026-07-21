const VERSE =
  'Love suffers long and is kind; love does not envy; love does not parade itself, is not puffed up; does not behave rudely, does not seek its own, is not provoked, thinks no evil; does not rejoice in iniquity, but rejoices in the truth; bears all things, believes all things, hopes all things, endures all things. Love never fails. But whether there are prophecies, they will fail; whether there are tongues, they will cease; whether there is knowledge, it will vanish away.';

export function ScriptureBanner() {
  return (
    <>
      <div className="header-divider" aria-hidden="true" />
      <figure className="scripture-epigraph" aria-label="Scripture reading">
        <blockquote className="scripture-epigraph__text">{VERSE}</blockquote>
        <figcaption className="scripture-epigraph__ref">I Corinthians 13:4–8</figcaption>
      </figure>
    </>
  );
}
