# Smart Campus Energy Optimizer 🌱

A machine-learning powered web application that seamlessly bridges an engaging frontend web UI to an AI-driven Python API to drastically reduce electrical overhead across physical university campuses. 

By analyzing historical foot-traffic, schedule tables, and real-time room occupancies, this suite algorithmically dictates HVAC, device, and lighting powers to guarantee carbon waste and overall megawatt expenditure drops over time.

---

## 🚀 The Problem & Solution

**The Problem:**
University classrooms, server labs, and auditoriums sit empty while draining hundreds of kilowatts in powered lights and AC conditioning. Facility managers have historically relied on static schedules or manual walkthroughs, which invariably leaves devices forgotten and burning idle wattage.

**The Solution:** 
We built a dual-ended platform. The FastAPI Python Backend reads local student data and dynamically parses occupancy trends using a Scikit-Learn machine-learning decision tree classifier.
The Frontend leverages real-time polling to constantly draw new predictions and status counts asynchronously from the python server. If a room goes idle, the system automatically tags it, tracks the hypothetical kilowatts wasted, maps a proposed reduction operation, and emits an intelligent power-down schedule right to the dashboard!

---

## 🛠️ Tech Stack & Dependencies

### **Frontend**
* **HTML5 / CSS3 / JavaScript (Vanilla)** - Ultra-lightweight and fast footprint. No heavy frameworks required.
* **Chart.js v4.4** - Dynamic graph generation for mapping forecast curves and hourly energy loads.
* **FontAwesome** - Beautiful standardized SVG icons.

### **Backend**
* **Python 3.x** - Core logical environment.
* **FastAPI** - Blistering fast async web framework driving the REST endpoints.
* **Uvicorn** - ASGI Web Server to host the FastAPI routes locally.
* **Pandas** - Lightning fast dataset processing and querying.
* **Scikit-Learn** - Machine Learning Library powering the `DecisionTreeClassifier` logic and `LabelEncoder` room mappings.
* **Numpy** - Array transformation parsing.

---

## 📂 Project Structure

```text
/ (Root Directory)
├── main.py                             # Python Backend Server & Algorithm Entrypoint
├── index.html                          # Main UI Viewport
├── script.js                           # Frontend controller, REST Client, and App Logic
├── style.css                           # Theming, Layouts, and Frontend Variables
├── requirements.txt                    # Python environment tracker (pip install -r)
│
├── campus_energy_dataset_4months.csv   # High-density historical IoT status data
└── college_timetable_ug_pg.csv         # Standardized student course schedules
```

---

## 🧩 Modules Breakdown

1. **The Telemetry Engine (`/api/status`)**
   The dashboard header metrics map here. Python reads the entire CSV and extracts the absolute latest row timestamp across the dataset. It actively maps classrooms with humans >0 as "Active" and empty rooms as "Idle". Math is simulated out via modulo seconds to constantly update live savings totals smoothly across a 25-room hard baseline limit.

2. **The Graph Plotter (`/api/forecast` | `/api/detailed_forecast`)**
   Provides Chart.js mapping data. Both endpoints feature Pandas `groupby` logic sorting incoming data into four-hour segments. The endpoints dynamically filter datasets depending on if the user selects `All Buildings` or particular departments within the UI dropdown.

3. **The AI Predictions Core (`/api/optimization`)**
   The heart of the app. During boot, `main.py` instantiates an ML model that fits the entire four-month `.csv` dataset. The endpoint retrieves all campus rooms, iterates one-by-one by requesting a prediction for the immediate `next hour`, and mathematically rolls a mitigation logic (Full power down vs HVAC throttling) based on the AI's likelihood confidence that the room is empty.

4. **The Schedule Tracker (`/api/timetable`)**
   Straightforward pass-through reading the daily class timetable CSV payload out as standard JSON dicts. It allows the Frontend to trace physical student movement against what the AI engine is recommending.
