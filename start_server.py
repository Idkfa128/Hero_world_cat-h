#!/usr/bin/env python3
"""
Улучшенный скрипт запуска сервера с проверкой путей
"""
import os
import sys
import subprocess
import time

def check_dependencies():
    """Проверяет наличие необходимых зависимостей"""
    try:
        import flask
        import flask_cors
        print("✓ Flask и Flask-CORS установлены")
        return True
    except ImportError as e:
        print(f"❌ Отсутствует зависимость: {e}")
        print("Установите зависимости: pip install flask flask-cors")
        return False

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

def start_server():
    """Запускает сервер"""
    print("\n=== Запуск сервера ===")
    print("Сервер будет доступен по адресу: http://127.0.0.1:5000")
    print("Для остановки нажмите Ctrl+C")
    print()
    
    try:
        # Запускаем app.py
        subprocess.run([sys.executable, 'app.py'], check=True)
    except KeyboardInterrupt:
        print("\n\nСервер остановлен пользователем")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Ошибка запуска сервера: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        return False
    
    return True

def main():
    print("=== Проверка системы ===")
    
    # Проверяем зависимости
    if not check_dependencies():
        return 1
    
    # Проверяем CSV файлы
    if not check_csv_files():
        return 1
    
    # Запускаем сервер
    if start_server():
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
