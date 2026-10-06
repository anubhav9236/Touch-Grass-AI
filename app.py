"""
TrailBuddy AI - AI-Powered Outdoor Activity Planner
Built for Hacktoberfest Touch Grass Edition.

Supports Google Gemini Cloud AI (ultra-fast, high intelligence) and Local Ollama (100% offline open-weight).
Zero tracking, privacy-first outdoor plan generation.
"""

import os
import sys
import re
import json
import random
import logging
import time

from flask import Flask, render_template, request, jsonify
import requests
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

app = Flask(__name__)

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
GEMINI_FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemma-4-26b-a4b-it",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.5-flash"
]

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate").strip()
OLLAMA_TAGS_URL = os.getenv("OLLAMA_TAGS_URL", "http://localhost:11434/api/tags").strip()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2").strip()
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "127.0.0.1")

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TrailBuddyAI")

# System Prompt for TrailBuddy AI
SYSTEM_PROMPT = (
    "You are TrailBuddy, an outdoor activity coach whose primary goal is to help "
    "people spend less time looking at screens and more time safely experiencing "
    "the real world. Give practical outdoor plans. Keep activities realistic. "
    "Encourage leaving the phone behind when possible. Prefer simple activities "
    "requiring little or no equipment. Include safety advice. Do not give dangerous "
    "instructions. Do not invent precise trail conditions. Do not claim real-time "
    "weather or location information. Clearly state when information is based only "
    "on user input. Encourage hydration and appropriate clothing. Adapt recommendations "
    "to the user's available time and fitness level."
)

# Curated offline outdoor challenges for instant "Touch Grass" moments
CURATED_CHALLENGES = [
    {
        "title": "Botanical Texture Hunt",
        "category": "Nature & Mindfulness",
        "duration": "15-20 min",
        "description": "Find 3 distinctly different leaf shapes and 2 different tree bark textures in your immediate neighborhood or park.",
        "phone_rule": "Leave phone on your desk or tucked away on silent in your pocket.",
        "difficulty": "Easy",
        "tag": "🌿 Observation"
    },
    {
        "title": "The Silent 2,000 Steps",
        "category": "Mindful Walking",
        "duration": "20-25 min",
        "description": "Walk roughly 2,000 steps (about 1 mile / 1.5 km) with absolutely no headphones, podcasts, or music. Tune your ears exclusively to natural ambient sounds.",
        "phone_rule": "Pocket phone on Do Not Disturb mode.",
        "difficulty": "Easy",
        "tag": "🚶 Step Challenge"
    },
    {
        "title": "Avian Listening Post",
        "category": "Birdwatching & Sensory",
        "duration": "10-15 min",
        "description": "Find a bench, rock, or patch of grass. Close your eyes for 5 full minutes and count how many unique bird calls you can isolate.",
        "phone_rule": "No screens during the 10-minute sit.",
        "difficulty": "Beginner Friendly",
        "tag": "🦜 Sensory"
    },
    {
        "title": "Uncharted Block Exploration",
        "category": "Urban & Trail Exploration",
        "duration": "30 min",
        "description": "Walk out your front door and take 3 turns you have never taken before in your neighborhood. Notice one architectural or natural detail you've never spotted.",
        "phone_rule": "Rely on physical landmarks rather than digital navigation.",
        "difficulty": "Moderate",
        "tag": "🧭 Micro-Adventure"
    },
    {
        "title": "The 10-Minute Cloud & Canopy Watch",
        "category": "Relaxation & Decompression",
        "duration": "10-15 min",
        "description": "Lie down or sit back comfortably under a tree canopy. Watch the movement of clouds and wind through the leaves without checking the time digitally.",
        "phone_rule": "Leave all devices indoors or in a backpack.",
        "difficulty": "Gentle",
        "tag": "🧘 Screen Detox"
    },
    {
        "title": "Macro Photography / Sketch Walk",
        "category": "Creative Observation",
        "duration": "25-30 min",
        "description": "Find 3 miniature natural wonders (moss patterns, insect pathways, droplets on leaves, pebble formations). If using a camera, switch the phone to Airplane Mode.",
        "phone_rule": "Airplane mode enabled -- camera only, zero notifications.",
        "difficulty": "Creative",
        "tag": "📷 Focus"
    },
    {
        "title": "Neighborhood Canopy Catalog",
        "category": "Tree Observation",
        "duration": "20 min",
        "description": "Identify the oldest/largest tree within 500 meters of your home. Stand next to its trunk and notice its roots, shade coverage, and resident insects.",
        "phone_rule": "Phone completely away.",
        "difficulty": "Easy",
        "tag": "🌳 Arborist"
    },
    {
        "title": "Hydration & Stride Reset",
        "category": "Gentle Fitness",
        "duration": "15 min",
        "description": "Drink a full glass of water, do 3 minutes of gentle ankle and hamstring stretches, and walk briskly around your block twice focusing on deep diaphragm breathing.",
        "phone_rule": "No screens.",
        "difficulty": "Active",
        "tag": "💧 Vitality"
    }
]

