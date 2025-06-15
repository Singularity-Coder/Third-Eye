import cv2
import face_recognition
import numpy as np
import os
import urllib.request
from datetime import datetime
import json

class SmartSecuritySystem:
    def __init__(self):
        # Face recognition setup
        self.known_face_encodings = []
        self.known_face_names = []
        
        # Object detection setup
        self.net = None
        self.classes = []
        
        # Detection logs
        self.detection_log = []
        
        # Setup systems
        self.setup_face_recognition()
        self.setup_object_detection()
    
    def setup_face_recognition(self):
        """Load known faces"""
        known_faces_dir = "known_faces"
        
        if not os.path.exists(known_faces_dir):
            os.makedirs(known_faces_dir)
            print(f"Created {known_faces_dir} folder. Add photos of people you want to recognize.")
            return
        
        for filename in os.listdir(known_faces_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_path = os.path.join(known_faces_dir, filename)
                image = face_recognition.load_image_file(image_path)
                
                encodings = face_recognition.face_encodings(image)
                if encodings:
                    self.known_face_encodings.append(encodings[0])
                    name = os.path.splitext(filename)[0]
                    self.known_face_names.append(name)
                    print(f"Loaded face: {name}")
    
    def setup_object_detection(self):
        """Setup lightweight object detection"""
        print("Setting up object detection...")
        
        # Create models directory
        if not os.path.exists('models'):
            os.makedirs('models')
        
        # Use MobileNet SSD (lighter than YOLO)
        model_files = {
            'MobileNetSSD_deploy.prototxt': 'https://raw.githubusercontent.com/chuanqi305/MobileNet-SSD/master/MobileNetSSD_deploy.prototxt',
            'MobileNetSSD_deploy.caffemodel': 'https://drive.google.com/uc?export=download&id=0B3gersZ2cHIxRm5PMWRoTkdHdHc'
        }
        
        # For simplicity, we'll use a basic setup
        # You can download the actual MobileNet files manually
        self.classes = ["background", "aeroplane", "bicycle", "bird", "boat",
                       "bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
                       "dog", "horse", "motorbike", "person", "pottedplant", "sheep",
                       "sofa", "train", "tvmonitor"]
        
        print("Object detection setup completed (basic mode)")
    
    def detect_faces(self, frame):
        """Detect and recognize faces"""
        # Resize for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = small_frame[:, :, ::-1]
        
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        
        face_results = []
        
        for face_encoding, face_location in zip(face_encodings, face_locations):
            matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
            name = "Unknown"
            confidence = 0
            
            if self.known_face_encodings:
                face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                best_match_index = np.argmin(face_distances)
                
                if matches[best_match_index]:
                    name = self.known_face_names[best_match_index]
                    confidence = 1 - face_distances[best_match_index]
            
            # Scale back up
            top, right, bottom, left = face_location
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4
            
            face_results.append({
                'name': name,
                'confidence': confidence,
                'location': (left, top, right, bottom)
            })
            
            # Draw rectangle and label
            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            
            label = f"{name} ({confidence:.2f})" if name != "Unknown" else name
            cv2.putText(frame, label, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, color, 2)
        
        return frame, face_results
    
    def detect_objects_basic(self, frame):
        """Basic object detection using background subtraction and contours"""
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Simple motion detection
        if not hasattr(self, 'background'):
            self.background = gray.copy().astype("float")
            return frame, []
        
        # Update background model
        cv2.accumulateWeighted(gray, self.background, 0.5)
        
        # Compute difference
        frameDelta = cv2.absdiff(gray, cv2.convertScaleAbs(self.background))
        thresh = cv2.threshold(frameDelta, 25, 255, cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        objects = []
        for contour in contours:
            if cv2.contourArea(contour) < 500:  # Filter small objects
                continue
            
            (x, y, w, h) = cv2.boundingRect(contour)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
            cv2.putText(frame, "Moving Object", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
            
            objects.append({
                'type': 'moving_object',
                'bbox': [x, y, w, h]
            })
        
        return frame, objects
    
    def log_detection(self, faces, objects):
        """Log detections with timestamp"""
        if faces or objects:
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'faces': faces,
                'objects': objects
            }
            self.detection_log.append(log_entry)
            
            # Save to file
            with open('detection_log.json', 'w') as f:
                json.dump(self.detection_log, f, indent=2)
    
    def run_system(self):
        """Run the complete security system"""
        cap = cv2.VideoCapture(0)
        
        print("Smart Security System Started!")
        print("Controls:")
        print("  'q' - Quit")
        print("  's' - Save current frame")
        print("  'l' - Show recent logs")
        
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every 3rd frame for performance
            if frame_count % 3 == 0:
                # Detect faces
                frame, faces = self.detect_faces(frame)
                
                # Detect objects
                frame, objects = self.detect_objects_basic(frame)
                
                # Log detections
                self.log_detection(faces, objects)
                
                # Display statistics
                stats_text = f"Faces: {len(faces)} | Objects: {len(objects)} | Logs: {len(self.detection_log)}"
                cv2.putText(frame, stats_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            frame_count += 1
            
            cv2.imshow('Smart Security System', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                cv2.imwrite(f'capture_{timestamp}.jpg', frame)
                print(f"Frame saved as capture_{timestamp}.jpg")
            elif key == ord('l'):
                self.show_recent_logs()
        
        cap.release()
        cv2.destroyAllWindows()
    
    def show_recent_logs(self):
        """Display recent detection logs"""
        print("\n--- Recent Detections ---")
        for log in self.detection_log[-5:]:  # Show last 5
            print(f"Time: {log['timestamp']}")
            if log['faces']:
                for face in log['faces']:
                    print(f"  Face: {face['name']} (confidence: {face['confidence']:.2f})")
            if log['objects']:
                print(f"  Objects detected: {len(log['objects'])}")
            print()

if __name__ == "__main__":
    system = SmartSecuritySystem()
    system.run_system()