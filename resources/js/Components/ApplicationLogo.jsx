import { useId } from 'react';

export default function ApplicationLogo({ className, ...props }) {
    const uid = useId().replace(/[:]/g, '');
    const gradId = `gt-grad-${uid}`;
    const glowId = `gt-glow-${uid}`;
    const bgId = `gt-bg-${uid}`;

    return (
        <svg className={className} {...props} viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="none">
            <defs>
                <linearGradient id={gradId} x1="10" y1="10" x2="62" y2="62" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="55%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <radialGradient id={bgId} cx="30%" cy="25%" r="80%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
                <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Badge shell */}
            <rect x="3" y="3" width="66" height="66" rx="19" fill={`url(#${bgId})`} stroke={`url(#${gradId})`} strokeWidth="1.4" strokeOpacity="0.55" />
            <rect x="7.5" y="7.5" width="57" height="57" rx="14.5" fill="none" stroke="currentColor" strokeOpacity="0.08" />

            {/* Faint alt-route */}
            <path
                d="M16 22C23 24.5 30 28.5 36 34C42 39.5 49.5 44.5 58 47.5"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1 7"
            />

            {/* Primary route - glowing gradient */}
            <path
                d="M16 51C23.5 40 30.5 33 39.5 25.5C45.5 20.5 52 18 58 19"
                stroke={`url(#${gradId})`}
                strokeWidth="4.75"
                strokeLinecap="round"
                filter={`url(#${glowId})`}
            />

            {/* Start node */}
            <circle cx="16" cy="51" r="4.5" fill={`url(#${gradId})`} />

            {/* Interchange hub node - halo ring */}
            <circle cx="39.5" cy="25.5" r="9" fill="none" stroke={`url(#${gradId})`} strokeOpacity="0.28" strokeWidth="1.2" />
            <circle cx="39.5" cy="25.5" r="5.25" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />

            {/* Destination node */}
            <circle cx="58" cy="19" r="4.5" fill="currentColor" />

            {/* Live pulse marker */}
            <circle cx="58" cy="48" r="3.25" fill="#fb923c" />
            <circle cx="58" cy="48" r="3.25" fill="#fb923c" opacity="0.55">
                <animate attributeName="r" values="3.25;8;3.25" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.55;0;0.55" dur="2.4s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}
