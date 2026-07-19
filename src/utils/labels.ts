export function formatUnderscoredLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function formatResourceContext(role: string, contentType: string): string {
  return `${formatUnderscoredLabel(role)} of ${formatUnderscoredLabel(
    contentType,
  )}`;
}
