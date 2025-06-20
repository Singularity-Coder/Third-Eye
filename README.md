# Third-Eye
Object detection

## Face Detection

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

___

### Quick Setup Checklist:
- [ ] Set up face recognition system
- [ ] Create `known_faces` folder
- [ ] Add photos of people you want to recognize
- [ ] Test the system

## Next Steps:
1. **Add more people** to your face database
2. **Improve accuracy** by adding multiple photos per person
3. **Add object detection** using YOLO or MobileNet
4. **Set up alerts** (email/SMS when unknown person detected)
5. **Add logging** to track detections

___

## Object Detection

## Step 5: Basic Object Detection
Create `object_detection.py`

## Step 6: Combined Face Recognition + Object Detection System
Create `combined_system.py`

## Installation and Setup Commands:

### Install Additional Required Libraries:
```bash
# For object detection (optional - for full YOLO support)
pip install tensorflow
pip install opencv-contrib-python

# For logging and utilities
pip install requests
```

### Download Pre-trained Models (Optional):
Download model from [pjreddie](https://pjreddie.com/darknet/yolo/) if it fails. Put that file in models directory.
```bash
# Create models directory
mkdir models

# Navigate to models directory
cd models

# For better object detection, download YOLO tiny (smaller, faster):
# You can manually download these files:
# - yolov3-tiny.weights
# - yolov3-tiny.cfg
# - coco.names
wget https://data.pjreddie.com/files/yolov3-tiny.weights
```

## How to Use:

### 1. **Start with Basic Object Detection:**
```bash
python object_detection.py
```

### 2. **Run Combined System:**
```bash
python combined_system.py
```

## Features of the Combined System:

**Face Recognition:**
- Recognizes known faces from `known_faces` folder
- Shows confidence scores
- Logs unknown faces

**Object Detection:**
- Detects moving objects
- Basic motion detection
- Can be upgraded to full YOLO detection

**Logging System:**
- Saves all detections with timestamps
- JSON format for easy analysis
- Shows statistics on screen

**Controls:**
- **'q'** - Quit
- **'s'** - Save current frame
- **'l'** - Show recent detection logs

## Performance Optimization Tips:

1. **Process every 3rd frame** (already implemented)
2. **Resize frames** for faster processing
3. **Lower detection thresholds** for better performance
4. **Use smaller models** (MobileNet vs YOLO)

## Next Upgrades:

1. **Add email alerts** for unknown faces
2. **Web interface** for remote monitoring
3. **Database storage** instead of JSON
4. **Multiple camera support**
5. **Night vision** with IR camera

___

```
The TensorFlow library was compiled to use AVX instructions, but these aren't available on your machine.
```
This error means your processor doesn't support AVX instructions that TensorFlow requires. Let's use the lightweight OpenCV-only solution instead.

## OpenCV-Only Detection System## Simple Installation (No TensorFlow needed):

```bash
# Only install these (no TensorFlow)
pip install opencv-python
pip install face-recognition
pip install numpy
```

## Run the System:

```bash
python opencv_only_system.py
```

## What This System Can Do:

### 1. **Face Detection & Recognition**
- Detects faces from front and profile views
- Recognizes known people from photos
- Detects eyes within faces for better accuracy

### 2. **Motion Detection**
- Advanced background subtraction
- Classifies movement patterns
- Tracks object size and shape

### 3. **People Detection**
- Full body detection
- Works even when face is not visible

### 4. **Color-based Object Detection**
- Detects objects by color (red, blue, green, yellow)
- Useful for tracking specific items

### 5. **Smart Logging**
- JSON logs with timestamps
- Detection statistics
- Saved images with detections

## Controls:
- **'1'** - Face detection only
- **'2'** - Face recognition only
- **'3'** - Motion detection only
- **'4'** - People detection only
- **'5'** - Color detection only
- **'a'** - All detections (recommended)
- **'s'** - Save current frame
- **'r'** - Reset background
- **'l'** - Show detection summary
- **'q'** - Quit

## Performance Benefits:
- **No AVX requirement** - works on any processor
- **Lightweight** - uses only OpenCV
- **Fast** - optimized for real-time processing
- **Reliable** - proven algorithms

## To Add Known Faces:
1. Create a `known_faces` folder
2. Add photos named like `john.jpg`, `mary.png`
3. Restart the system

**This system is actually better than TensorFlow for home security - it's faster, more reliable, and works on any computer!**

Try it now with:
```bash
python opencv_only_system.py
```


