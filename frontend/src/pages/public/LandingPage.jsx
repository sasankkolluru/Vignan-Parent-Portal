import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Youtube, X } from 'lucide-react';

const slides = [
  {
    title: 'ACHIEVE ACADEMIC EXCELLENCE',
    subtitle: 'Explore a future of unparalleled learning and growth',
    image: '/images/landing/vcc.jpeg'
  },
  {
    title: 'STATE-OF-THE-ART LEARNING',
    subtitle: 'Cutting-edge facilities for future-ready education',
    image: '/images/landing/phani.jpeg'
  },
  {
    title: 'LEADERSHIP & INNOVATION',
    subtitle: "Nurturing tomorrow's global leaders",
    image: '/images/landing/leadership.jpeg'
  }
];

const heroFeatures = [
  { letter: 'A', title: 'Academic Rigor', desc: 'Curriculum designed for industry readiness.' },
  { letter: 'B', title: 'Safety & Wellbeing', desc: '24/7 security and medical care.' },
  { letter: 'C', title: 'Holistic Development', desc: '100+ clubs and sports facilities.' },
  { letter: 'D', title: 'Placement Track Record', desc: '90% placement in multi-nationals.' }
];

const facultyProfiles = [
  { name: 'Dr.Balu Narasimha Rao ', dept: 'Computer Science' },
  { name: 'Dr. K. Lovaraju', dept: 'Mechanical' },
  { name: 'Ms. Kavya Rao', dept: 'Civil' },
  { name: 'Mr. Radha Rani', dept: 'AI & ML' }
];

// Content for the 3-block impression section
const impressionBlocks = [
  {
    title: "A World-Class Learning Environment",
    desc: "The main campus incorporates a university in the main campus to campus.",
    image: "/images/landing/wcle.jpeg",
    fullContent: "Vignan's University stands as a beacon of academic brilliance, sprawling across a lush green landscape that fosters innovation and peace of mind. Our infrastructure is designed to bridge the gap between traditional learning and futuristic application. With over 100+ smart classrooms equipped with the latest audio-visual aids, students engage in an immersive educational experience. The library houses over 100,000 volumes and provides digital access to global journals, ensuring that research is never capped. We believe that environment is a silent teacher; hence, our eco-friendly campus includes solar power harvesting and water recycling systems, teaching students sustainability by example. The residential facilities are designed to feel like a home away from home, with high-speed internet and nutritious dining options. Beyond academics, the campus features state-of-the-art auditoriums for cultural exchange and expansive grounds for athletic development. Every corner of Vignan is crafted to inspire, from the quiet study alcoves to the bustling innovation centers where ideas turn into reality. We invite parents and students to walk through our gates and witness a community dedicated to the pursuit of knowledge and the betterment of society. Our commitment to excellence is reflected in our NAAC A+ accreditation and our consistent ranking among the top engineering institutions in the country. At Vignan, we don't just provide a degree; we provide a transformative journey that prepares students for the complexities of the modern world. Join us in shaping a future where education knows no bounds and every student has the tools to succeed."
  },
  {
    title: "State-of-the-Art Labs",
    desc: "Vignan's University incorporates tech labs and assistants and comprehensive studies.",
    image: "/images/landing/seminar.jpeg",
    fullContent: "Innovation at Vignan's University is powered by our world-class laboratory infrastructure, where theory meets practice. Our labs are not just rooms with equipment; they are specialized centers of excellence in AI, Robotics, Cyber Security, and Biotechnology. Each lab is managed by industry-certified assistants who provide hands-on guidance to every student. We have partnered with global tech giants like Google, Microsoft, and Cisco to establish branded labs that offer students a chance to work on the same tools used in Silicon Valley. For instance, our VLSI design lab and Advanced Manufacturing center allow students to prototype products from scratch. The computer science wings are equipped with high-performance computing clusters capable of handling big data analytics and complex simulations. In the realm of life sciences, our bio-tech labs are at the forefront of genetic research and molecular biology. We maintain a strict 1:1 student-to-system ratio during practical sessions to ensure personalized learning. Safety is our top priority; all engineering and chemical labs are outfitted with modern safety gear and automated emergency systems. Furthermore, these labs are accessible beyond class hours for students working on independent projects or competitive hackathons. By the time a student reaches their final year, they have spent over 1,000 hours in these practical environments, making them 'day-one ready' for the industry. Our labs serve as the incubators for numerous student-led startups and patents, proving that when given the right tools, our students can change the world through technology and rigorous scientific inquiry."
  },
  {
    title: "Empowering Tomorrow's Leaders",
    desc: "Empowering Tomorrow's Leaders, enrollments and professional conversations.",
    image: "/images/landing/app.jpeg",
    fullContent: "Leadership at Vignan is about more than just management; it's about character, empathy, and the courage to innovate. Our 'Leadership Excellence' program is integrated into the core curriculum, ensuring every student develops soft skills alongside technical expertise. Through student-led clubs—ranging from robotics to social service—individuals learn the nuances of teamwork, budget management, and public speaking. We host annual global summits where students interact with CEOs, social reformers, and world-class researchers, gaining insights into global trends. Our mentorship program pairs freshmen with senior leaders and alumni, creating a support network that lasts a lifetime. The Entrepreneurship Cell at Vignan provides seed funding and legal guidance to students with a vision, fostering a culture of job creation rather than job seeking. We emphasize 'Professional Conversations,' a series of workshops designed to master corporate etiquette and high-stakes negotiation. Our holistic approach ensures that when a student graduates, they carry the Vignan seal of integrity and the drive to lead diverse teams. We also focus on global exposure through semester-exchange programs with universities in the USA, Europe, and Asia. This diversity of thought prepares our students to thrive in multi-national corporations and international research bodies. By empowering the individual, we are strengthening the collective future of our nation. Vignan's leaders are recognizable by their ability to solve complex problems with innovative solutions and their commitment to ethical practices in every field. Experience a culture that believes in your potential to lead and provides the roadmap to get there."
  }
];

