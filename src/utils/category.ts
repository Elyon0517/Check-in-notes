import type { BulletCategory } from '@/src/types/models';

export const CATEGORY_META: Record<BulletCategory, { color: string }> = {
  general: { color: '#64748B' },
  study: { color: '#7C3AED' },
  fitness: { color: '#16A34A' },
  work: { color: '#2563EB' },
  health: { color: '#DC2626' },
  life: { color: '#EA580C' },
};

export function getCategoryMeta(category: BulletCategory) {
  return CATEGORY_META[category] ?? CATEGORY_META.general;
}
