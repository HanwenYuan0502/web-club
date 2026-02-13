import Link from 'next/link';
import { Badminton } from '@/components/icons';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted/40 to-primary/5 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2.5 text-xl font-bold tracking-tight">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Badminton className="h-5 w-5" />
        </div>
        <span>BadBuddy</span>
      </Link>
      <div className="w-full max-w-lg">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground">&copy; {new Date().getFullYear()} BadBuddy Club Portal</p>
    </div>
  );
}
