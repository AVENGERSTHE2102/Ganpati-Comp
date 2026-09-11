'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Video, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

const categories = [
  {
    id: 'home-decor',
    title: 'Home Decor',
    description: 'Showcase your beautiful and eco-friendly Ganpati makhar and home decorations.',
    icon: Home,
    color: 'text-saffron',
    bg: 'bg-saffron/10',
  },
  {
    id: 'reel-making',
    title: 'Reel Making',
    description: 'Capture the festive spirit through creative short videos and reels.',
    icon: Video,
    color: 'text-burgundy',
    bg: 'bg-burgundy/10',
  },
  {
    id: 'literature',
    title: 'Literature',
    description: 'Express your devotion through essays, poems, and stories about Lord Ganesha.',
    icon: BookOpen,
    color: 'text-saffron',
    bg: 'bg-saffron/10',
  },
  {
    id: 'faculty-corner',
    title: 'Faculty Corner',
    description: 'A special category for our esteemed faculty to share their festive joy.',
    icon: GraduationCap,
    color: 'text-burgundy',
    bg: 'bg-burgundy/10',
  },
];

export function Categories() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { counts: {} }))
      .then((data) => setCounts(data.counts || {}))
      .catch((err) => console.error('Failed to fetch category counts:', err));
  }, []);

  return (
    <section className="py-14 sm:py-20 bg-background relative border-t border-saffron/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-burgundy dark:text-foreground mb-3 sm:mb-4">
            Competition Categories
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto text-base sm:text-lg">
            Choose your category and showcase your talent to the entire college community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = counts[category.id] ?? 0;

            return (
              <div key={category.id} className="h-full">
                <Link
                  href={`/category/${category.id}`}
                  className="group bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all border border-black/5 dark:border-white/5 cursor-pointer relative overflow-hidden flex flex-col h-full justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                      <div
                        className={`w-12 sm:w-14 h-12 sm:h-14 rounded-xl ${category.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <Icon className={`w-6 sm:w-7 h-6 sm:h-7 ${category.color}`} />
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-foreground/5 text-foreground/70 border border-foreground/10">
                        {count} {count === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{category.title}</h3>
                    <p className="text-foreground/70 text-xs sm:text-sm leading-relaxed mb-4">
                      {category.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-saffron pt-2 group-hover:gap-2 transition-all">
                    <span>Explore Submissions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-saffron to-burgundy transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

