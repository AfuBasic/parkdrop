import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

export function AuthLayout({ children, onBack, showBack = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 md:p-12 relative overflow-hidden">
      {/* Decorative background elements to make it premium */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md flex-1 flex flex-col z-10">
        <header className="flex items-center justify-between mb-12">
          {showBack && onBack ? (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-black/5 -ml-2">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          ) : (
            <div className="w-10 h-10" />
          )}
          
          <div className="flex items-center gap-3">
            <img src="/parkdrop-icon-only.png" alt="ParkDrop Logo" className="w-9 h-9 object-contain" />
            <span className="font-bold text-xl tracking-tight">ParkDrop</span>
          </div>

          <div className="w-10 h-10" />
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
