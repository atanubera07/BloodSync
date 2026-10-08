import type { Metadata } from 'next';
import './style.css';
export const metadata: Metadata = { title: 'BloodSync', description: 'A safer way to coordinate blood donation.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><header><a href="/">BloodSync</a><nav aria-label="Main navigation"><a href="/dashboard">Dashboard</a><a href="/requests">Requests</a><a href="/donor/profile">Donate</a><a href="/sign-in">Sign in</a></nav></header><main>{children}</main><footer>BloodSync · This service does not replace emergency medical care.</footer></body></html>; }
