// Widget GitHub (specs/16-widgets.md `github`): duas buscas da API de busca,
// credencial do `gh auth token` (casos do spike S10 na spec).
import { tr, trCount } from './i18n.mjs';
export const SEARCH_QUERIES = {
    mine: 'is:pr is:open author:@me',
    review: 'is:pr is:open review-requested:@me',
};
export function searchUrl(query) {
    return `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=1`;
}
/** Credencial só com saída 0 e stdout não vazio. */
export function tokenFromOutput(exitStatus, stdout) {
    if (exitStatus !== 0)
        return null;
    const token = stdout.trim();
    return token === '' ? null : token;
}
/** 401 pede um token novo; rede, 5xx e o resto mantêm o último valor. */
export function outcomeForStatus(status) {
    if (status === 200)
        return 'ok';
    if (status === 401)
        return 'unauthorized';
    return 'failed';
}
/** `total_count` da resposta; `null` se não for um inteiro ≥ 0. */
export function parseTotalCount(body) {
    try {
        const count = JSON.parse(body).total_count;
        return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : null;
    }
    catch (_a) {
        return null;
    }
}
export function githubView(counts, lang) {
    if (!counts)
        return { label: 'GitHub', unavailable: true };
    const label = trCount(lang, counts.mine, '1 PR', '{n} PRs');
    if (counts.review === 0)
        return { label, unavailable: false };
    return { label, unavailable: false, sub: tr(lang, '{n} to review', { n: counts.review }) };
}
