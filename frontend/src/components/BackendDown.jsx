import { API_BASE_URL } from '@app/api/client';

/**
 * The site and the API are separate services now, so "backend isn't running"
 * is a normal state during development. Say so plainly instead of showing an
 * empty page.
 */
export default function BackendDown({ error, onRetry }) {
    return (
        <div className="mx-auto max-w-lg rounded-[28px] border border-amber-200 bg-amber-50/70 px-6 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="mt-4 text-base font-bold text-amber-900">Can't reach the routing service</h2>
            <p className="mt-2 text-sm leading-6 text-amber-800/90">{error}</p>
            <p className="mono mt-3 text-xs text-amber-700/80">API base: {API_BASE_URL}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-5 rounded-full bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
                >
                    Try again
                </button>
            )}
        </div>
    );
}
