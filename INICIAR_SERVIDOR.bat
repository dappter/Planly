@echo off
echo ====================================
echo Iniciando Servidor Planly
echo ====================================
echo.
cd /d "%~dp0"
set FLASK_APP=app.py
set PORT=8080
echo Servidor iniciando na porta %PORT%...
echo Acesse: http://localhost:8080
echo.
echo Pressione Ctrl+C para parar
echo ====================================
echo.
"c:\Planly - Atualizado\.venv\Scripts\python.exe" app.py
pause
