'use client';
import dynamic from 'next/dynamic';
import '../../../chess-engine/styles.css'; // Global styles for the chess game

// Dynamically import the App to disable SSR for Three.js
const ChessApp = dynamic(() => import('../../../chess-engine/ui/App').then(mod => mod.App), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
      <h2>جاري تحميل لعبة الشطرنج 3D...</h2>
    </div>
  )
});

export default function ChessPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'auto', position: 'relative' }}>
      {/* Blurred Game Card Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/chess_card.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -2,
          transform: 'scale(1.05)',
          filter: 'brightness(0.3) saturate(1.1)'
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(3,16,32,0.85), rgba(7,26,45,0.92))', zIndex: -1 }} />
      <ChessApp />
    </div>
  );
}
