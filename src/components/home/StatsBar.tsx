"use client";

import { Home, Truck, Leaf, UsersRound } from "lucide-react";

const stats = [
  {
    icon: Home,
    title: "Farm Fresh",
    desc: "Sourced directly from our farm",
  },
  {
    icon: Truck,
    title: "Delivered Daily",
    desc: "Before sunrise to your door",
  },
  {
    icon: Leaf,
    title: "Pure & Natural",
    desc: "No preservatives. No additives",
  },
  {
    icon: UsersRound,
    title: "5000+ Families",
    desc: "Trust us every morning",
  },
];

const StatsBar = () => {
  return (
    <section id="stats-bar" className="relative z-10 bg-white px-3 pt-1 pb-4 md:px-4 md:pt-10">
      <div className="mx-auto max-w-6xl">

        {/* ── Mobile: horizontal 4-column row ── */}
        <div className="grid grid-cols-4 gap-1.5 md:hidden">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center gap-1 p-2 rounded-2xl bg-white border border-sky-100 shadow-sm"
              >
                {/* Icon circle */}
                <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-[#02429C] flex-shrink-0">
                  <Icon size={16} strokeWidth={1.6} />
                </div>
                {/* Title */}
                <p className="text-[10px] font-extrabold text-[#013378] leading-tight">
                  {item.title}
                </p>
                {/* Description */}
                <p className="text-[8.5px] font-normal text-gray-400 leading-tight">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Desktop: existing horizontal bar (unchanged) ── */}
        <div className="hidden md:grid md:grid-cols-4 lg:rounded-[32px] lg:border lg:border-sky-100 lg:bg-white lg:shadow-[0_20px_50px_rgba(2,66,156,0.08)] lg:overflow-hidden">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`group flex items-center gap-3 p-5 sm:p-6 lg:border-sky-100 transition-all duration-300 hover:bg-sky-50/50
                  ${index < 3 ? "lg:border-r" : ""}
                `}
              >
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-[#02429C] shadow-sm group-hover:scale-110 group-hover:bg-[#02429C] group-hover:text-white transition-all duration-300">
                  <Icon size={24} strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <h3 className="text-[15px] font-extrabold text-[#013378] tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-sm font-semibold text-gray-500">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default StatsBar;