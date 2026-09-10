'use client';

import Link from 'next/link';
import { Home, Video, BookOpen, GraduationCap, ArrowRight, LucideIcon } from 'lucide-react';
import type { CategorySlug } from '@/lib/types';
import { CATEGORY_SEEDS } from '@/lib/constants';

const CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  'home-decor':    Home,
  'reel-making':   Video,
  'literature':    BookOpen,
  'faculty-corner': GraduationCap,
};

const CATEGORY_COLORS: Record<CategorySlug, { bg: string; icon: string; border: string }> = {
  'home-decor':     { bg: 'bg-amber-50 dark:bg-amber-900/10',   icon: 'text-amber-500',   border: 'hover:border-amber-300' },
  'reel-making':    { bg: 'bg-purple-50 dark:bg-purple-900/10', icon: 'text-purple-500',  border: 'hover:border-purple-300' },
  'literature':     { bg: 'bg-green-50 dark:bg-green-900/10',   icon: 'text-green-500',   border: 'hover:border-green-300' },
  'faculty-corner': { bg: 'bg-blue-50 dark:bg-blue-900/10',     icon: 'text-blue-500',    border: 'hover:border-blue-300' },
};

interface CategoryCardProps {
  slug: CategorySlug;
  count?: number;
}

export function CategoryCard({ slug, count }: CategoryCardProps) {
  const cat = CATEGORY_SEEDS.find((c) => c.id === slug)!;
  const Icon = CATEGORY_ICONS[slug];
  const colors = CATEGORY_COLORS[slug];

  return (
    <Link
      href={`/category/${slug}`}
      className={`group block bg-white dark:bg-zinc-900 rounded-2xl border-2 border-transparent ${colors.border} shadow-sm hover:shadow-xl transition-all duration-300 p-6`}
    >
      <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-7 h-7 ${colors.icon}`} />
      </div>
      <h3 className="text-xl font-bold mb-2">{cat.name}</h3>
      <p className="text-foreground/60 text-sm leading-relaxed mb-5">{cat.description}</p>
      <div className="flex items-center justify-between">
        {count !== undefined ? (
          <span className="text-sm text-foreground/50">{count} approved submission{count !== 1 ? 's' : ''}</span>
        ) : (
          <span />
        )}
        <span className={`flex items-center gap-1 text-sm font-semibold ${colors.icon} group-hover:gap-2 transition-all`}>
          Browse <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
