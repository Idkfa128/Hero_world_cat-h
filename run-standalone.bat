@echo off
chcp 65001 >nul
echo Запуск Standalone версии Word Catch...
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

echo Все файлы найдены. Запуск standalone версии...
echo.

python run_standalone.py
pause
