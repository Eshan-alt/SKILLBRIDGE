import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'SkillBridge AI — Your next chapter starts here', description: 'Practice interviews, sharpen your coding skills, and track your growth.' };
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
