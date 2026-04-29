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
            <h4 className="text-white font-heading font-semibold mb-6">Research</h4>
            <ul className="space-y-4 font-sans text-sm">
              <li><Link href="/research" className="hover:text-brand-accent transition-colors">Neuron Architecture</Link></li>
              <li><Link href="/system" className="hover:text-brand-accent transition-colors">Intelligence System</Link></li>
              <li><Link href="/research#reports" className="hover:text-brand-accent transition-colors">Technical Reports</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-heading font-semibold mb-6">Company</h4>
            <ul className="space-y-4 font-sans text-sm">
              <li><Link href="/services" className="hover:text-brand-accent transition-colors">Services</Link></li>
              <li><Link href="/projects" className="hover:text-brand-accent transition-colors">Projects</Link></li>
              <li><Link href="/about" className="hover:text-brand-accent transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-brand-accent transition-colors">Contact Formulation</Link></li>
              <li><Link href="/admin" className="hover:text-brand-accent transition-colors opacity-30 hover:opacity-100">Portal</Link></li>
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
