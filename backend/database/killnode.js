require('dotenv').config();
const { execSync } = require('child_process');

try {
    console.log('Force killing node.js to release SQLite lock...');
    execSync('taskkill /F /IM node.exe');
} catch(e) {
    console.log('PIDs already clear');
}
