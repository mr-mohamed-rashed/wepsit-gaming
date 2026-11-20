'use client';

import { useState, useEffect, useRef } from 'react';

interface CoinCounterProps {
  coins: number;
}

export default function CoinCounter({ coins }: CoinCounterProps) {
  const [displayedCoins, setDisplayedCoins] = useState(coins);
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; text: string }[]>([]);
  const prevCoinsRef = useRef(coins);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If coins increased, show floating reward text
    const diff = coins - prevCoinsRef.current;
    if (diff > 0) {
      const id = Date.now() + Math.random();
      setFloatingCoins((prev) => [...prev, { id, text: `+${diff}` }]);
      
      // Clear floating text after animation ends
      setTimeout(() => {
        setFloatingCoins((prev) => prev.filter((item) => item.id !== id));
      }, 1200);

      // Smooth running number ticker
      if (timerRef.current) clearInterval(timerRef.current);
      
      const target = coins;
      let current = displayedCoins;
      const increment = Math.ceil(diff / 20);

      timerRef.current = setInterval(() => {
        current += increment;
        if (current >= target) {
          setDisplayedCoins(target);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setDisplayedCoins(current);
        }
      }, 30);
    } else if (diff < 0) {
      // Coins decreased, update directly
      setDisplayedCoins(coins);
    } else {
      setDisplayedCoins(coins);
    }

    prevCoinsRef.current = coins;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [coins]);

  return (
    <div className="relative flex items-center bg-slate-950/60 border border-amber-500/30 rounded-full py-1.5 px-4 shadow-inner glow-accent">
      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center text-xs font-bold text-slate-950 coin-rotate shadow-lg mr-2">
        🪙
      </div>
      <span className="font-mono font-bold text-amber-400 text-lg">
        {displayedCoins}
      </span>
      {floatingCoins.map((fc) => (
        <span
          key={fc.id}
          className="absolute -top-6 left-10 text-emerald-400 font-black text-sm coin-float"
        >
          {fc.text}
        </span>
      ))}
    </div>
  );
}