# High quality sample plan for instant demonstration and preview
SAMPLE_DEMO_PLAN = {
    "title": "30-Minute Neighborhood Nature Reset",
    "why": "A brisk, low-friction outdoor escape designed to rest your eyes from digital blue light, engage your calf and hip muscles, and reconnect your senses with your local environment.",
    "plan": [
        {"time": "0–5 min", "text": "Gentle warm-up stride and shoulder rolls. Step outside and take 5 deep diaphragm breaths."},
        {"time": "5–15 min", "text": "Steady-paced walk towards the nearest green space, tree-lined street, or park path."},
        {"time": "15–20 min", "text": "Sensory observation stop: Spot 3 distinct tree species or birds without looking at your watch."},
        {"time": "20–27 min", "text": "Return loop via an alternate quiet street at a relaxed, comfortable stride."},
        {"time": "27–30 min", "text": "Cool-down calf stretches and gentle deep breathing before heading back."}
    ],
    "checklist": [
        "Comfortable walking shoes or sneakers",
        "Reusable water bottle (stay hydrated)",
        "Weather-appropriate light jacket or sun protection"
    ],
    "safety": [
        "Stay aware of road traffic, pedestrian crossings, and uneven pavement.",
        "Based solely on your self-reported inputs; always adjust pace according to how your body feels.",
        "If sunlight is intense, wear a hat or apply sunscreen."
    ],
    "phone_down_challenge": "Place your phone on 'Do Not Disturb' inside your pocket or backpack for the entire 30 minutes. Let your eyes focus on distant tree horizons instead of glowing pixels.",
    "optional_variation": "If short on time, do a 15-minute brisk walk around two adjacent blocks. If raining, carry an umbrella and enjoy the calming scent of petrichor (rain on earth).",
    "is_demo": True,
    "model_used": "Sample Demo Mode"
}


