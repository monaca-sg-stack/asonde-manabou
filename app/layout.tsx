import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "あそんでまなぼう！",
  description: "子どもと一緒にあそびながら学べるアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
