import { Link } from 'react-router-dom';

const SCHEDULE = [
  {
    day: 'Monday',
    classes: [
      { time: '6:00 - 7:00pm', name: 'Kids Fundamentals', level: '7-10 years old', desc: 'Fun movement, fitness, and skill fundamentals for kids. Currently full, join the waiting list.', color: 'purple' },
    ],
  },
  {
    day: 'Tuesday',
    classes: [
      { time: '5:00 - 6:00pm', name: 'Circuits', level: 'All levels', desc: 'Fitness, strength and conditioning circuit work for all experience levels.', color: 'yellow' },
      { time: '6:00 - 7:00pm', name: 'Mixed Training', level: 'Beginner friendly', desc: 'High-energy fitness with simple technique, movement, and conditioning.', color: 'green' },
      { time: '7:00 - 8:00pm', name: 'Fundamentals', level: 'All levels', desc: 'Technique-focused class for members building consistent training habits.', color: 'blue' },
    ],
  },
  {
    day: 'Wednesday',
    classes: [
      { time: '6:00 - 7:00pm', name: 'Kids Fundamentals', level: '7-10 years old', desc: 'Kids movement and fitness fundamentals. Currently full, waiting list available.', color: 'purple' },
      { time: '8:00 - 9:00pm', name: 'Strength', level: 'Intermediate', desc: 'Skills, strength work, and conditioning for suitable members.', color: 'blue' },
    ],
  },
  {
    day: 'Thursday',
    classes: [
      { time: '5:00 - 6:00pm', name: 'Circuits', level: 'All levels', desc: 'Full-body fitness session built around strength, mobility and conditioning.', color: 'yellow' },
      { time: '6:00 - 7:00pm', name: 'Mixed Training', level: 'Beginner friendly', desc: 'Fundamentals fitness class combining proper form, footwork and a solid workout.', color: 'green' },
    ],
  },
  {
    day: 'Friday',
    classes: [
      { time: '6:00 - 7:00pm', name: 'Mixed Training', level: 'Beginner friendly', desc: 'Suitable for beginners and returning members who want fitness and fundamentals.', color: 'green' },
      { time: '7:00 - 8:00pm', name: 'Advanced Session', level: 'Coach approval', desc: 'Higher-intensity training for members cleared by a coach.', color: 'blue' },
    ],
  },
];

const colorMap = {
  purple:    { bg: 'bg-purple-500/10',    border: 'border-purple-500/30',    text: 'text-purple-300',    dot: 'bg-purple-400' },
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300',   dot: 'bg-blue-400' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-300',  dot: 'bg-green-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', dot: 'bg-yellow-400' },
};

export default function Schedule() {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto pt-12">
        <div className="text-center mb-10">
          <p className="text-purple-400 text-xs font-semibold tracking-widest uppercase mb-3">123 Main Street · Your Town</p>
          <h1 className="text-4xl font-black text-white mb-3">
            Training Club <span className="text-purple-400">Timetable</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto">
            Weekly classes from the sample timetable. Mixed Training is suitable for beginners, circuits are suitable for all levels, and advanced sessions can require coach approval.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <section className="space-y-3">
            {SCHEDULE.map(({ day, classes }) => (
              <div key={day} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="flex items-stretch">
                  <div className="w-24 sm:w-32 flex-shrink-0 flex flex-col items-center justify-center py-4 px-2 border-r border-zinc-800">
                    <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">{day}</p>
                  </div>
                  <div className="flex-1 p-3 space-y-2">
                    {classes.map((cls) => {
                      const c = colorMap[cls.color];
                      return (
                        <div key={`${day}-${cls.time}-${cls.name}`} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg px-4 py-3.5 border ${c.bg} ${c.border}`}>
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
                            <div>
                              <p className={`font-bold text-sm ${c.text}`}>{cls.name}</p>
                              <p className="text-zinc-500 text-xs mt-0.5">{cls.level}</p>
                              <p className="text-zinc-400 text-xs leading-relaxed mt-2 max-w-md">{cls.desc}</p>
                            </div>
                          </div>
                          <p className="text-zinc-300 text-sm font-semibold whitespace-nowrap sm:ml-4 sm:text-right">{cls.time}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900 p-5 aspect-[4/3] flex flex-col justify-end">
              <p className="text-white font-semibold">Timetable poster</p>
              <p className="text-zinc-500 text-sm">Replace with a club schedule image if needed.</p>
            </div>
            <div className="card">
              <p className="text-white font-bold text-lg mb-3">What to bring</p>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>Clean runners and comfortable training gear</li>
                <li>Water bottle and towel</li>
                <li>Any equipment your coach asks you to bring</li>
                <li>Notebook or phone for programme notes if useful</li>
              </ul>
            </div>
            <div className="card">
              <p className="text-white font-bold text-lg mb-2">Kids classes</p>
              <p className="text-zinc-400 text-sm">Kids classes can be adapted for youth fitness, skills, or sport-specific sessions. New enquiries can use the waiting list.</p>
              <Link to="/waiting-list" className="btn-primary w-full mt-4 text-sm py-2.5">Join Kids Waiting List</Link>
            </div>
          </aside>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm mb-4">Drop-in classes are available from €10 where space allows.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary px-8 py-3">
              Book A Class
            </Link>
            <a href="https://instagram.com/trainingclub" target="_blank" rel="noopener noreferrer" className="btn-secondary px-8 py-3">
              DM @trainingclub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
