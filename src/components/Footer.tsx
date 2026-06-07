import React, { useState } from 'react';
import { Mail, Phone, MapPin, ShieldCheck, Truck, RefreshCw, CreditCard, Facebook, Instagram, Twitter, Youtube, ShoppingCart } from 'lucide-react';

interface FooterProps {
  setView?: (view: string) => void;
  categories?: { id: string; name: string; slug: string }[];
  setActiveCategory?: (slug: string) => void;
}

export default function Footer({ setView, categories, setActiveCategory }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 text-black font-sans mt-auto">
      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Logo, About, and Social Handles */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-brand-green fill-brand-green" />
              <span className="font-black text-gray-900 text-2xl tracking-tighter">AFD <span className="text-brand-green">HOUSE</span></span>
            </div>
            <p className="text-xs leading-relaxed text-black font-semibold">
              AFD HOUSE is Bangladesh’s premier online marketplace. We curate high-utility clothing designs, electronic items, and children’s toys directly to your doorstep.
            </p>
            
            {/* Social media connections */}
            <div className="flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="p-2.5 bg-gray-50 hover:bg-brand-green hover:text-white rounded-full text-gray-400 transition-all border border-gray-100"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories Quick Navigation */}
          <div className="flex flex-col gap-5">
            <h3 className="text-gray-900 font-black text-[13px] uppercase tracking-widest">Categories</h3>
            <ul className="flex flex-col gap-3.5 text-xs font-bold">
              {categories?.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      setActiveCategory?.(cat.slug);
                      setView?.('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-brand-green transition-all text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care Quick Links */}
          <div className="flex flex-col gap-5">
            <h3 className="text-gray-900 font-black text-[13px] uppercase tracking-widest">Customer Care</h3>
            <ul className="flex flex-col gap-3.5 text-xs font-bold">
              <li><button onClick={() => setView?.('tracking')} className="hover:text-brand-green text-left">Track Order</button></li>
              <li><button className="hover:text-brand-green text-left">Help Center</button></li>
              <li><button className="hover:text-brand-green text-left">Return Policy</button></li>
              <li><button className="hover:text-brand-green text-left">Terms & Conditions</button></li>
              <li><button className="hover:text-brand-green text-left">Privacy Policy</button></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-5">
            <h3 className="text-gray-900 font-black text-[13px] uppercase tracking-widest">Contact Us</h3>
            <div className="flex flex-col gap-4 text-xs font-bold">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-green shrink-0" />
                <span className="leading-relaxed">Rangamati sadar upazila, Rangamati-4500</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-green shrink-0" />
                <span>+8801533770313</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-green shrink-0" />
                <span>afdhousebd@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Base bar */}
        <div className="border-t border-gray-200 mt-16 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] font-black text-black">
          <p>© 2026 AFD HOUSE Bangladesh Ltd. All Rights Reserved.</p>
          <div className="flex items-center gap-6 opacity-30">
            <span>BKASH</span>
            <span>NAGAD</span>
            <span>VISA</span>
            <span>MASTERCARD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
