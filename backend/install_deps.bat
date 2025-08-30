@echo off
echo === CrewAI Studio Backend Dependencies Installation ===
echo.

echo 1. Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo 2. Upgrading pip with Tsinghua mirror...
python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple/

echo.
echo 3. Installing dependencies with Tsinghua mirror...
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/

echo.
echo 4. Verifying installation...
pip list

echo.
echo === Installation Complete ===
echo You can now run: python main.py
echo Or run: python start.py
pause