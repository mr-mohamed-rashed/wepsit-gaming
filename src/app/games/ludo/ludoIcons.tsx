import React from 'react';

interface IconProps {
  className?: string;
}

export const StarShieldIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2.2l2.92 5.91 6.53.95-4.72 4.6 1.11 6.5L12 17.09l-5.84 3.07 1.11-6.5-4.72-4.6 6.53-.95L12 2.2z" />
  </svg>
);

export const StartLaunchIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2.5c3.8 1.9 6 6.1 5.4 10.6l2.4 2.4c.4.4.1 1.1-.5 1.1h-3.4l-1.9 3.6c-.3.6-1.1.6-1.4 0l-.6-1.1-.6 1.1c-.3.6-1.1.6-1.4 0l-1.9-3.6H4.7c-.6 0-.9-.7-.5-1.1l2.4-2.4C6 8.6 8.2 4.4 12 2.5zm0 4.5a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6z" />
  </svg>
);

export const DirectionArrowIcon: React.FC<IconProps & { angle?: number }> = ({
  className = 'w-3.5 h-3.5',
  angle = 0,
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={{ transform: `rotate(${angle}deg)` }}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h13" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export const CrownIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M3.5 18.5h17v2h-17v-2zm.5-2L2.5 7.5l5 3.8L12 4.5l4.5 6.8 5-3.8L20 16.5H4z" />
  </svg>
);

export const PeaceWarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M5 18L19 4M14 4h5v5M5 9l4 4"
      stroke="#fbbf24"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 18L5 4M5 4h5M5 4v5M19 9l-4 4"
      stroke="#38bdf8"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="18.5" r="2.2" fill="#22c55e" />
  </svg>
);

export const PeaceDoveIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M20.5 6.5c-1.8.2-3.4 1.1-4.5 2.4-.9-2.4-3.1-4.2-5.8-4.4-.6 0-1 .6-.7 1.1.9 1.6.9 3.6 0 5.2-1.8-.4-3.7-1.4-5.1-2.8-.4-.4-1.1-.1-1.1.5 0 4.2 3.1 7.7 7.1 8.4-.7 1.3-1.9 2.3-3.4 2.8-.6.2-.5 1.1.1 1.2 4.9.8 9.8-1.9 11.7-6.5.8-1.9 1.1-4 .9-6 .9-.6 1.5-1.5 1.7-2.5.1-.5-.4-.9-.9-.9-.3.1-.6.3-1 .5z" />
  </svg>
);

export const WarSwordsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M19 21l2-2" />
    <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
    <path d="M11 19l-6-6" />
    <path d="M8 16l-4 4" />
    <path d="M5 21l-2-2" />
  </svg>
);

export const LockClosedIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const ChestRewardIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <rect x="3" y="8" width="18" height="12" rx="2.5" fill="#dc2626" stroke="#fde68a" strokeWidth="1.5" />
    <path d="M3 12h18" stroke="#fde68a" strokeWidth="2" />
    <rect x="10" y="10" width="4" height="4.5" rx="1" fill="#fbbf24" />
    <path d="M7.5 8c0-2.2 1.8-3.8 4.5-3.8S16.5 5.8 16.5 8" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const CoinGoldIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" fill="url(#ludoCoinGrad)" stroke="#fef08a" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="6.5" stroke="#92400e" strokeOpacity="0.45" strokeWidth="1.2" />
    <path d="M12 7.5v9M9.8 10c0-1.1 1-1.8 2.2-1.8s2.2.7 2.2 1.8c0 2-4.4 1.6-4.4 3.8 0 1.1 1 1.9 2.2 1.9s2.2-.8 2.2-1.9" stroke="#78350f" strokeWidth="1.7" strokeLinecap="round" />
    <defs>
      <linearGradient id="ludoCoinGrad" x1="3" y1="3" x2="21" y2="21">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

export const TrophyCupIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M6 3h12v5a6 6 0 0 1-12 0V3zm-3 2h2v3a3 3 0 0 1-2.5-2.96V5zm16 0h2v.04A3 3 0 0 1 19 8V5zm-8 10.9V19H8v2h8v-2h-3v-3.1a7.9 7.9 0 0 1-2 0z" />
  </svg>
);

export const SettingsGearIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09c-.658.003-1.25.396-1.51 1z" />
  </svg>
);

export const MailInboxIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
  </svg>
);

export const EmoteSmileIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.6" />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.6" />
  </svg>
);

export const ChatBubbleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5 8.8 8.8 0 0 1-3.8-.85L3 21l1.4-4.7A8.5 8.5 0 1 1 21 12z" />
  </svg>
);

export const GridMenuIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
);

export const HelpQuestionIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.5 9.2a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 2.2-2.5 3.8" />
    <line x1="12" y1="17.2" x2="12.01" y2="17.2" strokeWidth="2.6" />
  </svg>
);

export const DoorExitIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const SpeakerToggleIcon: React.FC<IconProps & { muted?: boolean }> = ({
  className = 'w-4 h-4',
  muted = false,
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {muted ? (
      <>
        <line x1="22" y1="9" x2="16" y2="15" />
        <line x1="16" y1="9" x2="22" y2="15" />
      </>
    ) : (
      <>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    )}
  </svg>
);
