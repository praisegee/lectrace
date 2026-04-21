import type { ExternalReference } from "../../types/trace";
import { formatDate, formatAuthors, referenceLabel } from "../../utils/format";

interface Props {
  link: ExternalReference;
  anchorText?: string;
  style?: React.CSSProperties;
}

export function ExternalLinkCard({ link, anchorText, style }: Props) {
  const label = anchorText ?? referenceLabel(link);

  if (!link.title && !link.authors) {
    return (
      <a href={link.url} target="_blank" rel="noreferrer" style={style}>
        {label}
      </a>
    );
  }

  const anchor = link.url ? (
    <a href={link.url} target="_blank" rel="noreferrer" style={style} className="external-link">{label}</a>
  ) : (
    <span style={style} className="external-link">{label}</span>
  );

  return (
    <span className="link-card-wrapper">
      {anchor}
      <span className="link-hover-panel">
        {link.title && <span className="link-title">{link.title}</span>}
        {link.authors && (
          <span className="link-authors">
            {link.organization && <span className="link-org">[{link.organization}] </span>}
            {formatAuthors(link.authors)}
          </span>
        )}
        {link.date && <span className="link-date">{formatDate(link.date)}</span>}
        {link.description && <span className="link-description">{link.description}</span>}
        {link.notes && (
          <span className="link-notes">
            {link.notes.split("\n").map((line, i) => <span key={i}>{line}</span>)}
          </span>
        )}
      </span>
    </span>
  );
}
