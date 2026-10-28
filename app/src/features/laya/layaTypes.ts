/**
 * Core types for the Laya routing system.
 *
 * Laya intercepts each chat turn, scores query complexity, and — when
 * confidence is above the configured threshold — selects between a local
 * model tier and a frontier (cloud) model tier.  All failure modes fall back
 * to the existing OpenMark router so a Laya fault can never break a turn.
 *
 * The feature flag (`layaEnabled`) is OFF by default.  Routing only becomes
 * active once shadow evidence passes the quality gate (see `LayaShadowStats`).
 */

/** Which model tier Laya recommends for a turn. */
export type LayaTier = 'local' | 'frontier';

/** Signals that drove the routing score. */
export type LayaSignal =
  | 'long_message'
  | 'short_message'
  | 'code_block'
  | 'multi_step'
  | 'technical_keywords'
  | 'multi_question'
  | 'deep_analysis'
  | 'simple_lookup';

/** Result of the confidence scorer for one message. */
export interface LayaScore {
  /** Normalised 0–1 complexity estimate.  ≥0.5 → frontier tier; <0.5 → local. */
  complexity: number;
  /** Certainty in the routing decision: 2·|complexity − 0.5|.  0 at mid-range, 1 at extremes. */
  confidence: number;
  /** Recommended tier given the complexity estimate. */
  tier: LayaTier;
  /** Human-readable signals that contributed to this score. */
  signals: LayaSignal[];
}

/** Why a particular turn used or did not use Laya routing. */
export type LayaOutcome =
  | 'laya_local'              // Laya routed to local tier
  | 'laya_frontier'           // Laya routed to frontier tier
  | 'fallback_low_confidence' // confidence < threshold
  | 'fallback_error'          // scorer threw
  | 'fallback_timeout'        // scorer exceeded LAYA_SCORE_TIMEOUT_MS
  | 'fallback_unavailable'    // local model not configured / unavailable
  | 'flag_off';               // feature flag disabled

/** One resolved routing decision — stored in the slice's history ring. */
export interface LayaRoutingRecord {
  id: string;
  timestamp: number;
  threadId: string;
  /** The locally-generated user message ID for this turn (links record to message). */
  userMessageId?: string;
  /** First 120 chars of the user message. */
  messagePreview: string;
  score: LayaScore;
  outcome: LayaOutcome;
  /** The model_override actually sent to core RPC. */
  modelUsed: string;
  /** True once the user clicked "Redo with frontier model" for this turn. */
  redoneWithFrontier?: boolean;
}

/**
 * Shadow-mode record: Laya scores the query and records what it WOULD have
 * done, but the existing router still handles the turn.  Accumulated shadow
 * records are the evidence base reviewed before enabling live routing.
 */
export interface LayaShadowRecord {
  id: string;
  timestamp: number;
  messagePreview: string;
  layaScore: LayaScore;
  /** Model the existing router used. */
  existingRouterModel: string;
  /** Did the turn complete without error? — filled by turn-complete handler. */
  turnSuccess?: boolean;
  /** Did the user manually retry with a different model? */
  userRetried?: boolean;
}

/** Aggregated statistics over accumulated shadow records. */
export interface LayaShadowStats {
  /** Total shadow records collected. */
  recordCount: number;
  /** Fraction of shadow decisions where the tier matched the inferred good outcome. */
  estimatedPrecision: number;
  /** ISO timestamp of earliest record. */
  oldestRecordAt: string | null;
  /** ISO timestamp of newest record. */
  newestRecordAt: string | null;
}

/**
 * Quality gate: live routing only activates when ALL conditions hold.
 * These can be adjusted via `LAYA_MIN_SHADOW_RECORDS` / `LAYA_MIN_PRECISION`
 * config constants.
 */
export interface LayaEvidenceGate {
  minRecords: number;         // default 200
  minPrecision: number;       // default 0.75
  passed: boolean;
}

/** Persisted Laya configuration controlled by the user. */
export interface LayaConfig {
  /** Master ON/OFF switch.  OFF by default; evidence gate checked on enable. */
  enabled: boolean;
  /**
   * Confidence threshold (0–1).  Turns below this are not routed by Laya.
   * Default 0.65.
   */
  confidenceThreshold: number;
  /**
   * model_override to send for local-tier turns.
   * '' = let core resolve via its local AI config.
   */
  localModelOverride: string;
  /**
   * model_override to send for frontier-tier turns.
   * '' = let core resolve via hint:chat default.
   */
  frontierModelOverride: string;
  /** Collect shadow records even when live routing is OFF.  Default true. */
  shadowModeEnabled: boolean;
  /** Include routing decisions in anonymous product telemetry.  Default false. */
  telemetryEnabled: boolean;
}

/** The current live routing status exposed to the UI. */
export type LayaStatus =
  | 'disabled'          // flag off
  | 'shadow_only'       // flag off but shadow mode collecting
  | 'evidence_pending'  // flag on but evidence gate not yet passed
  | 'active';           // flag on and evidence gate passed — live routing
