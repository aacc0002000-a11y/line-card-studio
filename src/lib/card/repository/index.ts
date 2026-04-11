import { getCardRepositoryMode } from "@/lib/supabase/env";
import {
  localStorageCardRepository,
  subscribeToLocalStorageCards,
  getEmptySafeArray,
} from "@/lib/card/repository/localStorageCardRepository";
import { supabaseCardRepository } from "@/lib/card/repository/supabaseCardRepository";

const repositoryMode = getCardRepositoryMode();

export const cardRepository =
  repositoryMode === "supabase" ? supabaseCardRepository : localStorageCardRepository;

export const activeCardRepositoryMode = repositoryMode;
export const isCloudCardRepository = repositoryMode === "supabase";

export function subscribeCards(callback: () => void) {
  if (repositoryMode === "local") {
    return subscribeToLocalStorageCards(callback);
  }

  return () => {};
}

export { getEmptySafeArray };
