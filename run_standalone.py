#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для запуска standalone версии игры
"""
import os
import sys
import webbrowser
import subprocess

def check_csv_files():
    """Проверяет наличие CSV файлов"""
    csv_files = ['reflections.csv', 'prompts.csv']
    missing_files = []
    
    for file in csv_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Отсутствуют файлы: {', '.join(missing_files)}")
        return False
    
    print("✓ Все CSV файлы найдены")
    return True

def convert_csv_to_js():
    """Конвертирует CSV в JavaScript данные"""
    try:
        result = subprocess.run([sys.executable, 'csv_to_js.py'], 
                              capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode == 0:
            print("✓ CSV данные успешно конвертированы в JavaScript")
            return True
        else:
            print(f"❌ Ошибка конвертации: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Ошибка запуска конвертера: {e}")
        return False

def open_in_browser():
    """Открывает игру в браузере"""
    html_file = os.path.abspath('standalone-game.html')
    
    if not os.path.exists(html_file):
        print(f"❌ Файл {html_file} не найден!")
        return False
    
    try:
        webbrowser.open(f'file://{html_file}')
        print(f"✓ Игра открыта в браузере: {html_file}")
        return True
    except Exception as e:
        print(f"❌ Ошибка открытия браузера: {e}")
        return False

def main():
    """Основная функция"""
    print("=== Запуск Standalone версии Word Catch ===")
    print()
    
    # Проверяем CSV файлы
    if not check_csv_files():
        print("\n❌ Не все CSV файлы найдены. Убедитесь, что файлы reflections.csv и prompts.csv находятся в текущей папке.")
        return 1
    
    # Конвертируем CSV в JavaScript
    if not convert_csv_to_js():
        print("\n❌ Не удалось конвертировать CSV данные")
        return 1
    
    # Открываем в браузере
    if not open_in_browser():
        print("\n❌ Не удалось открыть игру в браузере")
        print(f"Попробуйте открыть файл вручную: {os.path.abspath('standalone-game.html')}")
        return 1
    
    print("\n✅ Игра запущена! Наслаждайтесь игрой!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
