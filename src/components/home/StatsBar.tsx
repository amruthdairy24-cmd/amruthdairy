"use client";

import { UsersRound, Milk, ShieldCheck, Truck } from "lucide-react";

const stats = [
  {
    icon: UsersRound,
    value: "5000+",
    label: "Happy Families",
  },
  {
    icon: Milk,
    value: "100%",
    label: "Pure Milk",
  },
  {
    icon: ShieldCheck,
    value: "50+",
    label: "Healthy Cows",
  },
  {
    icon: Truck,
    value: "Daily",
    label: "On-Time Delivery",
  },
];

const StatsBar = () => {
  return (
    <section className="relative z-10 bg-[#ffff] px-4 pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-0 lg:rounded-[32px] lg:border lg:border-sky-100 lg:bg-white lg:shadow-[0_20px_50px_rgba(2,66,156,0.08)] lg:overflow-hidden">
          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className={`group flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-white border border-sky-100 shadow-[0_4px_20px_rgba(2,66,156,0.06)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(2,66,156,0.12)] hover:border-sky-200 hover:-translate-y-0.5
                  lg:rounded-none lg:border-0 lg:shadow-none lg:hover:shadow-none lg:hover:translate-y-0 lg:hover:bg-sky-50/50 lg:flex-row lg:items-start lg:border-sky-100
                  ${index < 3 ? "lg:border-r" : ""}
                `}
              >
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-[#02429C] shadow-sm group-hover:scale-110 group-hover:bg-[#02429C] group-hover:text-white transition-all duration-300">
                  <Icon size={24} strokeWidth={2.2} className="sm:w-[26px] sm:h-[26px]" />
                </div>

                <div className="text-center lg:text-left">
                  <h3 className="text-xl sm:text-2xl lg:text-[15px] font-extrabold text-[#013378] tracking-tight">
                    {item.value}
                  </h3>
                  <p className="mt-0.5 text-[11px] sm:text-xs lg:text-sm font-semibold text-gray-500">
                    {item.label}
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