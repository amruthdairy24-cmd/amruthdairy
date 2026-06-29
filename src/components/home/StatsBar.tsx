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
    <section className="relative z-10 bg-[#ffff] px-4 py-12 md:py-20">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-sky-100 bg-white shadow-[0_20px_50px_rgba(2,66,156,0.08)] overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className={`group flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 sm:p-8 hover:bg-sky-50/50 transition-all duration-300 border-sky-100
                  ${index === 0 ? "border-b border-r lg:border-b-0" : ""}
                  ${index === 1 ? "border-b lg:border-b-0 lg:border-r" : ""}
                  ${index === 2 ? "border-r" : ""}
                `}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-sky-100 text-[#02429C] shadow-sm group-hover:scale-110 group-hover:bg-[#02429C] group-hover:text-white transition-all duration-300">
                  <Icon size={26} strokeWidth={2.2} />
                </div>

                <div className="text-center sm:text-left mt-2 sm:mt-0">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#013378] tracking-tight" style={{fontFamily: 'font-geist-sans'}}>
                    {item.value}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-gray-500">
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