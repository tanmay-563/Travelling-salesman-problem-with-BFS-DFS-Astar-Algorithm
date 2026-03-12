# 🧠 AI Search Algorithm Visualizer

An **interactive educational tool** that visually demonstrates how classic **AI search algorithms** explore graphs.

This project allows users to **build their own graph**, choose an algorithm, and **watch the algorithm explore the graph step-by-step in real time**.

It is designed to help students, developers, and AI enthusiasts **intuitively understand how search algorithms work internally**.

---

# 🚀 Live Demo

🌐 **Live Website**

```
PASTE YOUR HOSTED WEBSITE LINK HERE
```

📦 **GitHub Repository**

```
PASTE YOUR REPOSITORY LINK HERE
```

---

# 🎥 Algorithm Visualization Demo

Watch the algorithms explore the graph step-by-step.

<video src="video.mp4" controls width="100%"></video>


---

# ✨ Features

### 🎯 Interactive Graph Builder

* Create graphs with **2–10 nodes**
* Add **custom weighted edges**
* Visual preview of the graph
* Remove or clear edges easily

### 🧠 Multiple Search Algorithms

The visualizer supports:

* **Breadth-First Search (BFS)**
* **Depth-First Search (DFS)**
* **A* Search Algorithm**

Each algorithm shows how nodes are explored in real time.

---

### 🎬 Step-By-Step Animation

Watch the algorithm process unfold:

* current node highlight
* visited nodes
* frontier nodes
* explored edges
* final path discovery

---

### ⚡ Animation Controls

You can control the simulation:

* Pause / Resume
* Step forward manually
* Restart simulation
* Adjust animation speed

---

### 📊 Real-Time Algorithm Information

The simulator displays:

* nodes explored
* current node
* frontier set
* algorithm status
* optimal path
* total path cost

---

### 🧾 Pseudocode Display

Each algorithm includes its **pseudocode**, allowing users to connect the **visual animation with the algorithm logic**.

---

### 🎨 Modern UI

Features a visually engaging interface with:

* glowing nodes
* animated edges
* particle background
* smooth transitions
* cyber-style theme

---

# 🧮 Algorithms Explained

## 🔵 Breadth-First Search (BFS)

BFS explores the graph **level by level** using a **queue**.

It guarantees the **shortest path in an unweighted graph**.

**Steps**

1. Start from the initial node
2. Add it to the queue
3. Visit all its neighbors
4. Continue level by level

Time Complexity

```
O(V + E)
```

---

## 🟣 Depth-First Search (DFS)

DFS explores **as deep as possible before backtracking**.

It uses a **stack** (or recursion).

**Steps**

1. Start from the initial node
2. Go to the first unvisited neighbor
3. Continue deeper
4. Backtrack when no neighbors remain

Time Complexity

```
O(V + E)
```

---

## 🟡 A* Search Algorithm

A* is a **heuristic pathfinding algorithm** that chooses the most promising node using:

```
f(n) = g(n) + h(n)
```

Where

* **g(n)** = cost from start to node
* **h(n)** = heuristic estimate to goal
* **f(n)** = total estimated cost

A* is widely used in:

* robotics
* navigation
* game AI
* route planning

---

# 🧑‍💻 How To Run This Project

You can run the project **in less than 1 minute**.

---

## Step 1 — Download the Project

### Option A — Clone the repository

```bash
git clone REPOSITORY_LINK_HERE
```

### Option B — Download ZIP

1. Click **Code**
2. Click **Download ZIP**
3. Extract the folder

---

## Step 2 — Open the Project

Navigate to the project folder.

You will see files like:

```
index.html
script.js
style.css
video.mp4
```

---

## Step 3 — Run the Project

Simply open:

```
index.html
```

in your browser.

No installation required.

No server required.

Works directly in:

* Chrome
* Edge
* Firefox
* Safari

---

# 🧪 How To Use The Visualizer

### 1️⃣ Generate Nodes

Choose how many nodes you want (2–10).

Click:

```
Generate Nodes
```

---

### 2️⃣ Add Edges

Select:

```
From node
To node
Weight
```

Then click:

```
Add Edge
```

---

### 3️⃣ Select Algorithm

Choose one:

```
BFS
DFS
A*
```

---

### 4️⃣ Choose Start Node

Pick the node where the algorithm should begin.

---

### 5️⃣ Run Simulation

Click:

```
RUN SIMULATION
```

The algorithm will now explore the graph visually.

---

### 6️⃣ Control Animation

You can:

* Pause
* Resume
* Step through manually
* Restart the simulation
* Adjust animation speed

---

# 📁 Project Structure

```
AI-Search-Visualizer
│
├── index.html
├── style.css
├── script.js
├── video.mp4
│
└── README.md
```

---

# 🛠 Technologies Used

* **HTML5**
* **CSS3**
* **JavaScript**
* **Canvas API**

No external libraries required.

---

# 🎯 Educational Purpose

This project helps users understand:

* graph traversal
* AI search strategies
* algorithm exploration patterns
* heuristic search concepts

It is particularly useful for:

* computer science students
* AI learners
* interview preparation
* algorithm visualization

---

# 🌟 Future Improvements

Potential upgrades:

* Dijkstra's Algorithm
* Greedy Best First Search
* Bidirectional Search
* Grid / Maze Pathfinding
* Algorithm comparison mode
* Directed graph support
* Heuristic visualization

---

# 🤝 Contributing

Contributions are welcome.

If you would like to improve this project:

1. Fork the repository
2. Create a new branch
3. Submit a pull request

---

# 📜 License

This project is open-source and available under the **MIT License**.

---

# 👨‍💻 Author

Created by

```
YOUR NAME HERE
```

---

# ⭐ Support

If you found this project helpful:

⭐ Star the repository
🍴 Fork it
📢 Share it with others
