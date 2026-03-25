import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lightbulb, ShieldCheck, Zap, Users, ShieldAlert } from 'lucide-react';

export default function AboutPage() {
  const benefits = [
    { title: "Improved Engagement", desc: "Parents stay deeply involved without constantly calling the campus.", icon: <Users className="text-blue-500" /> },
    { title: "Reduced Manual Inquiries", desc: "Automate responses to repetitive questions like 'What is my child's attendance?'.", icon: <Zap className="text-amber-500" /> },
    { title: "Transparent Monitoring", desc: "Unfiltered, direct access to the institution's official system of record.", icon: <ShieldCheck className="text-emerald-500" /> },
    { title: "Real-time Access", desc: "Data is synced instantly when professors upload marks or attendance.", icon: <Lightbulb className="text-purple-500" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* Mini Nav */}
      <nav className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 mt-12 animate-fade-in-up">
        <header className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Why <span className="text-primary">ParentBot?</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Understanding the gap between institutional data and parent awareness, and how we bridge it.
          </p>
        </header>

        {/* Problem Statement */}
        <section className="glass-panel p-8 lg:p-12 rounded-3xl mb-12 border-l-4 border-l-rose-500">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">The Problem</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Parents often face a significant information gap regarding their child's academic progress. 
                Relying on end-of-semester report cards or occasional updates from faculty fails to provide 
                a timely intervention window. Furthermore, colleges are inundated with repetitive manual inquiries 
                from anxious parents about attendance, fees, and exam schedules, overwhelming administrative staff.
              </p>
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="glass-panel p-8 lg:p-12 rounded-3xl mb-12 border-l-4 border-l-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10" />
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
              <Lightbulb size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">The Solution: Vignan's University Parent Portal</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                We conceptualized a centralized, conversational interface tailored exclusively for parents. 
                Instead of navigating complex academic portals designed for students, parents can simply 
                "talk" to our AI. 
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                By asking simple questions like <em>"What is Alex's attendance this week?"</em> or 
                <em> "Are there any pending fees?"</em>, the system queries the institutional database 
                and provides instant, securely verified summaries.
              </p>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section>
          <h3 className="text-2xl font-bold mb-8 text-center">Key Benefits</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((b, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                    {b.icon}
                  </div>
                  <h4 className="font-bold text-lg">{b.title}</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center mt-20">
          <Link to="/login" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-full font-semibold shadow-xl hover:scale-105 active:scale-95 transition-all">
            Experience the Chatbot Now <ArrowLeft className="rotate-180" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
