const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'features', 'life', 'components', 'NightOut');

const palette = {
    black: '#000000',
    navy: '#1A1A2E',
    lila: '#C8B6FF',
    orange: '#FF9E00',
    blue: '#4CC9F0',
    white: '#FFFFFF'
};

function recursivelyReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            recursivelyReplace(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // 1. Replace all outer/background blacks with the pure black if not already
            // Actually, any #0a0a0c, #1a0b2e, #1a1a1a, #1a1a20, #252525, #2a2a2a, #1c1c1e goes to Navy (#1A1A2E)
            content = content.replace(/#0a0a0c/gi, palette.navy);
            content = content.replace(/#1a1a1a/gi, palette.navy);
            content = content.replace(/#1a0b2e/gi, palette.navy);
            content = content.replace(/#1a1a20/gi, palette.navy);
            content = content.replace(/#252525/gi, palette.navy);
            content = content.replace(/#2a2a2a/gi, palette.navy);
            content = content.replace(/#1c1c1e/gi, palette.navy);
            content = content.replace(/#1F2937/gi, palette.navy);
            content = content.replace(/#111827/gi, palette.navy);
            content = content.replace(/#374151/gi, palette.navy);

            // 2. Replace Magentas/Purples with Lila (#C8B6FF)
            content = content.replace(/#ff00ff/gi, palette.lila);
            content = content.replace(/#8B5CF6/gi, palette.lila);
            content = content.replace(/#9D00FF/gi, palette.lila); // Tokyo club

            // 3. Replace Cyans/Light Blues with Bright Blue (#4CC9F0)
            content = content.replace(/#00ffff/gi, palette.blue);
            content = content.replace(/#3B82F6/gi, palette.blue);
            content = content.replace(/#1E90FF/gi, palette.blue);
            content = content.replace(/#87CEEB/gi, palette.blue);

            // 4. Replace Reds/Oranges/Golds/Greens with Neon Orange (#FF9E00) or Blue if appropriate.
            // Action colors -> Orange
            content = content.replace(/#ff0000/gi, palette.orange);
            content = content.replace(/#ff4444/gi, palette.orange);
            content = content.replace(/#FF5733/gi, palette.orange);
            content = content.replace(/#DC143C/gi, palette.orange);
            content = content.replace(/#FF6B6B/gi, palette.orange);
            content = content.replace(/#F59E0B/gi, palette.orange);
            content = content.replace(/#10B981/gi, palette.blue); // Greens to Blue
            content = content.replace(/#00ff00/gi, palette.blue); // Greens to Blue
            content = content.replace(/#001a00/gi, palette.navy); // Dark green bg -> Navy
            content = content.replace(/#1a0000/gi, palette.navy); // Dark red bg -> Navy

            // 5. Replace subtle grays (#333, #444, #666, #888, #999) used as texts or borders
            // Borders (#333, #444) -> Lila or Blue. Since Lila is main accent, let's use Lila for borders
            content = content.replace(/borderColor: '#333'/g, `borderColor: '${palette.lila}'`);
            content = content.replace(/borderColor: '#444'/g, `borderColor: '${palette.lila}'`);
            content = content.replace(/borderColor: '#374151'/g, `borderColor: '${palette.lila}'`);
            content = content.replace(/borderBottomColor: '#333'/g, `borderBottomColor: '${palette.lila}'`);
            content = content.replace(/backgroundColor: '#333'/g, `backgroundColor: '${palette.navy}'`);

            // Texts (#666, #888, #9CA3AF) -> Blue (#4CC9F0) as secondary info
            content = content.replace(/color: '#666'/g, `color: '${palette.blue}'`);
            content = content.replace(/color: '#888'/g, `color: '${palette.blue}'`);
            content = content.replace(/color: '#999'/g, `color: '${palette.blue}'`);
            content = content.replace(/color: '#9CA3AF'/g, `color: '${palette.blue}'`);
            content = content.replace(/color: '#6B7280'/g, `color: '${palette.blue}'`);
            content = content.replace(/color: '#A0AEC0'/g, `color: '${palette.blue}'`);

            // 6. Replace `theme.colors.primary` inline styles with palette.lila
            content = content.replace(/color: theme\.colors\.primary/g, `color: '${palette.lila}'`);
            content = content.replace(/borderColor: theme\.colors\.primary/g, `borderColor: '${palette.lila}'`);
            content = content.replace(/backgroundColor: theme\.colors\.primary/g, `backgroundColor: '${palette.lila}'`);

            // 7. Make sure White is pure #FFFFFF
            content = content.replace(/#fff/g, palette.white);
            content = content.replace(/#FFF/g, palette.white);
            content = content.replace(/#F3F4F6/g, palette.white);
            content = content.replace(/#F9FAFB/g, palette.white);
            content = content.replace(/#E5E7EB/g, palette.white);

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated ' + fullPath);
            }
        }
    }
}

recursivelyReplace(dir);
