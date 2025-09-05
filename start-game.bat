@echo off
echo Запуск игры Word Catch...
echo.

REM Проверяем наличие Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Ошибка: Python не найден. Установите Python 3.6 или выше.
    pause
    exit /b 1
)

REM Проверяем наличие CSV файлов
if not exist "reflections.csv" (
    echo Ошибка: Файл reflections.csv не найден!
    echo Убедитесь, что файл находится в той же папке, что и этот скрипт.
    pause
    exit /b 1
)

if not exist "prompts.csv" (
    echo Ошибка: Файл prompts.csv не найден!
    echo Убедитесь, что файл находится в той же папке, что и этот скрипт.
    pause
    exit /b 1
)

echo Все файлы найдены. Запуск сервера...
echo Сервер будет доступен по адресу: http://127.0.0.1:5000
echo Для остановки нажмите Ctrl+C
echo.

python app.py
pause