const footerSitemap = ['About Portal', 'Campus Life', 'Achievements', 'Admissions', 'Support'];
const footerAccess = ['Program Highlights', 'Campus Tours', 'Parent Webinars', 'Scholarship Guide'];
const socialLinks = [
  { label: 'Facebook', icon: <Facebook size={16} /> },
  { label: 'Instagram', icon: <Instagram size={16} /> },
  { label: 'LinkedIn', icon: <Linkedin size={16} /> },
  { label: 'YouTube', icon: <Youtube size={16} /> }
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#002147] selection:bg-[#002147]/30 font-sans">
      {/* NAVBAR: FIXED TO SINGLE ROW AS REQUESTED */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-none">
            <img src="/images/landing/logo_vig.jpg" alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-lg font-bold tracking-wide text-[#002147]">Vignan's University</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link to="#" className="hover:text-[#F37021]">About Portal</Link>
              <Link to="#" className="hover:text-[#F37021]">Campus Life</Link>
              <Link to="/admin/login" className="hover:text-[#002147]">Admin Login</Link>
              <Link to="/login" className="hover:text-[#002147]">Parent Login</Link>
              <Link to="/faq" className="hover:text-[#002147]">Help & FAQ</Link>
            </div>
            <Link
              to="https://www.vignan.ac.in"
              className="px-5 py-2.5 rounded-full bg-[#002147] text-white text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-transform"
            >
              VISIT FOR INFO
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION: KEPT YOUR BASE STRUCTURE */}
      <header className="pb-16 pt-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
            <div className="relative bg-white shadow-2xl shadow-[#002147]/10 rounded-[32px] p-10 flex flex-col justify-between border border-[#002147]/10">
              <div>
                <p className="text-sm font-bold tracking-[0.4em] text-[#F37021] mb-4">VIGNAN'S UNIVERSITY</p>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-[#002147] leading-tight">
                  {slides[activeSlide].title}
                </h1>
                <p className="text-lg text-slate-600 mt-4 max-w-xl">
                  {slides[activeSlide].subtitle}
                </p>
              </div>
              <div className="mt-10 space-y-4">
                {heroFeatures.map(feature => (
                  <div key={feature.letter} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-[#F37021] text-white flex items-center justify-center font-bold">
                      {feature.letter}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#002147]">{feature.title}:</p>
                      <p className="text-sm text-slate-600 leading-snug">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-full rounded-[32px] overflow-hidden border border-[#002147]/10 shadow-[0_30px_80px_rgba(0,33,71,0.15)] relative">
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                style={{ backgroundImage: `url(${slides[activeSlide].image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#002147]/70 to-[#002147]/20" />
            </div>
          </div>
          <div className="flex justify-center mt-6 gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all ${activeSlide === idx ? 'bg-[#002147]' : 'bg-slate-300'}`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* NEW: 3 BLOCKS FROM IMAGE WITH MODAL CONTENT */}
      <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6 mb-16">
        {impressionBlocks.map((block, index) => (
          <div key={index} className="bg-[#002147] text-white rounded-3xl overflow-hidden shadow-xl border border-white/10 flex flex-col">
            <div className="h-48 overflow-hidden">
              <img src={block.image} alt={block.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-bold mb-2">{block.title}</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed flex-1">{block.desc}</p>
              <button 
                onClick={() => setSelectedContent(block)}
                className="w-full py-2 bg-[#F37021] text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* CONTENT MODAL (FOR 700 WORDS) */}
      {selectedContent && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-[#002147] text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedContent.title}</h2>
              <button onClick={() => setSelectedContent(null)}><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto text-slate-600 leading-relaxed text-sm">
              <p>{selectedContent.fullContent}</p>
            </div>
          </div>
        </div>
      )}

      {/* PARENT PORTAL FOCUS: HIGH IMPRESSION VERSION */}
      <section className="max-w-6xl mx-auto px-6 pb-16 space-y-10">
        <div className="bg-white border-2 border-[#002147]/5 rounded-[40px] shadow-xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F37021]/5 rounded-full -mr-32 -mt-32" />
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-[#002147] uppercase tracking-tighter">Parent Portal Focus</h2>
              <div className="w-20 h-1.5 bg-[#F37021] mt-2 mb-6" />
              <p className="text-base text-slate-600 leading-relaxed italic">
                "Bridging the gap between the classroom and home with real-time insights and transparent communication."
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F4F7FA] rounded-2xl border-l-4 border-[#002147]">
                  <p className="font-bold text-[#002147]">90% Engagement</p>
                  <p className="text-xs text-slate-500">Active parent participation rate.</p>
                </div>
                <div className="p-4 bg-[#F4F7FA] rounded-2xl border-l-4 border-[#F37021]">
                  <p className="font-bold text-[#002147]">Live Tracking</p>
                  <p className="text-xs text-slate-500">Attendance and grade analytics.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                 <img src="/images/landing/span.jpeg" alt="Parent Interaction" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* REST OF YOUR BASE CODE UNCHANGED */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 grid md:grid-cols-[0.8fr_1.2fr] gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.4em] uppercase text-slate-500">Chairman's Vision</p>
            <h3 className="text-2xl font-bold text-[#002147] mt-2">"Empowering Parents, Transforming Futures."</h3>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Parents are lifelong partners in campus success. Vignan's University nurtures trust through data transparency.
               At Vignan's University, we believe education is not just an institutional responsibility — it is a shared journey between parents, faculty, and students. A student's success is deeply rooted in emotional security, consistent guidance, and a strong support system. That is why we treat every student not just as a learner, but as an individual with unique aspirations, strengths, and challenges.

  Our vision is to create an environment where parents are not outsiders, but active participants in their child's growth. Through continuous communication, transparent academic tracking, and behavioral insights, we ensure that parents stay informed and involved at every stage. When parents feel confident and connected, students naturally perform better — this is not theory, it is proven psychology.

  We also emphasize the importance of emotional intelligence, discipline, and self-belief. A student who feels understood performs better than one who feels pressured. Our ecosystem is designed to reduce fear and increase clarity — because clarity builds confidence, and confidence drives success.

  At Vignan's, we don't just produce graduates; we shape responsible individuals who are mentally strong, ethically grounded, and professionally prepared. Our commitment is simple — if a parent trusts us with their child, we take that responsibility seriously, every single day.
            </p>
            <button className="mt-6 px-6 py-2 rounded-full bg-[#F37021] text-white font-semibold text-sm">Learn More</button>
          </div>
          <div className="rounded-[24px] border border-slate-200 overflow-hidden h-full">
            <img src="/images/landing/chairman.jpg" alt="Chairman" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* FACULTY SECTION: KEPT YOUR BASE CODE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.4em] uppercase text-slate-500">Faculty & Placements</p>
              <p className="mt-2 text-sm text-slate-600">Leading partners and faculty shaping multi-national opportunities.</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-[#002147] font-semibold">
              {['Infosys', 'TCS', 'Google'].map(logo => (
                <span key={logo} className="px-4 py-1 rounded-full border border-slate-200">{logo}</span>
              ))}
            </div>
          </div>
          <div className="mt-6 grid md:grid-cols-4 gap-4">
            {facultyProfiles.map(profile => (
              <div key={profile.name} className="border border-slate-100 rounded-2xl p-4 bg-[#F4F7FA]">
                <p className="text-base font-semibold text-[#002147]">{profile.name}</p>
                <p className="text-xs text-slate-500 mt-2">{profile.dept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER: KEPT YOUR BASE CODE */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.4em]">Sitemap</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {footerSitemap.map(link => <a key={link} href="#" className="block hover:text-[#002147]">{link}</a>)}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.4em]">Social Media</h3>
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map(item => (
                <a key={item.label} href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#002147] text-white hover:bg-[#F37021]">
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-[#002147] text-white text-xs text-center py-4">
          &copy; {new Date().getFullYear()} Vignan's University. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
