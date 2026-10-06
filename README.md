# TrailBuddy AI 🌿
### *Less Scrolling. More Exploring.*

Built for **Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass**.

---

## 📖 What It Is

**TrailBuddy AI** is a locally running, open-weight AI-powered outdoor activity planner designed to counteract screen fatigue and help people spend more time safely enjoying the physical world.

By combining personal preferences—such as available time, desired activity, fitness level, location, and interests—with the reasoning capabilities of local open-weight models (like **Meta's Llama 3.2 via Ollama**), TrailBuddy AI crafts tailored, practical, step-by-step outdoor itineraries. It pairs every mission with safety tips, an interactive gear checklist, and a dedicated **Phone-Down Challenge** that encourages users to put away their devices and step outside.

---

## 💡 Why I Built It & The "Touch Grass" Connection

In a world filled with endless algorithmic feeds, doomscrolling, and perpetual screen time, reclaiming our relationship with the outdoors is more vital than ever. The barrier to going outside is often decision fatigue: *"Where should I walk? How much time will it take? What should I do when I get there?"*

TrailBuddy AI removes that friction by providing instant, realistic outdoor missions. Crucially, the web application is intentionally designed so that **the screen is the shortest part of the experience**:
1. You spend 30 seconds setting your parameters.
2. The local AI creates your outdoor plan and offline checklist.
3. You activate the **Touch Grass Mode** countdown and close your device to head outside.

---

## 🤖 Open-Source AI & Local Inference

TrailBuddy AI runs on **100% open-weight AI** using **Ollama** and **Llama 3.2**. 

### Why Local Inference Matters:
Unlike a cloud-only AI application, TrailBuddy can run locally after setup, allowing users to keep their activity preferences on their own machine and continue using the core planner without an internet connection.

- **Zero Cloud API Keys Required:** No accounts, credit cards, or external API keys (OpenAI, Gemini, Claude, etc.) needed.
- **Offline Resilience:** Once the open-weight model is pulled into Ollama, your outdoor planner functions completely disconnected from the internet—in a cabin, in a remote park, or during an internet outage.
- **Data Locality:** Your schedule, physical constraints, location notes, and personal habits remain on your local device rather than being broadcasted to third-party telemetry servers.

---

## ✨ Features

- 🌿 **Local Open-Weight AI Core:** Powered by Ollama (`llama3.2` by default, configurable to `llama3.1`, `mistral`, `phi3`, etc.).
- 🗺️ **Structured Step-by-Step Plans:** Breaks down your available time into clear, manageable time blocks (e.g. 0–5 min warm-up, 5–35 min nature walk, 35–45 min observation stop, 45–50 min cool down).
- 🎒 **Interactive Offline Checklist:** Check off essential items (water, footwear, sun protection) with automatic state persistence via browser storage.
- 🛡️ **Safety & Contextual Tips:** Clear, grounded safety advice tailored to your fitness level and activity.
- 📵 **Touch Grass Mode & Phone-Down Timer:** Built-in JavaScript countdown timer (15m, 30m, 45m, 60m) with calming visual cues to support screen disconnection.
- 🎲 **Instant Micro-Challenges:** Quick, safe outdoor activities (e.g., *Botanical Texture Hunt*, *The Silent 2,000 Steps*, *Canopy Watch*) for immediate spontaneous outdoor breaks.
- ⚡ **Offline Demo Mode:** Explore sample plans instantly before configuring Ollama.
- 🖨️ **Printable & Clipboard Ready:** One-click markdown copy and clean print stylesheet (strips UI distractions for paper or PDF export).
- 🎨 **Modern Nature-Inspired Aesthetic:** Accessible emerald and obsidian palette, glassmorphic cards, responsive mobile layout, and micro-animations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│   (HTML5, Vanilla CSS3, Vanilla JavaScript, LocalStorage)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Flask Backend (app.py)                   │
│  - Input sanitization & validation (length limits, escaping)│
│  - System prompt orchestration & structured parsing         │
│  - /health live status endpoint                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Local HTTP Request (localhost:11434)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Ollama Engine                        │
│            Local Open-Weight Model (llama3.2)               │
│               100% Offline Local Inference                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Touch-Grass-AI/
│
├── app.py                  # Flask backend & Ollama integration handler
├── requirements.txt        # Minimal Python dependencies (Flask, requests, dotenv)
├── README.md               # Documentation and architecture guide
├── .env.example            # Sample configuration for Ollama URL and model
├── .gitignore              # Git ignore rules for venv, .env, and caches
│
├── templates/
│   └── index.html          # Semantic HTML5 single-page application
│
├── static/
│   ├── style.css           # Custom nature-themed CSS3 design system
│   └── script.js           # Async API fetching, timers, checklist logic
│
└── screenshots/
    └── .gitkeep            # Directory for application screenshots
```

---

## 🚀 Installation & Quick Start

### 1. Prerequisites
- **Python 3.9+** installed.
- **Ollama** installed from [ollama.com](https://ollama.com).

### 2. Pull the Open-Weight Model
Open your terminal and download the default open-weight model:
```bash
ollama pull llama3.2
```
*(Optional: You can also use `llama3.2:1b`, `llama3.1:8b`, `mistral`, or `phi3`)*

Ensure Ollama is running:
```bash
ollama run llama3.2
```

---

### 3. Clone and Setup TrailBuddy AI

#### On Windows (PowerShell / Command Prompt):
```powershell
# Clone the repository
git clone https://github.com/anubhav9236/Touch-Grass-AI.git
cd Touch-Grass-AI

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Setup environment file
copy .env.example .env

# Run the Flask application
python app.py
```

#### On macOS / Linux:
```bash
# Clone the repository
git clone https://github.com/anubhav9236/Touch-Grass-AI.git
cd Touch-Grass-AI

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Setup environment file
cp .env.example .env

# Run the Flask application
python3 app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🔌 Configuration (.env)

TrailBuddy AI is fully configurable via environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `OLLAMA_URL` | `http://localhost:11434/api/generate` | Local Ollama generation endpoint |
| `OLLAMA_TAGS_URL` | `http://localhost:11434/api/tags` | Ollama model tags / health endpoint |
| `OLLAMA_MODEL` | `llama3.2` | Open-weight model name |
| `HOST` | `127.0.0.1` | Flask host address |
| `PORT` | `5000` | Flask port |

---

## 📴 Offline Usage

TrailBuddy AI is built from the ground up to operate offline:
- **Core Planner:** Once Ollama has pulled `llama3.2`, prompt compilation, generation, and parsing execute completely offline on your device's CPU/GPU.
- **Frontend Assets:** All CSS and JavaScript are self-contained without mandatory external runtime CDN dependencies.
- **Touch Grass Mode:** The countdown timer and random micro-challenges execute 100% in client-side JavaScript.
- **Health Fallback:** If Ollama is temporarily stopped, TrailBuddy displays friendly setup instructions and provides an instant **Offline Demo Plan** to preview the workflow.

---

## 🛡️ Security & Robustness

- **Input Length Restrictions:** All user inputs (time, activity, location, notes) are strictly length-capped and sanitized to prevent memory exhaustion.
- **Safe Output Rendering:** All AI output is sanitized before injection into the DOM using standard HTML escaping and structured element creation (no `eval()` or unsanitized `innerHTML`).
- **No Hardcoded Secrets:** Zero cloud API keys or credentials exist in the codebase.
- **Graceful Error Handling:** Network timeouts and connection drops return clean JSON error payloads with zero exposed Python tracebacks.

---

## 🚀 Future Roadmap

- 🗺️ **Offline Local OpenStreetMap Tiles:** Render offline vector maps for nearby green spaces and trailheads.
- 📍 **Local GPS Waypoint Export:** Export planned routes as `.GPX` files for offline outdoor watches and GPS units.
- 🌤️ **Local Weather Station Integration:** Optional local sensor (or cached weather) integration for ambient temperature alerts.
- 🦜 **On-Device Audio Bird-Call Classifier:** Open-weight audio model to identify bird songs in real-time on local hardware.
- 🪴 **Gardening & Backyard Biodiversity Mode:** Tailored routines for container gardening, soil care, and urban composting.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to modify, extend, and share!
