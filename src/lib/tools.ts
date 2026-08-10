// Launcher tools for the Prompter. Add/remove = one line.
// `copies: true`  → copy the prompt to the clipboard, then open the tool.
// `copies: false` → just open it (pasting a prompt there makes no sense and
//                    would clobber the user's clipboard).
// `icon` maps to a lucide-react icon in Prompter.tsx.

export type ToolGroup = "general" | "specialized" | "marketing";

export type Tool = {
  id: string;
  name: string;
  url: string;
  group: ToolGroup;
  copies: boolean;
  icon: string;
};

export const tools: Tool[] = [
  // — IA de propósito general —
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/", group: "general", copies: true, icon: "bot" },
  { id: "claude", name: "Claude", url: "https://claude.ai/new", group: "general", copies: true, icon: "asterisk" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app", group: "general", copies: true, icon: "sparkles" },
  { id: "copilot", name: "Copilot", url: "https://copilot.microsoft.com/", group: "general", copies: true, icon: "stars" },
  { id: "meta", name: "Meta AI", url: "https://www.meta.ai/", group: "general", copies: true, icon: "infinity" },
  { id: "kimi", name: "Kimi", url: "https://www.kimi.com/", group: "general", copies: true, icon: "messageCircle" },

  // — Especializadas —
  { id: "gamma", name: "Gamma", url: "https://gamma.app/", group: "specialized", copies: true, icon: "presentation" },
  { id: "notebooklm", name: "NotebookLM", url: "https://notebooklm.google.com/", group: "specialized", copies: true, icon: "bookOpen" },
  { id: "zapia", name: "Zapia", url: "https://zapia.com/?lang=es", group: "specialized", copies: true, icon: "zap" },

  // — Marketing digital —
  { id: "trends", name: "Google Trends", url: "https://trends.google.com/trends/", group: "marketing", copies: false, icon: "trendingUp" },
  { id: "canva", name: "Canva", url: "https://www.canva.com/", group: "marketing", copies: true, icon: "palette" },
  { id: "hootsuite", name: "Hootsuite", url: "https://www.hootsuite.com/", group: "marketing", copies: true, icon: "share2" },
  { id: "googleads", name: "Google Ads", url: "https://ads.google.com/", group: "marketing", copies: false, icon: "megaphone" },
  { id: "metaads", name: "Meta Ads", url: "https://www.facebook.com/business/ads", group: "marketing", copies: false, icon: "target" },
];

export const toolGroupOrder: ToolGroup[] = ["general", "specialized", "marketing"];
