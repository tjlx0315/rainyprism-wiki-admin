import type { Metadata } from 'next';
import './globals.css';
import './refinements.css';

export const metadata: Metadata = {
  title: '雨棱镜世界观百科',
  description: '《雨棱镜》世界观百科。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
