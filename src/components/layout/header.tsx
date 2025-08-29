import { Bot } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b border-border/40 bg-card/20 backdrop-blur-lg sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Bot
          className="w-8 h-8 text-primary"
          style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)))' }}
        />
        <h1 className="text-2xl font-bold text-foreground">CrewView</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent/90"></span>
        </span>
        <span className="text-sm text-muted-foreground">
          All systems operational
        </span>
      </div>
    </header>
  );
}
