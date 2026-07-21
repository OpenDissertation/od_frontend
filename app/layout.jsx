import "./globals.css";

export const metadata = {
  title: "OpenDissertation",
  description:
    "Explore Princeton and UNSW PhD dissertations through a guided AI chat.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
