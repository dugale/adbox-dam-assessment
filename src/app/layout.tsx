import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Brand Studio · Harbor Point Bank",
  description:
    "Configure brand-approved marketing assets and customize them for your location.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
