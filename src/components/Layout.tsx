<<<<<<< HEAD

=======
>>>>>>> 36583a8 (Initial commit)
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-full w-full bg-gradient-to-br from-background to-background/80 flex flex-col">
      <header className="w-full py-6 px-8 animate-fade-in">
<<<<<<< HEAD
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-pulse-subtle drop-shadow-sm">
            Stream By Ishmam
          </h1>
=======
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-pulse-subtle drop-shadow-sm">
            Stream By Ishmam
          </h1>
          
          <div className="mt-2 flex items-center justify-center gap-2">
            <span>Contact:</span>
            <a 
              href="https://www.facebook.com/ishmamr.1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 transition-colors"
              aria-label="Facebook"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="inline-block"
              >
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
              </svg>
            </a>
          </div>
>>>>>>> 36583a8 (Initial commit)
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-slide-up">
        {children}
      </main>
      <footer className="w-full py-6 px-8 mt-auto">
<<<<<<< HEAD
        <div className="max-w-6xl mx-auto">
=======
        <div className="max-w-6xl mx-auto flex justify-center items-center">
          {/* Contact information removed from here */}
>>>>>>> 36583a8 (Initial commit)
        </div>
      </footer>
    </div>
  );
};

export default Layout;
