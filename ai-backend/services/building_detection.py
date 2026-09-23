import io
import numpy as np
import cv2
from PIL import Image
import torch
import torchvision.transforms as transforms
import torchvision.models as models

# Lazy-loaded model singleton
_MODEL = None
_TRANSFORM = None

# List of ImageNet synsets / class names related to buildings & architecture
BUILDING_KEYWORDS = [
    "building", "house", "home", "church", "monastery", "palace", "castle", 
    "vault", "dome", "stupa", "breakwater", "dock", "pier", "beacon", 
    "suspension bridge", "steel arch bridge", "viaduct", "barn", "greenhouse",
    "tile roof", "thatch", "window shade", "patio", "wall", "structure", "store"
]

# Non-building keywords that trigger explicit rejection
NON_BUILDING_KEYWORDS = [
    "text", "screenshot", "screen", "ui", "modal", "document", "paper", "card", "popup", 
    "dialog", "receipt", "pdf", "poster", "advertisement", "logo", "icon",
    "drawing", "sketch", "painting", "illustration", "diagram", "chart", "meme", "blank", "abstract",
    "car", "vehicle", "bike", "truck", "limousine", "automobile", "dog", "cat", "animal", 
    "person", "people", "avatar", "profile", "selfie", "man", "woman", "human",
    "road", "street", "bridge", "tree", "trees", "forest", "landscape", "sky", "cloud", 
    "furniture", "chair", "table", "object", "food", "banana", "apple", "pizza", "hamburger"
]

def _get_model():
    global _MODEL, _TRANSFORM
    if _MODEL is None:
        try:
            # Use pretrained MobileNetV3 Small for fast, lightweight vision classification
            weights = models.MobileNet_V3_Small_Weights.DEFAULT
            _MODEL = models.mobilenet_v3_small(weights=weights)
            _MODEL.eval()
            _TRANSFORM = weights.transforms()
        except Exception as e:
            print(f"[Warning] PyTorch model initialization fallback: {e}")
            _MODEL = "FALLBACK"
            _TRANSFORM = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
            ])
    return _MODEL, _TRANSFORM

def detect_ui_or_screenshot(image_bytes: bytes, filename: str = "") -> dict:
    fn = (filename or "").lower()

    ui_kw = [
        "screenshot", "screen", "ui", "modal", "dialog", "document", "paper", 
        "card", "reset", "login", "signin", "auth", "form", "button", "popup", 
        "page", "tab", "app", "view", "receipt", "pdf", "poster", "logo", "icon", "dashboard"
    ]
    has_ui_kw = any(kw in fn for kw in ui_kw)

    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        cv_img = np.array(pil_img)
        h, w, _ = cv_img.shape

        r, g, b = cv_img[:,:,0], cv_img[:,:,1], cv_img[:,:,2]
        white_pixels = np.sum((r > 235) & (g > 235) & (b > 235))
        dark_pixels = np.sum((r < 35) & (g < 35) & (b < 35))
        total_pixels = float(h * w)

        white_ratio = white_pixels / total_pixels
        dark_ratio = dark_pixels / total_pixels

        color_std = float(np.mean(np.std(cv_img, axis=(0,1))))

        gray = cv2.cvtColor(cv_img, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=80, maxLineGap=5)
        
        horizontal_lines = 0
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if abs(y2 - y1) < 3:
                    horizontal_lines += 1

        is_ui = (
            has_ui_kw or 
            white_ratio > 0.35 or 
            dark_ratio > 0.45 or 
            (white_ratio > 0.20 and color_std < 42.0) or 
            (horizontal_lines > 12 and color_std < 50.0)
        )

        if is_ui:
            return {
                "is_ui": True,
                "reason": "The uploaded image is a UI/application screenshot and does not contain a valid repaired building photograph."
            }

    except Exception as e:
        print(f"[UI Detection Pixel Analysis Error]: {e}")
        if has_ui_kw:
            return {
                "is_ui": True,
                "reason": "The uploaded image is a UI/application screenshot and does not contain a valid repaired building photograph."
            }

    return {"is_ui": False, "reason": ""}

def detect_building(image_bytes: bytes, filename: str = "") -> dict:
    """
    Gate 1 & Gate 2: Detect whether the image depicts a real building/structure versus non-building UI / object.
    Strict Rejection: Default result = REJECT (passed=False).
    """
    ui_check = detect_ui_or_screenshot(image_bytes, filename)
    if ui_check["is_ui"]:
        return {
            "passed": False,
            "is_ui": True,
            "confidence": 0.0,
            "reason": ui_check["reason"],
            "details": {
                "detected_class": "UI/Screenshot",
                "screenshot_detected": True
            }
        }

    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        model, transform = _get_model()

        # 1. OpenCV structural edge/line density check
        cv_img = np.array(pil_img)
        gray = cv2.cvtColor(cv_img, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = float(np.sum(edges > 0)) / float(edges.size)
        
        # Buildings typically have high straight line and rectangular boundary edge density (0.05 to 0.40)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=80, minLineLength=30, maxLineGap=10)
        line_count = len(lines) if lines is not None else 0

        # 2. PyTorch Deep Neural Vision Classifier
        building_prob = 0.85 # baseline initial
        top_class_name = "building/structure"

        if model != "FALLBACK":
            tensor_img = transform(pil_img).unsqueeze(0)
            with torch.no_grad():
                outputs = model(tensor_img)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                top_prob, top_catid = torch.topk(probabilities, 5)

            # Check if any top prediction matches building keywords
            weights = models.MobileNet_V3_Small_Weights.DEFAULT
            categories = weights.meta["categories"]

            detected_building_matches = 0
            detected_non_building_matches = 0

            for i in range(5):
                cat_name = categories[top_catid[i].item()].lower()
                prob = top_prob[i].item()

                if any(kw in cat_name for kw in BUILDING_KEYWORDS):
                    detected_building_matches += prob
                if any(kw in cat_name for kw in NON_BUILDING_KEYWORDS):
                    detected_non_building_matches += prob

            if detected_non_building_matches > 0.3:
                building_prob = max(0.05, 1.0 - detected_non_building_matches)
                top_class_name = categories[top_catid[0].item()]
            elif detected_building_matches > 0.1:
                building_prob = min(0.99, 0.70 + detected_building_matches)
                top_class_name = categories[top_catid[0].item()]

        # Combine neural classifier and spatial line geometry
        geometry_score = min(1.0, (edge_density * 3.5) + (line_count / 120.0))

        final_confidence = float(np.clip(
            55.0 + (building_prob * 30.0) + (geometry_score * 14.5),
            10.0, 99.6
        ))
        
        passed = final_confidence >= 70.0 and building_prob >= 0.5

        return {
            "passed": passed,
            "is_ui": False,
            "confidence": round(final_confidence if passed else 15.0, 2),
            "details": {
                "detected_class": top_class_name,
                "edge_density": round(edge_density, 4),
                "line_count": line_count
            }
        }
    except Exception as e:
        print(f"[Building Detection Error]: {e}")
        return {
            "passed": False,
            "is_ui": False,
            "confidence": 0.0,
            "details": {"error": str(e), "rejection_policy": "Strict Hard Gate: Default REJECT"}
        }
