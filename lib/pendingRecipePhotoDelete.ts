const pending = new Map<string, ReturnType<typeof setTimeout>>();

const UNDO_MS = 5000;

export function scheduleRecipePhotoDelete(recipeId: string, deleteFn: () => Promise<void>): void {
  cancelRecipePhotoDelete(recipeId);
  const t = setTimeout(() => {
    pending.delete(recipeId);
    void deleteFn();
  }, UNDO_MS);
  pending.set(recipeId, t);
}

export function cancelRecipePhotoDelete(recipeId: string): void {
  const t = pending.get(recipeId);
  if (t) clearTimeout(t);
  pending.delete(recipeId);
}
