import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  ShoppingBag, 
  Truck, 
  Check, 
  Code, 
  Terminal, 
  ArrowRight, 
  Copy, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Laptop,
  Phone,
  Lock,
  Globe,
  Settings,
  Layers,
  Sparkles
} from 'lucide-react';
import { CartItem, Coupon, OrderProduct, Order } from '../types';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface CheckoutViewProps {
  cart: CartItem[];
  user: any;
  coupon: Coupon | null;
  onOrderComplete: (order: Order) => void;
  onBackToCart: () => void;
}

type TabType = 'customer' | 'developer';
type DevTabType = 'bkash' | 'nagad' | 'sslcommerz' | 'stripe';

export default function CheckoutView({
  cart,
  user,
  coupon,
  onOrderComplete,
  onBackToCart,
}: CheckoutViewProps) {
  // Shipping form states
  const [name, setName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'SSLCommerz' | 'Stripe' | 'COD'>('bKash');
  
  // Tab control states: customer view vs developer/payload integrations
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<TabType>('customer');
  const [activeDevTab, setActiveDevTab] = useState<DevTabType>('bkash');
  const [copiedCodeFlag, setCopiedCodeFlag] = useState<string | null>(null);

  // Payment Gateway Simulator States
  const [paymentPortalOpen, setPaymentPortalOpen] = useState(false);
  const [simulatorStep, setSimulatorStep] = useState<'number' | 'otp' | 'pin' | 'success' | 'ssl_menu' | 'ssl_card' | 'ssl_bank'>('number');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [pinValue, setPinValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stripe Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // SSLCommerz dynamic channels inside nested simulator
  const [sslActiveSubTab, setSslActiveSubTab] = useState<'cards' | 'mfs' | 'internet'>('cards');

  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.salePrice || item.product.price;
    return acc + price * item.quantity;
  }, 0);

  let discountValue = 0;
  if (coupon) {
    if (coupon.discountType === 'percentage') {
      discountValue = Math.round((subtotal * coupon.discountValue) / 100);
    } else {
      discountValue = coupon.discountValue;
    }
  }

  const finalTotal = Math.max(0, subtotal - discountValue);

  const handleOpenPaymentSimulator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phoneNumber || !address) {
      alert('Please fill in all required shipping details.');
      return;
    }
    if (!agreedToTerms) {
      alert('You must agree to the Terms and Conditions to proceed.');
      return;
    }
    
    // For Cash on Delivery, we skip the simulator and submit immediately
    if (paymentMethod === 'COD') {
      handleConfirmOrderSubmit('COD');
      return;
    }
    
    // Set initial simulator step depending on payment option
    if (paymentMethod === 'SSLCommerz') {
      setSimulatorStep('ssl_menu');
    } else {
      setSimulatorStep('number');
    }
    
    // Set simulated default number
    setMobileNumber(phoneNumber || '01712345678');
    setOtpValue('');
    setPinValue('');
    setPaymentPortalOpen(true);
  };

  const handleSendOtpSimulator = () => {
    if (!mobileNumber) return;
    setSimulatorStep('otp');
  };

  const handleVerifyOtpSimulator = () => {
    setSimulatorStep('pin');
  };

  const handleConfirmOrderSubmit = async (methodOverride?: string) => {
    setIsSubmitting(true);
    const activeMethod = methodOverride || paymentMethod;
    try {
      // Map cart items to OrderProduct shape
      const purchasedProducts: OrderProduct[] = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.salePrice || item.product.price,
        quantity: item.quantity,
        image: item.product.images[0],
      }));

      const randomOrderId = 'ZM-' + Math.floor(100000 + Math.random() * 900000);

      const newOrder: Order = {
        id: randomOrderId,
        userId: user?.uid || 'guest-session',
        customerName: name,
        customerEmail: email || 'guest@example.com',
        products: purchasedProducts,
        total: subtotal,
        discount: discountValue,
        finalTotal: finalTotal,
        paymentMethod: activeMethod as any,
        paymentStatus: activeMethod === 'COD' ? 'Pending' : 'Paid', 
        status: 'Pending',
        shippingAddress: `${address}, Phone: ${phoneNumber}`,
        deliveryNotes: deliveryNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Firestore Batch write to ensure atomicity
      const batch = writeBatch(db);

      // 1. Write the order document
      const orderRef = doc(db, 'orders', randomOrderId);
      batch.set(orderRef, newOrder);

      // 2. Reduce products inventory sizes dynamically
      cart.forEach((item) => {
        const productRef = doc(db, 'products', item.product.id);
        const nextStock = Math.max(0, item.product.stock - item.quantity);
        batch.update(productRef, { stock: nextStock });
      });

      // 3. Clear the Firestore cart documents atomically on success (if user session exists)
      if (user) {
        cart.forEach((item) => {
          const cartItemRef = doc(db, 'cart', `${user.uid}_${item.product.id}`);
          batch.delete(cartItemRef);
        });
      }

      // Commit transaction
      await batch.commit();

      // Email configuration is temporarily disabled for now. Saving strictly to Firestore instead.
      console.log(`[Firestore Success] Order "${newOrder.id}" saved to Firebase Firestore. Admin notification skipped.`);

      setSimulatorStep('success');
      setTimeout(() => {
        onOrderComplete(newOrder);
        setPaymentPortalOpen(false);
      }, 2000);

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeFlag(id);
    setTimeout(() => setCopiedCodeFlag(null), 2000);
  };

  // Pre-compiled NodeJS real production integration strings
  const codeTemplates = {
    bkash: `// Initialize bKash API V2 credentials (Server-Side Node.js)
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BKASH_APP_KEY = process.env.BKASH_APP_KEY;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET;
const BKASH_USERNAME = process.env.BKASH_USERNAME;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD;
const BKASH_BASE_URL = 'https://tokenizedpay.sandbox.bka.sh/v2.0.0/api';

/**
 * Step 1: Generate Authorization Token
 */
async function getbKashAuthToken() {
  const response = await axios.post(\`\${BKASH_BASE_URL}/checkout/token/grant\`, {
    app_key: BKASH_APP_KEY,
    app_secret: BKASH_APP_SECRET
  }, {
    headers: {
      username: BKASH_USERNAME,
      password: BKASH_PASSWORD,
      "Content-Type": "application/json"
    }
  });
  return response.data.id_token; // Return token for next transactions
}

/**
 * Step 2: Create Payment Session URL 
 */
async function initiatebKashPayment(orderId, amount) {
  const idToken = await getbKashAuthToken();
  const requestBody = {
    mode: '0011', // Standalone checkout mode
    payerReference: 'PhoneNo', 
    callbackURL: 'https://yourwebsite.com/api/bkash/callback',
    amount: amount.toString(),
    currency: 'BDT',
    intent: 'sale',
    merchantInvoiceNumber: orderId
  };

  const response = await axios.post(\`\${BKASH_BASE_URL}/checkout/payment/create\`, requestBody, {
    headers: {
      Authorization: \`Bearer \${idToken}\`,
      "X-APP-Key": BKASH_APP_KEY,
      "Content-Type": "application/json"
    }
  });

  return response.data; // Includes: paymentID, bkashURL to redirect client
}

/**
 * Step 3: bKash Webhook Callback Response Handler
 */
async function executebKashPayment(paymentID) {
  const idToken = await getbKashAuthToken();
  const response = await axios.post(\`\${BKASH_BASE_URL}/checkout/payment/execute\`, {
    paymentID: paymentID
  }, {
    headers: {
      Authorization: \`Bearer \${idToken}\`,
      "X-APP-Key": BKASH_APP_KEY
    }
  });

  if (response.data.transactionStatus === 'Completed') {
    // Save to Database (payment successful!)
    return { success: true, trxID: response.data.trxID };
  }
  return { success: false };
}`,
    nagad: `// Nagad Sandbox API V2 Payment Signature Integration
const crypto = require('crypto');
const axios = require('axios');

const NAGAD_MERCHANT_ID = process.env.NAGAD_MERCHANT_ID;
const NAGAD_PUB_KEY = process.env.NAGAD_PUBLIC_KEY; // Merchant PG public key
const NAGAD_PRIV_KEY = process.env.NAGAD_PRIVATE_KEY; // Your private matching key
const NAGAD_BASE_URL = 'https://sandbox.mypg.co:10080/api/dfs'; 

/**
 * Encryption utility for Nagad's security parameters 
 */
function encryptRSA(data, publicKeyPath) {
  const buffer = Buffer.from(data);
  const encrypted = crypto.publicEncrypt({
    key: publicKeyPath,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, buffer);
  return encrypted.toString('base64');
}

/**
 * Generate cryptographic signature payload
 */
function generateSignature(data, privateKey) {
  const signer = crypto.createSign('SHA256');
  signer.update(data);
  return signer.sign(privateKey, 'base64');
}

/**
 * Initiate Nagad Digital Payment Setup
 */
async function initiateNagadPayment(orderId, amount) {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomStr = crypto.randomBytes(8).toString('hex');
  
  // Create sensitive payload
  const sensitiveData = JSON.stringify({
    merchantId: NAGAD_MERCHANT_ID,
    orderId: orderId,
    amount: amount,
    datetime: timestamp,
    random: randomStr
  });
  
  const encryptedSensitiveData = encryptRSA(sensitiveData, NAGAD_PUB_KEY);
  const signature = generateSignature(sensitiveData, NAGAD_PRIV_KEY);

  // Send request payload to Nagad DF Gateway
  const response = await axios.post(\`\${NAGAD_BASE_URL}/check-out/initialize\`, {
    sensitiveData: encryptedSensitiveData,
    signature: signature,
    merchantId: NAGAD_MERCHANT_ID
  });

  return response.data; // Extract payment session tokens
}`,
    sslcommerz: `// SSLCommerz Session Initializer API (Multi-card & MFS router hub)
const SSLCommerzPayment = require('sslcommerz-lts');

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = false; // set true for live production integration

/**
 * Initialize SSLCommerz instance helper
 */
const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

/**
 * Create Hosted Transaction Gateway URL
 */
async function initiateSSLCommerz(customerData, order, bdtValue) {
  const transactionPayload = {
    total_amount: bdtValue,
    currency: 'BDT',
    tran_id: order.id,
    success_url: 'https://yourwebsite.com/api/payments/sslcommerz/success',
    fail_url: 'https://yourwebsite.com/api/payments/sslcommerz/fail',
    cancel_url: 'https://yourwebsite.com/api/payments/sslcommerz/cancel',
    ipn_url: 'https://yourwebsite.com/api/payments/sslcommerz/ipn',
    shipping_method: 'Courier',
    product_name: order.products.map(p => p.name).join(', '),
    product_category: 'Electronics',
    product_profile: 'general',
    cus_name: customerData.name,
    cus_email: customerData.email,
    cus_add1: customerData.address,
    cus_phone: customerData.phone,
    ship_name: customerData.name,
    ship_add1: customerData.address,
  };

  const apiResponse = await sslcz.init(transactionPayload);
  return apiResponse.GatewayPageURL; // Return customer routing URL
}

/**
 * Callback Handlers & Webhook Verify IPN
 */
function verifySSLCommerzTrx(payload) {
  // SSLCommerz issues a checksum hash parameter on callbacks
  const { val_id, store_id: p_store_id, amount, verify_sign, verify_key } = payload;
  
  // Standard verify logic securely requests transaction details back from Gateway
  return sslcz.validate({ val_id }).then(validData => {
    if (validData.status === 'VALID' || validData.status === 'VALIDATED') {
      return { verified: true, transactionID: validData.tran_id };
    }
    return { verified: false };
  });
}`,
    stripe: `// Robust Stripe API Checkout Endpoint Structure
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe REST Intent setup
 */
async function createStripePaymentIntent(orderId, bdtAmount) {
  // Translate BDT to USD/other supported currency or utilize raw charging
  const bdtToUsdConversion = Math.round((bdtAmount * 0.0085) * 100); 

  const paymentIntent = await stripe.paymentIntents.create({
    amount: bdtToUsdConversion, // Specified in lowest currency unit (cents)
    currency: 'usd',
    metadata: {
      orderId: orderId,
      merchantRef: 'AFD HOUSE Storefront'
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  };
}`
  };

  // Helper template info tags
  const devDocs = {
    bkash: {
      title: 'bKash Tokenized Checkout (MFS)',
      badge: 'v2.0.0-tokenized',
      env: 'BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD',
      desc: 'Seamless bKash MFS Integration. Relies on Grant Token Authorization to retrieve dynamic authorization keys, creating intermediate PaymentID tokens. The customer returns to executing callback routines securely validated from server IPNs.'
    },
    nagad: {
      title: 'Nagad Gateway Services',
      badge: 'v2/AES-RSA',
      env: 'NAGAD_MERCHANT_ID, NAGAD_PRIVATE_KEY, NAGAD_PUBLIC_KEY',
      desc: 'High-security transaction workflow. Requires generating key-pairs for secure end-to-end communication. Payloads are encrypted with Nagad-provided SSL Certificates and signed with local private RSA keys.'
    },
    sslcommerz: {
      title: 'SSLCommerz (SSL Wireless Portal)',
      badge: 'LTS Hosted API v4',
      env: 'SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD',
      desc: 'The gold standard in Bangladesh multi-channel processing. Allows customers to choose their banking preference (e.g., Rocket, MFS, Visa Card, Netbanking). Operates using pre-configured redirect webhook models.'
    },
    stripe: {
      title: 'Stripe International Network',
      badge: 'REST Engine',
      env: 'STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY',
      desc: 'Default international credit card processing. Leverages Client Secrets within PaymentIntents. Securely transmits client transaction structures to cloud registers without processing raw credit information locally.'
    }
  };

  // Dynamically simulated payload generated based on state
  const dynamicRequestJsonPayload = JSON.stringify({
    store_id: `zm_${paymentMethod.toLowerCase()}_sandbox`,
    order_id: `ZM-${Math.floor(100000 + Math.random() * 900000)}`,
    amount: finalTotal,
    currency: "BDT",
    cus_name: name || "Customer Name",
    cus_phone: phoneNumber || "01XXXXXXXXX",
    cus_address: address || "Dhaka, Bangladesh",
    payment_method: paymentMethod,
    created_at: new Date().toISOString(),
    items: cart.map(i => ({ sku: i.product.sku, title: i.product.name, qty: i.quantity, itemPrice: i.product.salePrice || i.product.price }))
  }, null, 2);

  return (
    <div className="space-y-6 pb-16 font-sans animate-fadeIn">
      {/* Top Breadcrumb Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <div>
          <button
            onClick={onBackToCart}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shopping Basket</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1.5 tracking-tight flex items-center gap-2">
            Secure checkout Portal
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-900">
              SSL Encrypted
            </span>
          </h1>
        </div>

        {/* Client Selector Tab Header */}
        <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveWorkspaceTab('customer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeWorkspaceTab === 'customer'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-105'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer Checkout</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab('developer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeWorkspaceTab === 'developer'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-105'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Integration Blueprints</span>
          </button>
        </div>
      </div>

      {activeWorkspaceTab === 'developer' ? (
        /* ================= DEVELOPER WORKSPACE PANEL ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Menu Selection Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 glass-card rounded-2xl border border-gray-150/40 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
                <Settings className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 dark:text-gray-300">
                  Select Gateway Protocol
                </h3>
              </div>
              <div className="space-y-2">
                {[
                  { id: 'bkash', label: 'bKash Wallet Api', version: 'Tokenized v2' },
                  { id: 'nagad', label: 'Nagad Gateway DFS', version: 'RSA AES PG' },
                  { id: 'sslcommerz', label: 'SSLCommerz Lts', version: 'Merchant Hosted' },
                  { id: 'stripe', label: 'Stripe Network API', version: 'Direct Intents' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDevTab(item.id as DevTabType)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      activeDevTab === item.id 
                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-slate-800/30 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-550 font-normal">{item.version}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick integration checklist */}
            <div className="p-5 glass-card rounded-2xl border border-gray-150/40 dark:border-slate-800 space-y-3.5">
              <h4 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-indigo-550" />
                <span>Integration Checklist</span>
              </h4>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-450 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Secure Env Configuration:</strong> Never define sensitive gateway keys (App Secret or Private Key) directly on client assets. Keep them inside server environment variables.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Webhook Web Router (IPN):</strong> Ensure the listener path is accessible over HTTPS protocol so gateways can post dynamic confirmation tokens.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Cryptographic Signatures:</strong> Encrypt payloads strictly matching the specification (SHA256 checksums or Base64 RSA signatures).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Details & Code View Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 glass-card rounded-2xl border border-gray-150/40 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <span className="inline-block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-850 px-2.5 py-0.5 rounded-full mb-1 border border-indigo-100/50 dark:border-indigo-900/50 font-mono">
                    {devDocs[activeDevTab].badge}
                  </span>
                  <h3 className="text-base font-black text-gray-850 dark:text-white">
                    {devDocs[activeDevTab].title} Blueprint
                  </h3>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
                <p>{devDocs[activeDevTab].desc}</p>
                <div className="p-3 bg-gray-50 dark:bg-slate-850/60 rounded-xl space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Required Environment Keys</p>
                  <p className="font-mono text-indigo-650 dark:text-indigo-420 text-[11px] select-all break-all">{devDocs[activeDevTab].env}</p>
                </div>
              </div>

              {/* Code Snip block with copying convenience */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-850 dark:text-white flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-orange-500" />
                    <span>Real-World Server Code Mockup (Node/Express)</span>
                  </span>
                  <button
                    onClick={() => copyCode(codeTemplates[activeDevTab], activeDevTab)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-gray-10e dark:bg-slate-800 text-gray-650 dark:text-gray-300 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm cursor-pointer"
                  >
                    {copiedCodeFlag === activeDevTab ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code Block</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900 text-gray-100 rounded-xl overflow-hidden font-mono text-[11px] border border-slate-800 shadow-inner">
                  <div className="bg-slate-950 px-4 py-2 text-slate-400 flex items-center justify-between border-b border-slate-850">
                    <span>server-controllers/payments/{activeDevTab}.ts</span>
                    <span className="text-[10px] text-slate-500">TypeScript / ES Module</span>
                  </div>
                  <pre className="p-4 overflow-x-auto overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-thumb-slate-800">
                    <code>{codeTemplates[activeDevTab]}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= CUSTOMER WORKSPACE PANEL ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Shipping Form Card */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-black text-gray-905 dark:text-white tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>Customer Shipping & delivery Address</span>
            </h2>

            <form onSubmit={handleOpenPaymentSimulator} className="p-6 glass-card rounded-2xl space-y-6 border border-gray-150/40 dark:border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Recipient Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Robin Rahman"
                    className="w-full text-xs px-3.5 py-2.5 border-none bg-gray-50 dark:bg-slate-850 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 font-sans">Contact Phone (+880)</label>
                  <input
                    type="tel"
                    required
                    pattern="(?:\+?8801|01)[3-9][0-9]{8}"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\s+/g, ''))}
                    placeholder="e.g. 01712345678"
                    className="w-full text-xs px-3.5 py-2.5 border-none bg-gray-50 dark:bg-slate-850 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1">Allows 01, +8801, or 8801 formats</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 font-sans">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. customer@example.com"
                    className="w-full text-xs px-3.5 py-2.5 border-none bg-gray-50 dark:bg-slate-850 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1">For receiving invoice copy</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Delivery Address Details (Dhaka, Bangladesh)</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House 45, Road 12, Banani, Dhaka-1213"
                  className="w-full text-xs px-3.5 py-2.5 border-none bg-gray-50 dark:bg-slate-850 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Order Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Please call before delivery, or leave at the front desk."
                  className="w-full text-xs px-3.5 py-2.5 border-none bg-gray-50 dark:bg-slate-850 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3.5 pt-2">
                <label className="text-xs font-bold text-gray-750 dark:text-gray-300 flex items-center gap-1.5 leading-none">
                  <CreditCard className="w-4 h-4 text-indigo-550" />
                  <span>Choose Payment Terminal Gateway Method</span>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { id: 'bKash', label: 'bKash Pay', desc: 'Secure Mobile MFS Checkout', activeBg: 'border-pink-500 bg-pink-50/20 dark:bg-pink-950/10 text-pink-750 dark:text-pink-400' },
                    { id: 'Nagad', label: 'Nagad Pay', desc: 'Fast MFS Wallet Transfer', activeBg: 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400' },
                    { id: 'SSLCommerz', label: 'SSLCommerz', desc: 'Visa, Master & Internet Banking', activeBg: 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/10 text-cyan-705 dark:text-cyan-400' },
                    { id: 'Stripe', label: 'Stripe Credit', desc: 'International Credit Cards', activeBg: 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-650 dark:text-indigo-400' },
                    { id: 'COD', label: 'Cash On Delivery', desc: 'Pay when you receive items', activeBg: 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400' },
                  ].map((term) => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setPaymentMethod(term.id as any)}
                      className={`p-3.5 rounded-2xl border flex flex-col items-start text-left cursor-pointer duration-200 select-none ${
                        paymentMethod === term.id
                          ? `${term.activeBg} font-black shadow-md border-2`
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 hover:bg-gray-50/50 dark:hover:bg-slate-850/40 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-xs font-extrabold flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${paymentMethod === term.id ? 'bg-indigo-550 animate-pulse' : 'bg-gray-300'}`} />
                        {term.label}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 lines-clamp-2 leading-tight font-normal">{term.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-gray-50/50 dark:bg-slate-850/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                 <input 
                    type="checkbox" 
                    id="terms" 
                    className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                 />
                 <label htmlFor="terms" className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed cursor-pointer">
                    I agree to the <span className="text-indigo-600 font-bold underline cursor-pointer">AFD HOUSE Terms of Service</span> and <span className="text-indigo-600 font-bold underline cursor-pointer">Refund Policy</span>. I understand that for digital payments, my data is processed by secured third-party gateways.
                 </label>
              </div>

              {/* Submit checkout triggers simulated safety */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-605 hover:bg-indigo-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5 text-yellow-300" />
                  <span>
                    {paymentMethod === 'COD' 
                      ? 'Confirm Cash on Delivery Order' 
                      : `Proceed to Safe ${paymentMethod} sandbox Gateway`}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Checkout Right Side Sidebar Summary */}
          <div className="space-y-5">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-gray-400" />
              <span>invoice statement</span>
            </h2>

            {/* Dynamic Items Panel */}
            <div className="p-5 glass-card rounded-2xl border border-gray-150/40 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="divide-y divide-gray-100 dark:divide-slate-800 select-none overflow-y-auto max-h-56 pr-1 space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="pt-3 flex justify-between gap-2.5 text-xs text-gray-750 dark:text-gray-300">
                    <div className="flex gap-2">
                      <span className="font-extrabold text-indigo-600 bg-indigo-50 dark:bg-slate-850 px-2 rounded-md h-fit">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="font-semibold block text-gray-900 dark:text-white truncate max-w-40">{item.product.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">SKU: {item.product.sku}</span>
                      </div>
                    </div>
                    <span className="font-mono font-medium text-gray-800 dark:text-gray-100">৳{(item.product.salePrice || item.product.price) * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 dark:border-slate-800 pt-3.5 space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-550 dark:text-gray-400">
                  <span>Cart Items Subtotal</span>
                  <span className="font-mono text-gray-850 dark:text-gray-100">৳{subtotal}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-orange-600 dark:text-orange-400 font-bold bg-orange-50/50 dark:bg-orange-950/20 px-2 py-1.5 rounded-lg border border-orange-100/30">
                    <span className="flex items-center gap-1">🏷 Promo "{coupon.code}" Applied</span>
                    <span className="font-mono">- ৳{discountValue}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-dashed border-gray-100 dark:border-slate-800 text-gray-905 dark:text-white">
                  <span>Payable Total (BDT)</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-sans">৳{finalTotal}</span>
                </div>
              </div>
            </div>

            {/* Simulated Live Gateway Data Logging Panel */}
            <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl border border-slate-850 space-y-2.5 font-mono text-[11px] select-all shadow-md">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-850">
                <span className="text-yellow-420 font-bold flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Dynamic Request JSON Object</span>
                </span>
                <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">OUTBOUND</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                This JSON packet is sent to our payment microservice to generate the {paymentMethod} payment token.
              </p>
              <pre className="overflow-x-auto p-2 bg-slate-950 rounded-lg text-slate-350 max-h-48 leading-relaxed scrollbar-thin">
                <code>{dynamicRequestJsonPayload}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE GATEWAY PORTAL SIMULATORS ================= */}
      {paymentPortalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans">
          
          {/* Main simulator card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl animate-scaleUp">
            
            {/* Conditional Branded Headers */}
            {paymentMethod === 'bKash' && (
              <div className="bg-[#e21251] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-bold text-[#e21251] shadow-inner text-sm font-sans italic">
                    bKash
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#fbdfe6]">Tokenized Checkout</h4>
                    <p className="text-xs font-semibold leading-none">AFD HOUSE Ltd payment Gateway</p>
                  </div>
                </div>
                <button onClick={() => setPaymentPortalOpen(false)} className="text-pink-100 hover:text-white text-sm font-bold p-1 cursor-pointer">✕</button>
              </div>
            )}

            {paymentMethod === 'Nagad' && (
              <div className="bg-gradient-to-r from-orange-500 to-red-650 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white text-orange-600 rounded-full flex items-center justify-center font-black text-xs font-sans">
                    নগদ
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-orange-100">Nagad Interactive pay</h4>
                    <p className="text-xs font-semibold leading-none">Merchant: AFD HOUSE Sandbox</p>
                  </div>
                </div>
                <button onClick={() => setPaymentPortalOpen(false)} className="text-orange-100 hover:text-white text-sm font-bold p-1 cursor-pointer">✕</button>
              </div>
            )}

            {paymentMethod === 'SSLCommerz' && (
              <div className="bg-cyan-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-cyan-950 text-cyan-400 rounded-xl flex items-center justify-center font-black text-xs font-mono">
                    SSL
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-cyan-320">SSLCommerz EasyCheckout</h4>
                    <p className="text-xs font-semibold leading-none">Gateway Session Mode: Sandbox</p>
                  </div>
                </div>
                <button onClick={() => setPaymentPortalOpen(false)} className="text-cyan-200 hover:text-white text-sm font-bold p-1 cursor-pointer">✕</button>
              </div>
            )}

            {paymentMethod === 'Stripe' && (
              <div className="bg-[#635bff] text-white p-5 flex items-center justify-between mr-0">
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold tracking-wide uppercase font-mono">stripe</span>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-100">Stripe Payment Sandbox</h4>
                    <p className="text-xs font-semibold leading-none">Authenticated Checkout</p>
                  </div>
                </div>
                <button onClick={() => setPaymentPortalOpen(false)} className="text-indigo-100 hover:text-white text-sm font-bold p-1 cursor-pointer">✕</button>
              </div>
            )}

            {/* Bill Summary Strip */}
            <div className="bg-gray-50/50 dark:bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">Merchant Payment Bill:</span>
              <span className="text-lg font-black text-gray-900 dark:text-white">৳{finalTotal}</span>
            </div>

            {/* Portal Content Body */}
            <div className="p-6">
              
              {/* Common Success / Processing States */}
              {simulatorStep === 'success' ? (
                <div className="py-6 text-center space-y-3.5 animate-scaleUp">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Payment Received Successfully!</h3>
                    <p className="text-xs text-gray-400 font-mono">TrxID: TXN{Math.floor(1000000 + Math.random() * 9000000)}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Handing back controller to Merchant site... Proceeding to Order Receipt.
                  </p>
                </div>
              ) : isSubmitting ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">
                    Authorizing Sandbox Funds...
                  </p>
                </div>
              ) : (
                /* Dynamic Step Routers Based on Selection */
                <>
                  {paymentMethod === 'bKash' && (
                    <div className="space-y-4">
                      {simulatorStep === 'number' && (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal text-center bg-pink-50/40 dark:bg-pink-950/10 p-3 rounded-xl border border-pink-100/20">
                            <strong>Note:</strong> Enter any 11-digit bKash MFS account number to trigger simulated OTP verification.
                          </p>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-gray-450 tracking-wider">bKash Account Number</label>
                            <input
                              type="tel"
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value)}
                              placeholder="e.g. 01711223344"
                              className="w-full text-center text-base tracking-widest py-2.5 border-2 border-pink-250 dark:border-slate-800 rounded-xl focus:outline-none focus:border-pink-500 bg-gray-50 dark:bg-slate-850 font-mono text-gray-900 dark:text-white"
                            />
                          </div>
                          
                          <div className="text-[10px] text-gray-400 leading-relaxed text-center">
                            By clicking Proceed, you agree to the bKash terms and conditions for Tokenized Checkout sandbox simulation.
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setPaymentPortalOpen(false)}
                              className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              onClick={handleSendOtpSimulator}
                              disabled={mobileNumber.length < 11}
                              className="w-full bg-[#e21251] hover:bg-[#c20e43] disabled:bg-gray-200 disabled:text-gray-450 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Proceed
                            </button>
                          </div>
                        </div>
                      )}

                      {simulatorStep === 'otp' && (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-600 dark:text-gray-450 leading-relaxed text-center bg-emerald-50 dark:bg-emerald-950/10 p-3.5 rounded-xl">
                            ✓ Sandbox verification OTP has been generated for bKash wallet <span className="font-mono font-bold text-emerald-600">{mobileNumber}</span>. Enter code <strong>123456</strong> or any digits to continue.
                          </p>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-gray-450 tracking-wider text-center block">Authentication OTP</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value)}
                              placeholder="e.g. 123456"
                              className="w-full text-center text-xl tracking-[12px] py-2.5 border-2 border-pink-250 dark:border-slate-800 rounded-xl focus:outline-none focus:border-pink-500 bg-gray-50 dark:bg-slate-850 font-mono text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setSimulatorStep('number')}
                              className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              onClick={handleVerifyOtpSimulator}
                              disabled={otpValue.length < 4}
                              className="w-full bg-[#e21251] hover:bg-[#c20e43] disabled:bg-gray-200 disabled:text-gray-450 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Verify OTP
                            </button>
                          </div>
                        </div>
                      )}

                      {simulatorStep === 'pin' && (
                        <div className="space-y-4">
                          <p className="text-xs text-pink-650 dark:text-pink-400 leading-normal text-center bg-pink-50/40 dark:bg-pink-950/10 p-3 rounded-xl font-bold">
                            ⚠️ Sandbox Security Shield: Never write your actual bank or bKash PIN code! Write any dummy 5-digit PIN value (like 12345) to finish this simulated checkout.
                          </p>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-gray-450 tracking-wider text-center block">Simulator bKash Wallet PIN</label>
                            <input
                              type="password"
                              maxLength={5}
                              value={pinValue}
                              onChange={(e) => setPinValue(e.target.value)}
                              placeholder="•••••"
                              className="w-full text-center text-xl tracking-[14px] py-2.5 border-2 border-pink-250 dark:border-slate-800 rounded-xl focus:outline-none focus:border-pink-500 bg-gray-50 dark:bg-slate-850 font-mono text-gray-900"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setSimulatorStep('otp')}
                              className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmOrderSubmit}
                              disabled={pinValue.length < 4 || isSubmitting}
                              className="w-full bg-[#e21251] hover:bg-[#c20e43] disabled:bg-gray-200 disabled:text-gray-450 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Confirm Payment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'Nagad' && (
                    <div className="space-y-4">
                      {simulatorStep === 'number' && (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal text-center bg-orange-50/40 dark:bg-orange-950/10 p-3 rounded-xl">
                            Enter Nagad Personal Account Number to establish secure handshakes.
                          </p>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-gray-450 tracking-wider">Nagad Wallet Mobile Number</label>
                            <input
                              type="tel"
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value)}
                              placeholder="e.g. 01822334455"
                              className="w-full text-center text-base tracking-widest py-2.5 border-2 border-orange-250 dark:border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-slate-850 font-mono text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setPaymentPortalOpen(false)}
                              className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                            >
                              Exit
                            </button>
                            <button
                              type="button"
                              onClick={handleSendOtpSimulator}
                              disabled={mobileNumber.length < 11}
                              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-95 disabled:bg-gray-200 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Initialize OTP
                            </button>
                          </div>
                        </div>
                      )}

                      {simulatorStep === 'otp' && (
                        <div className="space-y-4">
                          <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed text-center bg-amber-50 dark:bg-amber-950/10 p-3 rounded-xl font-sans">
                            A simulated Nagad OTP authentication message block was sent to <span className="font-mono font-bold">{mobileNumber}</span>. Enter code <strong>987654</strong> or any digits.
                          </p>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-gray-450 tracking-wider text-center block font-sans">verification pin code</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value)}
                              placeholder="e.g. 987654"
                              className="w-full text-center text-xl tracking-[12px] py-2.5 border-2 border-orange-250 dark:border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-slate-850 font-mono text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setSimulatorStep('number')}
                              className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                            >
                              Modify Number
                            </button>
                            <button
                              type="button"
                              onClick={handleVerifyOtpSimulator}
                              disabled={otpValue.length < 4}
                              className="w-full bg-gradient-to-r from-orange-500 to-red-650 disabled:from-gray-250 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Verify OTP
                            </button>
                          </div>
                        </div>
                      )}

                      {simulatorStep === 'pin' && (
                        <div className="space-y-4">
                          <p className="text-xs text-orange-655 dark:text-orange-400 font-sans text-center bg-orange-50/50 dark:bg-orange-950/15 p-3 rounded-xl font-bold">
                            ⚠️ Simulated Environment: Type any 4-digit sandbox PIN (such as 1234) without inputting your master financial credentials.
                          </p>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-gray-450 tracking-wider text-center block font-mono">Sandbox Nagad Wallet PIN</label>
                            <input
                              type="password"
                              maxLength={4}
                              value={pinValue}
                              onChange={(e) => setPinValue(e.target.value)}
                              placeholder="••••"
                              className="w-full text-center text-xl tracking-[16px] py-2.5 border-2 border-orange-250 dark:border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 dark:bg-slate-850 font-mono text-gray-900"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setSimulatorStep('otp')}
                              className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                            >
                              Previous Step
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmOrderSubmit}
                              disabled={pinValue.length < 4 || isSubmitting}
                              className="w-full bg-gradient-to-r from-orange-500 to-red-650 disabled:from-gray-200 text-white text-xs font-black py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Verify nagad Payment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'SSLCommerz' && (
                    <div className="space-y-4">
                      {/* Interactive Session Portal Tabs */}
                      {simulatorStep === 'ssl_menu' && (
                        <div className="space-y-4">
                          <div className="flex border-b border-gray-150 dark:border-slate-800 text-xs">
                            <button 
                              type="button"
                              onClick={() => setSslActiveSubTab('cards')}
                              className={`flex-1 py-2 text-center font-bold border-b-2 ${sslActiveSubTab === 'cards' ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 font-extrabold' : 'border-transparent text-gray-400'}`}
                            >
                              Debit/Credit Card
                            </button>
                            <button 
                              type="button"
                              onClick={() => setSslActiveSubTab('mfs')}
                              className={`flex-1 py-2 text-center font-bold border-b-2 ${sslActiveSubTab === 'mfs' ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 font-extrabold' : 'border-transparent text-gray-400'}`}
                            >
                              Mobile Banking
                            </button>
                            <button 
                              type="button"
                              onClick={() => setSslActiveSubTab('internet')}
                              className={`flex-1 py-2 text-center font-bold border-b-2 ${sslActiveSubTab === 'internet' ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 font-extrabold' : 'border-transparent text-gray-400'}`}
                            >
                              Net Banking
                            </button>
                          </div>

                          {sslActiveSubTab === 'cards' && (
                            <div className="space-y-3.5 pt-1 animate-fadeIn">
                              <p className="text-[10px] text-gray-450 uppercase tracking-widest text-center block">Accepted Card networks</p>
                              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-gray-500">
                                <div className="p-2 border border-gray-150 rounded-xl bg-gray-50">Visa</div>
                                <div className="p-2 border border-gray-150 rounded-xl bg-gray-50">Master</div>
                                <div className="p-2 border border-gray-150 rounded-xl bg-gray-50">Amex</div>
                                <div className="p-2 border border-gray-150 rounded-xl bg-gray-50">DBBL Nexus</div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSimulatorStep('ssl_card')}
                                className="w-full py-2.5 text-xs font-extrabold text-white bg-cyan-800 hover:bg-cyan-900 rounded-xl transition-all cursor-pointer"
                              >
                                Pay with Card (৳{finalTotal})
                              </button>
                            </div>
                          )}

                          {sslActiveSubTab === 'mfs' && (
                            <div className="space-y-3 animate-fadeIn">
                              <p className="text-[11px] text-gray-400 text-center leading-normal">
                                Select preferred Bangladeshi payment gateway handler linked through SSLCommerz:
                              </p>
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethod('bKash');
                                    setSimulatorStep('number');
                                  }}
                                  className="p-3 text-xs font-bold border border-gray-200 hover:border-pink-300 dark:border-slate-800 rounded-xl text-pink-600 flex flex-col items-center gap-1 cursor-pointer"
                                >
                                  bKash Wallet Router
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethod('Nagad');
                                    setSimulatorStep('number');
                                  }}
                                  className="p-3 text-xs font-bold border border-gray-200 hover:border-orange-355 dark:border-slate-800 rounded-xl text-orange-605 flex flex-col items-center gap-1 cursor-pointer"
                                >
                                  Nagad MFS Router
                                </button>
                              </div>
                              <p className="text-[10px] text-gray-400 italic text-center">
                                Clicking any MFS proxy reroutes directly to their native verification engine.
                              </p>
                            </div>
                          )}

                          {sslActiveSubTab === 'internet' && (
                            <div className="pt-2 space-y-3.5 animate-fadeIn">
                              <p className="text-[11px] text-gray-500 leading-normal">
                                Authorize direct secure debits from local partner bank repositories:
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-700 font-bold">
                                <button type="button" onClick={() => setSimulatorStep('ssl_bank')} className="p-2.5 border rounded-xl hover:border-gray-300 text-left cursor-pointer">Islami Bank (i-Banking)</button>
                                <button type="button" onClick={() => setSimulatorStep('ssl_bank')} className="p-2.5 border rounded-xl hover:border-gray-300 text-left cursor-pointer">City Touch (The City Bank)</button>
                                <button type="button" onClick={() => setSimulatorStep('ssl_bank')} className="p-2.5 border rounded-xl hover:border-gray-300 text-left cursor-pointer">Mutual Trust Bank</button>
                                <button type="button" onClick={() => setSimulatorStep('ssl_bank')} className="p-2.5 border rounded-xl hover:border-gray-300 text-left cursor-pointer">Bank Asia Portal</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card validation sub-screen */}
                      {simulatorStep === 'ssl_card' && (
                        <div className="space-y-4 animate-scaleUp">
                          <p className="text-xs text-cyan-800 dark:text-cyan-400 italic bg-cyan-50 dark:bg-cyan-950/20 p-3.5 rounded-xl font-medium">
                            🔒 SSLCommerz Card Vault Sandbox Mode. Use mock Stripe testing credentials or any numerical sequence to run checkout safely.
                          </p>

                          <div className="space-y-3 font-sans">
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold uppercase text-gray-400">Mock Card Number</label>
                              <input
                                type="text"
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="4242 4242 4242 4242"
                                className="w-full text-xs px-3.5 py-2.5 border-none bg-gray-50 dark:bg-slate-850 rounded-xl focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold uppercase text-gray-400">Expiry (MM/YY)</label>
                                <input
                                  type="text"
                                  maxLength={5}
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                  placeholder="12/30"
                                  className="w-full text-xs px-3.5 py-2.5 border-none bg-gray-50 dark:bg-slate-850 rounded-xl focus:outline-none font-mono"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold uppercase text-gray-400">CVC Code</label>
                                <input
                                  type="password"
                                  maxLength={3}
                                  value={cardCvc}
                                  onChange={(e) => setCardCvc(e.target.value)}
                                  placeholder="***"
                                  className="w-full text-xs px-3.5 py-2.5 border-none bg-gray-50 dark:bg-slate-850 rounded-xl focus:outline-none font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setSimulatorStep('ssl_menu')}
                              className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                            >
                              Menu Back
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmOrderSubmit}
                              className="w-full bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-black py-2.5 rounded-xl transition-colors cursor-pointer animate-pulse"
                            >
                              Authorize Gateway (৳{finalTotal})
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Bank sub-screen */}
                      {simulatorStep === 'ssl_bank' && (
                        <div className="space-y-4 animate-scaleUp text-center py-4">
                          <CheckCircle2 className="w-12 h-12 text-cyan-600 mx-auto animate-bounce" />
                          <h4 className="text-sm font-bold text-gray-850 dark:text-white">Redirecting to Online Bank API Portal</h4>
                          <p className="text-xs text-gray-500 leading-normal max-w-xs mx-auto">
                            SSLCommerz has initialized the bank vault. Click Confirm below to dispatch mock client approval variables.
                          </p>

                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setSimulatorStep('ssl_menu')}
                              className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmOrderSubmit}
                              className="w-full bg-cyan-850 hover:bg-cyan-900 text-white text-xs font-black py-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                              Simulate Approval
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'Stripe' && (
                    <div className="space-y-4 font-sans animate-scaleUp">
                      <p className="text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/15 p-3.5 rounded-xl leading-relaxed text-center">
                        💳 <strong>Direct Stripe Intent Simulator</strong>. Connects securely with Stripe Cloud APIs under checkout authorization schedules. Input any mock digits.
                      </p>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Interactive Credit Card Digits</label>
                          <input
                            type="text"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full text-center text-xs px-3 py-2.5 border-none bg-gray-50 dark:bg-slate-850 rounded-xl text-gray-900 dark:text-white font-mono focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Valid Thru (MM/YY)</label>
                            <input
                              type="text"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="09/29"
                              className="w-full text-center text-xs px-3 py-2.5 border-none bg-gray-50 dark:bg-slate-850 rounded-xl text-gray-900 dark:text-white font-mono focus:outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">CVC Code (CVV)</label>
                            <input
                              type="password"
                              maxLength={3}
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="***"
                              className="w-full text-center text-xs px-3 py-2.5 border-none bg-gray-50 dark:bg-slate-850 rounded-xl text-gray-950 font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setPaymentPortalOpen(false)}
                          className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-750 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmOrderSubmit}
                          disabled={cardNumber.length < 12}
                          className="w-full bg-[#635bff] hover:bg-[#5048db] text-white text-xs font-extrabold py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          Pay With Stripe (৳{finalTotal})
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
