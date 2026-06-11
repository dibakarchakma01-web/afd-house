import React, { useState, useEffect } from 'react';
import { Shield, FileText, RefreshCw, Truck, ChevronRight, ArrowLeft } from 'lucide-react';

export type PolicyTab = 'privacy' | 'terms' | 'refund' | 'shipping';

interface PoliciesViewProps {
  initialTab?: PolicyTab;
  onBackToShop: () => void;
}

export default function PoliciesView({ initialTab = 'privacy', onBackToShop }: PoliciesViewProps) {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialTab]);

  const tabs = [
    { id: 'privacy' as PolicyTab, label: 'Privacy Policy', icon: Shield, date: 'May 13, 2026' },
    { id: 'terms' as PolicyTab, label: 'Terms & Conditions', icon: FileText, date: 'May 13, 2026' },
    { id: 'refund' as PolicyTab, label: 'Return & Refund Policy', icon: RefreshCw, date: 'May 13, 2026' },
    { id: 'shipping' as PolicyTab, label: 'Shipping Policy', icon: Truck, date: 'May 13, 2026' },
  ];

  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Shield;
  const activeDate = tabs.find(t => t.id === activeTab)?.date || '';

  return (
    <div id="policies-view-container" className="py-2 sm:py-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-150 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button 
            id="policies-back-btn"
            onClick={onBackToShop}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-550 hover:text-black dark:hover:text-white transition-all bg-gray-50 dark:bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-gray-100 dark:border-zinc-800 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shop</span>
          </button>
        </div>
        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 dark:text-gray-300">Information Desk</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar Navigation */}
        <div className="lg:col-span-1 flex flex-col gap-2.5">
          <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-gray-150 dark:border-zinc-800/80 shadow-xs">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-2">
              Legal Documents
            </h2>
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`policy-tab-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-green' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-gray-150/60 dark:border-zinc-800/50 text-center">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Need immediate help?</p>
            <p className="text-[11px] font-black text-gray-750 dark:text-gray-300 mt-1">Contact Support Team</p>
            <p className="text-xs font-black text-brand-green mt-1">+8801533770313</p>
          </div>
        </div>

        {/* Content Box */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-150 dark:border-zinc-800/80 shadow-xs p-6 sm:p-10">
            {/* Header section in content */}
            <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100 dark:border-zinc-800/80 mb-8">
              <div className="p-3 bg-brand-green/10 rounded-xl text-brand-green dark:bg-brand-green/20">
                <ActiveIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h1>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-1">
                  Last Updated: {activeDate}
                </p>
              </div>
            </div>

            {/* Document Content */}
            <div className="prose prose-sm max-w-none text-gray-750 dark:text-zinc-300 leading-relaxed font-medium space-y-6">
              {activeTab === 'privacy' && (
                <div id="policy-content-privacy" className="space-y-6">
                  <p className="text-sm">
                    Welcome to our website. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you visit our website and purchase China products from us.
                  </p>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">1. Information We Collect</h3>
                    <p className="text-xs">When you use our website, we may collect the following information:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Your name</li>
                      <li>Phone number</li>
                      <li>Email address</li>
                      <li>Shipping address</li>
                      <li>Payment information</li>
                      <li>Order details</li>
                      <li>Device and browser information</li>
                      <li>IP address and cookies</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">2. How We Use Your Information</h3>
                    <p className="text-xs">We use your information to:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Process and deliver your orders</li>
                      <li>Contact you regarding your order</li>
                      <li>Improve our website and services</li>
                      <li>Provide customer support</li>
                      <li>Send promotional offers and updates (if you agree)</li>
                      <li>Prevent fraud and unauthorized activities</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">3. Payment Security</h3>
                    <p className="text-xs">
                      We use secure payment methods to protect your payment information. However, no online transaction is completely secure, so we recommend using trusted payment methods.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">4. Cookies</h3>
                    <p className="text-xs">
                      Our website may use cookies to improve your browsing experience, remember your preferences, and analyze website traffic. You can disable cookies from your browser settings if you prefer.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">5. Sharing of Information</h3>
                    <p className="text-xs">
                      We do not sell or rent your personal information to third parties. Your information may be shared only with:
                    </p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Delivery companies</li>
                      <li>Payment service providers</li>
                      <li>Legal authorities if required by law</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">6. Product Information</h3>
                    <p className="text-xs">
                      We sell imported China products. We try to provide accurate product descriptions and images, but actual product color or appearance may vary slightly.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">7. Data Protection</h3>
                    <p className="text-xs">
                      We take reasonable security measures to keep your personal information safe from unauthorized access, misuse, or disclosure.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">8. Third-Party Links</h3>
                    <p className="text-xs">
                      Our website may contain links to third-party websites. We are not responsible for the privacy practices of those websites.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">9. Your Rights</h3>
                    <p className="text-xs">You have the right to:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Request access to your personal data</li>
                      <li>Request correction of incorrect information</li>
                      <li>Request deletion of your information</li>
                    </ul>
                    <p className="text-xs mt-2">To make any request, please contact us.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">10. Changes to This Policy</h3>
                    <p className="text-xs">
                      We may update this Privacy Policy at any time. Changes will be posted on this page.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'terms' && (
                <div id="policy-content-terms" className="space-y-6">
                  <p className="text-sm">
                    Welcome to our website. By accessing or using our website, you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully before using our services.
                  </p>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">1. General</h3>
                    <p className="text-xs">
                      This website is operated by our company/store. Throughout the site, the terms “we,” “us,” and “our” refer to the website owner. By visiting our website and purchasing products from us, you agree to these Terms & Conditions.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">2. Products & Services</h3>
                    <p className="text-xs">
                      We sell imported China products through our website. We try to ensure that all product descriptions, images, prices, and availability are accurate. However:
                    </p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Product colors may vary slightly due to screen settings</li>
                      <li>Sizes and specifications may have small variations</li>
                      <li>Product availability may change without notice</li>
                    </ul>
                    <p className="text-xs mt-2">We reserve the right to modify or discontinue products at any time.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">3. Pricing</h3>
                    <p className="text-xs">
                      All prices listed on the website are in Bangladeshi Taka (BDT) unless otherwise stated. We reserve the right to change prices without prior notice.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">4. Orders</h3>
                    <p className="text-xs">After placing an order:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>You will receive an order confirmation</li>
                      <li>We may contact you for verification</li>
                      <li>We reserve the right to cancel suspicious or incomplete orders</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">5. Shipping & Delivery</h3>
                    <p className="text-xs">Delivery times may vary depending on location and courier service. We are not responsible for delays caused by:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Courier companies</li>
                      <li>Natural disasters</li>
                      <li>Political issues</li>
                      <li>Customs or import delays</li>
                    </ul>
                    <p className="text-xs mt-2">Customers must provide accurate shipping information.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">6. Payment</h3>
                    <p className="text-xs">
                      We accept available payment methods shown on the website. Orders may be canceled if payment is not completed successfully.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">7. Return & Refund</h3>
                    <p className="text-xs">
                      Returns and refunds are subject to our Return & Refund Policy. Products must be returned in original condition if eligible for return.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">8. User Responsibilities</h3>
                    <p className="text-xs">By using our website, you agree:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Not to use the website for illegal activities</li>
                      <li>Not to attempt hacking or damaging the website</li>
                      <li>Not to submit false information</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">9. Intellectual Property</h3>
                    <p className="text-xs text-gray-650 dark:text-zinc-400">
                      All website content is the property of the website owner and may not be copied without permission. This includes:
                    </p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Logo</li>
                      <li>Images</li>
                      <li>Text</li>
                      <li>Product descriptions</li>
                      <li>Design</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">10. Limitation of Liability</h3>
                    <p className="text-xs">We are not responsible for:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Indirect or accidental damages</li>
                      <li>Loss caused by misuse of products</li>
                      <li>Temporary website unavailability</li>
                    </ul>
                    <p className="text-xs mt-2">Customers use products at their own responsibility.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">11. Privacy</h3>
                    <p className="text-xs">
                      Your personal information is handled according to our Privacy Policy.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">12. Changes to Terms</h3>
                    <p className="text-xs">
                      We reserve the right to update or modify these Terms & Conditions at any time without prior notice.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">13. Governing Law</h3>
                    <p className="text-xs">
                      These Terms & Conditions are governed by the laws of Bangladesh.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'refund' && (
                <div id="policy-content-refund" className="space-y-6">
                  <p className="text-sm">
                    Thank you for shopping with us. We want our customers to be satisfied with their purchases. Please read our Return & Refund Policy carefully before placing an order.
                  </p>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">1. Return Eligibility</h3>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-350">You may request a return if:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>You received a damaged product</li>
                      <li>You received the wrong product</li>
                      <li>The product has a manufacturing defect</li>
                      <li>The product is incomplete or missing parts</li>
                    </ul>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-350 mt-3">To be eligible for a return:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>The item must be unused and in original condition</li>
                      <li>The item must be returned with original packaging</li>
                      <li>Return request must be made within 3 days of receiving the product</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">2. Non-Returnable Items</h3>
                    <p className="text-xs">We do not accept returns for:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Used products</li>
                      <li>Products damaged by customer misuse</li>
                      <li>Products without original packaging</li>
                      <li>Clearance or discounted items (unless damaged)</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">3. Return Process</h3>
                    <p className="text-xs">To request a return:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Contact our support team</li>
                      <li>Provide your order number</li>
                      <li>Send clear photos/videos of the issue</li>
                      <li>Wait for return approval instructions</li>
                    </ul>
                    <p className="text-xs mt-2 text-red-500 font-semibold">We may reject return requests if sufficient proof is not provided.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">4. Refund Policy</h3>
                    <p className="text-xs">Once we receive and inspect the returned item:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Approved refunds will be processed within 7 business days</li>
                      <li>Refunds may be sent via Mobile Banking, Bank Transfer, or Original Payment Method</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">5. Shipping Charges</h3>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Customers may need to pay return shipping costs unless the mistake was from our side</li>
                      <li>Original delivery charges are non-refundable unless the product was incorrect or damaged</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">6. Exchange Policy</h3>
                    <p className="text-xs">
                      We may offer product replacement instead of a refund depending on product availability.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">7. Order Cancellation</h3>
                    <p className="text-xs">
                      Orders can be canceled before shipment. Once shipped, cancellation requests may not be accepted.
                    </p>
                  </div>

                  <div className="space-y-4 bg-orange-50/50 dark:bg-amber-950/10 p-4 rounded-xl border border-orange-100 dark:border-amber-900/30">
                    <h3 className="text-sm font-black text-orange-950 dark:text-amber-350 uppercase tracking-wider">8. Imported Product Disclaimer</h3>
                    <p className="text-xs text-orange-900/90 dark:text-amber-400/90 leading-relaxed">
                      As we sell imported China products: Minor color or packaging differences may occur. Product specifications may slightly vary from images shown on the website. These small differences are not considered defects.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'shipping' && (
                <div id="policy-content-shipping" className="space-y-6">
                  <p className="text-sm">
                    Thank you for shopping with us. This Shipping Policy explains how we process, ship, and deliver your orders.
                  </p>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">1. Order Processing</h3>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Orders are usually processed within 1–3 business days</li>
                      <li>Orders placed on weekends or public holidays may be processed on the next working day</li>
                      <li>Processing time may vary during high-demand periods</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">2. Shipping Areas</h3>
                    <p className="text-xs">
                      We currently deliver products across Bangladesh. For international shipping availability, please contact us before placing an order.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">3. Delivery Time</h3>
                    <p className="text-xs">Estimated delivery times:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li><strong>Inside Dhaka:</strong> 1–3 business days</li>
                      <li><strong>Outside Dhaka:</strong> 2–7 business days</li>
                    </ul>
                    <p className="text-xs mt-2">Delivery times may vary depending on: Courier service, weather conditions, public holidays, or remote delivery locations.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">4. Shipping Charges</h3>
                    <p className="text-xs">Shipping charges are calculated based on:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Delivery location</li>
                      <li>Product size or weight</li>
                      <li>Courier service fees</li>
                    </ul>
                    <p className="text-xs mt-2">Shipping costs will be shown during checkout or confirmed before shipment.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">5. Order Tracking</h3>
                    <p className="text-xs">Once your order is shipped, we may provide: Tracking number, courier information, or delivery updates.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">6. Delivery Delays</h3>
                    <p className="text-xs">We are not responsible for delays caused by:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1.5 text-gray-650 dark:text-zinc-400">
                      <li>Courier service issues</li>
                      <li>Natural disasters</li>
                      <li>Political disruptions</li>
                      <li>Customs or import delays</li>
                      <li>Incorrect customer information</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">7. Incorrect Address</h3>
                    <p className="text-xs">
                      Customers are responsible for providing accurate shipping information. We are not responsible for failed deliveries due to incorrect addresses or phone numbers.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">8. Product Inspection</h3>
                    <p className="text-xs">
                      Please check your package at the time of delivery. If the package appears damaged, contact us immediately with photos or videos.
                    </p>
                  </div>

                  <div className="space-y-4 bg-gray-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-gray-150 dark:border-zinc-800">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">9. Imported Product Notice</h3>
                    <p className="text-xs">
                      As we sell imported China products: Packaging may differ from product images. Some items may require additional delivery time depending on stock availability.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
