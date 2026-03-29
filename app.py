from flask import Flask, render_template, request, jsonify
import json
import os
import requests

app = Flask(__name__)
DATA_FILE = "data.json"

DEFAULT_DATA = {
    "links": [
        {"title": "GitHub", "url": "https://github.com", "icon": "🐙", "color": "#6e40c9"},
        {"title": "YouTube", "url": "https://youtube.com", "icon": "▶️", "color": "#ff0000"},
        {"title": "Google", "url": "https://google.com", "icon": "🔍", "color": "#4285f4"},
        {"title": "Reddit", "url": "https://reddit.com", "icon": "🤖", "color": "#ff4500"},
        {"title": "Hacker News", "url": "https://news.ycombinator.com", "icon": "📰", "color": "#ff6600"},
        {"title": "Wikipedia", "url": "https://wikipedia.org", "icon": "📖", "color": "#aaaaaa"},
    ],
    "widgets": [
        {
            "id": "w1",
            "title": "Wetter",
            "type": "iframe",
            "url": "https://wttr.in/Berlin?format=3",
            "embed_url": "https://wttr.in/Berlin?0&T"
        },
        {
            "id": "w2",
            "title": "Uhr",
            "type": "clock",
            "url": ""
        }
    ],
    "settings": {
        "background": "#0d1117",
        "accent": "#00d4aa",
        "greeting": "Willkommen!"
    }
}

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, encoding="utf-8") as f:
            return json.load(f)
    return DEFAULT_DATA

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.route("/")
def index():
    data = load_data()
    return render_template("index.html", data=data)

@app.route("/api/data", methods=["GET"])
def get_data():
    return jsonify(load_data())

@app.route("/api/data", methods=["POST"])
def update_data():
    data = request.json
    save_data(data)
    return jsonify({"status": "ok"})

@app.route("/api/ip")
def get_ip():
    try:
        r = requests.get("https://api.ipify.org?format=json", timeout=3)
        return jsonify(r.json())
    except:
        return jsonify({"ip": "N/A"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)