def parse_structured_plan(raw_text: str, fallback_title="Outdoor Adventure Plan", model_name="AI"):
    """
    Parses the structured output from AI into clean JSON sections.
    Expected sections: TITLE, WHY, PLAN, CHECKLIST, SAFETY, PHONE-DOWN CHALLENGE, OPTIONAL_VARIATION.
    """
    result = {
        "title": fallback_title,
        "why": "",
        "plan": [],
        "checklist": [],
        "safety": [],
        "phone_down_challenge": "",
        "optional_variation": "",
        "raw_text": raw_text.strip(),
        "is_demo": False,
        "model_used": model_name
    }

    # Normalize newlines
    text = raw_text.replace("\r\n", "\n")

    # Regular expression patterns for standard sections
    patterns = {
        "title": r"(?:TITLE\s*:?|#+\s*TITLE\s*:?)\s*(.*?)(?=(?:WHY|PLAN|CHECKLIST|SAFETY|PHONE-DOWN|OPTIONAL|\Z))",
        "why": r"(?:WHY\s*:?|#+\s*WHY\s*:?)\s*(.*?)(?=(?:PLAN|CHECKLIST|SAFETY|PHONE-DOWN|OPTIONAL|\Z))",
        "plan": r"(?:PLAN\s*:?|#+\s*PLAN\s*:?)\s*(.*?)(?=(?:CHECKLIST|SAFETY|PHONE-DOWN|OPTIONAL|\Z))",
        "checklist": r"(?:CHECKLIST\s*:?|#+\s*CHECKLIST\s*:?|BRING THIS\s*:?)\s*(.*?)(?=(?:SAFETY|PHONE-DOWN|OPTIONAL|\Z))",
        "safety": r"(?:SAFETY\s*:?|#+\s*SAFETY\s*:?)\s*(.*?)(?=(?:PHONE-DOWN|OPTIONAL|\Z))",
        "phone_down": r"(?:PHONE-DOWN CHALLENGE\s*:?|PHONE DOWN CHALLENGE\s*:?|#+\s*PHONE-DOWN CHALLENGE\s*:?)\s*(.*?)(?=(?:OPTIONAL_VARIATION|OPTIONAL VARIATION|\Z))",
        "variation": r"(?:OPTIONAL_VARIATION\s*:?|OPTIONAL VARIATION\s*:?|#+\s*OPTIONAL_VARIATION\s*:?)\s*(.*)"
    }

    def clean_section(val: str) -> str:
        return val.strip().strip("#*_- ").strip()

    title_match = re.search(patterns["title"], text, re.IGNORECASE | re.DOTALL)
    if title_match and title_match.group(1).strip():
        result["title"] = clean_section(title_match.group(1).split("\n")[0])

    why_match = re.search(patterns["why"], text, re.IGNORECASE | re.DOTALL)
    if why_match and why_match.group(1).strip():
        result["why"] = clean_section(why_match.group(1))

    # Parse Plan items (e.g. 0-5 min - warm up)
    plan_match = re.search(patterns["plan"], text, re.IGNORECASE | re.DOTALL)
    if plan_match and plan_match.group(1).strip():
        plan_block = plan_match.group(1).strip()
        lines = [l.strip() for l in plan_block.split("\n") if l.strip()]
        for line in lines:
            line_clean = re.sub(r"^[\*\-\•\–\—\s]+|^\d+[\.\)]\s*", "", line).strip()
            if not line_clean or line_clean.upper().startswith(("PLAN:", "#", "NOTE:")):
                continue
            
            # Check if line contains a time interval (e.g., "0-5 min -- Warm up" or "10 mins:")
            time_match = re.search(r"^([\d\s–\-—to\.]+(?:min|mins|minutes|hr|hrs)?)\s*[:—–\-\|]\s*(.*)$", line_clean, re.IGNORECASE)
            if time_match:
                t_str = time_match.group(1).strip()
                if not re.search(r"(?:min|hr)", t_str, re.IGNORECASE):
                    t_str += " min"
                result["plan"].append({
                    "time": t_str,
                    "text": time_match.group(2).strip()
                })
            elif len(line_clean) > 10 and not line_clean.endswith(":"):
                result["plan"].append({
                    "time": "Step",
                    "text": line_clean
                })

    # Parse Checklist items
    checklist_match = re.search(patterns["checklist"], text, re.IGNORECASE | re.DOTALL)
    if checklist_match and checklist_match.group(1).strip():
        chk_block = checklist_match.group(1).strip()
        lines = [l.strip() for l in chk_block.split("\n") if l.strip()]
        for line in lines:
            cleaned = re.sub(r"^[\*\-\•\–\—\s]+|^\d+[\.\)]\s*|^\[[\s\bxX]?\]\s*", "", line).strip()
            if cleaned:
                result["checklist"].append(cleaned)

    # Parse Safety tips
    safety_match = re.search(patterns["safety"], text, re.IGNORECASE | re.DOTALL)
    if safety_match and safety_match.group(1).strip():
        saf_block = safety_match.group(1).strip()
        lines = [l.strip() for l in saf_block.split("\n") if l.strip()]
        for line in lines:
            cleaned = re.sub(r"^[\*\-\•\–\—\s]+|^\d+[\.\)]\s*", "", line).strip()
            if cleaned:
                result["safety"].append(cleaned)

    # Parse Phone-Down Challenge
    phone_match = re.search(patterns["phone_down"], text, re.IGNORECASE | re.DOTALL)
    if phone_match and phone_match.group(1).strip():
        result["phone_down_challenge"] = clean_section(phone_match.group(1))

    # Parse Variation
    var_match = re.search(patterns["variation"], text, re.IGNORECASE | re.DOTALL)
    if var_match and var_match.group(1).strip():
        result["optional_variation"] = clean_section(var_match.group(1))

    # Fallback if section parsing was too strict
    if not result["plan"] and not result["why"]:
        result["why"] = "A customized outdoor experience created for your schedule and interests."
        result["plan"] = [{"time": "Full Plan", "text": raw_text.strip()}]

    if not result["checklist"]:
        result["checklist"] = [
            "Comfortable footwear",
            "Full water bottle",
            "Appropriate weather clothing"
        ]

    if not result["safety"]:
        result["safety"] = [
            "Stay observant of your surroundings and trail footing.",
            "Information is based on your input; prioritize personal comfort and physical limits.",
            "Keep hydrated and take rests whenever necessary."
        ]

    if not result["phone_down_challenge"]:
        result["phone_down_challenge"] = (
            "Switch your phone to silent/airplane mode and leave it in your pocket. "
            "Immerse yourself entirely in the sights, scents, and sounds of the outdoors."
        )

    return result


