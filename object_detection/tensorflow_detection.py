import cv2
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub

class TensorFlowObjectDetector:
    def __init__(self):
        print("Loading TensorFlow model... (this may take a moment)")
        try:
            # Load a pre-trained model from TensorFlow Hub
            self.model = hub.load("https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2")
            print("TensorFlow model loaded successfully!")
            
            # COCO class names
            self.class_names = [
                'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train',
                'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign',
                'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep',
                'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
                'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard',
                'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
                'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork',
                'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
                'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
                'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv',
                'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave',
                'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase',
                'scissors', 'teddy bear', 'hair drier', 'toothbrush'
            ]
        except Exception as e:
            print(f"Error loading TensorFlow model: {e}")
            print("Please install: pip install tensorflow tensorflow-hub")
            self.model = None
    
    def detect_objects(self, frame):
        """Detect objects using TensorFlow model"""
        if self.model is None:
            return frame, []
        
        # Prepare image
        input_tensor = tf.convert_to_tensor(frame)
        input_tensor = input_tensor[tf.newaxis, ...]
        
        # Run inference
        detections = self.model(input_tensor)
        
        # Extract detection results
        boxes = detections['detection_boxes'][0].numpy()
        classes = detections['detection_classes'][0].numpy().astype(int)
        scores = detections['detection_scores'][0].numpy()
        
        height, width = frame.shape[:2]
        detected_objects = []
        
        for i in range(len(boxes)):
            if scores[i] > 0.5:  # Confidence threshold
                box = boxes[i]
                class_id = classes[i] - 1  # COCO classes are 1-indexed
                
                if 0 <= class_id < len(self.class_names):
                    class_name = self.class_names[class_id]
                    confidence = scores[i]
                    
                    # Convert normalized coordinates to pixel coordinates
                    y1, x1, y2, x2 = box
                    x1, x2 = int(x1 * width), int(x2 * width)
                    y1, y2 = int(y1 * height), int(y2 * height)
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    
                    # Draw label
                    label = f"{class_name}: {confidence:.2f}"
                    cv2.putText(frame, label, (x1, y1 - 10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                    
                    detected_objects.append({
                        'class': class_name,
                        'confidence': confidence,
                        'bbox': [x1, y1, x2 - x1, y2 - y1]
                    })
        
        return frame, detected_objects
    
    def run_detection(self):
        """Run real-time object detection"""
        if self.model is None:
            print("Model not loaded. Cannot run detection.")
            return
        
        cap = cv2.VideoCapture(0)
        
        print("TensorFlow Object Detection started. Press 'q' to quit")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Detect objects
            frame, objects = self.detect_objects(frame)
            
            # Display object count
            cv2.putText(frame, f"Objects: {len(objects)}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            cv2.imshow('TensorFlow Object Detection', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()

# Install required packages
def install_requirements():
    import subprocess
    import sys
    
    packages = ['tensorflow', 'tensorflow-hub']
    for package in packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])

if __name__ == "__main__":
    # Uncomment the next line if you need to install packages
    # install_requirements()
    
    detector = TensorFlowObjectDetector()
    detector.run_detection()