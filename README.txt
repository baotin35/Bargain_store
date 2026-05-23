============================================
  Mom and Pop - Store Management System
============================================

HOW TO RUN
----------
1. Double-click  start.bat
2. A browser will open automatically at http://localhost:3000
3. Login with:  admin / admin123

IMPORTANT: Keep the black window open while using the app.
Closing it will stop the server.


FILES IN THIS PACKAGE
---------------------
start.bat       - Launch the app (double-click this)
reset-data.bat  - Wipe all data and restore sample data
node-runtime\   - Bundled Node.js (no install needed)
data\           - Your store data (Excel files)
public\         - App pages (do not delete)
routes\         - Backend logic (do not delete)


YOUR DATA
---------
All your data is stored in the  data\  folder as Excel files.
You can open them in Microsoft Excel to view or back up your data.
To back up: copy the entire  data\  folder to a USB drive.


MOVING TO ANOTHER COMPUTER
---------------------------
1. Copy the entire Mom-and-Pop folder to the new computer
2. Double-click start.bat
3. Done — no installation needed


CHANGING YOUR PASSWORD
----------------------
Currently passwords are stored in data\users.xlsx
Open that file in Excel and update the password column.


PORT CONFLICT
-------------
If you see an error about port 3000 already in use:
- Close any other copy of the app that may be running
- Or restart your computer and try again


============================================
