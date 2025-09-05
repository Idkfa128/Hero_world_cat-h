import csv
import os
from dataclasses import dataclass
from typing import List, Dict, Set
import random
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ReflectionQuestion:
    reflection_id: str
    prompt_text: str
    answer_text: str
    insight_tags: List[str]
    required_words: List[str]  # Слова, которые нужно собрать

class CSVQuestionLoader:
    def __init__(self, csv_file_path: str = 'reflections.csv'):
        self.csv_file_path = csv_file_path
        self.questions: List[ReflectionQuestion] = []
        self._load_questions()
    
    def _clean_text(self, text: str) -> str:
        return re.sub(r'[^\w\s]', '', text.lower().strip())
    
    def _extract_words(self, text: str) -> List[str]:
        words = re.findall(r'\b[\w-]+\b', text.lower())
        stop_words = {'что', 'как', 'где', 'когда', 'почему', 'зачем', 'кто', 
                     'чтобы', 'если', 'то', 'и', 'в', 'на', 'с', 'по', 'о', 'об',
                     'из', 'от', 'до', 'для', 'у', 'о', 'об', 'не', 'но', 'а',
                     'же', 'ли', 'бы', 'вот', 'это', 'тот', 'такой', 'какой',
                     'весь', 'все', 'всё', 'он', 'она', 'оно', 'они', 'я', 'ты',
                     'вы', 'мы', 'свой', 'твой', 'ваш', 'наш', 'его', 'её', 'их'}
        
        return [word for word in words if len(word) > 2 and word not in stop_words]
    
    def _load_questions(self):
        try:
            # Проверяем существование файла
            if not os.path.exists(self.csv_file_path):
                logger.error(f"CSV file not found: {self.csv_file_path}")
                # Попробуем альтернативные пути
                alt_paths = [
                    os.path.abspath('reflections.csv'),
                    os.path.join(os.path.dirname(__file__), 'reflections.csv'),
                    os.path.join(os.getcwd(), 'reflections.csv')
                ]
                
                for alt_path in alt_paths:
                    if os.path.exists(alt_path):
                        self.csv_file_path = alt_path
                        logger.info(f"Found CSV file at alternative path: {alt_path}")
                        break
                else:
                    raise FileNotFoundError(f"CSV file not found in any expected location. Tried: {[self.csv_file_path] + alt_paths}")
            
            logger.info(f"Loading questions from: {self.csv_file_path}")
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row.get('privacy_ok', '').lower() != 'true':
                        continue
                    
                    insight_tags = []
                    if row.get('insight_tags'):
                        insight_tags = [tag.strip() for tag in row['insight_tags'].split(',') if tag.strip()]
                    
                    prompt_text = row['prompt_text']
                    required_words = self._extract_words(prompt_text)
                    
                    if len(required_words) < 3:
                        answer_words = self._extract_words(row['answer_text'])
                        required_words.extend(answer_words[:2])
                    
                    required_words = list(set(required_words))[:5]
                    
                    question = ReflectionQuestion(
                        reflection_id=row['reflection_id'],
                        prompt_text=prompt_text,
                        answer_text=row['answer_text'],
                        insight_tags=insight_tags,
                        required_words=required_words
                    )
                    
                    self.questions.append(question)
            
            logger.info(f"Loaded {len(self.questions)} questions from {self.csv_file_path}")
        except Exception as e:
            logger.error(f"Error loading questions from {self.csv_file_path}: {e}")
            raise
    
    def get_questions_by_difficulty(self, difficulty: str, count: int = 5) -> List[ReflectionQuestion]:
        try:
            filtered_questions = self.questions.copy()
            
            if difficulty == 'easy':
                filtered_questions = [q for q in filtered_questions if len(q.required_words) <= 3]
            elif difficulty == 'medium':
                filtered_questions = [q for q in filtered_questions if 3 <= len(q.required_words) <= 4]
            else:
                filtered_questions = [q for q in filtered_questions if len(q.required_words) >= 4]
            
            result = random.sample(filtered_questions, min(count, len(filtered_questions)))
            logger.info(f"Selected {len(result)} questions for difficulty {difficulty}")
            return result
        except Exception as e:
            logger.error(f"Error getting questions by difficulty {difficulty}: {e}")
            return []
    
    def get_all_questions(self) -> List[ReflectionQuestion]:
        return self.questions.copy()
    
    def get_question_by_id(self, reflection_id: str) -> ReflectionQuestion:
        try:
            for question in self.questions:
                if question.reflection_id == reflection_id:
                    return question
            logger.warning(f"Question with ID {reflection_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error getting question by ID {reflection_id}: {e}")
            return None