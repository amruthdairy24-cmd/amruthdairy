import localFont from "next/font/local";

export const bespokeStencil = localFont({
    src: [
        {
            path: "../fonts/BespokeStencil-Variable.ttf",
            weight: "100 900",
            style: "normal",
        },
    ],
    variable: "--font-bespoke",
    display: "swap",
});

export const panchangVariable = localFont({
  src: [
    {
      path: "../fonts/Panchang-Variable.ttf",
      weight: "200 800",
      style: "normal",
    },
  ],
  variable: "--font-panchang",
  display: "swap",
});
export const cabinetGrotesk = localFont({
  src: [
    {
      path: "../fonts/CabinetGrotesk-Variable.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-cabinet",
  display: "swap",
});