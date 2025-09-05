from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from game_logic import ReflectionGameEngine
import os

app = Flask(__name__)
CORS(app)

# Инициализируем движок игры с путем к CSV файлу
csv_path = os.path.join(os.path.dirname(__file__), 'reflections.csv')
game_engine = ReflectionGameEngine(csv_path)

@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/api/game/create', methods=['POST'])
def create_game():
    data = request.json
    difficulty = data.get('difficulty', 'medium')
    
    try:
        session_id = game_engine.create_game(difficulty)
        return jsonify({
            "success": True,
            "session_id": session_id,
            "difficulty": difficulty
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/game/<int:session_id>/collect', methods=['POST'])
def collect_word(session_id):
    data = request.json
    word = data.get('word')
    
    if not word:
        return jsonify({"success": False, "error": "Word required"}), 400
    
    result = game_engine.collect_word(session_id, word)
    return jsonify(result)

@app.route('/api/game/<int:session_id>/submit-question', methods=['POST'])
def submit_question(session_id):
    result = game_engine.submit_question(session_id)
    return jsonify(result)

@app.route('/api/game/<int:session_id>/submit-answer', methods=['POST'])
def submit_answer(session_id):
    data = request.json
    answer = data.get('answer', '')
    
    result = game_engine.submit_answer(session_id, answer)
    return jsonify(result)

@app.route('/api/game/<int:session_id>/state')
def get_game_state(session_id):
    state = game_engine.get_game_state(session_id)
    if not state:
        return jsonify({"error": "Game not found"}), 404
    return jsonify(state)

@app.route('/api/game/<int:session_id>/update', methods=['POST'])
def update_game(session_id):
    data = request.json
    delta_time = data.get('delta_time', 0.016)
    
    game_engine.update_game(session_id, delta_time)
    return jsonify({"success": True})

@app.route('/api/questions/count')
def get_questions_count():
    count = len(game_engine.question_loader.get_all_questions())
    return jsonify({"total_questions": count})

if __name__ == '__main__':
    app.run(debug=True, port=5000)