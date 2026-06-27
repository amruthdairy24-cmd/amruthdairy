"use client";

import { Users, Droplets, Heart, Truck } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "5000+",
    label: "Happy Families",
    active: true,
  },
  {
    icon: Droplets,
    value: "100%",
    label: "Pure Milk",
    active: false,
  },
  {
    icon: Heart,
    value: "50+",
    label: "Healthy Cows",
    active: true,
  },
  {
    icon: Truck,
    value: "Daily",
    label: "On-Time Delivery",
    active: false,
  },
];

const StatsBar = () => {
  return (
    <section className="relative z-10 bg-[#ffff] px-4 py-20">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-100 bg-white shadow-[0_15px_45px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-5 md:p-6 ${
                  index !== stats.length - 1
                    ? "lg:border-r border-slate-100"
                    : ""
                }`}
              >
                {item.active ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B84D8] text-white shadow-lg">
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-extrabold leading-none text-slate-900">
                    {item.value}
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-tight text-slate-500">
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