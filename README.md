# Third-Eye
Object detection

### Install CMake on macOS
A popular build automation tool used to compile and build software, especially C/C++ projects.

Use Homebrew:

```bash
brew install cmake
```

If you don't have Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then rerun the `brew install cmake` command.

After installation, check if it worked:

```bash
cmake --version
```

___

### Step 1: Install Python and Required Libraries
Open Command Prompt/Terminal and run:
```bash
# Install Python (if not already installed)
# Download from python.org

# Install required libraries
pip install opencv-python
pip install face-recognition
pip install numpy
pip install pillow
```

### Step 2: Test Your Webcam
Create a file called `test_camera.py`

### Step 3: Basic Face Detection
Create `face_detection.py`

### Step 4: Face Recognition System
Create `face_recognition_system.py`

## How to Run:

### 1. **Test Camera First**
```bash
python test_camera.py
```

### 2. **Try Face Detection**
```bash
python face_detection.py
```

### 3. **Set Up Face Recognition**
```bash
python face_recognition_system.py
```

## Quick Setup Checklist:
- [ ] Set up face recognition system
- [ ] Create `known_faces` folder
- [ ] Add photos of people you want to recognize
- [ ] Test the system

**Adding Object Detection (Next Step):**
- Install: `pip install tensorflow`
- Download pre-trained models
- Integrate object detection

## Next Steps:
1. **Add more people** to your face database
2. **Improve accuracy** by adding multiple photos per person
3. **Add object detection** using YOLO or MobileNet
4. **Set up alerts** (email/SMS when unknown person detected)
5. **Add logging** to track detections



