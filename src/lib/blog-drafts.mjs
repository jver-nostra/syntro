// Retirar un slug solo después de la revisión editorial para publicarlo.
export const blogDrafts = [
  'php2shell-cve-2026-109618-mitigar-sin-parche',
  'cumple-mi-empresa-ley-ia-test',
  'articulo-4-ai-act-alfabetizacion-ia',
  'plan-concienciacion-ciberseguridad-empresas',
  'preparar-proyecto-ia-pyme-costes-retorno',
];

export function isBlogDraft(path) {
  const pathname = new URL(path, 'https://aisecurity.es').pathname.replace(/\/$/, '');
  return blogDrafts.some(slug => pathname === `/blog/${slug}`);
}
