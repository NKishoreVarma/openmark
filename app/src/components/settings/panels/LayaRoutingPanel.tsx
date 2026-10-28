import { useCallback } from 'react';

import { useT } from '../../../lib/i18n/I18nContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  clearHistory,
  clearShadowRecords,
  selectLayaConfig,
  selectLayaHistory,
  selectLayaShadowStats,
  selectLayaStatus,
  updateConfig,
} from '../../../features/laya/layaSlice';
import type { LayaConfig, LayaOutcome } from '../../../features/laya/layaTypes';
import { Card } from '../../ui';
import Field from '../../ui/Field';
import Checkbox from '../../ui/Checkbox';
import SettingsPanel from '../layout/SettingsPanel';


function outcomeColor(outcome: LayaOutcome): string {
  if (outcome === 'laya_local') return 'text-teal-600 dark:text-teal-400';
  if (outcome === 'laya_frontier') return 'text-blue-600 dark:text-blue-400';
  return 'text-content-secondary';
}

const LayaRoutingPanel = () => {
  const { t } = useT();
  const dispatch = useAppDispatch();
  const config = useAppSelector(selectLayaConfig);
  const history = useAppSelector(selectLayaHistory);
  const shadowStats = useAppSelector(selectLayaShadowStats);
  const status = useAppSelector(selectLayaStatus);

  const patch = useCallback(
    (update: Partial<LayaConfig>) => dispatch(updateConfig(update)),
    [dispatch]
  );

  const outcomeLabel = useCallback(
    (outcome: LayaOutcome): string => t(`settings.laya.outcome.${outcome}`),
    [t]
  );

  const statusLabel: Record<typeof status, string> = {
    disabled: t('settings.laya.status.disabled'),
    shadow_only: t('settings.laya.status.shadow_only'),
    evidence_pending: t('settings.laya.status.evidence_pending'),
    active: t('settings.laya.status.active'),
  };

  const statusColor: Record<typeof status, string> = {
    disabled: 'text-content-secondary',
    shadow_only: 'text-yellow-600 dark:text-yellow-400',
    evidence_pending: 'text-orange-600 dark:text-orange-400',
    active: 'text-teal-600 dark:text-teal-400',
  };

  return (
    <SettingsPanel
      title={t('settings.laya.title')}
      description={t('settings.laya.description')}
    >
      {/* Status banner */}
      <Card className="mb-4 px-4 py-3 flex items-center gap-2">
        <span className="text-sm text-content-secondary">{t('settings.laya.status.label')}:</span>
        <span className={`text-sm font-medium ${statusColor[status]}`}>
          {statusLabel[status]}
        </span>
      </Card>

      {/* Master toggle */}
      <Card className="mb-4">
        <Field
          label={t('settings.laya.enabled')}
          description={t('settings.laya.enabledDesc')}
          control={
            <Checkbox
              id="laya-enabled"
              checked={config.enabled}
              onCheckedChange={v => patch({ enabled: v })}
              data-testid="laya-enabled-checkbox"
            />
          }
        />
      </Card>

      {/* Evidence gate warning */}
      {config.enabled && status === 'evidence_pending' && (
        <Card className="mb-4 px-4 py-3 border-orange-300 dark:border-orange-700">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            {t('settings.laya.evidencePending')}
          </p>
        </Card>
      )}

      {/* Confidence threshold */}
      <Card className="mb-4">
        <Field
          label={t('settings.laya.confidenceThreshold')}
          description={t('settings.laya.confidenceThresholdDesc')}
          stacked
          control={
            <div className="flex items-center gap-3 w-full">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={config.confidenceThreshold}
                onChange={e => patch({ confidenceThreshold: Number(e.target.value) })}
                className="flex-1"
                aria-label={t('settings.laya.confidenceThreshold')}
              />
              <span className="text-sm text-content-secondary w-10 text-right">
                {Math.round(config.confidenceThreshold * 100)}%
              </span>
            </div>
          }
        />
      </Card>

      {/* Model overrides */}
      <Card className="mb-4 divide-y divide-line">
        <div className="px-4 py-3">
          <Field
            label={t('settings.laya.localModel')}
            description={t('settings.laya.localModelDesc')}
            stacked
            control={
              <input
                type="text"
                value={config.localModelOverride}
                onChange={e => patch({ localModelOverride: e.target.value })}
                placeholder="e.g. ollama:llama3.2"
                className="w-full rounded border border-line bg-surface px-3 py-1.5 text-sm"
                aria-label={t('settings.laya.localModel')}
              />
            }
          />
        </div>
        <div className="px-4 py-3">
          <Field
            label={t('settings.laya.frontierModel')}
            description={t('settings.laya.frontierModelDesc')}
            stacked
            control={
              <input
                type="text"
                value={config.frontierModelOverride}
                onChange={e => patch({ frontierModelOverride: e.target.value })}
                placeholder="e.g. hint:chat"
                className="w-full rounded border border-line bg-surface px-3 py-1.5 text-sm"
                aria-label={t('settings.laya.frontierModel')}
              />
            }
          />
        </div>
      </Card>

      {/* Shadow mode + telemetry toggles */}
      <Card className="mb-4 divide-y divide-line">
        <div className="px-4 py-3">
          <Field
            label={t('settings.laya.shadowMode')}
            description={t('settings.laya.shadowModeDesc')}
            control={
              <Checkbox
                id="laya-shadow-mode"
                checked={config.shadowModeEnabled}
                onCheckedChange={v => patch({ shadowModeEnabled: v })}
                data-testid="laya-shadow-checkbox"
              />
            }
          />
        </div>
        <div className="px-4 py-3">
          <Field
            label={t('settings.laya.telemetry')}
            description={t('settings.laya.telemetryDesc')}
            control={
              <Checkbox
                id="laya-telemetry"
                checked={config.telemetryEnabled}
                onCheckedChange={v => patch({ telemetryEnabled: v })}
                data-testid="laya-telemetry-checkbox"
              />
            }
          />
        </div>
      </Card>

      {/* Shadow evidence stats */}
      <Card className="mb-4 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-content">{t('settings.laya.shadowStats')}</span>
          <button
            onClick={() => dispatch(clearShadowRecords())}
            className="text-xs text-content-secondary hover:text-content"
          >
            Clear
          </button>
        </div>
        <p className="mt-1 text-sm text-content-secondary">
          {t('settings.laya.shadowRecords').replace('{count}', String(shadowStats.recordCount))}
        </p>
        {shadowStats.recordCount > 0 && (
          <p className="text-sm text-content-secondary">
            {t('settings.laya.shadowPrecision').replace(
              '{pct}',
              String(Math.round(shadowStats.estimatedPrecision * 100))
            )}
          </p>
        )}
      </Card>

      {/* Routing history */}
      <Card className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-content">{t('settings.laya.history')}</span>
          <button
            onClick={() => dispatch(clearHistory())}
            className="text-xs text-content-secondary hover:text-content"
          >
            {t('settings.laya.clearHistory')}
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-content-secondary">{t('settings.laya.historyEmpty')}</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {[...history].reverse().map(r => (
              <li key={r.id} className="text-xs text-content-secondary border-b border-line pb-1 last:border-0">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${outcomeColor(r.outcome)}`}>
                    {outcomeLabel(r.outcome)}
                  </span>
                  <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="mt-0.5 truncate">{r.messagePreview}</div>
                <div className="flex gap-2 mt-0.5">
                  <span>
                    complexity {Math.round(r.score.complexity * 100)}%
                  </span>
                  <span>·</span>
                  <span>
                    confidence {Math.round(r.score.confidence * 100)}%
                  </span>
                  <span>·</span>
                  <span>{r.modelUsed}</span>
                  {r.redoneWithFrontier && (
                    <span className="text-blue-500">↺ redone</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </SettingsPanel>
  );
};

export default LayaRoutingPanel;
