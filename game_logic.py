from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Optional
import random
import time
import re
import logging
from csv_processor import CSVQuestionLoader, ReflectionQuestion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GameState(Enum):
    COLLECTING = "collecting"
    ANSWERING = "answering"
    COMPLETED = "completed"
    GAME_OVER = "game_over"

@dataclass
class FlyingWord:
    word: str
    x: int
    y: int
    speed_x: float
    speed_y: float
    collected: bool = False

class ReflectionGameEngine:
    def __init__(self, csv_file_path: str = 'reflections.csv'):
        self.question_loader = CSVQuestionLoader(csv_file_path)
        self.active_games: Dict[int, 'GameSession'] = {}
        self.next_session_id = 1
    
    def create_game(self, difficulty: str = "medium") -> int:
        try:
            session_id = self.next_session_id
            questions = self.question_loader.get_questions_by_difficulty(difficulty, 5)
            
            game = GameSession(session_id, questions, difficulty)
            self.active_games[session_id] = game
            self.next_session_id += 1
            
            logger.info(f"Created game session {session_id} with difficulty {difficulty}")
            return session_id
        except Exception as e:
            logger.error(f"Error creating game: {e}")
            raise
    
    def collect_word(self, session_id: int, word: str) -> dict:
        try:
            game = self.active_games.get(session_id)
            if not game:
                logger.warning(f"Game session {session_id} not found")
                return {"success": False, "error": "Game not found"}
            
            return game.collect_word(word)
        except Exception as e:
            logger.error(f"Error collecting word {word} in session {session_id}: {e}")
            return {"success": False, "error": str(e)}
    
    def submit_question(self, session_id: int) -> dict:
        try:
            game = self.active_games.get(session_id)
            if not game:
                logger.warning(f"Game session {session_id} not found")
                return {"success": False, "error": "Game not found"}
            
            return game.submit_question()
        except Exception as e:
            logger.error(f"Error submitting question in session {session_id}: {e}")
            return {"success": False, "error": str(e)}
    
    def submit_answer(self, session_id: int, answer: str) -> dict:
        try:
            game = self.active_games.get(session_id)
            if not game:
                logger.warning(f"Game session {session_id} not found")
                return {"success": False, "error": "Game not found"}
            
            return game.submit_answer(answer)
        except Exception as e:
            logger.error(f"Error submitting answer in session {session_id}: {e}")
            return {"success": False, "error": str(e)}
    
    def get_game_state(self, session_id: int) -> Optional[dict]:
        try:
            game = self.active_games.get(session_id)
            if not game:
                logger.warning(f"Game session {session_id} not found")
                return None
            
            return game.get_state()
        except Exception as e:
            logger.error(f"Error getting game state for session {session_id}: {e}")
            return None
    
    def update_game(self, session_id: int, delta_time: float):
        try:
            game = self.active_games.get(session_id)
            if game:
                game.update(delta_time)
        except Exception as e:
            logger.error(f"Error updating game session {session_id}: {e}")

