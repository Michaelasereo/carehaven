import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query/provider";
import { ToastProvider } from "@/components/ui/toast";
import { AuthHandler } from "./auth-handler";

const dmSans = localFont({
  src: [
    {
      path: "../public/fonts/DMSans-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../public/fonts/DMSans-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/DMSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/DMSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/DMSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/DMSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/DMSans-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../public/fonts/DMSans-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/fonts/DMSans-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const quintessential = localFont({
  src: "../public/Quintessential-Regular.ttf",
  variable: "--font-quintessential",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Care Haven - Telemedicine Platform",
  description: "Connect with licensed healthcare professionals via secure video consultations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${quintessential.variable} font-sans antialiased`}
      >
        <ReactQueryProvider>
          <ToastProvider>
            <AuthHandler />
            {children}
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