def generate_with_gemini(user_prompt: str):
    """
    Calls Google Gemini API with smart fallback models and retry mechanism.
    Returns (raw_text, model_name).
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    models_to_try = [GEMINI_MODEL] + [m for m in GEMINI_FALLBACK_MODELS if m != GEMINI_MODEL]
    last_err = None

    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": f"SYSTEM INSTRUCTION:\n{SYSTEM_PROMPT}\n\nUSER REQUEST:\n{user_prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.9,
                "maxOutputTokens": 1000
            }
        }

        for attempt in range(2):
            try:
                logger.info(f"Dispatching plan generation to Google Gemini model: {m} (attempt {attempt + 1})")
                resp = requests.post(url, json=payload, timeout=12.0)
                
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"], f"Google Gemini ({m})"
                
                logger.warning(f"Gemini model {m} attempt {attempt + 1} returned HTTP {resp.status_code}: {resp.text[:120]}")
                last_err = f"HTTP {resp.status_code}: {resp.text[:100]}"
                time.sleep(0.8)

            except Exception as e:
                logger.warning(f"Gemini request failed for model {m} attempt {attempt + 1}: {type(e).__name__} - {e}")
                last_err = str(e)
                time.sleep(0.8)

    raise RuntimeError(f"All Gemini models failed. Last error: {last_err}")


def generate_with_ollama(user_prompt: str):
    """
    Calls local Ollama instance for 100% offline generation.
    Returns (raw_text, model_name).
    """
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": user_prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_predict": 750
        }
    }

    logger.info(f"Dispatching plan generation to local Ollama model: {OLLAMA_MODEL}")
    response = requests.post(OLLAMA_URL, json=payload, timeout=60.0)

    if response.status_code != 200:
        raise RuntimeError(f"Ollama returned HTTP {response.status_code}")

    res_json = response.json()
    raw_output = res_json.get("response", "")
    if not raw_output:
        raise RuntimeError("Ollama returned empty response.")

    return raw_output, f"Ollama ({OLLAMA_MODEL})"


@app.route("/")
def index():
    """Renders the single-page responsive web app."""
    active_engine = "gemini" if GEMINI_API_KEY else "ollama"
    active_model = GEMINI_MODEL if GEMINI_API_KEY else OLLAMA_MODEL
    return render_template("index.html", default_model=active_model, active_engine=active_engine)


@app.route("/health", methods=["GET"])
def health():
    """
    Checks AI engine status (Google Gemini and/or Local Ollama).
    """
    gemini_active = bool(GEMINI_API_KEY)
    ollama_connected = False
    available_models = []

    if gemini_active:
        available_models.append(GEMINI_MODEL)

    try:
        resp = requests.get(OLLAMA_TAGS_URL, timeout=1.5)
        if resp.status_code == 200:
            ollama_connected = True
            data = resp.json()
            available_models.extend([m.get("name", "") for m in data.get("models", [])])
    except Exception:
        pass

    is_online = gemini_active or ollama_connected
    active_engine = "Gemini AI" if gemini_active else ("Local Ollama" if ollama_connected else "Offline / Setup Needed")
    active_model = GEMINI_MODEL if gemini_active else OLLAMA_MODEL

    return jsonify({
        "status": "ok" if is_online else "degraded",
        "gemini": gemini_active,
        "ollama": ollama_connected,
        "active_engine": active_engine,
        "model": active_model,
        "available_models": available_models,
        "message": f"{active_engine} online ({active_model})" if is_online else "AI offline. Please configure Gemini API key or start Ollama."
    })


@app.route("/generate", methods=["POST"])
def generate_plan():
    """
    Receives user preferences, builds structured prompt, calls AI (Gemini or Ollama),
    parses the response, and returns clean JSON.
    """
    try:
        data = request.get_json(silent=True) or {}
    except Exception:
        return jsonify({
            "error": "Invalid JSON format in request payload.",
            "success": False
        }), 400

    # Input sanitization
    time_avail = str(data.get("time", "30 minutes"))[:50].strip()
    activity = str(data.get("activity", "Walking"))[:80].strip()
    fitness = str(data.get("fitness", "Beginner"))[:50].strip()
    location = str(data.get("location", "Local area"))[:100].strip()
    interests = data.get("interests", ["Nature"])
    if isinstance(interests, list):
        interests_str = ", ".join([str(i)[:40] for i in interests[:10]])
    else:
        interests_str = str(interests)[:150].strip()
    
    weather = str(data.get("weather", "Mild / Standard"))[:100].strip()
    companions = str(data.get("companions", "Solo"))[:60].strip()
    notes = str(data.get("notes", ""))[:500].strip()

    user_prompt = f"""
