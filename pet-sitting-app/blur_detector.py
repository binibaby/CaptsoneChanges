import sys
import cv2

def is_blurry(image_path, threshold=100.0):
    image = cv2.imread(image_path)
    if image is None:
        print("error")
        return
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    print("blurry" if laplacian_var < threshold else "clear")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("error")
    else:
        is_blurry(sys.argv[1]) 