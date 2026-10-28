import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  LayaConfig,
  LayaRoutingRecord,
  LayaShadowRecord,
  LayaShadowStats,
  LayaStatus,
} from './layaTypes';

const MAX_ROUTING_HISTORY = 100;
const MAX_SHADOW_RECORDS = 500;

export interface LayaState {
  config: LayaConfig;
  /** Ring buffer of the last MAX_ROUTING_HISTORY live routing decisions. */
  history: LayaRoutingRecord[];
  /** Ring buffer of shadow-mode observations (pre-enablement evidence). */
  shadowRecords: LayaShadowRecord[];
  shadowStats: LayaShadowStats;
}

export const DEFAULT_CONFIG: LayaConfig = {
  enabled: false,
  confidenceThreshold: 0.65,
  localModelOverride: '',
  frontierModelOverride: '',
  shadowModeEnabled: true,
  telemetryEnabled: false,
};

const DEFAULT_SHADOW_STATS: LayaShadowStats = {
  recordCount: 0,
  estimatedPrecision: 0,
  oldestRecordAt: null,
  newestRecordAt: null,
};

export const DEFAULT_LAYA_STATE: LayaState = {
  config: DEFAULT_CONFIG,
  history: [],
  shadowRecords: [],
  shadowStats: DEFAULT_SHADOW_STATS,
};

const initialState: LayaState = DEFAULT_LAYA_STATE;

function recomputeShadowStats(records: LayaShadowRecord[]): LayaShadowStats {
  if (records.length === 0) return DEFAULT_SHADOW_STATS;

  // Estimated precision: proportion of shadow records where the user did NOT
  // manually retry with a different model. A retry is the best proxy we have
  // for "Laya would have routed wrong" in shadow mode.
  const retried = records.filter(r => r.userRetried).length;
  const estimatedPrecision = records.length > 0 ? (records.length - retried) / records.length : 0;

  const timestamps = records.map(r => r.timestamp).sort();

  return {
    recordCount: records.length,
    estimatedPrecision,
    oldestRecordAt: new Date(timestamps[0]).toISOString(),
    newestRecordAt: new Date(timestamps[timestamps.length - 1]).toISOString(),
  };
}

const layaSlice = createSlice({
  name: 'laya',
  initialState,
  reducers: {
    updateConfig(state, action: PayloadAction<Partial<LayaConfig>>) {
      state.config = { ...state.config, ...action.payload };
    },

    addRoutingRecord(state, action: PayloadAction<LayaRoutingRecord>) {
      state.history.push(action.payload);
      if (state.history.length > MAX_ROUTING_HISTORY) {
        state.history.shift();
      }
    },

    markRedoneWithFrontier(state, action: PayloadAction<string>) {
      const record = state.history.find(r => r.id === action.payload);
      if (record) {
        record.redoneWithFrontier = true;
      }
    },

    addShadowRecord(state, action: PayloadAction<LayaShadowRecord>) {
      state.shadowRecords.push(action.payload);
      if (state.shadowRecords.length > MAX_SHADOW_RECORDS) {
        state.shadowRecords.shift();
      }
      state.shadowStats = recomputeShadowStats(state.shadowRecords);
    },

    updateShadowRecord(
      state,
      action: PayloadAction<{ id: string; patch: Partial<LayaShadowRecord> }>
    ) {
      const record = state.shadowRecords.find(r => r.id === action.payload.id);
      if (record) {
        Object.assign(record, action.payload.patch);
        state.shadowStats = recomputeShadowStats(state.shadowRecords);
      }
    },

    clearHistory(state) {
      state.history = [];
    },

    clearShadowRecords(state) {
      state.shadowRecords = [];
      state.shadowStats = DEFAULT_SHADOW_STATS;
    },
  },
});

export const {
  updateConfig,
  addRoutingRecord,
  markRedoneWithFrontier,
  addShadowRecord,
  updateShadowRecord,
  clearHistory,
  clearShadowRecords,
} = layaSlice.actions;

export default layaSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export type RootStateWithLaya = { laya: LayaState };

export function selectLayaConfig(state: RootStateWithLaya): LayaConfig {
  return state.laya.config;
}

export function selectLayaHistory(state: RootStateWithLaya): LayaRoutingRecord[] {
  return state.laya.history;
}

export function selectLayaShadowStats(state: RootStateWithLaya): LayaShadowStats {
  return state.laya.shadowStats;
}

/** Derive the current operational status of the Laya router. */
export function selectLayaStatus(state: RootStateWithLaya): LayaStatus {
  const { config, shadowStats } = state.laya;
  if (!config.enabled) {
    return config.shadowModeEnabled ? 'shadow_only' : 'disabled';
  }
  const MIN_RECORDS = 200;
  const MIN_PRECISION = 0.75;
  if (
    shadowStats.recordCount >= MIN_RECORDS &&
    shadowStats.estimatedPrecision >= MIN_PRECISION
  ) {
    return 'active';
  }
  return 'evidence_pending';
}