Create a structured outdoor activity plan for the following person:

- Available Time: {time_avail}
- Activity Preference: {activity}
- Fitness Level: {fitness}
- Location/Area: {location if location else 'Unspecified local outdoor area'}
- Key Interests: {interests_str if interests_str else 'General nature & fresh air'}
- Weather / Season Notes: {weather if weather else 'Standard outdoor conditions'}
- Companionship: {companions}
- Special Notes / Constraints: {notes if notes else 'None'}

Please format your response strictly using these exact section headers:

TITLE: <A short, inspiring title for this outdoor mission>
WHY: <1-2 sentences explaining why this specific plan is great for the user>
PLAN:
- 0–X min — <Specific, realistic step>
- X–Y min — <Specific, realistic step>
(Break down the full {time_avail} into realistic timed steps)
CHECKLIST:
- <Item 1 (hydration, footwear, etc.)>
- <Item 2>
- <Item 3>
SAFETY:
- <Safety tip 1 based on user inputs and activity>
- <Safety tip 2>
PHONE-DOWN CHALLENGE:
<A creative, practical screen-off challenge encouraging them to keep their phone away during the outing>
OPTIONAL_VARIATION:
<A quick tweak or backup option if time is cut short or weather shifts>
"""

    raw_output = None
    model_used = "AI"

    # Strategy 1: Try Gemini if API key is present
    if GEMINI_API_KEY:
        try:
            raw_output, model_used = generate_with_gemini(user_prompt)
        except Exception as e:
            logger.warning(f"Gemini generation error: {e}")

    # Strategy 2: Try Ollama if Gemini was not available or failed
    if not raw_output:
        try:
            raw_output, model_used = generate_with_ollama(user_prompt)
        except Exception as e:
            logger.warning(f"Ollama generation error: {e}")

    # If both AI engines failed, return clear error message
    if not raw_output:
        return jsonify({
            "success": False,
            "error": "AI service is currently unavailable. Please check your Gemini API key or test with our instant Demo Plan.",
            "gemini_configured": bool(GEMINI_API_KEY)
        }), 503

    parsed_data = parse_structured_plan(raw_output, fallback_title=f"{time_avail} {activity} Mission", model_name=model_used)
    parsed_data["success"] = True
    return jsonify(parsed_data)


@app.route("/api/demo-plan", methods=["GET", "POST"])
def get_demo_plan():
    """Returns an instant pre-computed sample plan for exploration."""
    return jsonify({
        "success": True,
        **SAMPLE_DEMO_PLAN
    })


@app.route("/api/random-challenge", methods=["GET", "POST"])
def get_random_challenge():
    """Returns an engaging outdoor micro-challenge."""
    challenge = random.choice(CURATED_CHALLENGES)
    return jsonify({
        "success": True,
        "challenge": challenge
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found", "status": 404}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "status": 500}), 500


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    engine_label = f"Google Gemini ({GEMINI_MODEL})" if GEMINI_API_KEY else f"Ollama ({OLLAMA_MODEL})"
    print("=" * 65)
    print("TrailBuddy AI -- Hacktoberfest Touch Grass Edition")
    print(f"AI Engine       : {engine_label}")
    print(f"Server Address  : http://{HOST}:{PORT}")
    print("Privacy Notice  : Direct inference -- Zero tracking")
    print("=" * 65)
    app.run(host=HOST, port=PORT, debug=False)
