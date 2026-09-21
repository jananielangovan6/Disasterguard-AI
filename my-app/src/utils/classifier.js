// ============================================================================
// DISASTERGUARD AI — CLASSIFIER UTILITIES & EXPORTS
// Provides OfflineError class and re-exports AI Damage Classifier engines
// ============================================================================

import { classifyDamageImage } from "./aiDamageClassifier";
import { classifyWithTensorFlow } from "./tfDamageClassifier";

export class OfflineError extends Error {
  constructor(message = "Network connection offline. Operating in offline mode.") {
    super(message);
    this.name = "OfflineError";
  }
}

export { classifyDamageImage, classifyWithTensorFlow };
export default classifyDamageImage;
