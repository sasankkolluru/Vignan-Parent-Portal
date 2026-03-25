import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Mail, Phone } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "How do I log in?",
      a: "Logging in is simple and secure. You need your child's Student Registration Number and the Parent Phone Number registered with the college. Once entered, you will receive an OTP via SMS to verify your identity."
    },
    {
      q: "What type of information is available?",
      a: "The chatbot can provide summaries and detailed reports on Subject-wise Attendance, Academic Performance (Marks/CGPA), Pending Fees and Payment History, Upcoming Exams, and Faculty Contact Details."
    },
    {
      q: "What should I do if my phone number or registration details don't work?",
      a: "Access is strictly linked to institutional records. If your number is not recognized, please contact the college administration office or your child's class advisor to update your contact details in the central database."
    },
    {
      q: "Is my child's data secure?",
      a: "Absolutely. We enforce strict OTP-based verification tied to the registered parent's mobile number. Sessions are temporary, and no financial transactions are processed directly on our servers."
    },
    {
      q: "Can I pay fees through this portal?",
      a: "Currently, the system provides real-time information regarding pending dues and payment history. Actual payments will need to be processed via the official university payment gateway linked within the app."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 relative overflow-hidden">
      {/* Decorators */}
      <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Mini Nav */}
      <nav className="p-6 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 mt-8 relative z-10 animate-fade-in-up">
        <header className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Everything you need to know about navigating and using the ParentBot.
          </p>
        </header>

        {/* FAQs */}
        <div className="space-y-4 mb-16">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 border ${
                openIndex === index 
                  ? 'border-primary shadow-lg shadow-primary/10' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <button
                className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-lg"
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              >
                <span>{faq.q}</span>
                <ChevronDown 
                  className={`transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-primary' : 'text-slate-400'}`} 
                  size={20} 
                />
              </button>
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Support Card */}
        <div className="glass-panel p-8 rounded-3xl text-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border border-indigo-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Our support team is always ready to assist you with any technical difficulties.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-8">
            <div className="flex items-center justify-center gap-3 text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                <Mail className="text-primary" size={20} />
              </div>
              <span className="font-medium">support@parentbot.edu</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                <Phone className="text-primary" size={20} />
              </div>
              <span className="font-medium">+1 (800) 123-4567</span>
            </div>
          </div>

          <Link to="/login" className="text-primary font-semibold hover:underline">
            ← Proceed to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
