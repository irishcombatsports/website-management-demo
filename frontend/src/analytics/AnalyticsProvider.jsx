import { useEffect, useState } from 'react';
import { createAnalyticsTracker, getAnalyticsConsent, setAnalyticsConsent } from './analyticsClient';

export default function AnalyticsProvider() {
  const [consent, setConsent] = useState(() => getAnalyticsConsent());

  useEffect(() => {
    const tracker = createAnalyticsTracker();
    let stop = () => {};
    tracker.start().then(cleanup => {
      stop = cleanup || (() => {});
    });
    return () => stop();
  }, []);

  const choose = (value) => {
    setAnalyticsConsent(value);
    setConsent(value);
  };

  if (consent) return null;

  return (
    <div className="fixed left-3 right-3 bottom-3 z-[70] sm:left-auto sm:max-w-md">
      <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 shadow-2xl p-4">
        <p className="text-white font-bold text-sm">Privacy-first analytics</p>
        <p className="text-zinc-400 text-xs leading-relaxed mt-1">
          This demo can collect anonymous behaviour data to show heat maps and improve the website. No IP addresses are stored.
        </p>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => choose('accepted')} className="btn-primary text-xs px-3 py-2">
            Allow
          </button>
          <button type="button" onClick={() => choose('declined')} className="btn-secondary text-xs px-3 py-2">
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
