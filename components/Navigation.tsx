'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Logo } from './Logo';
import { useAuth } from '@/components/AuthProvider';

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/projects', label: 'Work' },
  { href: '/process', label: 'Process' },
  { href: '/research', label: 'Research' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
          isScrolled ? 'glass py-4' : 'bg-transparent py-6'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size={32} />
            <span className="font-heading font-semibold text-xl tracking-tight text-brand-secondary">
              NANOWARE AI
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-sm font-medium tracking-wide transition-colors relative py-2',
                  pathname === link.href ? 'text-brand-secondary' : 'text-slate-500 hover:text-brand-secondary'
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div 
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  href="/dashboard"
                  className="text-sm font-medium text-brand-secondary hover:text-brand-accent transition-colors"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/login"
                className="text-sm font-medium text-slate-500 hover:text-brand-secondary transition-colors"
              >
                Client Portal
              </Link>
            )}
            <Link 
              href="/contact"
              className="bg-brand-secondary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-[0_4px_14px_0_rgba(15,23,42,0.15)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)]"
            >
              Request a Solution
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 11L11 1M11 1H3.5M11 1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          <button 
            className="lg:hidden text-brand-secondary"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-white px-6 py-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
               <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
                <Logo size={32} />
                <span className="font-heading font-semibold text-xl tracking-tight text-brand-secondary">
                  NANOWARE AI
                </span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="text-brand-secondary">
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-6 text-xl font-heading font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    pathname === link.href ? 'text-brand-accent' : 'text-brand-secondary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-8 flex flex-col gap-6 border-t border-slate-100">
                {user ? (
                  <>
                    <Link
                       href="/dashboard"
                       onClick={() => setMobileMenuOpen(false)}
                       className="text-brand-secondary hover:text-brand-accent transition-colors block"
                    >
                      Dashboard
                    </Link>
                    <button
                       onClick={() => {
                         setMobileMenuOpen(false);
                         logout();
                       }}
                       className="text-left text-slate-500 hover:text-red-500 transition-colors block"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                     href="/login"
                     onClick={() => setMobileMenuOpen(false)}
                     className="text-brand-secondary hover:text-brand-accent transition-colors block"
                  >
                    Client Portal
                  </Link>
                )}
                <Link
                   href="/contact"
                   onClick={() => setMobileMenuOpen(false)}
                   className="inline-flex items-center gap-2 text-brand-secondary hover:text-brand-accent transition-colors"
                >
                  Request a Solution
                   <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 11L11 1M11 1H3.5M11 1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
