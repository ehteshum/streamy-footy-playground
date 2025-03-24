
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-full w-full bg-gradient-to-br from-background to-background/80 flex flex-col">
      <header className="w-full py-6 px-8 animate-fade-in">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-primary">Stream</span>Footy
          </h1>
          <div className="space-x-4">
            <span className="text-sm text-muted-foreground">Modern Football Streaming</span>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-slide-up">
        {children}
      </main>
      <footer className="w-full py-6 px-8 mt-auto">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-center text-muted-foreground">
            Created for personal use only. All streams are user-provided.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
