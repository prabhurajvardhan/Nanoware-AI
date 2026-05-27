import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-brand-secondary text-slate-300 py-16 md:py-24 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <Logo size={32} />
              <span className="font-heading font-semibold text-xl tracking-tight text-white">
                NANOWARE AI
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm font-sans mb-8 leading-relaxed">
              Engineering intelligence. Developing novel neuron architectures to create systems that understand, reason, and evolve like living intelligence.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-heading font-semibold mb-6">Services</h4>
            <ul className="space-y-4 font-sans text-sm">
              <li><Link href="/services#automations" className="hover:text-brand-accent transition-colors">AI Automations</Link></li>
              <li><Link href="/services#agents" className="hover:text-brand-accent transition-colors">AI Agents</Link></li>
              <li><Link href="/services#web-development" className="hover:text-brand-accent transition-colors">Web Development</Link></li>
              <li><Link href="/services#dashboards" className="hover:text-brand-accent transition-colors">Dashboards</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-heading font-semibold mb-6">Work</h4>
            <ul className="space-y-4 font-sans text-sm">
              <li><Link href="/projects#demos" className="hover:text-brand-accent transition-colors">Demos</Link></li>
              <li><Link href="/projects#case-studies" className="hover:text-brand-accent transition-colors">Case Studies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-heading font-semibold mb-6">Labs</h4>
            <ul className="space-y-4 font-sans text-sm">
              <li><Link href="/research" className="hover:text-brand-accent transition-colors">Research</Link></li>
              <li><Link href="/projects/original" className="hover:text-brand-accent transition-colors">Original Projects</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-heading font-semibold mb-6">Company</h4>
            <ul className="space-y-4 font-sans text-sm">
              <li><Link href="/about" className="hover:text-brand-accent transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-brand-accent transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800 text-sm opacity-60">
          <p>© {new Date().getFullYear()} Nanoware AI. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
