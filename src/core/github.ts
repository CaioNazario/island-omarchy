// Widget GitHub (specs/16-widgets.md `github`): duas buscas da API de busca,
// credencial do `gh auth token` (casos do spike S10 na spec).

export const SEARCH_QUERIES = {
  mine: 'is:pr is:open author:@me',
  review: 'is:pr is:open review-requested:@me',
} as const;

export function searchUrl(query: string): string {
  return `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=1`;
}

/** Credencial só com saída 0 e stdout não vazio. */
export function tokenFromOutput(exitStatus: number, stdout: string): string | null {
  if (exitStatus !== 0) return null;
  const token = stdout.trim();
  return token === '' ? null : token;
}

export type SearchOutcome = 'ok' | 'unauthorized' | 'failed';

/** 401 pede um token novo; rede, 5xx e o resto mantêm o último valor. */
export function outcomeForStatus(status: number): SearchOutcome {
  if (status === 200) return 'ok';
  if (status === 401) return 'unauthorized';
  return 'failed';
}

/** `total_count` da resposta; `null` se não for um inteiro ≥ 0. */
export function parseTotalCount(body: string): number | null {
  try {
    const count = (JSON.parse(body) as { total_count?: unknown }).total_count;
    return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : null;
  } catch {
    return null;
  }
}

export interface GithubCounts {
  mine: number;
  review: number;
}

export interface GithubView {
  label: string;
  /** Sem `gh`, sem login ou 401 persistente: "GitHub" `neutral-400`. */
  unavailable: boolean;
  sub?: string;
}

export function githubView(counts: GithubCounts | null): GithubView {
  if (!counts) return { label: 'GitHub', unavailable: true };
  const label = counts.mine === 1 ? '1 PR' : `${counts.mine} PRs`;
  if (counts.review === 0) return { label, unavailable: false };
  return { label, unavailable: false, sub: `${counts.review} para revisar` };
}
