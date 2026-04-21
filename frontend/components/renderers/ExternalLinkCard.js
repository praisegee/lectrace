import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDate, formatAuthors, referenceLabel } from "../../utils/format";
export function ExternalLinkCard({ link, anchorText, style }) {
    const label = anchorText ?? referenceLabel(link);
    if (!link.title && !link.authors) {
        return (_jsx("a", { href: link.url, target: "_blank", rel: "noreferrer", style: style, children: label }));
    }
    const anchor = link.url ? (_jsx("a", { href: link.url, target: "_blank", rel: "noreferrer", style: style, className: "external-link", children: label })) : (_jsx("span", { style: style, className: "external-link", children: label }));
    return (_jsxs("span", { className: "link-card-wrapper", children: [anchor, _jsxs("span", { className: "link-hover-panel", children: [link.title && _jsx("span", { className: "link-title", children: link.title }), link.authors && (_jsxs("span", { className: "link-authors", children: [link.organization && _jsxs("span", { className: "link-org", children: ["[", link.organization, "] "] }), formatAuthors(link.authors)] })), link.date && _jsx("span", { className: "link-date", children: formatDate(link.date) }), link.description && _jsx("span", { className: "link-description", children: link.description }), link.notes && (_jsx("span", { className: "link-notes", children: link.notes.split("\n").map((line, i) => _jsx("span", { children: line }, i)) }))] })] }));
}
