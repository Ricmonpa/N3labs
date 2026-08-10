"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy, Check, Sparkles, Bot, Asterisk, Infinity as InfinityIcon, Stars,
  MessageCircle, Presentation, BookOpen, Zap, TrendingUp, Palette, Share2,
  Megaphone, Target, type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { tools, toolGroupOrder, type ToolGroup } from "@/lib/tools";

const iconMap: Record<string, LucideIcon> = {
  bot: Bot, asterisk: Asterisk, sparkles: Sparkles, stars: Stars,
  infinity: InfinityIcon, messageCircle: MessageCircle, presentation: Presentation,
  bookOpen: BookOpen, zap: Zap, trendingUp: TrendingUp, palette: Palette,
  share2: Share2, megaphone: Megaphone, target: Target,
};

export default function Prompter() {
  const { t } = useLanguage();
  const p = t.prompter;

  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [audience, setAudience] = useState("");
  const [format, setFormat] = useState(p.options.format[0]);
  const [tone, setTone] = useState(p.options.tone[0]);
  const [detail, setDetail] = useState(p.options.detail[0]);
  const [outputLang, setOutputLang] = useState(p.options.outputLang[0]);
  const [extra, setExtra] = useState("");
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => {
    const tpl = p.template;
    const lines: string[] = [];
    lines.push(`${tpl.roleLead} ${context.trim() || tpl.roleDefault}.`);
    lines.push("");
    lines.push(tpl.goalHeader);
    lines.push(goal.trim() || tpl.goalPlaceholder);
    lines.push("");
    if (audience.trim()) {
      lines.push(`${tpl.audienceHeader} ${audience.trim()}`);
    }
    lines.push(`${tpl.formatHeader} ${format}`);
    lines.push(`${tpl.toneHeader} ${tone}`);
    lines.push(`${tpl.detailHeader} ${detail}`);
    lines.push(`${tpl.langHeader} ${outputLang}`);
    if (extra.trim()) {
      lines.push("");
      lines.push(`${tpl.extraHeader} ${extra.trim()}`);
    }
    lines.push("");
    lines.push(tpl.closing);
    return lines.join("\n");
  }, [p.template, goal, context, audience, format, tone, detail, outputLang, extra]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const launchTool = async (url: string, copies: boolean) => {
    if (copies) {
      try {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const inputClass =
    "w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40 focus:bg-white/[0.05] transition-all duration-200";
  const labelClass = "block text-sm font-semibold text-zinc-300 mb-2";
  const selectClass = inputClass + " appearance-none cursor-pointer pr-9";

  return (
    <section className="pt-32 pb-24 px-6 relative grid-bg min-h-screen">
      {/* Ambient */}
      <div
        className="absolute top-40 left-1/4 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: "rgba(220, 38, 38, 0.07)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/8 text-red-400 text-xs font-medium tracking-wide mb-6">
            <Sparkles size={12} className="text-red-500" />
            {p.badge}
          </span>
          <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-black leading-none mb-3">
            <span className="gradient-text">{p.title}</span>{" "}
            <span className="text-zinc-600 text-2xl font-medium align-middle">{p.titleVersion}</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-light">{p.subtitle}</p>
        </motion.div>

        {/* Two panels */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Build panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass rounded-2xl p-7 border border-white/[0.06]"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">
                {p.buildTitle}
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>{p.fields.goal.label}</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={p.fields.goal.placeholder}
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </div>

              <div>
                <label className={labelClass}>{p.fields.context.label}</label>
                <input
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={p.fields.context.placeholder}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>{p.fields.audience.label}</label>
                <input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder={p.fields.audience.placeholder}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{p.fields.format.label}</label>
                  <select value={format} onChange={(e) => setFormat(e.target.value)} className={selectClass}>
                    {p.options.format.map((o) => (
                      <option key={o} value={o} className="bg-[#0d0d14]">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{p.fields.tone.label}</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className={selectClass}>
                    {p.options.tone.map((o) => (
                      <option key={o} value={o} className="bg-[#0d0d14]">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{p.fields.detail.label}</label>
                  <select value={detail} onChange={(e) => setDetail(e.target.value)} className={selectClass}>
                    {p.options.detail.map((o) => (
                      <option key={o} value={o} className="bg-[#0d0d14]">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{p.fields.outputLang.label}</label>
                  <select value={outputLang} onChange={(e) => setOutputLang(e.target.value)} className={selectClass}>
                    {p.options.outputLang.map((o) => (
                      <option key={o} value={o} className="bg-[#0d0d14]">{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>{p.fields.extra.label}</label>
                <textarea
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder={p.fields.extra.placeholder}
                  rows={2}
                  className={inputClass + " resize-none"}
                />
                <p className="text-xs text-zinc-600 mt-2">{p.fields.extra.helper}</p>
              </div>
            </div>
          </motion.div>

          {/* Result panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="glass rounded-2xl p-7 border border-white/[0.06] flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">
                  {p.resultTitle}
                </h2>
              </div>

              <pre className="flex-1 rounded-xl bg-black/40 border border-white/[0.06] p-5 text-sm text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed overflow-auto min-h-[340px]">
                {prompt}
              </pre>

              <button
                onClick={copyPrompt}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm transition-all duration-200"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? p.copied : p.copy}
              </button>
            </div>
          </motion.div>
        </div>

        {/* AI selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2">
            {p.aiTitle}
          </h3>
          <p className="text-zinc-600 text-xs mb-10 max-w-xl mx-auto">{p.aiHint}</p>

          <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {toolGroupOrder.map((group) => {
              const groupTools = tools.filter((tool) => tool.group === group);
              if (groupTools.length === 0) return null;
              return (
                <div key={group}>
                  <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-red-500/80 mb-4">
                    {p.toolGroups[group as ToolGroup]}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {groupTools.map(({ id, name, url, copies, icon }) => {
                      const Icon = iconMap[icon] ?? Bot;
                      return (
                        <button
                          key={id}
                          onClick={() => launchTool(url, copies)}
                          className="relative glass glass-hover rounded-2xl p-6 border border-white/[0.06] hover:border-red-500/25 flex flex-col items-center gap-3 group transition-all duration-300"
                        >
                          <Icon size={24} className="text-zinc-400 group-hover:text-red-400 transition-colors" />
                          <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                            {name}
                          </span>
                          {!copies && (
                            <span className="absolute top-2 right-2 text-[8px] font-medium tracking-wide uppercase text-zinc-600 border border-white/[0.06] rounded px-1 py-0.5">
                              {p.opensOnly}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
