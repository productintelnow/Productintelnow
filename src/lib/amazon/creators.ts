/**
 * Hook for a future Amazon Creators API client.
 *
 * Do not implement price, availability, ratings, or review text here.
 * Do not return sample numbers. Until the owner provides credentials and a
 * real client, this function returns null and templates ignore it.
 *
 * Tracking ids in src/config/constants.mjs are campaign tags. Never pass a
 * user id, email, or cookie into this module.
 */
export type CreatorsLookup = {
  productId: string;
  asin?: string;
};

export async function fetchCreatorsSnapshots(_lookups: CreatorsLookup[]): Promise<null> {
  return null;
}
