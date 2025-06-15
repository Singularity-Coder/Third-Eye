import cv2
import numpy as np
import urllib.request
import os

class ObjectDetector:
    def __init__(self):
        self.net = None
        self.classes = []
        self.setup_yolo()
    
    def setup_yolo(self):
        """Download and setup YOLO model"""
        print("Setting up YOLO model...")
        
        # Create models directory
        if not os.path.exists('models'):
            os.makedirs('models')
        
        # Download YOLO files if not present
        yolo_files = {
            'yolov3.cfg': 'https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3.cfg',
            'coco.names': 'https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names',
            'yolov3.weights': 'https://pjreddie.com/media/files/yolov3.weights'
        }
        
        for filename, url in yolo_files.items():
            filepath = f'models/{filename}'
            if not os.path.exists(filepath):
                print(f"Downloading {filename}...")
                try:
                    urllib.request.urlretrieve(url, filepath)
                    print(f"Downloaded {filename}")
                except:
                    print(f"Failed to download {filename}. Please download manually from: {url}")
                    return False
        
        # Load YOLO
        try:
            self.net = cv2.dnn.readNet('models/yolov3.weights', 'models/yolov3.cfg')
            
            # Load class names
            with open('models/coco.names', 'r') as f:
                self.classes = [line.strip() for line in f.readlines()]
            
            print("YOLO model loaded successfully!")
            return True
        except Exception as e:
            print(f"Error loading YOLO: {e}")
            return False
    
    def detect_objects(self, frame):
        """Detect objects in frame"""
        if self.net is None:
            return frame, []
        
        height, width = frame.shape[:2]
        
        # Create blob from image
        blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
        self.net.setInput(blob)
        
        # Run inference
        outputs = self.net.forward(self.net.getUnconnectedOutLayersNames())
        
        # Process outputs
        boxes = []
        confidences = []
        class_ids = []
        
        for output in outputs:
            for detection in output:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                
                if confidence > 0.5:  # Confidence threshold
                    center_x = int(detection[0] * width)
                    center_y = int(detection[1] * height)
                    w = int(detection[2] * width)
                    h = int(detection[3] * height)
                    
                    x = int(center_x - w / 2)
                    y = int(center_y - h / 2)
                    
                    boxes.append([x, y, w, h])
                    confidences.append(float(confidence))
                    class_ids.append(class_id)
        
        # Apply Non-Maximum Suppression
        indices = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)
        
        detected_objects = []
        
        if len(indices) > 0:
            for i in indices.flatten():
                x, y, w, h = boxes[i]
                label = str(self.classes[class_ids[i]])
                confidence = confidences[i]
                
                # Draw bounding box
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, f"{label} {confidence:.2f}", (x, y - 5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
                detected_objects.append({
                    'label': label,
                    'confidence': confidence,
                    'bbox': [x, y, w, h]
                })
        
        return frame, detected_objects
    
    def run_detection(self):
        """Start real-time object detection"""
        if self.net is None:
            print("YOLO model not loaded. Please check setup.")
            return
        
        cap = cv2.VideoCapture(0)
        
        print("Object detection started. Press 'q' to quit")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Detect objects
            frame, objects = self.detect_objects(frame)
            
            # Display object count
            cv2.putText(frame, f"Objects detected: {len(objects)}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            cv2.imshow('Object Detection', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    detector = ObjectDetector()
    detector.run_detection()