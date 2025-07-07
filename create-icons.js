const fs = require('fs');
const path = require('path');

// Simple script to create basic icon files
// Since we can't easily generate PNG files without external libraries,
// we'll create a simple placeholder approach

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

const createPlaceholderIcon = (size) => {
    // Create a simple SVG placeholder that can be used as a fallback
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" fill="#4A90E2" stroke="#2E5B9A" stroke-width="4"/>
        <text x="${size/2}" y="${size/2 + 10}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size/8}" font-weight="bold">🎵</text>
        <text x="${size/2}" y="${size/2 + 30}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size/12}">Lori</text>
    </svg>`;
    
    return svg;
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// Create placeholder icon files
iconSizes.forEach(size => {
    const svgContent = createPlaceholderIcon(size);
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, svgContent);
    console.log(`Created ${filename}`);
});

// Create a basic favicon.ico equivalent
const faviconSvg = createPlaceholderIcon(32);
fs.writeFileSync(path.join(__dirname, 'favicon.svg'), faviconSvg);
console.log('Created favicon.svg');

console.log('\n✅ Icon files created successfully!');
console.log('🔧 To convert SVG to PNG icons, you can use:');
console.log('   - Online converters like https://convertio.co/svg-png/');
console.log('   - ImageMagick: convert icon.svg icon.png');
console.log('   - Inkscape: inkscape --export-png=icon.png icon.svg');
console.log('\n📱 For now, the SVG icons will work as placeholders in most browsers.'); 