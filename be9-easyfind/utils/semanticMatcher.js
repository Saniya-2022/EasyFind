const { pipeline } = require('@xenova/transformers');
const cosineSimilarity = require('cosine-similarity');

// Configuration
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.80;
const MODEL_NAME = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';

let embedder = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initialize the embedding model (lazy loading)
 */
async function initializeEmbedder() {
  if (embedder) {
    return embedder;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log(`🤖 Loading embedding model: ${MODEL_NAME}...`);
      embedder = await pipeline('feature-extraction', MODEL_NAME, {
        quantized: true, // Use quantized model for faster inference
      });
      console.log('✅ Embedding model loaded successfully');
      return embedder;
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Generate embedding for a text string
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text provided for embedding');
  }

  const model = await initializeEmbedder();

  try {
    const output = await model(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert tensor to array
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} - Similarity score (0 to 1)
 */
function calculateSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }
  return cosineSimilarity(embedding1, embedding2);
}

/**
 * Prepare text for embedding from lost/found item
 * @param {Object} item - Lost or Found item
 * @returns {string} - Combined text for embedding
 */
function prepareItemText(item) {
  const parts = [
    item.itemName,
    item.category,
    item.description,
    item.location || item.foundLocation,
  ]
    .filter(Boolean)
    .join(' ');

  return parts.toLowerCase().trim();
}

/**
 * Check if a found item matches any lost items using semantic similarity
 * @param {Object} foundItem - Found item document
 * @param {Array} lostItems - Array of lost item documents
 * @returns {Array} - Array of matching lost items with similarity scores
 */
async function findMatchingLostItems(foundItem, lostItems) {
  if (!lostItems || lostItems.length === 0) {
    return [];
  }

  try {
    // Prepare text for found item
    const foundItemText = prepareItemText(foundItem);
    const foundEmbedding = await generateEmbedding(foundItemText);

    const matches = [];

    // Compare with each lost item
    for (const lostItem of lostItems) {
      const lostItemText = prepareItemText(lostItem);
      const lostEmbedding = await generateEmbedding(lostItemText);

      const similarity = calculateSimilarity(foundEmbedding, lostEmbedding);

      console.log(`📊 Comparing: "${foundItemText.substring(0, 50)}..." with "${lostItemText.substring(0, 50)}..."`);
      console.log(`   Similarity: ${(similarity * 100).toFixed(2)}%`);

      if (similarity >= SIMILARITY_THRESHOLD) {
        matches.push({
          lostItem,
          similarity,
        });
      }
    }

    // Sort by similarity score (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);

    return matches;
  } catch (error) {
    console.error('Error in semantic matching:', error);
    return [];
  }
}

/**
 * Check if a lost item matches any found items using semantic similarity
 * @param {Object} lostItem - Lost item document
 * @param {Array} foundItems - Array of found item documents
 * @returns {Array} - Array of matching found items with similarity scores
 */
async function findMatchingFoundItems(lostItem, foundItems) {
  if (!foundItems || foundItems.length === 0) {
    return [];
  }

  try {
    // Prepare text for lost item
    const lostItemText = prepareItemText(lostItem);
    const lostEmbedding = await generateEmbedding(lostItemText);

    const matches = [];

    // Compare with each found item
    for (const foundItem of foundItems) {
      const foundItemText = prepareItemText(foundItem);
      const foundEmbedding = await generateEmbedding(foundItemText);

      const similarity = calculateSimilarity(lostEmbedding, foundEmbedding);

      console.log(`📊 Comparing: "${lostItemText.substring(0, 50)}..." with "${foundItemText.substring(0, 50)}..."`);
      console.log(`   Similarity: ${(similarity * 100).toFixed(2)}%`);

      if (similarity >= SIMILARITY_THRESHOLD) {
        matches.push({
          foundItem,
          similarity,
        });
      }
    }

    // Sort by similarity score (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);

    return matches;
  } catch (error) {
    console.error('Error in semantic matching:', error);
    return [];
  }
}

/**
 * Pre-generate embeddings for all items (for batch processing)
 * @param {Array} items - Array of lost or found items
 * @returns {Promise<Map>} - Map of item ID to embedding
 */
async function generateEmbeddingsBatch(items) {
  if (!items || items.length === 0) {
    return new Map();
  }

  const embeddingMap = new Map();
  const model = await initializeEmbedder();

  console.log(`🔄 Generating embeddings for ${items.length} items...`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const text = prepareItemText(item);

    try {
      const output = await model(text, {
        pooling: 'mean',
        normalize: true,
      });

      embeddingMap.set(item._id.toString(), Array.from(output.data));
      console.log(`   [${i + 1}/${items.length}] Embedded: ${text.substring(0, 50)}...`);
    } catch (error) {
      console.error(`   [${i + 1}/${items.length}] Failed to embed item ${item._id}:`, error);
    }
  }

  console.log(`✅ Generated ${embeddingMap.size} embeddings`);
  return embeddingMap;
}

module.exports = {
  initializeEmbedder,
  generateEmbedding,
  calculateSimilarity,
  findMatchingLostItems,
  findMatchingFoundItems,
  generateEmbeddingsBatch,
  prepareItemText,
  SIMILARITY_THRESHOLD,
};