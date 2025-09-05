from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from game_logic import ReflectionGameEngine
import os
import csv
import random
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('server.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='frontend', static_url_path='/')
CORS(app)

# Используем абсолютный путь к CSV файлу
csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'reflections.csv'))
logger.info(f"Looking for CSV file at: {csv_path}")
logger.info(f"CSV file exists: {os.path.exists(csv_path)}")

if not os.path.exists(csv_path):
    logger.error(f"CSV file not found at: {csv_path}")
    # Попробуем альтернативный путь
    alt_csv_path = os.path.abspath('reflections.csv')
    logger.info(f"Trying alternative path: {alt_csv_path}")
    if os.path.exists(alt_csv_path):
        csv_path = alt_csv_path
        logger.info(f"Using alternative CSV path: {csv_path}")
    else:
        logger.error("CSV file not found in any expected location")

game_engine = ReflectionGameEngine(csv_path)
logger.info(f"Game engine initialized with CSV path: {csv_path}")

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/health')
def health():
    try:
        total = len(game_engine.question_loader.get_all_questions())
        return jsonify({"ok": True, "questions": total})
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route('/api/game/create', methods=['POST'])
def create_game():
    try:
        data = request.json
        difficulty = data.get('difficulty', 'medium')
        
        session_id = game_engine.create_game(difficulty)
        logger.info(f"Created game session {session_id} with difficulty {difficulty}")
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "difficulty": difficulty
        })
    except Exception as e:
        logger.error(f"Error creating game: {e}")
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/game/<int:session_id>/collect', methods=['POST'])
def collect_word(session_id):
    try:
        data = request.json
        word = data.get('word')
        
        if not word:
            return jsonify({"success": False, "error": "Word required"}), 400
        
        result = game_engine.collect_word(session_id, word)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error collecting word in session {session_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/game/<int:session_id>/submit-question', methods=['POST'])
def submit_question(session_id):
    try:
        result = game_engine.submit_question(session_id)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error submitting question in session {session_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/game/<int:session_id>/submit-answer', methods=['POST'])
def submit_answer(session_id):
    try:
        data = request.json
        answer = data.get('answer', '')
        
        result = game_engine.submit_answer(session_id, answer)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error submitting answer in session {session_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/game/<int:session_id>/state')
def get_game_state(session_id):
    try:
        state = game_engine.get_game_state(session_id)
        if not state:
            return jsonify({"error": "Game not found"}), 404
        return jsonify(state)
    except Exception as e:
        logger.error(f"Error getting game state for session {session_id}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/game/<int:session_id>/update', methods=['POST'])
def update_game(session_id):
    try:
        data = request.json
        delta_time = data.get('delta_time', 0.016)
        
        game_engine.update_game(session_id, delta_time)
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error updating game session {session_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/questions/count')
def get_questions_count():
    try:
        count = len(game_engine.question_loader.get_all_questions())
        return jsonify({"total_questions": count})
    except Exception as e:
        logger.error(f"Error getting questions count: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/random-prompt')
def get_random_prompt():
    try:
        prompts_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'prompts.csv'))
        logger.info(f"Looking for prompts CSV at: {prompts_path}")
        
        if not os.path.exists(prompts_path):
            logger.error(f"Prompts CSV not found at: {prompts_path}")
            # Попробуем альтернативный путь
            alt_prompts_path = os.path.abspath('prompts.csv')
            if os.path.exists(alt_prompts_path):
                prompts_path = alt_prompts_path
                logger.info(f"Using alternative prompts path: {prompts_path}")
            else:
                logger.error("Prompts CSV not found in any expected location")
                return jsonify({"success": False, "error": "Prompts file not found"}), 404
        
        items = []
        with open(prompts_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                items.append(row)
        
        if not items:
            return jsonify({"success": False}), 404
        
        pick = random.choice(items)
        logger.info(f"Selected random prompt: {pick.get('prompt_id')}")
        
        return jsonify({
            "success": True,
            "prompt_id": pick.get('prompt_id'),
            "text": pick.get('text'),
            "category": pick.get('category')
        })
    except Exception as e:
        logger.error(f"Error getting random prompt: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask application on port 5000")
    app.run(debug=True, port=5000)