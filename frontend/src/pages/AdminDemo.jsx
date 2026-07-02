const stats = [
  { label: 'Active members', value: '128', sub: '+14 this month', tone: 'text-purple-300' },
  { label: 'Bookings this week', value: '342', sub: '86% capacity', tone: 'text-blue-300' },
  { label: 'Forms completed', value: '97%', sub: 'waivers and sign-ups', tone: 'text-green-300' },
  { label: 'Monthly revenue', value: '€4.8k', sub: 'demo payment data', tone: 'text-orange-300' },
];

const members = [
  { name: 'Sarah Kelly', plan: 'Unlimited Membership', status: 'Active', due: 'Renews 28 Jul', tag: 'Signed' },
  { name: 'Daniel Moore', plan: 'Trial Week', status: 'Trial', due: 'Follow up today', tag: 'Waiver pending' },
  { name: 'Aisha Byrne', plan: 'Small Group Coaching', status: 'Active', due: 'Booked Tue 7pm', tag: 'Signed' },
  { name: 'Mark Collins', plan: 'Monthly Plan', status: 'Payment issue', due: 'Retry scheduled', tag: 'Signed' },
];

const activity = [
  'New enquiry from Fitness Studio demo style',
  '3 members booked tonight’s 6pm class',
  'Payment reminder queued for Mark Collins',
  'Waiver completed by Sarah Kelly',
  'Attendance exported for this week',
];

const tools = [
  ['Members', 'Search members, view plans, notes, waivers and payment status.'],
  ['Bookings', 'Track class attendance, sign-ups, trials, consultations or fixtures.'],
  ['Forms', 'Collect waivers, enquiries, surveys and custom registration details.'],
  ['Payments', 'Show subscription status, payment history and failed payment alerts.'],
  ['Reports', 'Export lists, review activity and spot follow-up tasks quickly.'],
  ['Settings', 'Update business details, pricing, services, schedules and contact info.'],
];

export default function AdminDemo() {
  return (
    <div className="min-h-screen pt-16 bg-black">
      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-purple-300 text-xs font-semibold tracking-widest uppercase mb-2">Public admin preview</p>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Management System Demo</h1>
              <p className="text-zinc-400 mt-3 max-w-2xl">
                A read-only example of the admin tools customers can get with the Growth and Pro packages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/#packages" className="btn-secondary">View Packages</a>
              <a href="/#request" className="btn-primary">Request This System</a>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((item) => (
            <div key={item.label} className="card">
              <p className={`text-2xl sm:text-3xl font-black ${item.tone}`}>{item.value}</p>
              <p className="text-white font-semibold text-sm mt-1">{item.label}</p>
              <p className="text-zinc-500 text-xs mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-5 mt-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-white font-black text-xl">Member & Customer List</h2>
                <p className="text-zinc-500 text-sm mt-1">Example records with plan, booking and follow-up status.</p>
              </div>
              <button className="btn-secondary text-sm" type="button">Export</button>
            </div>

            <div className="overflow-x-auto -mx-5">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-y border-zinc-800 bg-zinc-950/70 text-left">
                    <th className="px-5 py-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Plan</th>
                    <th className="px-5 py-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Next action</th>
                    <th className="px-5 py-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Forms</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.name} className="border-b border-zinc-800">
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-semibold">{member.name}</p>
                        <p className="text-zinc-500 text-xs">customer@example.com</p>
                      </td>
                      <td className="px-5 py-4 text-zinc-300 text-sm">{member.plan}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-purple-500/10 text-purple-200 px-2.5 py-1 text-xs font-semibold">
                          {member.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-400 text-sm">{member.due}</td>
                      <td className="px-5 py-4 text-zinc-400 text-sm">{member.tag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card">
              <h2 className="text-white font-black text-xl mb-4">Activity Notifications</h2>
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3">
                    <p className="text-zinc-300 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-white font-black text-xl mb-4">Today</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-zinc-400">6pm class</span><span className="text-white font-semibold">18 booked</span></div>
                <div className="flex justify-between gap-3"><span className="text-zinc-400">New trials</span><span className="text-white font-semibold">4</span></div>
                <div className="flex justify-between gap-3"><span className="text-zinc-400">Forms pending</span><span className="text-white font-semibold">2</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-white font-black text-2xl mb-4">What Customers Can Manage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map(([title, text]) => (
              <div key={title} className="card">
                <h3 className="text-white font-bold">{title}</h3>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
