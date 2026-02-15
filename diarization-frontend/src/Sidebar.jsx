import { NavLink } from 'react-router-dom';
import { Mic, Users, Hexagon } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: "/", icon: Mic, label: "Diarization" },
    { to: "/speakers", icon: Users, label: "Speakers" },
  ];

  return (
    <aside className="w-20 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-6 z-50 shrink-0">
      
      {/* App Logo */}
      <div className="mb-8 text-emerald-500 hover:text-emerald-400 transition-colors cursor-default">
        <Hexagon size={28} strokeWidth={2.5} />
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-4 w-full px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className={({ isActive }) => `
              relative flex items-center justify-center p-3 rounded-xl transition-all duration-300 group
              ${isActive 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300'
              }
            `}
          >
            {({ isActive }) => (
                <>
                    <item.icon 
                        size={24} 
                        strokeWidth={isActive ? 2.5 : 2} 
                        className="transition-transform group-hover:scale-110 duration-300"
                    />
                    
                    {/* Active Indicator Bar */}
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    )}
                </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}