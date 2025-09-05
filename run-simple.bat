@echo off
chcp 65001 >nul
echo Запуск простой версии Word Catch...
echo.

REM Проверяем наличие HTML файла
if not exist "simple-game.html" (
    echo Ошибка: Файл simple-game.html не найден!
    pause
    exit /b 1
)

echo Открываем игру в браузере...
echo.

REM Открываем HTML файл в браузере по умолчанию
start "" "simple-game.html"

echo Игра открыта в браузере!
echo Для закрытия просто закройте окно браузера.
echo.
pause
