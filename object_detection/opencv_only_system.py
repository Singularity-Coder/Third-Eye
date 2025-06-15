import cv2
import numpy as np
import face_recognition
import os
from datetime import datetime
import json

class OpenCVDetectionSystem:
    def __init__(self):
        print("Initializing OpenCV-Only Detection System...")
        
        # Face recognition setup
        self.known_face_encodings = []
        self.known_face_names = []
        
        # OpenCV cascade classifiers (built-in, no downloads needed)
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        self.body_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_fullbody.xml')
        self.profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        
        # Motion detection
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        self.motion_threshold = 500
        
        # Color detection setup
        self.color_ranges = {
            'red': ([0, 50, 50], [10, 255, 255]),
            'blue': ([100, 50, 50], [130, 255, 255]),
            'green': ([40, 50, 50], [80, 255, 255]),
            'yellow': ([20, 50, 50], [40, 255, 255])
        }
        
        # Detection logs
        self.detection_log = []
        
        # Load known faces
        self.setup_face_recognition()
        
        print("System ready! Using only OpenCV - no external dependencies.")
    
    def setup_face_recognition(self):
        """Load known faces from the known_faces directory"""
        known_faces_dir = "known_faces"
        
        if not os.path.exists(known_faces_dir):
            os.makedirs(known_faces_dir)
            print(f"Created {known_faces_dir} folder. Add photos of people you want to recognize.")
            return
        
        for filename in os.listdir(known_faces_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                try:
                    image_path = os.path.join(known_faces_dir, filename)
                    image = face_recognition.load_image_file(image_path)
                    
                    encodings = face_recognition.face_encodings(image)
                    if encodings:
                        self.known_face_encodings.append(encodings[0])
                        name = os.path.splitext(filename)[0]
                        self.known_face_names.append(name)
                        print(f"Loaded face: {name}")
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
    
    def detect_faces_detailed(self, frame):
        """Advanced face detection using multiple methods"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        detected_faces = []
        
        # Method 1: Standard face detection
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
            cv2.putText(frame, 'Face', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
            
            # Detect eyes within face region
            roi_gray = gray[y:y+h, x:x+w]
            eyes = self.eye_cascade.detectMultiScale(roi_gray, 1.1, 3)
            
            eye_count = len(eyes)
            for (ex, ey, ew, eh) in eyes:
                cv2.rectangle(frame, (x+ex, y+ey), (x+ex+ew, y+ey+eh), (0, 255, 0), 1)
            
            detected_faces.append({
                'type': 'frontal_face',
                'bbox': [x, y, w, h],
                'eyes_detected': eye_count,
                'confidence': 'high' if eye_count >= 2 else 'medium'
            })
        
        # Method 2: Profile face detection
        profiles = self.profile_cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
        for (x, y, w, h) in profiles:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 255), 2)
            cv2.putText(frame, 'Profile', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
            detected_faces.append({
                'type': 'profile_face',
                'bbox': [x, y, w, h],
                'confidence': 'medium'
            })
        
        return frame, detected_faces
    
    def recognize_faces(self, frame):
        """Face recognition using face_recognition library"""
        if not self.known_face_encodings:
            return frame, []
        
        # Resize for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = small_frame[:, :, ::-1]
        
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        
        recognized_faces = []
        
        for face_encoding, face_location in zip(face_encodings, face_locations):
            matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
            name = "Unknown"
            confidence = 0
            
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
            
            # Draw recognition result
            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            
            label = f"{name} ({confidence:.2f})" if name != "Unknown" else name
            cv2.putText(frame, label, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, color, 2)
            
            recognized_faces.append({
                'name': name,
                'confidence': confidence,
                'bbox': [left, top, right - left, bottom - top]
            })
        
        return frame, recognized_faces
    
    def detect_motion_advanced(self, frame):
        """Advanced motion detection with object tracking"""
        # Apply background subtraction
        fg_mask = self.bg_subtractor.apply(frame)
        
        # Morphological operations to clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        moving_objects = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > self.motion_threshold:
                x, y, w, h = cv2.boundingRect(contour)
                
                # Calculate movement characteristics
                aspect_ratio = w / h
                extent = area / (w * h)
                
                # Classify based on shape and movement
                object_type = "Unknown Motion"
                if aspect_ratio > 2:
                    object_type = "Horizontal Movement"
                elif aspect_ratio < 0.5:
                    object_type = "Vertical Movement"
                elif 0.7 < extent < 0.9:
                    object_type = "Person-like Movement"
                
                # Draw bounding box
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, f'{object_type} ({area:.0f})', (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                moving_objects.append({
                    'type': object_type.lower().replace(' ', '_'),
                    'area': area,
                    'aspect_ratio': aspect_ratio,
                    'bbox': [x, y, w, h]
                })
        
        return frame, moving_objects
    
    def detect_people(self, frame):
        """Detect people using full body cascade"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        bodies = self.body_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=3, 
            minSize=(50, 100),
            maxSize=(300, 600)
        )
        
        detected_people = []
        
        for (x, y, w, h) in bodies:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 255), 2)
            cv2.putText(frame, 'Person Detected', (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 255), 2)
            
            detected_people.append({
                'type': 'person',
                'bbox': [x, y, w, h],
                'confidence': 'medium'
            })
        
        return frame, detected_people
    
    def detect_colors(self, frame):
        """Detect objects by color"""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        color_objects = []
        
        for color_name, (lower, upper) in self.color_ranges.items():
            lower = np.array(lower)
            upper = np.array(upper)
            
            mask = cv2.inRange(hsv, lower, upper)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
            
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 1000:  # Filter small objects
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 255, 255), 2)
                    cv2.putText(frame, f'{color_name.title()} Object', (x, y-10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                    
                    color_objects.append({
                        'type': f'{color_name}_object',
                        'color': color_name,
                        'area': area,
                        'bbox': [x, y, w, h]
                    })
        
        return frame, color_objects
    
    def run_complete_system(self):
        """Run the complete detection system"""
        cap = cv2.VideoCapture(0)
        
        print("\n=== OpenCV Complete Detection System ===")
        print("Controls:")
        print("  'q' - Quit")
        print("  '1' - Face detection only")
        print("  '2' - Face recognition only") 
        print("  '3' - Motion detection only")
        print("  '4' - People detection only")
        print("  '5' - Color detection only")
        print("  'a' - All detections (default)")
        print("  's' - Save current frame")
        print("  'r' - Reset background model")
        print("  'l' - Show detection logs")
        
        detection_mode = 'all'
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            all_detections = []
            
            # Run different detection methods based on mode
            if detection_mode in ['face', 'all']:
                frame, faces = self.detect_faces_detailed(frame)
                all_detections.extend(faces)
            
            if detection_mode in ['recognition', 'all']:
                frame, recognized = self.recognize_faces(frame)
                all_detections.extend(recognized)
            
            if detection_mode in ['motion', 'all']:
                frame, motion = self.detect_motion_advanced(frame)
                all_detections.extend(motion)
            
            if detection_mode in ['people', 'all']:
                frame, people = self.detect_people(frame)
                all_detections.extend(people)
            
            if detection_mode in ['color', 'all']:
                frame, colors = self.detect_colors(frame)
                all_detections.extend(colors)
            
            # Display information
            mode_text = f"Mode: {detection_mode.upper()}"
            cv2.putText(frame, mode_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            detection_text = f"Detections: {len(all_detections)}"
            cv2.putText(frame, detection_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Log detections
            if all_detections:
                log_entry = {
                    'timestamp': datetime.now().isoformat(),
                    'frame': frame_count,
                    'mode': detection_mode,
                    'detections': all_detections
                }
                self.detection_log.append(log_entry)
            
            cv2.imshow('OpenCV Complete Detection System', frame)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('1'):
                detection_mode = 'face'
                print("Switched to Face Detection mode")
            elif key == ord('2'):
                detection_mode = 'recognition'
                print("Switched to Face Recognition mode")
            elif key == ord('3'):
                detection_mode = 'motion'
                print("Switched to Motion Detection mode")
            elif key == ord('4'):
                detection_mode = 'people'
                print("Switched to People Detection mode")
            elif key == ord('5'):
                detection_mode = 'color'
                print("Switched to Color Detection mode")
            elif key == ord('a'):
                detection_mode = 'all'
                print("Switched to All Detections mode")
            elif key == ord('s'):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                cv2.imwrite(f'detection_{timestamp}.jpg', frame)
                print(f"Frame saved as detection_{timestamp}.jpg")
            elif key == ord('r'):
                self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
                print("Background model reset")
            elif key == ord('l'):
                self.show_detection_summary()
            
            frame_count += 1
        
        cap.release()
        cv2.destroyAllWindows()
        
        # Save final log
        with open('detection_log.json', 'w') as f:
            json.dump(self.detection_log, f, indent=2)
        
        print(f"\nSession complete! Total detections: {len(self.detection_log)}")
        print("Detection log saved to detection_log.json")
    
    def show_detection_summary(self):
        """Show detection summary"""
        print("\n=== Detection Summary ===")
        
        if not self.detection_log:
            print("No detections recorded yet.")
            return
        
        # Count detection types
        detection_counts = {}
        total_detections = 0
        
        for entry in self.detection_log[-20:]:  # Last 20 entries
            for detection in entry['detections']:
                det_type = detection.get('type', 'unknown')
                detection_counts[det_type] = detection_counts.get(det_type, 0) + 1
                total_detections += 1
        
        print(f"Total recent detections: {total_detections}")
        for det_type, count in sorted(detection_counts.items()):
            print(f"  {det_type}: {count}")
        
        print()

if __name__ == "__main__":
    system = OpenCVDetectionSystem()
    system.run_complete_system()