class GameSession:
    def __init__(self, session_id: int, questions: List[ReflectionQuestion], difficulty: str):
        self.session_id = session_id
        self.questions = questions
        self.current_question_index = 0
        self.difficulty = difficulty
        self.state = GameState.COLLECTING
        
        self.score = 0
        self.lives = 3
        self.combo = 0
        self.streak = 0
        
        self.collected_words: List[str] = []
        self.flying_words: List[FlyingWord] = []
        
        self._generate_flying_words()
        
        self.start_time = time.time()
        self.time_remaining = 30
    
    def get_current_question(self) -> Optional[ReflectionQuestion]:
        if self.current_question_index < len(self.questions):
            return self.questions[self.current_question_index]
        return None
    
    def _generate_flying_words(self):
        current_question = self.get_current_question()
        if not current_question:
            return
        
        required_words = re.findall(r'\b[\w-]+\b', current_question.answer_text.lower())
        
        distraction_words = []
        if current_question.insight_tags:
            distraction_words.extend(current_question.insight_tags)
        
        common_distractions = ["сегодня", "завтра", "потом", "сейчас", "очень", 
                              "быстро", "медленно", "иногда", "часто", "редко"]
        
        all_words = required_words + random.sample(distraction_words + common_distractions, 3)
        random.shuffle(all_words)
        
        self.flying_words = []
        for word in all_words:
            self.flying_words.append(FlyingWord(
                word=word,
                x=random.randint(50, 750),
                y=random.randint(50, 400),
                speed_x=random.uniform(-1.5, 1.5),
                speed_y=random.uniform(-1.5, 1.5)
            ))
    
    def collect_word(self, word: str) -> dict:
        try:
            if self.state != GameState.COLLECTING:
                return {"success": False, "message": "Не время собирать слова"}
            
            for flying_word in self.flying_words:
                if flying_word.word == word and not flying_word.collected:
                    flying_word.collected = True
                    self.collected_words.append(word)
                    
                    current_question = self.get_current_question()
                    logger.info(f"Collected word '{word}' in session {self.session_id}")
                    return {
                        "success": True,
                        "word": word,
                        "collected_count": len(self.collected_words),
                        "total_needed": len(current_question.required_words) if current_question else 0
                    }
            
            return {"success": False, "message": "Слово не найдено"}
        except Exception as e:
            logger.error(f"Error collecting word '{word}' in session {self.session_id}: {e}")
            return {"success": False, "message": "Ошибка при сборе слова"}
    
    def submit_question(self) -> dict:
        try:
            if self.state != GameState.COLLECTING:
                return {"success": False, "message": "Не время проверять вопрос"}
            
            current_question = self.get_current_question()
            if not current_question:
                return {"success": False, "message": "Вопрос не найден"}
            
            collected_set = set(self.collected_words)
            required_set = set(current_question.required_words)
            
            if collected_set.issuperset(required_set):
                self.state = GameState.ANSWERING
                self.time_remaining = 20
                
                logger.info(f"Question submitted successfully in session {self.session_id}")
                return {
                    "success": True,
                    "question_text": current_question.prompt_text,
                    "time_remaining": self.time_remaining,
                    "question_id": current_question.reflection_id
                }
            else:
                self.lives -= 1
                self.combo = 0
                self.streak = 0
                self._reset_collection()
                
                if self.lives <= 0:
                    self.state = GameState.GAME_OVER
                    logger.info(f"Game over in session {self.session_id} - no lives left")
                    return {
                        "success": False, 
                        "game_over": True,
                        "message": "Закончились жизни"
                    }
                
                logger.warning(f"Wrong words collected in session {self.session_id}, lives remaining: {self.lives}")
                return {
                    "success": False,
                    "message": "Собраны не все нужные слова",
                    "lives_remaining": self.lives
                }
        except Exception as e:
            logger.error(f"Error submitting question in session {self.session_id}: {e}")
            return {"success": False, "message": "Ошибка при проверке вопроса"}
    
    def submit_answer(self, answer: str) -> dict:
        try:
            if self.state != GameState.ANSWERING:
                return {"success": False, "message": "Не время отвечать"}
            
            current_question = self.get_current_question()
            if not current_question:
                return {"success": False, "message": "Вопрос не найден"}
            
            user_answer = self._clean_answer(' '.join(self.collected_words))
            correct_answer = self._clean_answer(current_question.answer_text)
            
            is_correct = self._check_answer_similarity(user_answer, correct_answer, threshold=0.8)
            
            if is_correct:
                points = self._calculate_points(current_question, self.time_remaining)
                self.score += points
                self.combo += 1
                self.streak += 1
                
                if self.streak >= 3:
                    streak_bonus = self.streak * 10
                    self.score += streak_bonus
                    points += streak_bonus
                
                self.current_question_index += 1
                self._reset_collection()
                
                if self.current_question_index >= len(self.questions):
                    self.state = GameState.COMPLETED
                    logger.info(f"Game completed in session {self.session_id} with score {self.score}")
                    return {
                        "success": True,
                        "correct": True,
                        "points": points,
                        "total_score": self.score,
                        "streak": self.streak,
                        "game_completed": True,
                        "message": "Игра завершена! Отличный результат!"
                    }
                else:
                    self.state = GameState.COLLECTING
                    self._generate_flying_words()
                    self.time_remaining = 30
                    
                    logger.info(f"Correct answer in session {self.session_id}, moving to next question")
                    return {
                        "success": True,
                        "correct": True,
                        "points": points,
                        "total_score": self.score,
                        "streak": self.streak,
                        "combo": self.combo,
                        "next_question": True,
                        "message": "Правильно! Переходим к следующему вопросу"
                    }
            else:
                self.lives -= 1
                self.combo = 0
                self.streak = 0
                self._reset_collection()
                
                if self.lives <= 0:
                    self.state = GameState.GAME_OVER
                    logger.info(f"Game over in session {self.session_id} - wrong answer, no lives left")
                    return {
                        "success": False, 
                        "correct": False,
                        "game_over": True,
                        "lives_remaining": 0,
                        "message": "Игра окончена. Попробуйте еще раз!"
                    }
                
                self.state = GameState.COLLECTING
                self.time_remaining = 30
                
                logger.warning(f"Wrong answer in session {self.session_id}, lives remaining: {self.lives}")
                return {
                    "success": False,
                    "correct": False,
                    "lives_remaining": self.lives,
                    "correct_answer": current_question.answer_text,
                    "message": f"Неправильно. Правильный ответ: {current_question.answer_text}"
                }
        except Exception as e:
            logger.error(f"Error submitting answer in session {self.session_id}: {e}")
            return {"success": False, "message": "Ошибка при проверке ответа"}
    
    def _clean_answer(self, answer: str) -> str:
        return re.sub(r'[^\w\s]', '', answer.lower().strip())
    
    def _check_answer_similarity(self, user_answer: str, correct_answer: str, threshold: float = 0.5) -> bool:
        user_words = set(user_answer.split())
        correct_words = set(correct_answer.split())
        if not correct_words:
            return False
        common_ratio = len(user_words & correct_words) / len(correct_words)
        return common_ratio >= threshold
    
    def _calculate_points(self, question: ReflectionQuestion, time_remaining: float) -> int:
        base_points = len(question.required_words) * 20
        time_bonus = int(time_remaining * 3)
        difficulty_bonus = {
            "easy": 10,
            "medium": 20,
            "hard": 30
        }.get(self.difficulty, 10)
        
        return base_points + time_bonus + difficulty_bonus
    
    def _reset_collection(self):
        self.collected_words = []
        for word in self.flying_words:
            word.collected = False
    
    def update(self, delta_time: float):
        try:
            if self.state in [GameState.COMPLETED, GameState.GAME_OVER]:
                return
            
            self.time_remaining -= delta_time
            
            if self.time_remaining <= 0:
                self.lives -= 1
                self.combo = 0
                self.streak = 0
                
                if self.lives <= 0:
                    self.state = GameState.GAME_OVER
                    logger.info(f"Game over in session {self.session_id} - time ran out")
                else:
                    self._reset_collection()
                    self.time_remaining = 30
            
            for word in self.flying_words:
                if not word.collected:
                    word.x += word.speed_x
                    word.y += word.speed_y
                    width, height = 800, 500
                    if word.x < 0:
                        word.x = width
                    elif word.x > width:
                        word.x = 0
                    if word.y < 0:
                        word.y = height
                    elif word.y > height:
                        word.y = 0
        except Exception as e:
            logger.error(f"Error updating game session {self.session_id}: {e}")
    
    def get_state(self) -> dict:
        try:
            current_question = self.get_current_question()
            
            return {
                "state": self.state.value,
                "score": self.score,
                "lives": self.lives,
                "combo": self.combo,
                "streak": self.streak,
                "time_remaining": int(self.time_remaining),
                "current_question": current_question.prompt_text if current_question else None,
                "collected_words": self.collected_words,
                "flying_words": [
                    {
                        "word": fw.word,
                        "x": int(fw.x),
                        "y": int(fw.y),
                        "collected": fw.collected
                    }
                    for fw in self.flying_words
                ],
                "progress": {
                    "current": self.current_question_index + 1,
                    "total": len(self.questions)
                },
                "question_id": current_question.reflection_id if current_question else None
            }
        except Exception as e:
            logger.error(f"Error getting game state for session {self.session_id}: {e}")
            return {}