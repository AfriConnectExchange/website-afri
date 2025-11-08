import React from 'react';
import { Header } from '@/components/dashboard/header';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { CategoryGrid } from '@/components/help/category-grid';
import { ArticleList } from '@/components/help/article-list';

export function HelpCenterPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header cartCount={0} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Help Center</h1>
        <p className="text-muted-foreground mb-6">Find answers, guides and support articles.</p>
        <div className="mb-6">
          <SearchBar value={''} onChange={() => {}} onSearch={() => {}} placeholder="Search help articles..." />
        </div>
        <CategoryGrid />
        <div className="mt-8">
          <ArticleList />
        </div>
      </main>
    </div>
  );
}

export default HelpCenterPage;
