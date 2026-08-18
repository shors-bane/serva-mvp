import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-void border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="flex flex-col gap-2">
            <span className="font-display font-semibold text-copper text-xl">Serva</span>
            <p className="text-ink-faint text-sm">
              Trusted electronics repair, at your doorstep.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link to="/book" className="nav-link text-ink-muted hover:text-ink transition-colors text-sm">
              Book Repair
            </Link>
            <Link to="/track" className="nav-link text-ink-muted hover:text-ink transition-colors text-sm">
              Track Repair
            </Link>
            <Link to="/partner" className="nav-link text-ink-muted hover:text-ink transition-colors text-sm">
              Partner With Us
            </Link>
            <Link to="/terms" className="nav-link text-ink-muted hover:text-ink transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/privacy" className="nav-link text-ink-muted hover:text-ink transition-colors text-sm">
              Privacy Policy
            </Link>
          </div>

          <div className="flex flex-col gap-2 md:items-end justify-start">
            <p className="text-ink-faint text-xs">Made in India</p>
            <p className="text-ink-faint text-xs">
              &copy; {currentYear} Serva. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
