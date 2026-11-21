export const locales = [
  { code: 'root', prefix: '', lang: 'en', label: 'English' },
  { code: 'pt-br', prefix: '/pt-br', lang: 'pt-BR', label: 'Português' },
] as const;

/** Path of the current page in another locale. */
export function localizedPath(pathname: string, prefix: string): string {
  const bare = pathname.replace(/^\/pt-br(?=\/|$)/, '') || '/';
  return `${prefix}${bare}`;
}
