# ----------------------------------------
# Script d'installation pour emotion-app
# Environnement virtuel + dépendances Windows
# ----------------------------------------

python -m venv venv

. .\venv\Scripts\Activate.ps1

pip install --upgrade pip

pip install cmake

pip install opencv-python==4.4.0.46
pip install pandas==1.1.4
pip install scikit-learn==0.23.2
pip install flask
pip install flask-cors

pip install dlib==19.21.1 --no-cache-dir

