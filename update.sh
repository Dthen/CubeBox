echo Beginning update process
echo running git pull 
git pull
echo ran git pull. Results are above. 
echo Running npm install
npm install
echo Ran npm install. Results are above.
echo running pm2 restart cubebox.js.
pm2 restart cubebox.js
echo CubeBox process restarted.
echo update process complete.
