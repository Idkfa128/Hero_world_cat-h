#!/usr/bin/env python3
"""
Скрипт для проверки путей к CSV файлам
"""
import os
import sys

def check_csv_files():
    """Проверяет существование CSV файлов в различных возможных местах"""
    print("=== Проверка CSV файлов ===")
    
    # Возможные пути к файлам
    possible_paths = [
        'reflections.csv',
        'prompts.csv',
        os.path.join(os.path.dirname(__file__), 'reflections.csv'),
        os.path.join(os.path.dirname(__file__), 'prompts.csv'),
        os.path.abspath('reflections.csv'),
        os.path.abspath('prompts.csv'),
        os.path.join(os.getcwd(), 'reflections.csv'),
        os.path.join(os.getcwd(), 'prompts.csv')
    ]
    
    found_files = {}
    
    for path in possible_paths:
        if os.path.exists(path):
            filename = os.path.basename(path)
            if filename not in found_files:
                found_files[filename] = path
                print(f"✓ {filename}: {os.path.abspath(path)}")
    
    # Проверяем, что оба файла найдены
    if 'reflections.csv' not in found_files:
        print("❌ reflections.csv не найден!")
        return False
    
    if 'prompts.csv' not in found_files:
        print("❌ prompts.csv не найден!")
        return False
    
    print("\n=== Все файлы найдены ===")
    return True

def main():
    print(f"Текущая рабочая директория: {os.getcwd()}")
    print(f"Директория скрипта: {os.path.dirname(__file__)}")
    print()
    
    if check_csv_files():
        print("\n✅ Все CSV файлы найдены. Можно запускать сервер.")
        return 0
    else:
        print("\n❌ Не все CSV файлы найдены. Проверьте расположение файлов.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
