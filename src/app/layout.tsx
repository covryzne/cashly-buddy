import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "react-day-picker/style.css";
import "./globals.css";
import "../styles/date-time-picker.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  title: "Beranda · Cashly",
  description: "Catat pengeluaran dan bangun kebiasaan baik bersama Cashly.",
  appleWebApp: { capable: true, title: "Cashly", statusBarStyle: "default" },
  icons: {
    icon: [
      {
        url: "/favicon.ico?v=mochi-1",
        type: "image/x-icon",
        sizes: "16x16 32x32 48x48",
      },
      {
        url: "/icons/favicon-32.png?v=mochi-1",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/icons/favicon-16.png?v=mochi-1",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/icons/icon-192.png?v=mochi-1",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: {
      url: "/apple-touch-icon.png?v=mochi-2",
      sizes: "180x180",
      type: "image/png",
    },
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9fe" },
    { media: "(prefers-color-scheme: dark)", color: "#12101a" },
  ],
};
const themeScript = `(function(){try{var t=localStorage.getItem('cashly-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={jakarta.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Browser extensions may add body attributes before React hydrates.
          Keep this exception local; descendant hydration warnings stay active. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
