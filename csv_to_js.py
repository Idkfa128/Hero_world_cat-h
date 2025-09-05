#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Конвертер CSV файлов в JavaScript данные для standalone версии
"""
import csv
import json
import os
import re

def clean_text(text):
    """Очищает текст от лишних символов"""
    return re.sub(r'[^\w\s]', '', text.lower().strip())

def extract_words(text):
    """Извлекает значимые слова из текста"""
    words = re.findall(r'\b[\w-]+\b', text.lower())
    stop_words = {'что', 'как', 'где', 'когда', 'почему', 'зачем', 'кто', 
                 'чтобы', 'если', 'то', 'и', 'в', 'на', 'с', 'по', 'о', 'об',
                 'из', 'от', 'до', 'для', 'у', 'о', 'об', 'не', 'но', 'а',
                 'же', 'ли', 'бы', 'вот', 'это', 'тот', 'такой', 'какой',
                 'весь', 'все', 'всё', 'он', 'она', 'оно', 'они', 'я', 'ты',
                 'вы', 'мы', 'свой', 'твой', 'ваш', 'наш', 'его', 'её', 'их'}
    
    return [word for word in words if len(word) > 2 and word not in stop_words]

def convert_reflections_csv():
    """Конвертирует reflections.csv в JavaScript данные"""
    reflections_path = 'reflections.csv'
    
    if not os.path.exists(reflections_path):
        print(f"❌ Файл {reflections_path} не найден!")
        return None
    
    reflections = []
    
    try:
        with open(reflections_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Пропускаем записи без разрешения
                if row.get('privacy_ok', '').lower() != 'true':
                    continue
                
                # Извлекаем теги
                insight_tags = []
                if row.get('insight_tags'):
                    insight_tags = [tag.strip() for tag in row['insight_tags'].split(',') if tag.strip()]
                
                # Извлекаем слова из ответа
                answer_text = row['answer_text']
                required_words = extract_words(answer_text)
                
                # Если слов мало, добавляем из вопроса
                if len(required_words) < 3:
                    prompt_words = extract_words(row['prompt_text'])
                    required_words.extend(prompt_words[:2])
                
                # Ограничиваем количество слов
                required_words = list(set(required_words))[:5]
                
                reflection = {
                    'reflection_id': row['reflection_id'],
                    'prompt_text': row['prompt_text'],
                    'answer_text': answer_text,
                    'insight_tags': insight_tags,
                    'required_words': required_words
                }
                
                reflections.append(reflection)
        
        print(f"✓ Обработано {len(reflections)} записей из reflections.csv")
        return reflections
        
    except Exception as e:
        print(f"❌ Ошибка при обработке {reflections_path}: {e}")
        return None

def convert_prompts_csv():
    """Конвертирует prompts.csv в JavaScript данные"""
    prompts_path = 'prompts.csv'
    
    if not os.path.exists(prompts_path):
        print(f"❌ Файл {prompts_path} не найден!")
        return None
    
    prompts = []
    
    try:
        with open(prompts_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                prompt = {
                    'prompt_id': row['prompt_id'],
                    'text': row['text'],
                    'category': row['category']
                }
                prompts.append(prompt)
        
        print(f"✓ Обработано {len(prompts)} записей из prompts.csv")
        return prompts
        
    except Exception as e:
        print(f"❌ Ошибка при обработке {prompts_path}: {e}")
        return None

def generate_js_data(reflections, prompts):
    """Генерирует JavaScript код с данными"""
    js_code = f"""
        // Автоматически сгенерированные данные из CSV файлов
        const REFLECTIONS_DATA = {json.dumps(reflections, ensure_ascii=False, indent=2)};
        
        const PROMPTS_DATA = {json.dumps(prompts, ensure_ascii=False, indent=2)};
    """
    return js_code

def update_standalone_html():
    """Обновляет standalone-game.html с новыми данными"""
    reflections = convert_reflections_csv()
    prompts = convert_prompts_csv()
    
    if not reflections or not prompts:
        print("❌ Не удалось загрузить данные из CSV файлов")
        return False
    
    # Генерируем JavaScript данные
    js_data = generate_js_data(reflections, prompts)
    
    # Читаем текущий HTML файл
    html_path = 'standalone-game.html'
    if not os.path.exists(html_path):
        print(f"❌ Файл {html_path} не найден!")
        return False
    
    try:
        with open(html_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Заменяем старые данные на новые
        # Ищем блок с REFLECTIONS_DATA и заменяем его
        pattern = r'const REFLECTIONS_DATA = \[.*?\];'
        new_content = re.sub(pattern, js_data, content, flags=re.DOTALL)
        
        # Записываем обновленный файл
        with open(html_path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        
        print(f"✓ Обновлен файл {html_path} с данными из CSV")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при обновлении {html_path}: {e}")
        return False

def main():
    """Основная функция"""
    print("=== Конвертер CSV в JavaScript данные ===")
    
    if update_standalone_html():
        print("\n✅ Конвертация завершена успешно!")
        print("Теперь можно открыть standalone-game.html в браузере")
    else:
        print("\n❌ Конвертация не удалась")

if __name__ == "__main__":
    main()
