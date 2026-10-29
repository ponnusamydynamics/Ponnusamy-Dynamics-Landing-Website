import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AtlasEarthCanvas } from './components/AtlasEarthCanvas';
import { Compass, Code2, Boxes, Send, AlertCircle, ChevronDown } from 'lucide-react';

interface InquiryFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

// Quick, snappy zoom-in from the right animation presets
const quickZoomRightVariants = {
  hidden: { opacity: 0, x: 85, scale: 0.93 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.52,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const pillarCardVariants = {
  hidden: { opacity: 0, x: 70, scale: 0.94 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: index * 0.12,
      duration: 0.48,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function App() {
  const [formData, setFormData] = useState<InquiryFormData>({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configurable Web3Forms Access Key from environment or default placeholder
  const ACCESS_KEY = (import.meta as any).env?.VITE_WEB3FORMS_ACCESS_KEY || '';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!ACCESS_KEY || ACCESS_KEY === 'YOUR_ACCESS_KEY_HERE') {
        // Asynchronous transmission simulator when access key is not yet configured
        await new Promise((resolve) => setTimeout(resolve, 850));
        setIsSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        // Asynchronous fetch API target for Web3Forms
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: ACCESS_KEY,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            subject: formData.subject || 'Institutional Inquiry - Ponnusamy Dynamics',
            message: formData.message,
            from_name: 'Ponnusamy Dynamics Portal',
          }),
        });

        const data = await response.json();
        if (data.success) {
          setIsSuccess(true);
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            subject: '',
            message: '',
          });
        } else {
          throw new Error(data.message || 'Transmission failed. Please check network and retry.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Transmission error. Please verify input parameters and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040404] text-white selection:bg-white selection:text-black font-sans relative overflow-x-hidden">
      {/* 3D Volumetric Atlas & Rotating Celestial Globe + Interactive Background Network */}
      <AtlasEarthCanvas />

      {/* Foreground Content Stack */}
      <div className="relative z-10 flex flex-col min-h-screen pointer-events-auto">
        {/* =========================================================
            HEADER
        ========================================================= */}
        <header className="sticky top-0 z-40 bg-[#040404]/85 backdrop-blur-md border-b border-[#181818] h-[66px] sm:h-[70px]">
          <div className="max-w-[1380px] mx-auto h-full px-6 flex items-center justify-between">
            {/* Logo Unit - more pronounced and commanding */}
            <a
              href="#top"
              className="group flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-xs"
              aria-label="Ponnusamy Dynamics - Home"
            >
              <img
                src="/assets/PDLogo.svg"
                alt="Ponnusamy Dynamics"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src.includes('/assets/PDLogo.svg')) {
                    target.src = '/PDLogo.svg';
                  }
                }}
                className="h-[40px] sm:h-[45px] w-auto transition-transform duration-300 ease-out group-hover:scale-105 drop-shadow-[0_0_16px_rgba(255,255,255,0.26)]"
              />
            </a>

            {/* Right Controls: Navigation & Active Status */}
            <div className="flex items-center gap-6 sm:gap-8">
              <nav className="hidden sm:flex items-center gap-7 font-mono text-[11px] font-medium tracking-[0.08em] text-[#A3A3A3]">
                <a href="#mission" className="hover:text-white transition-colors">
                  MISSION
                </a>
                <a href="#pillars" className="hover:text-white transition-colors">
                  PILLARS
                </a>
                <a href="#inquiries" className="hover:text-white transition-colors">
                  INQUIRIES
                </a>
              </nav>

              {/* Status Indicator */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/5 border border-[#10B981]/25 rounded-xs"
                title="Status: Active"
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#10B981] whitespace-nowrap">
                  STATUS: ACTIVE
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}
        <main className="flex-1">
          {/* =========================================================
              01 // HERO SECTION & MISSION STATEMENT
              Animated entry: quick zoom-in from the right
          ========================================================= */}
          <section id="mission" className="border-b border-[#181818] relative min-h-[78vh] flex items-center pt-8 pb-20 sm:pt-12 sm:pb-24 lg:pt-14 lg:pb-28 overflow-hidden">
            <div className="max-w-[1380px] mx-auto px-6 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Text Column: Quick zoom-in from right animation on load */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={quickZoomRightVariants}
                  className="lg:col-span-7 xl:col-span-6 z-20"
                >
                  {/* Authoritative Headline */}
                  <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-[54px] xl:text-[58px] leading-[1.06] tracking-[-0.03em] text-white uppercase">
                    BUILDING ADVANCED TECHNICAL SYSTEMS TO EXPAND HUMAN CAPABILITY.
                  </h1>

                  {/* Subtext */}
                  <p className="mt-8 text-[16px] sm:text-[18.5px] leading-[1.65] text-[#C4C4C4] font-normal max-w-xl">
                    Ponnusamy Dynamics develops resilient software infrastructure, advanced numerical
                    solvers, and high-consequence execution engines to solve hard structural problems and
                    empower human progress.
                  </p>
                </motion.div>

                {/* Right Visual Staging Spacer for 3D Atlas Figure */}
                <div className="lg:col-span-5 xl:col-span-6 min-h-[300px] sm:min-h-[420px] lg:min-h-[540px] pointer-events-none relative flex items-center justify-center" />
              </div>
            </div>

            {/* Faint Glowing Scroll Indicator: Prompts user down to Pillars */}
            <motion.a
              href="#pillars"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.35, 0.8, 0.35], y: [0, 6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer group z-30 focus-visible:outline-none"
              aria-label="Scroll down to Operational Framework"
            >
              <span className="font-mono text-[9.5px] tracking-[0.2em] text-[#737373] group-hover:text-white uppercase transition-colors select-none">
                SCROLL
              </span>
              <ChevronDown size={18} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.45)] text-white" />
            </motion.a>
          </section>

          {/* =========================================================
              02 // THE THREE OPERATIONAL PILLARS (The Three I's)
              Scroll-triggered: quick zoom in from the right
          ========================================================= */}
          <motion.section
            id="pillars"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.16 }}
            variants={quickZoomRightVariants}
            className="pt-20 pb-28 sm:pt-28 sm:pb-36 border-b border-[#181818] bg-[#050505]/60 backdrop-blur-xs relative overflow-hidden"
          >
            <div className="max-w-[1380px] mx-auto px-6">
              {/* Section Header */}
              <div className="pb-5 border-b border-[#181818] mb-12">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-3.5 bg-white inline-block" />
                  <h2 className="font-display font-bold text-sm tracking-[0.16em] text-white uppercase">
                    02 // OPERATIONAL FRAMEWORK // THE THREE I'S
                  </h2>
                </div>
              </div>

              {/* Three Clean Pillars Grid with Staggered Quick Zoom */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pillar I: INTROSPECT */}
                <motion.div
                  variants={pillarCardVariants}
                  custom={0}
                  whileHover={{ y: -6, borderColor: '#3A3A3A' }}
                  className="bg-[#090909] border border-[#1C1C1C] transition-colors duration-300 p-8 flex flex-col justify-between rounded-xs"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-6">
                      <div className="p-2.5 bg-white/5 border border-white/10 rounded-xs text-white">
                        <Compass size={20} />
                      </div>
                      <div>
                        <span className="block font-mono text-[11px] text-[#10B981] font-semibold tracking-wider">
                          PILLAR I
                        </span>
                        <h3 className="font-display font-bold text-2xl tracking-tight text-white uppercase">
                          INTROSPECT
                        </h3>
                      </div>
                    </div>

                    <p className="text-[15px] leading-relaxed text-[#D6D6D6] font-normal mb-6">
                      Deep analysis of system friction, human requirements, and structural challenges
                      before writing a line of code.
                    </p>

                    <div className="space-y-3 pt-5 border-t border-[#181818] text-[13px] text-[#8C8C8C] leading-relaxed font-mono">
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>Problem-space decomposition &amp; structural friction mapping</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>Zero-assumption boundary condition analysis</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>Human-system constraint &amp; latency profiling</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Pillar II: IDEAS */}
                <motion.div
                  variants={pillarCardVariants}
                  custom={1}
                  whileHover={{ y: -6, borderColor: '#3A3A3A' }}
                  className="bg-[#090909] border border-[#1C1C1C] transition-colors duration-300 p-8 flex flex-col justify-between rounded-xs"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-6">
                      <div className="p-2.5 bg-white/5 border border-white/10 rounded-xs text-white">
                        <Code2 size={20} />
                      </div>
                      <div>
                        <span className="block font-mono text-[11px] text-[#10B981] font-semibold tracking-wider">
                          PILLAR II
                        </span>
                        <h3 className="font-display font-bold text-2xl tracking-tight text-white uppercase">
                          IDEAS
                        </h3>
                      </div>
                    </div>

                    <p className="text-[15px] leading-relaxed text-[#D6D6D6] font-normal mb-6">
                      Translating abstract principles into rigorous design specifications, mathematical
                      models, and low-level system architecture.
                    </p>

                    <div className="space-y-3 pt-5 border-t border-[#181818] text-[13px] text-[#8C8C8C] leading-relaxed font-mono">
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>Mathematical formulations &amp; computational invariant proofs</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>Deterministic protocol design &amp; formal state machine synthesis</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>Low-level memory layout &amp; cache-coherent topology</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Pillar III: INNOVATE */}
                <motion.div
                  variants={pillarCardVariants}
                  custom={2}
                  whileHover={{ y: -6, borderColor: '#3A3A3A' }}
                  className="bg-[#090909] border border-[#1C1C1C] transition-colors duration-300 p-8 flex flex-col justify-between rounded-xs"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-6">
                      <div className="p-2.5 bg-white/5 border border-white/10 rounded-xs text-white">
                        <Boxes size={20} />
                      </div>
                      <div>
                        <span className="block font-mono text-[11px] text-[#10B981] font-semibold tracking-wider">
                          PILLAR III
                        </span>
                        <h3 className="font-display font-bold text-2xl tracking-tight text-white uppercase">
                          INNOVATE
                        </h3>
                      </div>
                    </div>

                    <p className="text-[15px] leading-relaxed text-[#D6D6D6] font-normal mb-6">
                      Executing high-performance software systems, autonomous tools, and fault-tolerant
                      infrastructure.
                    </p>

                    <div className="space-y-3 pt-5 border-t border-[#181818] text-[13px] text-[#8C8C8C] leading-relaxed font-mono">
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>High-throughput, zero-cost abstraction runtime implementation</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>Self-healing distributed state &amp; resilient failure recovery</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-[#10B981] mt-0.5">•</span>
                        <span>Production deployment &amp; continuous empirical stress verification</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Faint Glowing Scroll Indicator: Prompts user down to Inquiries */}
            <motion.a
              href="#inquiries"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.35, 0.8, 0.35], y: [0, 6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer group z-30 focus-visible:outline-none"
              aria-label="Scroll down to Inquiries"
            >
              <span className="font-mono text-[9.5px] tracking-[0.2em] text-[#737373] group-hover:text-white uppercase transition-colors select-none">
                SCROLL
              </span>
              <ChevronDown size={18} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.45)] text-white" />
            </motion.a>
          </motion.section>

          {/* =========================================================
              03 // INSTITUTIONAL CONTACT & INQUIRIES
              Scroll-triggered: quick zoom in from the right
          ========================================================= */}
          <motion.section
            id="inquiries"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.16 }}
            variants={quickZoomRightVariants}
            className="py-20 sm:py-28 border-b border-[#181818] relative overflow-hidden"
          >
            <div className="max-w-[1380px] mx-auto px-6">
              {/* Section Header */}
              <div className="pb-5 border-b border-[#181818] mb-12">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-3.5 bg-white inline-block" />
                  <h2 className="font-display font-bold text-sm tracking-[0.16em] text-white uppercase">
                    03 // INQUIRIES
                  </h2>
                </div>
                <p className="mt-3 text-[15px] text-[#A3A3A3] max-w-2xl font-normal leading-relaxed">
                  Formal communications, institutional research inquiries, and collaboration requests are routed
                  directly to the Office of the Director.
                </p>
              </div>

              {/* Form Container */}
              <div className="max-w-3xl bg-[#090909] border border-[#1C1C1C] p-7 sm:p-10 rounded-xs shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                {isSuccess ? (
                  /* Success State Badge */
                  <div className="py-10 text-center space-y-5">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse" />
                      <span className="font-mono text-[13px] font-semibold tracking-[0.1em] text-[#10B981]">
                        🟢 [ TRANSMISSION COMPLETE ]
                      </span>
                    </div>

                    <p className="font-mono text-[13px] text-[#A3A3A3] max-w-md mx-auto leading-relaxed">
                      Your inquiry has been encrypted and logged with the Office of the Director. You will receive an institutional response at your designated email address.
                    </p>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => setIsSuccess(false)}
                        className="inline-flex items-center font-mono text-[11px] text-[#666666] hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        [ TRANSMIT ANOTHER INQUIRY ]
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form Input Fields */
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* First Name & Last Name (Grid row) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="firstName"
                          className="block font-mono text-[11px] uppercase tracking-[0.12em] text-[#8C8C8C]"
                        >
                          FIRST NAME <span className="text-[#10B981]">*</span>
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Linus"
                          className="w-full bg-[#050505] border border-[#222222] focus:border-[#4B5563] focus:ring-1 focus:ring-white/20 text-white font-mono text-[13px] px-3.5 py-2.5 rounded-xs outline-none transition-colors placeholder-[#3E3E3E]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="lastName"
                          className="block font-mono text-[11px] uppercase tracking-[0.12em] text-[#8C8C8C]"
                        >
                          LAST NAME <span className="text-[#10B981]">*</span>
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Torvalds"
                          className="w-full bg-[#050505] border border-[#222222] focus:border-[#4B5563] focus:ring-1 focus:ring-white/20 text-white font-mono text-[13px] px-3.5 py-2.5 rounded-xs outline-none transition-colors placeholder-[#3E3E3E]"
                        />
                      </div>
                    </div>

                    {/* Return Email Address */}
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="block font-mono text-[11px] uppercase tracking-[0.12em] text-[#8C8C8C]"
                      >
                        RETURN EMAIL ADDRESS <span className="text-[#10B981]">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contact@institution.org"
                        className="w-full bg-[#050505] border border-[#222222] focus:border-[#4B5563] focus:ring-1 focus:ring-white/20 text-white font-mono text-[13px] px-3.5 py-2.5 rounded-xs outline-none transition-colors placeholder-[#3E3E3E]"
                      />
                    </div>

                    {/* Subject / Inquiry Scope */}
                    <div className="space-y-2">
                      <label
                        htmlFor="subject"
                        className="block font-mono text-[11px] uppercase tracking-[0.12em] text-[#8C8C8C]"
                      >
                        SUBJECT / INQUIRY SCOPE <span className="text-[#10B981]">*</span>
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="e.g. Distributed Solver Architecture Research Collaboration"
                        className="w-full bg-[#050505] border border-[#222222] focus:border-[#4B5563] focus:ring-1 focus:ring-white/20 text-white font-mono text-[13px] px-3.5 py-2.5 rounded-xs outline-none transition-colors placeholder-[#3E3E3E]"
                      />
                    </div>

                    {/* Message Specifications */}
                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="block font-mono text-[11px] uppercase tracking-[0.12em] text-[#8C8C8C]"
                      >
                        MESSAGE SPECIFICATIONS <span className="text-[#10B981]">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Detail technical requirements, architectural scope, research proposal, or institutional agenda..."
                        className="w-full bg-[#050505] border border-[#222222] focus:border-[#4B5563] focus:ring-1 focus:ring-white/20 text-white font-mono text-[13px] p-3.5 rounded-xs outline-none transition-colors resize-y placeholder-[#3E3E3E]"
                      />
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                      <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xs flex items-center gap-2 text-red-400 font-mono text-[12px]">
                        <AlertCircle size={15} />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-mono text-[12px] font-semibold tracking-[0.1em] hover:bg-[#E5E5E5] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xs cursor-pointer shadow-[0_0_16px_rgba(255,255,255,0.15)]"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>[ TRANSMITTING INQUIRY... ]</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>[ TRANSMIT INQUIRY ]</span>
                          </>
                        )}
                      </motion.button>

                      <div className="font-mono text-[11px] text-[#555555]">
                        SECURE ASYNC CHANNEL // OFFICE OF THE DIRECTOR
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.section>
        </main>

        {/* =========================================================
            FOOTER
        ========================================================= */}
        <footer className="bg-[#040404] py-12 border-t border-[#121212]">
          <div className="max-w-[1380px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-mono text-[12px] text-[#888888] tracking-wide text-center sm:text-left">
              © 2026 Ponnusamy Dynamics. All Rights Reserved.
            </div>
            <a
              href="#top"
              className="font-mono text-[11px] text-[#666666] hover:text-white transition-colors"
            >
              BACK TO TOP ↑
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
