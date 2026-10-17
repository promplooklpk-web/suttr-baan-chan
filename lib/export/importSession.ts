import type { RecipeExportEnvelope } from '@/types/export';
import type { ImportPlan } from '@/lib/export/applyImport';

let pendingEnvelope: RecipeExportEnvelope | null = null;
let pendingPlans: ImportPlan[] | null = null;

export function setPendingImport(envelope: RecipeExportEnvelope, plans: ImportPlan[]): void {
  pendingEnvelope = envelope;
  pendingPlans = plans;
}

export function getPendingImport(): {
  envelope: RecipeExportEnvelope;
  plans: ImportPlan[];
} | null {
  if (!pendingEnvelope || !pendingPlans) return null;
  return { envelope: pendingEnvelope, plans: pendingPlans };
}

export function clearPendingImport(): void {
  pendingEnvelope = null;
  pendingPlans = null;
}
