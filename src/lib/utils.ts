/**
 * Utilitário simples para combinar classes CSS
 * Substitui a necessidade de clsx e tailwind-merge para casos simples
 */
export function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ')
}
