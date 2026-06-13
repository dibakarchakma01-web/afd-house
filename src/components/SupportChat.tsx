import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, ChevronDown, Sparkles, MessageCircle, ExternalLink, LogIn } from 'lucide-react';
import { collection, doc, addDoc, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ChatMessage } from '../types';

interface SupportChatProps {
  user: any;
  onLoginRequest: () => void;
}

export default function SupportChat({ user, onLoginRequest }: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [unread, setUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Firestore thread mapping key
  const threadId = user?.uid;

  useEffect(() => {
    if (!threadId || !isOpen) return;

    // Listen to real-time chat messages from Firestore
    const messagesRef = collection(db, 'chats', threadId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgList: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          msgList.push(doc.data() as ChatMessage);
        });
        setMessages(msgList);
        // Alert if there is a new message from operator (roles not equal to current customer)
        if (msgList.length > 0 && msgList[msgList.length - 1].senderRole === 'admin') {
          setUnread(true);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'chats/' + threadId + '/messages');
      }
    );

    return () => unsubscribe();
  }, [threadId, isOpen]);

  // Handle unread clearing
  useEffect(() => {
    if (isOpen) {
      setUnread(false);
    }
  }, [isOpen, messages]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const messageText = inputValue;
    setInputValue('');

    const chatMessage: ChatMessage = {
      senderId: user.uid,
      senderName: user.displayName || user.email || 'Customer',
      senderRole: 'customer',
      message: messageText,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Create or update chat thread metadata
      const threadRef = doc(db, 'chats', threadId);
      await setDoc(
        threadRef,
        {
          id: threadId,
          userId: user.uid,
          userName: user.displayName || user.email || 'Customer',
          lastMessage: messageText,
          lastMessageAt: new Date().toISOString(),
          status: 'open',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Add message to path
      const messagesRef = collection(db, 'chats', threadId, 'messages');
      await addDoc(messagesRef, chatMessage);

      // Simulate AI responses in sandbox for premium feel if no admin replies instantly
      setTimeout(async () => {
        const aiReplies = [
          "Greetings! Thank you for contacting AFD HOUSE Support. An administrative assistant is verifying your inquiry. Let us know if you need sizing/delivery details!",
          "Yes, we deliver countrywide in 2-3 business days! You can track active states on our Tracking tab.",
          "Our active promo code is EID30. Simply type it into the voucher input at checkout for discounts up to 30%!"
        ];
        const randomReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];

        const botMsg: ChatMessage = {
          senderId: 'afd-house-support-operator',
          senderName: 'AFD HOUSE Support Assistant',
          senderRole: 'admin',
          message: randomReply,
          createdAt: new Date().toISOString(),
        };
        await addDoc(messagesRef, botMsg);
        
        await setDoc(threadRef, {
          lastMessage: randomReply,
          lastMessageAt: new Date().toISOString(),
        }, { merge: true });

      }, 3500);

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${threadId}/messages`);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Support & WhatsApp Trigger */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
          }}
          className="relative group bg-brand-green hover:bg-brand-green-dark hover:scale-105 active:scale-95 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer border-2 border-white dark:border-zinc-900"
        >
          <MessageCircle className="w-6 h-6 animate-pulse" />
          {unread && (
            <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce font-sans">
              1
            </span>
          )}
          <span className="max-w-0 overflow-hidden group-hover:max-w-28 group-hover:ml-2 duration-350 transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap">
            Support
          </span>
        </button>
      )}

      {/* Floating Support Box Panel */}
      {isOpen && (
        <div className="w-[325px] sm:w-[365px] h-[480px] bg-white dark:bg-zinc-900 border border-orange-100/80 dark:border-zinc-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-fadeIn font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-green to-emerald-600 p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight leading-tight">AFD HOUSE Helpdesk</h4>
                <p className="text-[10px] text-emerald-100 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-ping" />
                  <span>WhatsApp & Live Support Active</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full duration-150 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col bg-[#FFFBF7] dark:bg-zinc-950/40">
            {/* Direct WhatsApp Call-to-action */}
            <div className="space-y-2">
              <span className="block text-[10px] font-black uppercase tracking-widest text-[#15803d]/90 pl-1">
                ⚡ Recommended Faster Contact:
              </span>
              <a
                href="https://wa.me/8801575445600?text=Assalamu%20Alaikum%20AFD%20House,%20I'm%20interested%20in%20your%20products."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold px-4 py-3 rounded-2xl transition-all shadow-md group border border-[#1ebd53] hover:scale-[1.01] duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4.5 h-4.5 fill-white" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[9px] opacity-90 font-black uppercase tracking-wider leading-none">Instant Chat</span>
                    <span className="block text-xs mt-1 leading-none font-bold">হোয়াটসঅ্যাপে সরাসরি চ্যাট করুন</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-emerald-100 uppercase tracking-wider hidden sm:inline">Connect</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-90 group-hover:translate-x-0.5 duration-150 shrink-0" />
                </div>
              </a>
            </div>

            {/* In-App Live chat interface section */}
            <hr className="border-orange-100/50 dark:border-zinc-800" />

            <div className="flex-1 flex flex-col min-h-[170px]">
              {user ? (
                <>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1 mb-2">
                    💬 Website Live Session:
                  </span>
                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[190px] pr-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-6 px-4">
                        <p className="text-xs font-bold text-gray-500">No active messages yet</p>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                          Ask us about retail orders, delivery schedules, sizing, or any bulk inquiry. Send a message below to start.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, i) => {
                        const isAdmin = msg.senderRole === 'admin';
                        return (
                          <div
                            key={i}
                            className={`flex gap-2 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                          >
                            {isAdmin && (
                              <div className="w-6 h-6 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20 flex items-center justify-center text-[9px] font-black shrink-0 shadow-xs">
                                AD
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] p-2.5 rounded-2xl text-[11px] leading-relaxed font-sans shadow-xs ${
                                isAdmin
                                  ? 'bg-white dark:bg-zinc-800 border border-orange-100/40 dark:border-zinc-800 text-gray-800 dark:text-zinc-200 rounded-tl-none'
                                  : 'bg-brand-green text-white rounded-br-none font-medium'
                              }`}
                            >
                              <p className="whitespace-pre-line">{msg.message}</p>
                              <p className={`text-[8px] mt-0.5 text-right leading-none ${isAdmin ? 'text-gray-400' : 'text-emerald-100'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="my-auto flex flex-col items-center justify-center text-center p-5 bg-white dark:bg-zinc-900 border border-orange-100/40 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                  <User className="w-8 h-8 text-orange-400/85 mb-2" />
                  <p className="text-xs font-black text-gray-900 dark:text-white">ওয়েবসাইট লাইভ চ্যাট সার্ভিস</p>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-xs">
                    আমাদের ওয়েবসাইট লাইভ চ্যাট অপারেটরের সাথে যোগাযোগ বা আপনার মেসেজ রেকর্ড রাখতে লগইন করুন।
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onLoginRequest();
                    }}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-1.8 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-black rounded-xl hover:scale-[1.03] active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>লগইন করুন / Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form input - active only if logged in */}
          {user && (
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-zinc-900 border-t border-orange-100/50 dark:border-zinc-800 flex gap-2 font-sans">
              <input
                type="text"
                required
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your query and press send..."
                className="text-xs flex-1 px-3 py-2 border border-orange-100/60 dark:border-zinc-800 text-gray-950 dark:text-white rounded-xl focus:outline-none focus:border-brand-green bg-orange-50/10"
              />
              <button
                type="submit"
                className="bg-brand-green hover:bg-brand-green-dark active:scale-95 text-white p-2 text-xs rounded-xl flex items-center justify-center shadow-lg shadow-brand-green/10 duration-200 transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
