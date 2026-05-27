import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
import os

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths for the high-precision AI models (CNN based)
DETECTOR_MODEL_PATH = "models/face_detection_yunet_2023mar.onnx"
RECOGNIZER_MODEL_PATH = "models/face_recognition_sface_2021dec.onnx"

# Global AI Engine instances
detector = None
recognizer = None

def init_engines():
    global detector, recognizer
    if not os.path.exists(DETECTOR_MODEL_PATH) or not os.path.exists(RECOGNIZER_MODEL_PATH):
        logger.error("AI Model files missing! Please ensure they are downloaded in the models/ folder.")
        return False
    
    try:
        # Initialize YuNet detector
        # We start with a default input size, it will be updated dynamically per image
        detector = cv2.FaceDetectorYN.create(
            DETECTOR_MODEL_PATH,
            "",
            (320, 320), # Initial size
            0.9, # Score threshold (strict for high quality)
            0.3, # NMS threshold
            5000 # Top K
        )
        # Initialize SFace recognizer
        recognizer = cv2.FaceRecognizerSF.create(
            RECOGNIZER_MODEL_PATH,
            ""
        )
        logger.info("AI Face Recognition engines (CNN) initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize AI engines: {str(e)}")
        return False

# Attempt initial load
init_engines()

def extract_face_descriptor_ai(image):
    """
    Uses modern CNN (YuNet + SFace) to extract a high-precision 
    facial signature. This is extremely robust and
    almost impossible to trick compared to basic texture matching.
    """
    if detector is None or recognizer is None:
        if not init_engines():
            return None, "AI Engine not initialized. Check model files."

    h, w, _ = image.shape
    detector.setInputSize((w, h))
    
    # AI Face Detection
    status, faces = detector.detect(image)
    
    if faces is None or status == 0:
        return None, "No face detected. Please ensure you are looking directly at the camera."

    # Use the first face (usually the most prominent)
    # Align and crop the face using AI landmarks for perfect mathematical consistency
    aligned_face = recognizer.alignCrop(image, faces[0])
    
    # Generate the 128-dimensional mathematical "fingerprint"
    feature = recognizer.feature(aligned_face)
    
    # Return features as a flat numpy array
    return feature[0], None


@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "status": "healthy", 
        "engine": "OpenCV SFace (CNN)",
        "models_loaded": detector is not None
    }), 200


@app.route('/generate_descriptor', methods=['POST'])
def generate_descriptor():
    """
    Generates a high-security AI face descriptor from the uploaded image.
    Used during Employee Enrollment.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"error": "Invalid image file"}), 400

        descriptor, error = extract_face_descriptor_ai(image)

        if descriptor is None:
            return jsonify({"error": error}), 400

        logger.info(f"Generated AI signature ({len(descriptor)} dims)")
        return jsonify({
            "message": "AI Face Enrollment Successful",
            "descriptor": json.dumps(descriptor.tolist())
        }), 200

    except Exception as e:
        logger.error(f"Error generating AI descriptor: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/verify', methods=['POST'])
def verify():
    """
    Compares live face against stored AI signature using Cosine Similarity.
    This is highly accurate and prevents false attendance marks.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    if 'known_descriptor' not in request.form:
        return jsonify({"error": "No known_signature provided"}), 400

    try:
        file = request.files['file']
        
        # Parse the known descriptor from the database
        try:
            stored_list = json.loads(request.form['known_descriptor'])
            known_descriptor = np.array(stored_list, dtype=np.float32).reshape(1, -1)
        except Exception as pe:
            # Fallback for old LBP data format if necessary, though it will fail the match
            return jsonify({"error": "Invalid stored signature format. Please re-enroll.", "match": False}), 400

        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"error": "Invalid image file", "match": False}), 400

        unknown_descriptor, error = extract_face_descriptor_ai(image)

        if unknown_descriptor is None:
            logger.info(f"Verification Failed: {error}")
            return jsonify({"error": error, "match": False}), 400

        # AI Matching Logic: SFace uses Cosine Similarity
        # Range -1.0 to 1.0. Higher is more similar.
        # Threshold 0.36 is standard for modern SFace (very secure).
        similarity = float(recognizer.match(known_descriptor, unknown_descriptor.reshape(1, -1), cv2.FaceRecognizerSF_FR_COSINE))
        
        # 0.36 is a balanced threshold for SFace. 
        # Above 0.36 = Same person
        THRESHOLD = 0.36
        match = bool(similarity >= THRESHOLD)

        logger.info(f"AI VERIFY — Similarity: {similarity:.4f}, Threshold: {THRESHOLD}, Match: {match}")

        return jsonify({
            "match": match,
            "similarity": round(similarity, 4),
            "threshold": THRESHOLD,
            "message": "Success: Face Identified!" if match else "Error: Face does not match registered user."
        }), 200

    except Exception as e:
        logger.error(f"Error in AI verification: {str(e)}")
        return jsonify({"error": str(e), "message": "Internal AI Error"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
