import { useId } from 'react';

export default function ApplicationLogo({ className, ...props }) {
    const uid = useId().replace(/[:]/g, '');
    const pinGradId = `gt-pin-${uid}`;
    const ringGlowId = `gt-ring-glow-${uid}`;

    return (
        <svg className={className} {...props} viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="none">
            <defs>
                <linearGradient id={pinGradId} x1="10" y1="6" x2="58" y2="66" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="45%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>
                <filter id={ringGlowId} x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="1.4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Pin body */}
            <path
                d="M36 3C19.98 3 7 15.98 7 32c0 20.5 25.4 35.6 27.7 36.9a2.5 2.5 0 0 0 2.6 0C39.6 67.6 65 52.5 65 32 65 15.98 52.02 3 36 3z"
                fill={`url(#${pinGradId})`}
            />
            {/* Subtle top sheen */}
            <path
                d="M36 3C19.98 3 7 15.98 7 32c0 3.2.42 6.24 1.2 9.1C10.6 24.9 22 12 36 12c14 0 25.4 12.9 27.8 29.1.78-2.86 1.2-5.9 1.2-9.1C65 15.98 52.02 3 36 3z"
                fill="white"
                fillOpacity="0.14"
            />

            {/* Inner dark disc (road map core) */}
            <circle cx="36" cy="31" r="17" fill="#0b1b1e" fillOpacity="0.92" />

            {/* Cross streets */}
            <path d="M36 15v32M20 31h32" stroke="white" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" />
            {/* Diagonal goli (alley) route */}
            <path d="M25 24l9 7 9-3.5" stroke="#fbbf24" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 5.5" />
            {/* Alt curved route */}
            <path d="M24 38c4-1 7-3.5 8-7" stroke="#2dd4bf" strokeWidth="2.25" strokeLinecap="round" strokeDasharray="1 5" />

            {/* Hub / intersection node */}
            <circle cx="36" cy="31" r="4.5" fill="white" />
            <circle cx="36" cy="31" r="4.5" fill="none" stroke={`url(#${pinGradId})`} strokeWidth="1.6" filter={`url(#${ringGlowId})`} />

            {/* Live location pulse marker on the stem */}
            <circle cx="36" cy="58" r="3" fill="#fb923c" />
            <circle cx="36" cy="58" r="3" fill="#fb923c" opacity="0.55">
                <animate attributeName="r" values="3;7.5;3" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}
