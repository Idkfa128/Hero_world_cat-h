from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Optional
import random
import time
import re
from csv_processor import CSVQuestionLoader, ReflectionQuestion

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
        """Создать новую игровую сессию"""
        session_id = self.next_session_id
        questions = self.question_loader.get_questions_by_difficulty(difficulty, 5)
        
        game = GameSession(session_id, questions, difficulty)
        self.active_games[session_id] = game
        self.next_session_id += 1
        
        return session_id
    
    def collect_word(self, session_id: int, word: str) -> dict:
        """Собрать слово из поля"""
        game = self.active_games.get(session_id)
        if not game:
            return {"success": False, "error": "Game not found"}
        
        return game.collect_word(word)
    
    def submit_question(self, session_id: int) -> dict:
        """Проверить собранные слова для вопроса"""
        game = self.active_games.get(session_id)
        if not game:
            return {"success": False, "error": "Game not found"}
        
        return game.submit_question()
    
    def submit_answer(self, session_id: int, answer: str) -> dict:
        """Проверить ответ на вопрос"""
        game = self.active_games.get(session_id)
        if not game:
            return {"success": False, "error": "Game not found"}
        
        return game.submit_answer(answer)
    
    def get_game_state(self, session_id: int) -> Optional[dict]:
        """Получить состояние игры"""
        game = self.active_games.get(session_id)
        if not game:
            return None
        
        return game.get_state()
    
    def update_game(self, session_id: int, delta_time: float):
        """Обновить игровое состояние"""
        game = self.active_games.get(session_id)
        if game:
            game.update(delta_time)

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
        self.streak = 0  # Серия правильных ответов
        
        self.collected_words: List[str] = []
        self.flying_words: List[FlyingWord] = []
        
        # Генерируем летающие слова для первого вопроса
        self._generate_flying_words()
        
        self.start_time = time.time()
        self.time_remaining = 30
    
    def get_current_question(self) -> Optional[ReflectionQuestion]:
        """Получить текущий вопрос"""
        if self.current_question_index < len(self.questions):
            return self.questions[self.current_question_index]
        return None
    
    def _generate_flying_words(self):
        """Генерирует летающие слова для текущего вопроса"""
        current_question = self.get_current_question()
        if not current_question:
            return
        
        required_words = current_question.required_words
        
        # Добавляем отвлекающие слова из insight_tags и общие слова
        distraction_words = []
        if current_question.insight_tags:
            distraction_words.extend(current_question.insight_tags)
        
        # Общие отвлекающие слова
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
        """Собрать слово в область составления"""
        if self.state != GameState.COLLECTING:
            return {"success": False, "message": "Не время собирать слова"}
        
        for flying_word in self.flying_words:
            if flying_word.word == word and not flying_word.collected:
                flying_word.collected = True
                self.collected_words.append(word)
                
                current_question = self.get_current_question()
                return {
                    "success": True,
                    "word": word,
                    "collected_count": len(self.collected_words),
                    "total_needed": len(current_question.required_words) if current_question else 0
                }
        
        return {"success": False, "message": "Слово не найдено"}
    
    def submit_question(self) -> dict:
        """Проверить, правильно ли собраны слова для вопроса"""
        if self.state != GameState.COLLECTING:
            return {"success": False, "message": "Не время проверять вопрос"}
        
        current_question = self.get_current_question()
        if not current_question:
            return {"success": False, "message": "Вопрос не найден"}
        
        # Проверяем, собраны ли все нужные слова
        collected_set = set(self.collected_words)
        required_set = set(current_question.required_words)
        
        if collected_set.issuperset(required_set):
            # Правильно собрали! Переходим к ответу
            self.state = GameState.ANSWERING
            self.time_remaining = 20  # 20 секунд на ответ
            
            return {
                "success": True,
                "question_text": current_question.prompt_text,
                "time_remaining": self.time_remaining,
                "question_id": current_question.reflection_id
            }
        else:
            # Неправильно собрали
            self.lives -= 1
            self.combo = 0
            self.streak = 0
            self._reset_collection()
            
            if self.lives <= 0:
                self.state = GameState.GAME_OVER
                return {
                    "success": False, 
                    "game_over": True,
                    "message": "Закончились жизни"
                }
            
            return {
                "success": False,
                "message": "Собраны не все нужные слова",
                "lives_remaining": self.lives
            }
    
    def submit_answer(self, answer: str) -> dict:
        """Проверить ответ игрока"""
        if self.state != GameState.ANSWERING:
            return {"success": False, "message": "Не время отвечать"}
        
        current_question = self.get_current_question()
        if not current_question:
            return {"success": False, "message": "Вопрос не найден"}
        
        # Более гибкая проверка ответа
        user_answer = self._clean_answer(answer)
        correct_answer = self._clean_answer(current_question.answer_text)
        
        # Проверяем частичное совпадение
        is_correct = self._check_answer_similarity(user_answer, correct_answer)
        
        if is_correct:
            # Правильный ответ
            points = self._calculate_points(current_question, self.time_remaining)
            self.score += points
            self.combo += 1
            self.streak += 1
            
            # Бонус за серию правильных ответов
            if self.streak >= 3:
                streak_bonus = self.streak * 10
                self.score += streak_bonus
                points += streak_bonus
            
            # Переходим к следующему вопросу
            self.current_question_index += 1
            self._reset_collection()
            
            if self.current_question_index >= len(self.questions):
                self.state = GameState.COMPLETED
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
            # Неправильный ответ
            self.lives -= 1
            self.combo = 0
            self.streak = 0
            self._reset_collection()
            
            if self.lives <= 0:
                self.state = GameState.GAME_OVER
                return {
                    "success": False, 
                    "correct": False,
                    "game_over": True,
                    "lives_remaining": 0,
                    "message": "Игра окончена. Попробуйте еще раз!"
                }
            
            self.state = GameState.COLLECTING
            self.time_remaining = 30
            
            return {
                "success": False,
                "correct": False,
                "lives_remaining": self.lives,
                "correct_answer": current_question.answer_text,
                "message": f"Неправильно. Правильный ответ: {current_question.answer_text}"
            }
    
    def _clean_answer(self, answer: str) -> str:
        """Очистка ответа для сравнения"""
        return re.sub(r'[^\w\s]', '', answer.lower().strip())
    
    def _check_answer_similarity(self, user_answer: str, correct_answer: str) -> bool:
        """Проверка схожести ответов"""
        # Простая проверка: если ответ содержит ключевые слова
        user_words = set(user_answer.split())
        correct_words = set(correct_answer.split())
        
        # Если есть значительное пересечение
        common_words = user_words & correct_words
        return len(common_words) >= max(1, len(correct_words) // 2)
    
    def _calculate_points(self, question: ReflectionQuestion, time_remaining: float) -> int:
        """Расчет очков за ответ"""
        base_points = len(question.required_words) * 20
        time_bonus = int(time_remaining * 3)
        difficulty_bonus = {
            "easy": 10,
            "medium": 20,
            "hard": 30
        }.get(self.difficulty, 10)
        
        return base_points + time_bonus + difficulty_bonus
    
    def _reset_collection(self):
        """Сбросить собранные слова"""
        self.collected_words = []
        for word in self.flying_words:
            word.collected = False
    
    def update(self, delta_time: float):
        """Обновить игровое состояние"""
        if self.state in [GameState.COMPLETED, GameState.GAME_OVER]:
            return
        
        self.time_remaining -= delta_time
        
        if self.time_remaining <= 0:
            # Время вышло
            self.lives -= 1
            self.combo = 0
            self.streak = 0
            
            if self.lives <= 0:
                self.state = GameState.GAME_OVER
            else:
                self._reset_collection()
                self.time_remaining = 30
        
        # Обновляем позиции летающих слов
        for word in self.flying_words:
            if not word.collected:
                word.x += word.speed_x
                word.y += word.speed_y
                
                # Отскок от границ
                if word.x <= 0 or word.x >= 800:
                    word.speed_x *= -1
                if word.y <= 0 or word.y >= 500:
                    word.speed_y *= -1
    
    def get_state(self) -> dict:
        """Получить состояние игры"""
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