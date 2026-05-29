import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HNA — Foreign Round Entry",
  description: "Submit foreign rounds to Handicaps Network Africa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

