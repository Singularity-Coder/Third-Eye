import cv2
import face_recognition
import numpy as np
import os

class FaceRecognitionSystem:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_names = []
        self.load_known_faces()
    
    def load_known_faces(self):
        """Load known faces from 'known_faces' folder"""
        known_faces_dir = "known_faces"
        
        if not os.path.exists(known_faces_dir):
            os.makedirs(known_faces_dir)
            print(f"Created {known_faces_dir} folder. Add photos of people you want to recognize.")
            return
        
        for filename in os.listdir(known_faces_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                # Load image
                image_path = os.path.join(known_faces_dir, filename)
                image = face_recognition.load_image_file(image_path)
                
                # Get face encoding
                encodings = face_recognition.face_encodings(image)
                if encodings:
                    self.known_face_encodings.append(encodings[0])
                    # Use filename (without extension) as name
                    name = os.path.splitext(filename)[0]
                    self.known_face_names.append(name)
                    print(f"Loaded face: {name}")
    
    def recognize_faces(self):
        """Start real-time face recognition"""
        cap = cv2.VideoCapture(0)
        
        print("Face recognition system started. Press 'q' to quit")
        print("Press 's' to save current face")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Resize frame for faster processing
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = small_frame[:, :, ::-1]
            
            # Find faces and encodings
            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            
            for face_encoding, face_location in zip(face_encodings, face_locations):
                # Check if face matches known faces
                matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
                name = "Unknown"
                confidence = 0
                
                if self.known_face_encodings:
                    face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                    best_match_index = np.argmin(face_distances)
                    
                    if matches[best_match_index]:
                        name = self.known_face_names[best_match_index]
                        confidence = 1 - face_distances[best_match_index]
                
                # Scale face location back up
                top, right, bottom, left = face_location
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4
                
                # Draw rectangle and label
                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                
                label = f"{name} ({confidence:.2f})" if name != "Unknown" else name
                cv2.putText(frame, label, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, color, 2)
            
            cv2.imshow('Face Recognition System', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                self.save_current_face(frame)
        
        cap.release()
        cv2.destroyAllWindows()
    
    def save_current_face(self, frame):
        """Save current face for recognition"""
        name = input("\nEnter name for this person: ")
        if name:
            filename = f"known_faces/{name}.jpg"
            cv2.imwrite(filename, frame)
            print(f"Saved face as {filename}")
            # Reload known faces
            self.known_face_encodings = []
            self.known_face_names = []
            self.load_known_faces()

if __name__ == "__main__":
    system = FaceRecognitionSystem()
    system.recognize_faces()