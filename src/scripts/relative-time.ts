/**
 * Formata data/hora ISO em tempo relativo amigável (pt-BR).
 * Não inventa valores — retorna null se a data for inválida.
 */
export function formatRelativeTime(
  isoDate: string | null | undefined,
  now: number = Date.now(),
): string | null {
  if (!isoDate || typeof isoDate !== 'string') return null;

  const then = Date.parse(isoDate);
  if (!Number.isFinite(then)) return null;

  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.floor(hours / 24);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}
