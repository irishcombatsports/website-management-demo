const ranges = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year', 'Custom'];

const metricCards = [
  ['Visitors Today', '184', '+22%'],
  ['Visitors This Week', '1,248', '+16%'],
  ['Visitors This Month', '5,906', '+31%'],
  ['Conversion Rate', '7.8%', '+1.4%'],
  ['Average Time on Site', '3m 12s', '+38s'],
  ['Live Visitors', '11', 'right now'],
];

const topPages = [
  ['Homepage', 42, 'Best performing page'],
  ['Pricing', 23, 'High intent'],
  ['Admin Demo', 18, 'Strong engagement'],
  ['Contact', 11, 'Most conversions'],
  ['Gallery', 6, 'Low conversion'],
];

const clickedButtons = [
  ['Request Demo', 96],
  ['Admin Demo', 74],
  ['View Demo Options', 58],
  ['Phone number', 31],
  ['Starter Website', 26],
];

const recommendations = [
  'Your Admin Demo button receives strong engagement. Keep it visible near the top of the homepage.',
  'Most mobile visitors stop around the pricing section. Add a second Request Demo button directly after pricing.',
  'Instagram traffic converts better than Facebook traffic. Use Instagram for short walkthrough clips of the admin dashboard.',
  'The gallery gets attention but few enquiries. Add a clear call-to-action underneath it.',
];

const heatPoints = [
  ['12%', '18%', 'h-20 w-20', 'bg-purple-500/50'],
  ['64%', '24%', 'h-28 w-28', 'bg-fuchsia-500/50'],
  ['42%', '46%', 'h-24 w-24', 'bg-orange-400/45'],
  ['76%', '64%', 'h-16 w-16', 'bg-red-400/45'],
  ['26%', '72%', 'h-20 w-20', 'bg-purple-400/40'],
];

function Bar({ label, value, caption }) {
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm mb-2">
        <span className="text-zinc-300">{label}</span>
        <span className="text-zinc-500">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-purple-500" style={{ width: `${value}%` }} />
      </div>
      {caption && <p className="text-zinc-600 text-xs mt-1">{caption}</p>}
    </div>
  );
}

export default function AnalyticsDemo() {
  return (
    <div className="min-h-screen pt-16 bg-black">
      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-purple-300 text-xs font-semibold tracking-widest uppercase mb-2">Behaviour analytics demo</p>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Heat Maps & User Behaviour</h1>
              <p className="text-zinc-400 mt-3 max-w-2xl">
                A privacy-first dashboard showing where visitors click, how far they scroll, what converts and what needs improving.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ranges.slice(0, 4).map((range, index) => (
                <button key={range} type="button" className={index === 2 ? 'btn-primary text-xs px-3 py-2' : 'btn-secondary text-xs px-3 py-2'}>
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {metricCards.map(([label, value, change]) => (
            <div key={label} className="card">
              <p className="text-purple-300 text-2xl font-black">{value}</p>
              <p className="text-white text-sm font-semibold mt-1">{label}</p>
              <p className="text-zinc-500 text-xs mt-1">{change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5">
          <div className="card">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-white font-black text-xl">Homepage Heat Map</h2>
                <p className="text-zinc-500 text-sm mt-1">Click, tap and attention hotspots shown as an easy visual overlay.</p>
              </div>
              <span className="rounded-full bg-green-500/10 text-green-300 text-xs font-semibold px-3 py-1">Live tracking enabled</span>
            </div>

            <div className="relative min-h-[430px] rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-20 bg-zinc-900 border-b border-zinc-800 px-5 py-4">
                <div className="h-3 w-36 rounded bg-zinc-700" />
                <div className="h-2 w-64 rounded bg-zinc-800 mt-3" />
              </div>
              <div className="absolute left-5 right-5 top-28 grid grid-cols-2 gap-4">
                <div className="h-24 rounded-lg bg-zinc-900 border border-zinc-800" />
                <div className="h-24 rounded-lg bg-zinc-900 border border-zinc-800" />
              </div>
              <div className="absolute left-5 right-5 bottom-8 h-36 rounded-lg bg-zinc-900 border border-zinc-800" />
              {heatPoints.map(([left, top, size, color]) => (
                <div
                  key={`${left}-${top}`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl ${size} ${color}`}
                  style={{ left, top }}
                />
              ))}
              <div className="absolute left-5 bottom-5 right-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-black/70 border border-zinc-800 p-3">
                    <p className="text-white font-black">74%</p>
                    <p className="text-zinc-500 text-xs">max scroll</p>
                  </div>
                  <div className="rounded-lg bg-black/70 border border-zinc-800 p-3">
                    <p className="text-white font-black">14</p>
                    <p className="text-zinc-500 text-xs">dead clicks</p>
                  </div>
                  <div className="rounded-lg bg-black/70 border border-zinc-800 p-3">
                    <p className="text-white font-black">3</p>
                    <p className="text-zinc-500 text-xs">rage clicks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card">
              <h2 className="text-white font-black text-xl mb-4">Mobile vs Desktop</h2>
              <div className="space-y-4">
                <Bar label="Mobile" value={64} caption="Most visitors are on phones" />
                <Bar label="Desktop" value={28} />
                <Bar label="Tablet" value={8} />
              </div>
            </div>

            <div className="card">
              <h2 className="text-white font-black text-xl mb-4">Traffic Sources</h2>
              <div className="space-y-4">
                <Bar label="Instagram" value={39} caption="Best converting source" />
                <Bar label="Google" value={31} />
                <Bar label="Direct" value={18} />
                <Bar label="Facebook" value={12} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card">
            <h2 className="text-white font-black text-xl mb-4">Top Pages</h2>
            <div className="space-y-3">
              {topPages.map(([page, percent, note]) => (
                <Bar key={page} label={page} value={percent} caption={note} />
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-white font-black text-xl mb-4">Most Clicked Buttons</h2>
            <div className="space-y-3">
              {clickedButtons.map(([label, clicks]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3">
                  <span className="text-zinc-300 text-sm">{label}</span>
                  <span className="text-white font-bold text-sm">{clicks}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-white font-black text-xl mb-4">Admin Controls</h2>
            <div className="space-y-3">
              {['Enable heat maps', 'Pause tracking', 'Export CSV/PDF', 'Filter by device', 'Compare date ranges', 'Set data retention'].map((item, index) => (
                <div key={item} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3">
                  <span className="text-zinc-300 text-sm">{item}</span>
                  <span className={index < 5 ? 'text-green-300 text-xs font-semibold' : 'text-purple-300 text-xs font-semibold'}>
                    {index < 5 ? 'Ready' : 'Config'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <h2 className="text-white font-black text-2xl">AI Recommendations</h2>
              <p className="text-zinc-500 text-sm mt-1">Plain-English actions a non-technical business owner can understand.</p>
            </div>
            <a href="/#request" className="btn-primary" data-analytics-conversion="Request analytics feature click">Request This Feature</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
            {recommendations.map((item) => (
              <div key={item} className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <p className="text-zinc-200 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
