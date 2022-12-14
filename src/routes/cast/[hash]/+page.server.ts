import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { transformCasts } from '$lib/utils';
import type { Root, Cast } from '$lib/types/merkleAllReply';
import type { CastInterface } from '$lib/types';

/**
 * @param hash hash of cast
 * @returns the thread hash (root of thread), returns itself if it's the root
 */
async function getThreadHash(hash: string): Promise<string> {
  const response = await fetch(`https://api.farcaster.xyz/v2/cast?hash=${hash}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_HUB_KEY}`
    },
  });
  const data = await response.json();
  return data.result.cast.threadHash;
}

/**
 * @param hash get all the replies of a threadHash
 * @returns 
 */
async function getReplies(hash: string): Promise<Root> {
  const response = await fetch(`https://api.farcaster.xyz/v2/all-casts-in-thread?threadHash=${hash}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_HUB_KEY}`
    },
  });
  return response.json();
}

/**
 * given a hash, get the chains of cast from it to the root (thread)
 * 
 * given a hash and a list of replies, find the ancestor chain: an array
 * array of casts where the previous index is the parent
 * 
 * bug: the /v2/all-casts-in-thread only returns a certain amount of cast
 * (maybe a hundred), and if the casts aren't included in the one hundred
 * cast returned by it, the getAncestors return an empty array, which
 * breaks the front-end
 * 
 * @param hash the cast hash
 * @param data the return of getReplies()
 * @returns an array of cast, where each index is the parent of the previous index
 */
function getAncestors(hash: string, data: Root): CastInterface[] {
  let ancestorChain = [];
  let currentHash: string | undefined = hash;
  const casts = data.result.casts;
  while (currentHash) {
    let currentCast = casts.find(cast => cast.hash === currentHash);
    if (!currentCast) break;
    ancestorChain.unshift(currentCast);
    currentHash = currentCast.parentHash;
  }

  return transformCasts(ancestorChain.map(cast => removeParent(cast)), 'merkleUser');
}

function removeParent(cast: Cast): Cast {
  return { ...cast, parentAuthor: undefined, parentHash: undefined };
}

/**
 * given a hash, get all the direct children
 * 
 * @param hash the cast hash
 * @param data the return of getReplies()
 * @returns an array of cast, the children
 */
function getChildren(hash: string, data: Root): CastInterface[] {
  const directChildrenCasts = data.result.casts.filter(cast => cast.parentHash === hash);
  return transformCasts(directChildrenCasts, 'merkleUser');
}

export const load: PageServerLoad = async ({ params }) => {
  if (params.hash.startsWith('0x') && typeof params.hash === 'string' && params.hash.length == 66) {
    const hash = params.hash;
    const replies = await getReplies(await getThreadHash(hash));
    return { ancestors: getAncestors(hash, replies), children: getChildren(hash, replies) };
  }

  throw error(404, 'Not found');
};