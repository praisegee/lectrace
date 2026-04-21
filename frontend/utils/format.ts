export function formatNumber(x: number | string): string {
  if (typeof x === "string") return x; // nan, inf
  if (Math.abs(x) > 1e12) return x.toExponential(3);
  if (Math.abs(x) > 1e6) return x.toLocaleString();
  if (Number.isInteger(x * 1000)) return x.toString();
  return x.toFixed(4);
}

export function formatDate(date: string): string {
  return date.split("T")[0];
}

export function formatAuthors(authors: string[]): string {
  const max = 10;
  if (authors.length <= max) return authors.join(", ");
  const omitted = authors.length - max;
  return `${authors.slice(0, max / 2).join(", ")} … (${omitted} more) … ${authors.slice(-max / 2).join(", ")}`;
}

export function referenceLabel(ref: { authors?: string[]; date?: string; title?: string; url?: string }): string {
  if (ref.authors?.length) {
    const first = ref.authors[0];
    const name = /\bTeam\b/.test(first) ? first : first.split(" ").at(-1)!;
    const plus = ref.authors.length > 1 ? "+" : "";
    const year = ref.date?.slice(0, 4) ?? "?";
    return `[${name}${plus} ${year}]`;
  }
  return ref.title ?? ref.url ?? "?";
}
