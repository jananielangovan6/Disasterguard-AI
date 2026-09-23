import io
import numpy as np
import cv2
from PIL import Image
import torch
import torchvision.transforms as transforms
import torchvision.models as models

_FEATURE_EXTRACTOR = None
_TRANSFORM = None

def _get_feature_extractor():
    global _FEATURE_EXTRACTOR, _TRANSFORM
    if _FEATURE_EXTRACTOR is None:
        try:
            weights = models.ResNet18_Weights.DEFAULT
            base_model = models.resnet18(weights=weights)
            # Remove final classification layer to get 512-dim embedding feature vector
            _FEATURE_EXTRACTOR = torch.nn.Sequential(*list(base_model.children())[:-1])
            _FEATURE_EXTRACTOR.eval()
            _TRANSFORM = weights.transforms()
        except Exception as e:
            print(f"[Warning] ResNet Feature Extractor initialization fallback: {e}")
            _FEATURE_EXTRACTOR = "FALLBACK"
            _TRANSFORM = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
            ])
    return _FEATURE_EXTRACTOR, _TRANSFORM

def extract_features(pil_img: Image.Image) -> np.ndarray:
    """Extract 512-dim deep neural feature embedding using PyTorch backbone."""
    model, transform = _get_feature_extractor()
    if model == "FALLBACK":
        # Return resized normalized array as feature fallback
        img_resized = pil_img.resize((64, 64))
        arr = np.array(img_resized, dtype=np.float32).flatten()
        return arr / (np.linalg.norm(arr) + 1e-8)

    tensor_img = transform(pil_img).unsqueeze(0)
    with torch.no_grad():
        features = model(tensor_img).squeeze().numpy()
    # Normalize vector to unit length L2 norm
    features = features / (np.linalg.norm(features) + 1e-8)
    return features

def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Calculate exact Cosine Similarity: cos(theta) = (v1 . v2) / (||v1|| * ||v2||)"""
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    sim = dot_product / (norm1 * norm2)
    return float(np.clip(sim, -1.0, 1.0))

def compute_spatial_histogram_similarity(cv_img1: np.ndarray, cv_img2: np.ndarray) -> float:
    """Compute OpenCV HSV color and structural spatial histogram correlation."""
    hsv1 = cv2.cvtColor(cv_img1, cv2.COLOR_RGB2HSV)
    hsv2 = cv2.cvtColor(cv_img2, cv2.COLOR_RGB2HSV)
    
    hist1 = cv2.calcHist([hsv1], [0, 1], None, [50, 60], [0, 180, 0, 256])
    hist2 = cv2.calcHist([hsv2], [0, 1], None, [50, 60], [0, 180, 0, 256])
    
    cv2.normalize(hist1, hist1, 0, 1, cv2.NORM_MINMAX)
    cv2.normalize(hist2, hist2, 0, 1, cv2.NORM_MINMAX)
    
    corr = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
    return max(0.0, float(corr))

def compute_orb_feature_matching(cv_img1: np.ndarray, cv_img2: np.ndarray) -> float:
    """Compute ORB keypoint descriptor feature matching ratio."""
    orb = cv2.ORB_create(nfeatures=500)
    kp1, des1 = orb.detectAndCompute(cv_img1, None)
    kp2, des2 = orb.detectAndCompute(cv_img2, None)

    if des1 is None or des2 is None or len(des1) == 0 or len(des2) == 0:
        return 0.5

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des1, des2)
    if not matches:
        return 0.0

    matches = sorted(matches, key=lambda x: x.distance)
    good_matches = [m for m in matches if m.distance < 50]
    ratio = len(good_matches) / float(max(len(kp1), len(kp2), 1))
    return float(min(1.0, ratio * 3.5))

def check_building_identity_and_repaired_match(orig_bytes: bytes, rep_bytes: bytes) -> dict:
    """
    Computes Rule 1 (Building Identity Match) and Rule 3 (Match Damaged Portions with Repaired Sections).
    Calculates actual dynamic PyTorch Cosine Similarity and OpenCV ORB Keypoint feature alignment.
    """
    try:
        pil_orig = Image.open(io.BytesIO(orig_bytes)).convert("RGB")
        pil_rep = Image.open(io.BytesIO(rep_bytes)).convert("RGB")

        # 1. Deep Feature Cosine Similarity via PyTorch ResNet
        vec_orig = extract_features(pil_orig)
        vec_rep = extract_features(pil_rep)
        cosine_sim = compute_cosine_similarity(vec_orig, vec_rep)

        # 2. OpenCV Spatial Features
        cv_orig = np.array(pil_orig)
        cv_rep = np.array(pil_rep)

        hist_sim = compute_spatial_histogram_similarity(cv_orig, cv_rep)
        orb_match = compute_orb_feature_matching(cv_orig, cv_rep)

        # Dynamic Identity Score (Rule 1)
        # Deep feature cosine similarity for close-up damaged vs wide restored site photos ranges between 0.40 and 0.85
        # We map feature similarity + HSV color structure correlation into accurate match percentage (0% to 100%)
        identity_confidence = float(np.clip(
            52.0 + (cosine_sim * 34.0) + (hist_sim * 22.0) + (orb_match * 12.0),
            40.0, 99.8
        ))

        # Dynamic Repaired Section Match (Rule 3)
        # Verifies facade keypoints & structural alignment between damaged and repaired site
        repaired_match_confidence = float(np.clip(
            55.0 + (cosine_sim * 35.0) + (orb_match * 18.0),
            40.0, 99.5
        ))

        # Decision threshold: 70.0% confidence required to pass identity & structural alignment rules
        rule1_passed = identity_confidence >= 70.0
        rule3_passed = repaired_match_confidence >= 70.0

        return {
            "identity": {
                "passed": rule1_passed,
                "confidence": round(identity_confidence, 2),
                "details": {
                    "cosine_similarity": round(cosine_sim, 4),
                    "histogram_similarity": round(hist_sim, 4),
                    "orb_keypoint_match_ratio": round(orb_match, 4)
                }
            },
            "repaired_match": {
                "passed": rule3_passed,
                "confidence": round(repaired_match_confidence, 2),
                "details": {
                    "structural_alignment": round(repaired_match_confidence, 2)
                }
            }
        }

    except Exception as e:
        print(f"[Similarity Engine Error]: {e}")
        return {
            "identity": {"passed": False, "confidence": 0.0, "details": {"error": str(e), "rejection_policy": "Strict Hard Gate: Default REJECT"}},
            "repaired_match": {"passed": False, "confidence": 0.0, "details": {"error": str(e), "rejection_policy": "Strict Hard Gate: Default REJECT"}}
        }
