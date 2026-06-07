import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, ChevronDown, Sparkles } from 'lucide-react';
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
      {/* Floating Pill Trigger */}
      {!isOpen && (
        <button
          onClick={() => {
            if (!user) {
              onLoginRequest();
            } else {
              setIsOpen(true);
            }
          }}
          className="relative group bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer border border-indigo-500"
        >
          <MessageSquare className="w-6 h-6" />
          {unread && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce font-sans">
              1
            </span>
          )}
          <span className="max-w-0 overflow-hidden group-hover:max-w-28 group-hover:ml-2 duration-350 transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            Live Support
          </span>
        </button>
      )}

      {/* Floating Panel Box */}
      {isOpen && (
        <div className="w-[320px] sm:w-[360px] h-[450px] glass-card rounded-2xl flex flex-col overflow-hidden animate-fadeIn font-sans">
          {/* Box Header */}
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-orange-950/40 p-4 text-white flex items-center justify-between shadow border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">AFD HOUSE Live Chat</h4>
                <p className="text-[10px] text-indigo-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                  <span>Operators Online</span>
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

          {/* Messages Stream */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-white/20 dark:bg-slate-900/10">
            {messages.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="text-gray-400 dark:text-gray-655 text-4xl mb-2">💬</div>
                <p className="text-xs font-semibold text-gray-500">Need shopping support?</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  Ask regarding order delivery, sizing parameters, processing timelines, or active discounts. An operator will answer shortly.
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
                      <div className="w-7 h-7 rounded-full bg-indigo-55/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                        ZM
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed font-sans shadow-sm ${
                        isAdmin
                          ? 'bg-white dark:bg-gray-800 border border-gray-105 dark:border-gray-700/50 text-gray-800 dark:text-gray-200 rounded-tl-none'
                          : 'bg-indigo-650 text-white rounded-br-none font-medium'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.message}</p>
                      <p className={`text-[9px] mt-1 text-right leading-none ${isAdmin ? 'text-gray-400' : 'text-indigo-200'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Messages Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white/40 dark:bg-slate-900/40 border-t border-white/15 flex gap-2 font-sans">
            <input
              type="text"
              required
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your query and send..."
              className="text-xs flex-1 px-3 py-2 border-none glass-input text-gray-950 dark:text-white rounded-xl focus:outline-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white p-2.2 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/10 duration-200 transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
