import Link from 'next/link';
import { ArrowUpRight, BarChart3, Check, LayoutDashboard, MessageSquare } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

const businessTools = [
  {
    icon: LayoutDashboard,
    title: 'Project dashboard',
    description: 'Follow active work, review delivery stages, and keep every project update in one place.',
  },
  {
    icon: MessageSquare,
    title: 'Direct feedback loop',
    description: 'Send feedback from the workspace and keep conversations connected to the work in progress.',
  },
  {
    icon: BarChart3,
    title: 'Clear progress visibility',
    description: 'See what is complete, what is moving, and what needs your attention next.',
  },
];

export default function BusinessesPage() {
  return (
    <PageTransition>
      <div className="bg-brand-primary text-brand-secondary">
        <section className="relative overflow-hidden bg-brand-secondary text-white">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-accent/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-24 md:px-12 md:py-32 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-3">
                <span className="h-px w-8 bg-brand-accent" />
                <span className="font-heading text-sm font-medium uppercase tracking-widest text-brand-accent">Nanoware AI for Businesses</span>
              </div>
              <h1 className="font-heading text-4xl font-medium leading-tight tracking-tight md:text-6xl">
                Your work, <span className="font-serif italic text-brand-accent">in motion.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
                A focused workspace for businesses working with Nanoware AI. Track delivery, review progress, and collaborate with the team from one secure client portal.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login?redirect=%2Fdashboard"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-medium tracking-wide text-brand-secondary transition-colors hover:bg-slate-200"
                >
                  Sign In
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login?mode=signup&redirect=%2Fdashboard"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/25 px-8 py-4 text-sm font-medium tracking-wide text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
                >
                  Get Started
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="glass-dark rounded-3xl border border-white/10 p-8 shadow-2xl lg:ml-auto lg:max-w-md">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-accent">Client workspace</p>
              <div className="mt-8 space-y-5">
                {['Live project timeline', 'Feedback and activity updates', 'Secure access to your workspace'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-3">
              <span className="h-px w-8 bg-brand-accent" />
              <span className="font-heading text-sm font-medium uppercase tracking-widest text-brand-accent">Built for momentum</span>
            </div>
            <h2 className="font-heading text-3xl font-medium tracking-tight md:text-5xl">
              Everything you need to stay close to the build.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-500 md:text-lg">
              Sign in to the existing Nanoware AI client portal to access the tools already available for your engagement.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {businessTools.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-medium text-brand-secondary">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 bg-slate-50 px-6 py-20 md:px-12">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="font-heading text-sm font-medium uppercase tracking-widest text-brand-accent">Ready when you are</p>
              <h2 className="mt-3 font-heading text-3xl font-medium text-brand-secondary">Open your business workspace.</h2>
            </div>
            <Link href="/login?mode=signup&redirect=%2Fdashboard" className="inline-flex items-center gap-3 rounded-full bg-brand-secondary px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-slate-800">
              Create your account
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
