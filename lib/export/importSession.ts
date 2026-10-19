import type JSZip from 'jszip';

import type { RecipeExportEnvelope } from '@/types/export';
import type { ImportPlan } from '@/lib/export/applyImport';

let pendingEnvelope: RecipeExportEnvelope | null = null;
let pendingPlans: ImportPlan[] | null = null;
let pendingZip: JSZip | null = null;
let pendingZipUri: string | null = null;
let pendingSkippedCount = 0;

export function setPendingImport(
  envelope: RecipeExportEnvelope,
  plans: ImportPlan[],
  zip?: JSZip | null,
  zipUri?: string | null,
  skippedRecipeCount = 0,
): void {
  pendingEnvelope = envelope;
  pendingPlans = plans;
  pendingZip = zip ?? null;
  pendingZipUri = zipUri ?? null;
  pendingSkippedCount = skippedRecipeCount;
}

export function getPendingImport(): {
  envelope: RecipeExportEnvelope;
  plans: ImportPlan[];
  zip: JSZip | null;
  zipUri: string | null;
  skippedRecipeCount: number;
} | null {
  if (!pendingEnvelope || !pendingPlans) return null;
  return {
    envelope: pendingEnvelope,
    plans: pendingPlans,
    zip: pendingZip,
    zipUri: pendingZipUri,
    skippedRecipeCount: pendingSkippedCount,
  };
}

export function clearPendingImport(): void {
  pendingEnvelope = null;
  pendingPlans = null;
  pendingZip = null;
  pendingZipUri = null;
  pendingSkippedCount = 0;
}
