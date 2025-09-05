import csv
import os
from dataclasses import dataclass
from typing import List, Dict, Set
import random
import re

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
        """Очистка текста от лишних символов"""
        return re.sub(r'[^\w\s]', '', text.lower().strip())
    
    def _extract_words(self, text: str) -> List[str]:
        """Извлечение значимых слов из текста"""
        words = re.findall(r'\b[\w-]+\b', text.lower())
        # Фильтруем короткие и служебные слова
        stop_words = {'что', 'как', 'где', 'когда', 'почему', 'зачем', 'кто', 
                     'чтобы', 'если', 'то', 'и', 'в', 'на', 'с', 'по', 'о', 'об',
                     'из', 'от', 'до', 'для', 'у', 'о', 'об', 'не', 'но', 'а',
                     'же', 'ли', 'бы', 'вот', 'это', 'тот', 'такой', 'какой',
                     'весь', 'все', 'всё', 'он', 'она', 'оно', 'они', 'я', 'ты',
                     'вы', 'мы', 'свой', 'твой', 'ваш', 'наш', 'его', 'её', 'их'}
        
        return [word for word in words if len(word) > 2 and word not in stop_words]
    
    def _load_questions(self):
        """Загрузка вопросов из CSV файла"""
        if not os.path.exists(self.csv_file_path):
            raise FileNotFoundError(f"CSV file not found: {self.csv_file_path}")
        
        with open(self.csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Пропускаем записи где privacy_ok не True
                if row.get('privacy_ok', '').lower() != 'true':
                    continue
                
                # Извлекаем insight_tags
                insight_tags = []
                if row.get('insight_tags'):
                    insight_tags = [tag.strip() for tag in row['insight_tags'].split(',') if tag.strip()]
                
                # Создаем список required_words из prompt_text
                prompt_text = row['prompt_text']
                required_words = self._extract_words(prompt_text)
                
                # Если слов мало, добавляем из answer_text
                if len(required_words) < 3:
                    answer_words = self._extract_words(row['answer_text'])
                    required_words.extend(answer_words[:2])
                
                # Убираем дубликаты
                required_words = list(set(required_words))[:5]  # Максимум 5 слов
                
                question = ReflectionQuestion(
                    reflection_id=row['reflection_id'],
                    prompt_text=prompt_text,
                    answer_text=row['answer_text'],
                    insight_tags=insight_tags,
                    required_words=required_words
                )
                
                self.questions.append(question)
    
    def get_questions_by_difficulty(self, difficulty: str, count: int = 5) -> List[ReflectionQuestion]:
        """Получить вопросы с фильтрацией по сложности"""
        # Простая логика сложности: больше слов = сложнее
        filtered_questions = self.questions.copy()
        
        if difficulty == 'easy':
            filtered_questions = [q for q in filtered_questions if len(q.required_words) <= 3]
        elif difficulty == 'medium':
            filtered_questions = [q for q in filtered_questions if 3 <= len(q.required_words) <= 4]
        else:  # hard
            filtered_questions = [q for q in filtered_questions if len(q.required_words) >= 4]
        
        return random.sample(filtered_questions, min(count, len(filtered_questions)))
    
    def get_all_questions(self) -> List[ReflectionQuestion]:
        """Получить все вопросы"""
        return self.questions.copy()
    
    def get_question_by_id(self, reflection_id: str) -> ReflectionQuestion:
        """Найти вопрос по ID"""
        for question in self.questions:
            if question.reflection_id == reflection_id:
                return question
        return None