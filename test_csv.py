#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Простой тест для проверки работы с CSV файлами
"""
import os
import sys

def test_csv_loading():
    """Тестирует загрузку CSV файлов"""
    print("=== Тест загрузки CSV файлов ===")
    
    # Проверяем текущую директорию
    print(f"Текущая директория: {os.getcwd()}")
    print(f"Файлы в директории: {os.listdir('.')}")
    
    # Проверяем reflections.csv
    reflections_path = 'reflections.csv'
    if os.path.exists(reflections_path):
        print(f"✓ reflections.csv найден: {os.path.abspath(reflections_path)}")
        
        # Пробуем прочитать файл
        try:
            with open(reflections_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                print(f"  Строк в файле: {len(lines)}")
                if len(lines) > 0:
                    print(f"  Первая строка: {lines[0].strip()}")
        except Exception as e:
            print(f"  ❌ Ошибка чтения: {e}")
    else:
        print(f"❌ reflections.csv не найден")
    
    # Проверяем prompts.csv
    prompts_path = 'prompts.csv'
    if os.path.exists(prompts_path):
        print(f"✓ prompts.csv найден: {os.path.abspath(prompts_path)}")
        
        # Пробуем прочитать файл
        try:
            with open(prompts_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                print(f"  Строк в файле: {len(lines)}")
                if len(lines) > 0:
                    print(f"  Первая строка: {lines[0].strip()}")
        except Exception as e:
            print(f"  ❌ Ошибка чтения: {e}")
    else:
        print(f"❌ prompts.csv не найден")
    
    # Тестируем csv_processor
    try:
        from csv_processor import CSVQuestionLoader
        print("\n=== Тест CSVQuestionLoader ===")
        
        loader = CSVQuestionLoader('reflections.csv')
        questions = loader.get_all_questions()
        print(f"Загружено вопросов: {len(questions)}")
        
        if questions:
            first_q = questions[0]
            print(f"Первый вопрос: {first_q.prompt_text[:50]}...")
            print(f"Ответ: {first_q.answer_text[:50]}...")
            print(f"Требуемые слова: {first_q.required_words}")
        
    except Exception as e:
        print(f"❌ Ошибка в CSVQuestionLoader: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_csv_loading()
