@echo off
chcp 65001 >nul
echo Запуск Word Catch...
echo.

REM Проверяем наличие HTML файла
if not exist "index.html" (
    echo Ошибка: Файл index.html не найден!
    pause
    exit /b 1
)

echo Открываем игру в браузере...
echo Игра автоматически загрузит данные из CSV файлов.
echo.

REM Открываем HTML файл в браузере по умолчанию
start "" "index.html"

echo Игра открыта в браузере!
echo Для закрытия просто закройте окно браузера.
echo.
pause
