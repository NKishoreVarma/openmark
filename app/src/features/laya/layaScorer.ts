/**
 * Laya heuristic complexity scorer.
 *
 * Pure function: given a user message string, returns a LayaScore with
 * complexity (0–1), confidence, recommended tier, and contributing signals.
 *
 * Design goals:
 * - Zero async I/O — executes synchronously inside a try/catch in the router
 * - No external dependencies beyond layaTypes.ts
 * - Deterministic — same message always yields same score
 */

import type { LayaScore, LayaSignal, LayaTier } from './layaTypes';

/** Words clearly signalling a simple factual lookup. */
const SIMPLE_LOOKUP_PATTERNS = /\b(what is|what are|who is|who are|define|definition of|meaning of)\b/i;

/** Words signalling a deep-analysis or comparison request. */
const DEEP_ANALYSIS_PATTERNS =
  /\b(analyze|analyse|explain in detail|explain the difference|explain the differences|walk me through|step by step|comprehensive|compare and contrast|compare this|compare with|pros and cons|evaluate|critique|deep dive|in depth|how does.*interact|how do.*interact)\b/i;

/** Technical terms that push toward the frontier tier. */
const TECH_KEYWORD_PATTERNS =
  /\b(algorithm|architecture|async|authentication|authorization|binary|cache|callback|closure|concurrency|cryptography|database|deadlock|decorator|dependency injection|docker|encryption|fibonacci|garbage collection|heap|hook|http|https|interface|iterator|kubernetes|lambda|latency|memory leak|microservice|mutex|oauth|promise|prototype|queue|race condition|recursion|regex|rest api|semaphore|serialization|sql|stack|thread|throughput|typescript|websocket)\b/i;

/** Multi-step request patterns. */
const MULTI_STEP_PATTERNS =
  /(?:\d+\.\s|\bfirst\b|\bsecond\b|\bthird\b|\bthen\b|\bfinally\b|\bnext\b|\bstep \d+\b|\bphase \d+\b)/gi;

/** Code block opener (fenced or indented). */
const CODE_BLOCK_RE = /```|~~~|^\s{4}\S/m;

/** Roughly count words — split on whitespace, drop empty tokens. */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Score a user message for routing complexity.
 *
 * Complexity 0.0 = clearly local (trivial / simple lookup)
 * Complexity 1.0 = clearly frontier (complex / multi-step / analytical)
 * Mid-range (0.4–0.6) = uncertain; router will fall back to existing router
 * unless confidence exceeds the configured threshold.
 */
export function scoreMessage(message: string): LayaScore {
  const text = message.trim();
  const wc = wordCount(text);
  const signals: LayaSignal[] = [];

  // Start from a neutral-ish base (slight lean toward local for short questions)
  let complexity = 0.35;

  // --- word count signals ---
  if (wc > 150) {
    complexity += 0.25;
    signals.push('long_message');
  } else if (wc > 80) {
    complexity += 0.12;
    signals.push('long_message');
  } else if (wc < 10) {
    complexity -= 0.15;
    signals.push('short_message');
  } else if (wc < 25) {
    complexity -= 0.07;
    signals.push('short_message');
  }

  // --- code block ---
  if (CODE_BLOCK_RE.test(text)) {
    complexity += 0.18;
    signals.push('code_block');
  }

  // --- multi-step patterns ---
  const stepMatches = text.match(MULTI_STEP_PATTERNS) ?? [];
  if (stepMatches.length >= 3) {
    complexity += 0.18;
    signals.push('multi_step');
  } else if (stepMatches.length >= 1) {
    complexity += 0.08;
    signals.push('multi_step');
  }

  // --- technical keywords ---
  const techMatches = [...text.matchAll(new RegExp(TECH_KEYWORD_PATTERNS.source, 'gi'))];
  if (techMatches.length >= 3) {
    complexity += 0.20;
    signals.push('technical_keywords');
  } else if (techMatches.length >= 1) {
    complexity += 0.10;
    signals.push('technical_keywords');
  }

  // --- multiple questions ---
  const questionMarks = (text.match(/\?/g) ?? []).length;
  if (questionMarks >= 3) {
    complexity += 0.12;
    signals.push('multi_question');
  } else if (questionMarks >= 2) {
    complexity += 0.06;
    signals.push('multi_question');
  }

  // --- deep analysis ---
  if (DEEP_ANALYSIS_PATTERNS.test(text)) {
    complexity += 0.22;
    signals.push('deep_analysis');
  }

  // --- simple lookup (only if message is not already long/complex) ---
  if (SIMPLE_LOOKUP_PATTERNS.test(text) && wc < 30 && !signals.includes('deep_analysis')) {
    complexity -= 0.18;
    signals.push('simple_lookup');
  }

  // Clamp to [0, 1]
  complexity = Math.min(1, Math.max(0, complexity));

  const tier: LayaTier = complexity >= 0.5 ? 'frontier' : 'local';
  // Confidence: 0 at mid-range (0.5), 1 at extremes (0 or 1)
  const confidence = 2 * Math.abs(complexity - 0.5);

  return { complexity, confidence, tier, signals };
}
