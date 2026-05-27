import urllib.request
import time
import os

if not os.path.exists("models"):
    os.makedirs("models")

urls = [
    ("https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx", "models/face_detection_yunet_2023mar.onnx"),
    ("https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx", "models/face_recognition_sface_2021dec.onnx")
]

for url, filename in urls:
    success = False
    for attempt in range(5):
        try:
            print(f"Downloading {filename} (Attempt {attempt+1})...")
            urllib.request.urlretrieve(url, filename)
            print("Successfully downloaded.")
            success = True
            break
        except Exception as e:
            print(f"Failed: {e}. Retrying in 2 seconds...")
            time.sleep(2)
    if not success:
        print(f"Could not download {filename} after 5 attempts.")
