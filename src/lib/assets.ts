
'use client';

import { FirebaseStorage, getDownloadURL, ref } from 'firebase/storage';
import { Firestore, collection, getDocs } from 'firebase/firestore';
import { CARD_DEFINITIONS } from './card-definitions';

const AUDIO_ASSETS_PATHS = [
  'music/lobby.mp3',
  'music/battle.mp3',
  'sfx/explosion.mp3',
  'sfx/flip.mp3',
  'sfx/draw.mp3',
];

/**
 * Fetches all dynamic asset URLs from Firebase.
 * @param firestore - Firestore instance.
 * @param storage - Firebase Storage instance.
 * @returns A promise that resolves to an array of asset URLs.
 */
export async function fetchAllAssetUrls(firestore: Firestore, storage: FirebaseStorage): Promise<string[]> {
  const imageUrls = new Set<string>();

  // 1. Get image URLs from Firestore 'card-images' collection
  try {
    const imageCollectionRef = collection(firestore, 'card-images');
    const imageSnapshot = await getDocs(imageCollectionRef);
    imageSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.imageUrl) {
        imageUrls.add(data.imageUrl);
      }
      if (data.ability?.soundUrl) {
        imageUrls.add(data.ability.soundUrl);
      }
    });
  } catch (error) {
    console.warn("Could not fetch card image URLs from Firestore.", error);
  }

  // 2. Add fallback image URLs from local definitions
  CARD_DEFINITIONS.forEach(def => {
    if (def.imageUrl) {
      imageUrls.add(def.imageUrl);
    }
  });

  // 3. Get audio URLs from Firebase Storage
  const audioUrlPromises = AUDIO_ASSETS_PATHS.map(path =>
    getDownloadURL(ref(storage, path)).catch(err => {
      console.warn(`Failed to get URL for ${path}`, err);
      return null; // Return null if a specific audio file fails
    })
  );

  const audioUrls = await Promise.all(audioUrlPromises);
  audioUrls.forEach(url => {
    if (url) {
      imageUrls.add(url); // Use the same set for all assets
    }
  });

  return Array.from(imageUrls);
}

/**
 * Preloads a single asset (image or audio).
 * @param src - The URL of the asset to preload.
 * @returns A promise that resolves when the asset is loaded or fails.
 */
export function preloadAsset(src: string): Promise<void> {
  return new Promise((resolve) => {
    // Universal preloader using fetch, which works for all file types
    // and correctly populates the browser cache.
    fetch(src, { mode: 'cors' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load asset: ${src}`);
        }
        return response.blob(); // Consume the response body
      })
      .then(() => resolve()) // Asset is loaded and in cache
      .catch(err => {
        console.warn(err);
        resolve(); // Resolve even on error to not block the loading process
      });
  });
}

/**
 * Preloads all fetched assets and reports progress.
 * @param firestore - Firestore instance.
 * @param storage - Firebase Storage instance.
 * @param onProgress - Callback function to report progress.
 */
export async function preloadAssets(
  firestore: Firestore,
  storage: FirebaseStorage,
  onProgress?: (loaded: number, total: number) => void
) {
  const assetUrls = await fetchAllAssetUrls(firestore, storage);
  const total = assetUrls.length;
  let loaded = 0;

  onProgress?.(0, total);

  // Preload all assets in parallel
  await Promise.all(assetUrls.map(async (src) => {
    try {
      await preloadAsset(src);
    } catch (e) {
      // Error is already logged in preloadAsset
    }
    loaded++;
    onProgress?.(loaded, total);
  }));
}
