
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-full w-full bg-gradient-to-br from-background to-background/80 flex flex-col">
      <header className="w-full py-6 px-8 animate-fade-in">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-pulse-subtle drop-shadow-sm">
            Stream By Ishmam
          </h1>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-slide-up">
        {children}
      </main>
      <footer className="w-full py-6 px-8 mt-auto">
        <div className="max-w-6xl mx-auto">
        </div>
      </footer>
    </div>
  );
};

export default Layout;
