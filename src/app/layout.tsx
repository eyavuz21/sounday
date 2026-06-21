import type { Metadata, Viewport } from "next";
import {
  Inter,
  Newsreader,
  Instrument_Serif,
  Nunito,
  Nunito_Sans,
} from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: "Sounday — Your calendar, turned into a personal soundtrack",
  description:
    "Calm tracks when you're overloaded, a confidence-priming hype song before high-stakes meetings — pinged to your phone right when you need it.",
};

export const viewport: Viewport = {
  themeColor: "#2f87a6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${newsreader.variable} ${instrumentSerif.variable} ${nunito.variable} ${nunitoSans.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
