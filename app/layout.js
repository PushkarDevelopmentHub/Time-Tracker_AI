import "./globals.css";
import Navbar from "@/components/Navbar";
import Reminders from "@/components/Reminders";
import { ToastProvider } from "@/components/Toast";

export const metadata = { title: "Life Tracker", description: "Personal life OS" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ToastProvider>
          <Navbar />
          <Reminders />
          <div className="content-area max-w-6xl mx-auto p-4 md:p-8 pt-0">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
