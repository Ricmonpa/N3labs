// Minimal robots.txt evaluator following RFC 9309:
// groups merged per user-agent, specific group beats "*",
// longest matching rule wins, "allow" wins ties, supports * and $.

type Rule = { allow: boolean; pattern: string };
type Group = { agents: string[]; rules: Rule[] };

export type ParsedRobots = { groups: Group[]; sitemaps: string[] };

export type RobotsVerdict = {
  allowed: boolean;
  /** The rule that decided it, e.g. "Disallow: /" — null if no rule applied. */
  rule: string | null;
  /** Which user-agent group applied: the bot token, "*", or null (no group). */
  group: string | null;
};

export function parseRobots(text: string): ParsedRobots {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (key === "allow" || key === "disallow") {
      lastWasAgent = false;
      if (!current || value === "") continue;
      current.rules.push({ allow: key === "allow", pattern: value });
    } else if (key === "sitemap") {
      sitemaps.push(value);
    } else {
      lastWasAgent = false;
    }
  }
  return { groups, sitemaps };
}

function patternToRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp("^" + body + (anchored ? "$" : ""));
}

export function evaluateRobots(robots: ParsedRobots, token: string, path: string): RobotsVerdict {
  const wanted = token.toLowerCase();
  let groupName: string | null = wanted;
  let matching = robots.groups.filter((g) => g.agents.includes(wanted));
  if (matching.length === 0) {
    matching = robots.groups.filter((g) => g.agents.includes("*"));
    groupName = matching.length ? "*" : null;
  }

  let best: Rule | null = null;
  for (const rule of matching.flatMap((g) => g.rules)) {
    if (!patternToRegex(rule.pattern).test(path)) continue;
    if (
      !best ||
      rule.pattern.length > best.pattern.length ||
      (rule.pattern.length === best.pattern.length && rule.allow && !best.allow)
    ) {
      best = rule;
    }
  }

  return {
    allowed: best ? best.allow : true,
    rule: best ? `${best.allow ? "Allow" : "Disallow"}: ${best.pattern}` : null,
    group: groupName,
  };
}
