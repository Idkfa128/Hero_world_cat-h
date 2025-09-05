@echo off
chcp 65001 >nul
echo Запуск финальной версии Word Catch...
echo.

REM Проверяем наличие HTML файла
if not exist "final-game.html" (
    echo Ошибка: Файл final-game.html не найден!
    pause
    exit /b 1
)

echo Открываем игру в браузере...
echo Игра будет загружать данные из CSV файлов автоматически.
echo.

REM Открываем HTML файл в браузере по умолчанию
start "" "final-game.html"

echo Игра открыта в браузере!
echo Для закрытия просто закройте окно браузера.
echo.
pause
