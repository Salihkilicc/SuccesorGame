const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'features', 'life', 'components', 'NightOut');

function replaceExtraF(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceExtraF(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Replace any string '#FFFFFFFFF' with '#FFFFFF'
            content = content.replace(/#FFFFFFFFF/g, '#FFFFFF');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed ' + fullPath);
            }
        }
    }
}

replaceExtraF(dir);
