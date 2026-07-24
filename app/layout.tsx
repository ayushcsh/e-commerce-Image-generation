import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import AiAssistant from "@/components/AiAssistant";

export const metadata: Metadata = {
  title: "VendorFlow — AI Product Image Generator",
  description:
    "AI product image generation for ecommerce vendors and marketplace sellers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <AiAssistant />
      </body>
    </html>
  );
}
