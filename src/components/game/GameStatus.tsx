'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Archive, Layers, Info } from 'lucide-react';

interface GameStatusProps {
  deckSize: number;
  discardSize: number;
  message: string | null;
}

export default function GameStatus({ deckSize, discardSize, message }: GameStatusProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="w-5 h-5" />
            <span className="font-medium text-foreground">{deckSize}</span>
            <span className="hidden sm:inline">in Deck</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Archive className="w-5 h-5" />
            <span className="font-medium text-foreground">{discardSize}</span>
            <span className="hidden sm:inline">in Discard</span>
          </div>
        </div>
        {message && (
          <div className="flex items-center gap-2 text-primary font-semibold text-center">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
