from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import os

from utils.image_classifier import ImageClassifier
from utils.data_land_marker import LandMarker
from sklearn.ensemble import RandomForestClassifier

app = Flask(__name__)
CORS(app)  # Autoriser les requêtes cross-origin (depuis React par ex.)

# === Initialisation globale ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PREDICTOR_PATH = os.path.join(BASE_DIR, 'utils', 'shape_predictor_68_face_landmarks.dat')
if not os.path.isfile(PREDICTOR_PATH):
    raise FileNotFoundError(f"❌ Fichier non trouvé : {PREDICTOR_PATH}")
CSV_PATH = os.path.join(BASE_DIR, 'data', 'csv', 'dataset.csv')
if not os.path.isfile(CSV_PATH):
    raise FileNotFoundError(f"❌ Fichier non trouvé : {CSV_PATH}")
ALGORITHM = 'RandomForest'

land_marker = LandMarker(landmark_predictor_path=PREDICTOR_PATH)
classifier = ImageClassifier(csv_path=CSV_PATH, algorithm=ALGORITHM, land_marker=land_marker)


# === Route principale de prédiction ===
@app.route('/predict', methods=['POST'])
def predict_emotion():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    # Lecture de l’image en mémoire avec OpenCV
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    prediction = classifier.classify(gray_img)
    return jsonify({'prediction': prediction})


# === Lancement local ===
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
