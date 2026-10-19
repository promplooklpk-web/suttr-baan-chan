import type JSZip from 'jszip';

import type { RecipeExportEnvelope } from '@/types/export';
import type { ImportPlan } from '@/lib/export/applyImport';

let pendingEnvelope: RecipeExportEnvelope | null = null;
let pendingPlans: ImportPlan[] | null = null;
let pendingZip: JSZip | null = null;
let pendingZipUri: string | null = null;

export function setPendingImport(
  envelope: RecipeExportEnvelope,
  plans: ImportPlan[],
  zip?: JSZip | null,
  zipUri?: string | null,
): void {
  pendingEnvelope = envelope;
  pendingPlans = plans;
  pendingZip = zip ?? null;
  pendingZipUri = zipUri ?? null;
}

export function getPendingImport(): {
  envelope: RecipeExportEnvelope;
  plans: ImportPlan[];
  zip: JSZip | null;
  zipUri: string | null;
} | null {
  if (!pendingEnvelope || !pendingPlans) return null;
  return {
    envelope: pendingEnvelope,
    plans: pendingPlans,
    zip: pendingZip,
    zipUri: pendingZipUri,
  };
}

export function clearPendingImport(): void {
  pendingEnvelope = null;
  pendingPlans = null;
  pendingZip = null;
  pendingZipUri = null;
}
