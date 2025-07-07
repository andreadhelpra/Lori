# 🎵 Lori - Muzikë me Zë

A simple, voice-controlled music app designed for Albanian speakers. Built as a Progressive Web App (PWA) for easy installation on mobile devices.

## 🌟 Features

- **Voice Control in Albanian**: Speak naturally in Albanian to search for music
- **Simple Interface**: Large buttons and clear text designed for easy use
- **Progressive Web App**: Installable on your phone like a native app
- **YouTube Integration**: Searches and plays music from YouTube
- **Offline Support**: Core functionality works even without internet
- **Accessibility**: High contrast support and large touch targets

## 🚀 How to Use

1. **Open the app** in your web browser
2. **Allow microphone access** when prompted
3. **Tap the large microphone button** 
4. **Speak your music request** in Albanian, for example:
   - "Dua të dëgjoj muzikë popullore"
   - "Luaj një këngë shqiptare"
   - "Kërko muzikë relaksuese"
5. **Choose from the results** or the app will auto-play the best match
6. **Use the play/pause button** to control playback

## 📱 Installation

### On Mobile (iPhone/Android)
1. Open the app in your browser
2. Look for "Add to Home Screen" or "Install App" option
3. Follow the prompts to install
4. The app will appear on your home screen like a regular app

### On Desktop
1. Open the app in Chrome, Edge, or Firefox
2. Look for the install icon in the address bar
3. Click to install the app

## 🔧 Technical Setup

### Quick Start (Recommended)
To run the app with real YouTube Music search:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start all services:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Go to `https://localhost:3000`
   - Accept the self-signed certificate warning
   - Allow microphone access and start using voice commands!

### Alternative Setup Options

**Option 1: Run servers separately**
```bash
# Terminal 1: Start music proxy
npm run music-proxy

# Terminal 2: Start main app
npm start
```

**Option 2: Basic setup (mock data only)**
Just open `index.html` in a web browser - no additional setup required!

### How It Works
- **Music Proxy Server** (port 4000): Uses unofficial YouTube Music API to search for real songs
- **Main App Server** (port 3000): Serves the PWA with HTTPS for voice recognition
- **Voice Recognition**: Requires HTTPS to work properly

## 🗣️ Voice Commands

The app understands natural Albanian speech. Examples:

- **General**: "Dua të dëgjoj muzikë"
- **Genre**: "Luaj muzikë popullore"
- **Mood**: "Kërko muzikë të qetë"
- **Specific**: "Kërkoji këngët e [artist name]"
- **Language**: "Luaj këngë shqiptare"

## 🎯 Design Philosophy

This app was designed with simplicity and accessibility in mind:

- **Large, clear buttons** for easy tapping
- **High contrast colors** for better visibility
- **Simple workflow** - just tap, speak, and listen
- **Albanian language support** throughout the interface
- **No complex setup** or account creation required

## 🔒 Privacy & Permissions

- **Microphone access**: Required for voice commands
- **No data collection**: Your voice is processed locally
- **No account needed**: Start using immediately
- **Offline capable**: Works without internet after initial load

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Voice Recognition**: Web Speech API
- **Music Source**: YouTube iframe API
- **PWA Features**: Service Worker, Web App Manifest
- **Styling**: CSS Grid, Flexbox, Custom Properties

## 🌐 Browser Support

- **Chrome** (Recommended) - Full features
- **Firefox** - Core features
- **Safari** - Limited voice recognition
- **Edge** - Full features

## 📁 File Structure

```
Lori/
├── index.html          # Main app page
├── style.css           # Styling and responsive design
├── script.js           # App logic and voice recognition
├── manifest.json       # PWA configuration
├── service-worker.js   # Offline functionality
├── music-proxy.js      # Backend proxy for YouTube Music API
├── serve-https.js      # HTTPS server for PWA
├── start-all.js        # Script to start all services
├── package.json        # Node.js dependencies and scripts
├── create-icons.js     # Icon generation script
├── icons/              # App icons
│   └── *.svg           # App icons in various sizes
└── README.md          # This file
```

## 🚀 Future Enhancements

- **Playlist creation**: Save favorite songs
- **Voice-controlled volume**: "Ngrije zërin" / "Ule zërin"
- **Multiple languages**: Support for other languages
- **Local music files**: Play uploaded music files
- **Smart suggestions**: Learn from listening habits

## 🤝 Contributing

This is a personal project for family use, but suggestions for improvements are welcome!

## 📄 License

This project is for personal, non-commercial use only.

## 🙏 Acknowledgments

- Built with love for Albanian speakers
- Uses YouTube for music content
- Designed for elderly and non-technical users
- Inspired by the need for simple, accessible technology

---

**Për çdo pyetje ose ndihmë, kontaktoni zhvilluesin.** 

*For any questions or help, contact the developer.* 