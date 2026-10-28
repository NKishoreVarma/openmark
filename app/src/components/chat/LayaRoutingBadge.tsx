/**
 * LayaRoutingBadge — a lightweight chip shown below an assistant message turn
 * that was routed by Laya.  Displays which tier was selected, complexity %, and
 * a "Redo with frontier model" action.
 *
 * Usage:
 *   <LayaRoutingBadge record={routingRecord} onRedoWithFrontier={handleRedo} />
 *
 * Omit the component entirely (or pass null) when Laya was not active for the
 * turn to avoid showing it on turns routed by the existing router.
 */

import { useState } from 'react';

import { useT } from '../../lib/i18n/I18nContext';
import { useAppDispatch } from '../../store/hooks';
import { markRedoneWithFrontier } from '../../features/laya/layaSlice';
import type { LayaRoutingRecord } from '../../features/laya/layaTypes';

interface LayaRoutingBadgeProps {
  record: LayaRoutingRecord;
  /** Called when user clicks "Redo with frontier model". */
  onRedoWithFrontier?: (record: LayaRoutingRecord) => void;
  className?: string;
}

export default function LayaRoutingBadge({
  record,
  onRedoWithFrontier,
  className,
}: LayaRoutingBadgeProps) {
  const { t } = useT();
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);

  const isLocal = record.outcome === 'laya_local';
  const isFrontier = record.outcome === 'laya_frontier';
  const isLayaRouted = isLocal || isFrontier;

  if (!isLayaRouted) return null;

  const tierLabel = isLocal ? t('laya.badge.local') : t('laya.badge.frontier');
  const complexityPct = Math.round(record.score.complexity * 100);
  const confidencePct = Math.round(record.score.confidence * 100);
  const signalsLabel = record.score.signals.join(', ');

  function handleRedo() {
    if (record.redoneWithFrontier) return;
    dispatch(markRedoneWithFrontier(record.id));
    onRedoWithFrontier?.(record);
  }

  return (
    <div
      className={`inline-flex flex-col gap-1 mt-1 ${className ?? ''}`}
      data-testid="laya-routing-badge"
    >
      <div className="flex items-center gap-1.5">
        {/* tier chip */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className={`
            inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
            border transition-colors
            ${isLocal
              ? 'border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/30'
              : 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30'
            }
          `}
          aria-expanded={expanded}
          aria-label={`${tierLabel} — click for routing details`}
        >
          <span
            className={`size-1.5 rounded-full ${isLocal ? 'bg-teal-500' : 'bg-blue-500'}`}
            aria-hidden
          />
          {tierLabel}
          <svg
            className={`size-3 opacity-60 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* redo with frontier */}
        {isLocal && onRedoWithFrontier && !record.redoneWithFrontier && (
          <button
            type="button"
            onClick={handleRedo}
            className="text-xs text-content-secondary hover:text-content underline underline-offset-2"
            aria-label={t('laya.badge.redoWithFrontier')}
          >
            {t('laya.badge.redoWithFrontier')}
          </button>
        )}
        {record.redoneWithFrontier && (
          <span className="text-xs text-blue-500">↺ {t('laya.badge.frontier')}</span>
        )}
      </div>

      {/* expanded explanation */}
      {expanded && (
        <div className="pl-1 text-xs text-content-secondary space-y-0.5">
          <p>
            {t('laya.badge.routingExplanation')
              .replace('{pct}', String(complexityPct))
              .replace('{conf}', String(confidencePct))}
          </p>
          {signalsLabel && (
            <p>{t('laya.badge.signals').replace('{signals}', signalsLabel)}</p>
          )}
          <p className="text-content-muted">{record.modelUsed}</p>
        </div>
      )}
    </div>
  );
}
