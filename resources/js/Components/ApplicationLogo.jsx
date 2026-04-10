export default function ApplicationLogo(props) {
    return (
        <svg {...props} viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="none">
            <rect x="4" y="4" width="64" height="64" rx="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
            <path
                d="M17 50C24 39 31 32 40 24C46 19 52 17 58 18"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
            />
            <path
                d="M17 22C24 24 31 28 37 34C43 40 50 45 58 48"
                stroke="rgba(34,211,238,0.36)"
                strokeWidth="4"
                strokeLinecap="round"
            />
            <circle cx="18" cy="49" r="4.5" fill="currentColor" />
            <circle cx="38" cy="33" r="4.5" fill="currentColor" />
            <circle cx="58" cy="18" r="4.5" fill="currentColor" />
            <circle cx="58" cy="48" r="3.5" fill="rgba(251,146,60,0.9)" />
        </svg>
    );
}
