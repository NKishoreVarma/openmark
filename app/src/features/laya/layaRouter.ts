/**
 * Laya routing decision engine.
 *
 * decideRouting() is the single entry point.  It is always safe to call: any
 * failure (scorer throws, timeout, model unavailable) returns an outcome with
 * the existing-router model so the chat turn is never broken.
 *
 * Integration point: call this BEFORE chatSend() and pass the returned
 * `model` to chatSend's `model` parameter.
 */

import type { AppDispatch } from '../../store';
import { addRoutingRecord, addShadowRecord, type LayaState } from './layaSlice';
import { scoreMessage } from './layaScorer';
import type { LayaConfig, LayaOutcome, LayaRoutingRecord, LayaShadowRecord } from './layaTypes';

/** Max time the scorer may take before we treat it as a timeout fallback. */
const SCORE_TIMEOUT_MS = 100;

/** Hint the existing managed-cloud router uses when no override is pinned. */
const HINT_CHAT = 'hint:chat';

/** Minimum shadow records required before the evidence gate passes. */
const MIN_RECORDS = 200;
/** Minimum estimated precision for the evidence gate. */
const MIN_PRECISION = 0.75;

let _nextId = 0;
function makeId(): string {
  return `laya-${Date.now()}-${++_nextId}`;
}

export interface RoutingResult {
  /** model_override to pass to chatSend — never undefined. */
  model: string;
  outcome: LayaOutcome;
  /** Raw score (null when scoring was skipped or failed). */
  score: ReturnType<typeof scoreMessage> | null;
  /** The routing record that was dispatched (null when Laya is inactive). */
  record: LayaRoutingRecord | null;
  shadowRecord: LayaShadowRecord | null;
}

function computeStatus(laya: LayaState): 'disabled' | 'shadow_only' | 'evidence_pending' | 'active' {
  if (!laya.config.enabled) {
    return laya.config.shadowModeEnabled ? 'shadow_only' : 'disabled';
  }
  if (
    laya.shadowStats.recordCount >= MIN_RECORDS &&
    laya.shadowStats.estimatedPrecision >= MIN_PRECISION
  ) {
    return 'active';
  }
  return 'evidence_pending';
}

/**
 * Decide which model to use for the next chat turn.
 *
 * @param message        - The user's message text (used for scoring)
 * @param threadId       - Thread id for the record
 * @param existingModel  - Model the existing router would have sent (fallback value)
 * @param layaState      - Current laya Redux slice state (read-only snapshot)
 * @param dispatch       - Redux dispatch for recording the decision
 * @param userMessageId  - Optional locally-generated user message ID for badge linkage
 */
export function decideRouting(
  message: string,
  threadId: string,
  existingModel: string,
  layaState: LayaState,
  dispatch: AppDispatch,
  userMessageId?: string
): RoutingResult {
  const config: LayaConfig = layaState.config;
  const status = computeStatus(layaState);

  const messagePreview = message.slice(0, 120);

  // --- shadow mode: record what Laya WOULD have done even when routing is off ---
  if (config.shadowModeEnabled && status !== 'active') {
    let score: ReturnType<typeof scoreMessage> | null = null;
    try {
      score = withTimeout(() => scoreMessage(message), SCORE_TIMEOUT_MS);
    } catch {
      // silent — shadow recording best-effort
    }
    if (score) {
      const shadowRecord: LayaShadowRecord = {
        id: makeId(),
        timestamp: Date.now(),
        messagePreview,
        layaScore: score,
        existingRouterModel: existingModel,
      };
      dispatch(addShadowRecord(shadowRecord));
      return {
        model: existingModel,
        outcome: 'flag_off',
        score,
        record: null,
        shadowRecord,
      };
    }
    return { model: existingModel, outcome: 'flag_off', score: null, record: null, shadowRecord: null };
  }

  // --- flag fully off, shadow also off ---
  if (status === 'disabled') {
    return { model: existingModel, outcome: 'flag_off', score: null, record: null, shadowRecord: null };
  }

  // --- evidence gate pending ---
  if (status === 'evidence_pending') {
    return { model: existingModel, outcome: 'flag_off', score: null, record: null, shadowRecord: null };
  }

  // --- live routing active ---
  let score: ReturnType<typeof scoreMessage> | null = null;
  let outcome: LayaOutcome;
  let model: string;

  try {
    score = withTimeout(() => scoreMessage(message), SCORE_TIMEOUT_MS);
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === 'LAYA_TIMEOUT';
    outcome = isTimeout ? 'fallback_timeout' : 'fallback_error';
    const record = makeRecord(makeId(), threadId, messagePreview, score, outcome, existingModel, userMessageId);
    dispatch(addRoutingRecord(record));
    return { model: existingModel, outcome, score, record, shadowRecord: null };
  }

  if (score.confidence < config.confidenceThreshold) {
    outcome = 'fallback_low_confidence';
    model = existingModel;
  } else if (score.tier === 'local') {
    // Use the configured local override, or fall back to existing router if blank
    const localModel = config.localModelOverride || null;
    if (!localModel) {
      outcome = 'fallback_unavailable';
      model = existingModel;
    } else {
      outcome = 'laya_local';
      model = localModel;
    }
  } else {
    // frontier tier
    outcome = 'laya_frontier';
    model = config.frontierModelOverride || HINT_CHAT;
  }

  const record = makeRecord(makeId(), threadId, messagePreview, score, outcome, model, userMessageId);
  dispatch(addRoutingRecord(record));
  return { model, outcome, score, record, shadowRecord: null };
}

function makeRecord(
  id: string,
  threadId: string,
  messagePreview: string,
  score: ReturnType<typeof scoreMessage> | null,
  outcome: LayaOutcome,
  modelUsed: string,
  userMessageId?: string
): LayaRoutingRecord {
  return {
    id,
    timestamp: Date.now(),
    threadId,
    userMessageId,
    messagePreview,
    score: score ?? { complexity: 0, confidence: 0, tier: 'frontier', signals: [] },
    outcome,
    modelUsed,
  };
}

/**
 * Run fn synchronously and throw a LAYA_TIMEOUT error if it takes longer than
 * timeoutMs.  Since JS is single-threaded this is implemented as a best-effort
 * elapsed check AFTER the call — the intent is to detect a hung regex.
 */
function withTimeout<T>(fn: () => T, timeoutMs: number): T {
  const start = Date.now();
  const result = fn();
  const elapsed = Date.now() - start;
  if (elapsed > timeoutMs) {
    throw new Error('LAYA_TIMEOUT');
  }
  return result;
}
