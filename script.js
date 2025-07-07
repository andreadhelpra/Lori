// Global variables
let recognition;
let isListening = false;
let currentPlayer = null;
let currentVideoId = null;
let musicQueue = []; // Array to store all search results
let currentSongIndex = 0; // Index of current song in queue
let isAutoPlayEnabled = true; // Whether to auto-play next song
let lastSearchQuery = ''; // Store the last search query for infinite playback
let searchVariations = []; // Store search variations for infinite playback
let progressUpdateInterval = null; // Interval for updating progress
let isDragging = false; // Whether user is dragging the slider
let songDuration = 0; // Duration of current song in seconds

// DOM elements
const voiceBtn = document.getElementById('voiceBtn');
const transcript = document.getElementById('transcript');
const transcriptText = document.getElementById('transcriptText');
const musicSection = document.getElementById('musicSection');
const songTitle = document.getElementById('songTitle');
const artist = document.getElementById('artist');
const playBtn = document.getElementById('playBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressSlider = document.getElementById('progressSlider');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const progressFill = document.getElementById('progressFill');
const searchResults = document.getElementById('searchResults');
const resultsList = document.getElementById('resultsList');
const status = document.getElementById('status');
const error = document.getElementById('error');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(function(registration) {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    }

    // Check for speech recognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError('Kërkimi me zë nuk është i disponueshëm në këtë pajisje.');
        return;
    }

    setupSpeechRecognition();
    setupEventListeners();
    
    // Load YouTube iframe API
    loadYouTubeAPI();
}

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.lang = 'sq-AL'; // Albanian
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        isListening = true;
        voiceBtn.classList.add('listening');
        voiceBtn.querySelector('.voice-text').textContent = 'Po dëgjoj... Flisni tani!';
        
        // Change to recording icon
        const micIcon = voiceBtn.querySelector('.mic-icon svg');
        micIcon.innerHTML = `
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="1.5"/>
        `;
        
        showTranscript();
        hideError();
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        transcriptText.textContent = finalTranscript || interimTranscript;
        
        if (finalTranscript) {
            processVoiceCommand(finalTranscript);
        }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        resetVoiceButton();
        
        // Don't show error for permission-related issues if we just handled them
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            return; // These are handled by our permission system
        }
        
        let errorMessage = 'Gabim në dëgjimin e zërit.';
        switch(event.error) {
            case 'no-speech':
                errorMessage = 'Nuk dëgjova asgjë. Provo përsëri.';
                break;
            case 'network':
                errorMessage = 'Gabim në rrjet. Kontrollo lidhjen.';
                break;
            case 'aborted':
                return; // Don't show error for user-initiated stops
            default:
                errorMessage = 'Gabim në dëgjimin e zërit. Provo përsëri.';
                break;
        }
        showError(errorMessage);
    };

    recognition.onend = function() {
        isListening = false;
        resetVoiceButton();
    };
}

function setupEventListeners() {
    voiceBtn.addEventListener('click', handleVoiceButtonClick);
    playBtn.addEventListener('click', togglePlayback);
    backBtn.addEventListener('click', playPreviousSong);
    forwardBtn.addEventListener('click', playNextSongManually);
    
    // Progress slider events
    progressSlider.addEventListener('input', onProgressSliderInput);
    progressSlider.addEventListener('mousedown', onProgressSliderStart);
    progressSlider.addEventListener('mouseup', onProgressSliderEnd);
    progressSlider.addEventListener('touchstart', onProgressSliderStart);
    progressSlider.addEventListener('touchend', onProgressSliderEnd);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(event) {
    // Only handle shortcuts when not typing in input fields or dragging slider
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || isDragging) {
        return;
    }
    
    switch(event.key) {
        case ' ':
            event.preventDefault();
            togglePlayback();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            playPreviousSong();
            break;
        case 'ArrowRight':
            event.preventDefault();
            playNextSongManually();
            break;
    }
}

// Progress slider functions
function onProgressSliderInput(event) {
    if (!currentPlayer || !isDragging) return;
    
    const percentage = event.target.value;
    updateProgressDisplay(percentage);
}

function onProgressSliderStart(event) {
    isDragging = true;
    stopProgressUpdates();
}

function onProgressSliderEnd(event) {
    if (!currentPlayer) {
        isDragging = false;
        return;
    }
    
    const percentage = event.target.value;
    const newTime = (percentage / 100) * songDuration;
    
    currentPlayer.seekTo(newTime, true);
    isDragging = false;
    startProgressUpdates();
}

function updateProgressDisplay(percentage) {
    const currentSeconds = (percentage / 100) * songDuration;
    const currentTime = formatTime(currentSeconds);
    
    currentTimeDisplay.textContent = currentTime;
    progressFill.style.width = percentage + '%';
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startProgressUpdates() {
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
    }
    
    progressUpdateInterval = setInterval(() => {
        if (!currentPlayer || isDragging) return;
        
        try {
            const currentTime = currentPlayer.getCurrentTime();
            const duration = currentPlayer.getDuration();
            
            if (duration > 0 && currentTime >= 0) {
                songDuration = duration; // Update duration in case it changed
                const percentage = Math.min((currentTime / duration) * 100, 100);
                
                if (!isDragging) {
                    progressSlider.value = percentage;
                    updateProgressDisplay(percentage);
                }
                
                // Update total time display if it's still 0:00
                if (totalTimeDisplay.textContent === '0:00') {
                    totalTimeDisplay.textContent = formatTime(duration);
                }
            }
        } catch (error) {
            console.log('Error updating progress:', error);
        }
    }, 500); // Update every 500ms for smoother progress
}

function stopProgressUpdates() {
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
        progressUpdateInterval = null;
    }
}

function resetProgress() {
    progressSlider.value = 0;
    progressFill.style.width = '0%';
    currentTimeDisplay.textContent = '0:00';
    totalTimeDisplay.textContent = '0:00';
    songDuration = 0;
    stopProgressUpdates();
}

async function checkMicrophonePermission() {
    try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        return result.state === 'granted';
    } catch (error) {
        // Fallback for browsers that don't support permissions API
        return false;
    }
}

async function requestMicrophonePermission() {
    try {
        // Request microphone permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately, we just needed permission
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        showError('Ju lutem lejoni përdorimin e mikrofonit për të përdorur kërkimin me zë.');
        return false;
    }
}

async function handleVoiceButtonClick() {
    // Hide any previous errors
    hideError();
    
    if (isListening) {
        recognition.stop();
        return;
    }
    
    // Check if we already have permission
    const hasPermission = await checkMicrophonePermission();
    
    if (!hasPermission) {
        // Request permission first
        const granted = await requestMicrophonePermission();
        if (!granted) {
            return; // Permission denied, error already shown
        }
    }
    
    // Start speech recognition
    toggleVoiceRecognition();
}

function toggleVoiceRecognition() {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function resetVoiceButton() {
    voiceBtn.classList.remove('listening');
    voiceBtn.querySelector('.voice-text').textContent = 'Thuaj çfarë muzike do të dëgjosh';
    
    // Reset to normal microphone icon
    const micIcon = voiceBtn.querySelector('.mic-icon svg');
    micIcon.innerHTML = `
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="1.5"/>
        <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="1.5"/>
    `;
}

function processVoiceCommand(command) {
    // Reset queue for new search
    musicQueue = [];
    currentSongIndex = 0;
    isAutoPlayEnabled = true;
    lastSearchQuery = command;
    
    // Generate search variations for infinite playback
    searchVariations = generateSearchVariations(command);
    
    showStatus('Po kërkoj muzikën...');
    searchMusic(command);
}

function generateSearchVariations(originalQuery) {
    const variations = [originalQuery];
    
    // Add variations based on the original query
    if (originalQuery.toLowerCase().includes('shqip')) {
        variations.push('muzikë shqiptare', 'këngë shqipe', 'albanian music', 'folk shqiptar');
    } else if (originalQuery.toLowerCase().includes('italian')) {
        variations.push('italian music', 'musica italiana', 'italian songs', 'italian hits');
    } else {
        // Add generic variations
        variations.push(
            originalQuery + ' music',
            originalQuery + ' songs',
            originalQuery + ' hits',
            originalQuery + ' best',
            originalQuery + ' popular',
            'similar to ' + originalQuery,
            originalQuery + ' playlist',
            originalQuery + ' mix'
        );
    }
    
    return variations;
}

async function searchMusic(query) {
    try {
        // Use the deployed music proxy server to search for real YouTube Music results
        const proxyUrl = 'https://lori-backend.onrender.com/search';
        const searchUrl = `${proxyUrl}?q=${encodeURIComponent(query)}`;
        
        console.log('Searching for:', query);
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const results = await response.json();
        
        if (results.length > 0) {
            hideStatus();
            // Store all results in the queue
            musicQueue = results;
            currentSongIndex = 0;
            isAutoPlayEnabled = true;
            
            // Always auto-play the first result
            showStatus('Po luaj këngën më të mirë...');
            playMusic(results[0]);
            
            // If there are multiple results, show them as alternatives
            if (results.length > 1) {
                setTimeout(() => {
                    showSearchResults(results.slice(1)); // Show remaining results as alternatives
                }, 1000); // Show alternatives after 1 second
            }
        } else {
            showError('Nuk u gjet muzikë për "' + query + '". Provo përsëri.');
        }
    } catch (err) {
        console.error('Search error:', err);
        console.log('Trying fallback mock data...');
        
        // Fallback to mock data if proxy is not available
        try {
            const fallbackResults = await searchYouTubeFallback(query);
            if (fallbackResults.length > 0) {
                hideStatus();
                showStatus('Duke përdorur të dhëna demo (serveri i muzikës nuk është i disponueshëm)');
                setTimeout(() => {
                    hideStatus();
                    // Store all results in the queue
                    musicQueue = fallbackResults;
                    currentSongIndex = 0;
                    isAutoPlayEnabled = true;
                    
                    // Always auto-play the first result
                    playMusic(fallbackResults[0]);
                    
                    // If there are multiple results, show them as alternatives
                    if (fallbackResults.length > 1) {
                        setTimeout(() => {
                            showSearchResults(fallbackResults.slice(1)); // Show remaining results as alternatives
                        }, 1000); // Show alternatives after 1 second
                    }
                }, 2000);
            } else {
                showError('Gabim në kërkim. Sigurohu që serveri i muzikës është duke punuar.');
            }
        } catch (fallbackErr) {
            console.error('Fallback error:', fallbackErr);
            showError('Gabim në kërkim. Provo përsëri.');
        }
    }
}

// Fallback mock data if proxy is not available
async function searchYouTubeFallback(query) {
    console.log('Using fallback mock data for:', query);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock results with more realistic data based on the query
    const mockResults = [
        {
            videoId: 'dQw4w9WgXcQ',
            title: query.includes('shqip') ? 'Këngë Shqiptare - ' + query : query + ' - Official Music Video',
            artist: query.includes('shqip') ? 'Artist Shqiptar' : 'Artist',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        },
        {
            videoId: 'L_jWHffIx5E',
            title: query + ' - Live Performance',
            artist: 'Live Artist',
            thumbnail: 'https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg'
        }
    ];
    
    return mockResults.slice(0, 2);
}

function showSearchResults(results) {
    hideTranscript();
    
    resultsList.innerHTML = '';
    
    // Add a header for alternative options
    const headerItem = document.createElement('div');
    headerItem.className = 'result-header';
    headerItem.innerHTML = '<h4>Opsione të tjera:</h4>';
    resultsList.appendChild(headerItem);
    
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.setAttribute('role', 'listitem');
        resultItem.setAttribute('tabindex', '0');
        resultItem.setAttribute('aria-label', `Luaj ${result.title} nga ${result.artist}`);
        resultItem.innerHTML = `
            <div class="result-title">${result.title}</div>
            <div class="result-artist">${result.artist}</div>
        `;
        
        // Add click and keyboard event listeners
        const playHandler = () => {
            // Find the index of this song in the queue and play from there
            const songIndex = musicQueue.findIndex(song => song.videoId === result.videoId);
            if (songIndex !== -1) {
                currentSongIndex = songIndex;
                playMusic(result);
            } else {
                // If not in queue, add it and play
                musicQueue.push(result);
                currentSongIndex = musicQueue.length - 1;
                playMusic(result);
            }
        };
        resultItem.addEventListener('click', playHandler);
        resultItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playHandler();
            }
        });
        
        resultsList.appendChild(resultItem);
    });
    
    searchResults.classList.remove('hidden');
}

function playMusic(musicData) {
    currentVideoId = musicData.videoId;
    songTitle.textContent = musicData.title;
    artist.textContent = musicData.artist;
    
    // Add queue position indicator if there are multiple songs
    if (musicQueue.length > 1) {
        const queuePosition = currentSongIndex + 1;
        artist.textContent = `${musicData.artist} (${queuePosition}/${musicQueue.length})`;
    }
    
    // Reset progress for new song
    resetProgress();
    
    hideSearchResults();
    hideTranscript();
    musicSection.classList.remove('hidden');
    
    // Load the video in the YouTube player
    if (currentPlayer) {
        currentPlayer.loadVideoById(currentVideoId);
    } else {
        createYouTubePlayer(currentVideoId);
    }
    
    updatePlayButton(true);
    updateNavigationButtons();
    showStatus('Po ngarkohet muzika...');
    
    // Set a timeout to auto-skip if song doesn't start playing within 10 seconds
    setTimeout(() => {
        if (currentPlayer && currentPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
            console.log('Song failed to start, skipping to next...');
            showStatus('Kënga nuk u ngarkua. Po kërkoj një tjetër...');
            setTimeout(() => {
                playNextSong();
            }, 1000);
        }
    }, 10000);
}

function playNextSong() {
    if (currentSongIndex < musicQueue.length - 1 && isAutoPlayEnabled) {
        currentSongIndex++;
        const nextSong = musicQueue[currentSongIndex];
        showStatus(`Po luaj: ${nextSong.title}`);
        playMusic(nextSong);
    } else if (currentSongIndex >= musicQueue.length - 1 && isAutoPlayEnabled) {
        // All songs in current queue played, search for more similar music
        showStatus('Po kërkoj më shumë muzikë të ngjashme...');
        searchForMoreMusic();
    }
}

async function searchForMoreMusic() {
    try {
        // Pick a random variation from our search variations
        const randomVariation = searchVariations[Math.floor(Math.random() * searchVariations.length)];
        
        console.log('Searching for more music with:', randomVariation);
        
        // Also add some random popular music terms to keep it fresh
        const popularTerms = ['hits', 'best of', 'popular', 'top songs', 'greatest hits', 'mix', 'playlist'];
        const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];
        const enhancedQuery = `${randomVariation} ${randomTerm}`;
        
        console.log('Enhanced query:', enhancedQuery);
        
        const proxyUrl = 'http://localhost:4000/search';
        const searchUrl = `${proxyUrl}?q=${encodeURIComponent(enhancedQuery)}`;
        
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const results = await response.json();
        
        if (results.length > 0) {
            // Filter out songs we've already played
            const newSongs = results.filter(song => 
                !musicQueue.some(queuedSong => queuedSong.videoId === song.videoId)
            );
            
            if (newSongs.length > 0) {
                // Add new songs to the queue
                musicQueue.push(...newSongs);
                
                // Continue playing
                currentSongIndex++;
                const nextSong = musicQueue[currentSongIndex];
                showStatus(`Po luaj: ${nextSong.title}`);
                playMusic(nextSong);
                
                console.log(`Added ${newSongs.length} new songs to queue. Total queue: ${musicQueue.length}`);
            } else {
                // All songs were duplicates, try a different variation
                console.log('All songs were duplicates, trying different search...');
                setTimeout(() => searchForMoreMusic(), 2000);
            }
        } else {
            // No results, try a different variation
            console.log('No results, trying different search...');
            setTimeout(() => searchForMoreMusic(), 2000);
        }
    } catch (error) {
        console.error('Error searching for more music:', error);
        // Fallback: try again with a different variation after a delay
        setTimeout(() => searchForMoreMusic(), 5000);
    }
}

function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube API callback
window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube API ready');
};

function createYouTubePlayer(videoId) {
    // Create hidden iframe for audio playback
    const playerDiv = document.createElement('div');
    playerDiv.id = 'youtube-player';
    playerDiv.style.display = 'none';
    document.body.appendChild(playerDiv);
    
    currentPlayer = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        videoId: videoId,
        playerVars: {
            autoplay: 1,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            loop: 1,
            fs: 0,
            cc_load_policy: 0,
            iv_load_policy: 3
        },
        events: {
            onReady: function(event) {
                event.target.playVideo();
                hideStatus();
                
                // Get song duration and start progress updates
                setTimeout(() => {
                    try {
                        songDuration = currentPlayer.getDuration();
                        totalTimeDisplay.textContent = formatTime(songDuration);
                        startProgressUpdates();
                    } catch (error) {
                        console.log('Error getting duration:', error);
                        totalTimeDisplay.textContent = '0:00';
                    }
                }, 1000);
            },
            onStateChange: function(event) {
                if (event.data === YT.PlayerState.PLAYING) {
                    updatePlayButton(true);
                    hideStatus();
                    startProgressUpdates();
                } else if (event.data === YT.PlayerState.PAUSED) {
                    updatePlayButton(false);
                    stopProgressUpdates();
                } else if (event.data === YT.PlayerState.ENDED) {
                    updatePlayButton(false);
                    stopProgressUpdates();
                    // Auto-play next song when current song ends
                    setTimeout(() => {
                        playNextSong();
                    }, 1000); // Small delay before next song
                }
            },
            onError: function(event) {
                console.error('YouTube player error:', event.data);
                
                // Handle different types of YouTube errors
                let errorMessage = 'Gabim në luajtjen e muzikës.';
                switch(event.data) {
                    case 2:
                        errorMessage = 'Video nuk u gjet. Po kërkoj një tjetër...';
                        break;
                    case 5:
                        errorMessage = 'Video nuk mund të luhet. Po kërkoj një tjetër...';
                        break;
                    case 100:
                        errorMessage = 'Video nuk është i disponueshëm. Po kërkoj një tjetër...';
                        break;
                    case 101:
                    case 150:
                        errorMessage = 'Video nuk mund të luhet në këtë pajisje. Po kërkoj një tjetër...';
                        break;
                    default:
                        errorMessage = 'Gabim në luajtjen e muzikës. Po kërkoj një tjetër...';
                }
                
                showStatus(errorMessage);
                
                // Auto-skip to next song after error
                setTimeout(() => {
                    playNextSong();
                }, 2000);
            }
        }
    });
}

function togglePlayback() {
    if (currentPlayer) {
        const state = currentPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            currentPlayer.pauseVideo();
        } else {
            currentPlayer.playVideo();
        }
    }
}

function playPreviousSong() {
    if (currentSongIndex > 0) {
        currentSongIndex--;
        const previousSong = musicQueue[currentSongIndex];
        showStatus(`Po luaj: ${previousSong.title}`);
        playMusic(previousSong);
        updateNavigationButtons();
    }
}

function playNextSongManually() {
    playNextSong();
}

function updateNavigationButtons() {
    // Update back button state
    if (currentSongIndex <= 0) {
        backBtn.disabled = true;
        backBtn.setAttribute('aria-label', 'Nuk ka këngë të mëparshme');
    } else {
        backBtn.disabled = false;
        backBtn.setAttribute('aria-label', 'Kënga e mëparshme');
    }
    
    // Forward button is always enabled since we have infinite playback
    forwardBtn.disabled = false;
    forwardBtn.setAttribute('aria-label', 'Kënga tjetër');
}

function updatePlayButton(isPlaying) {
    const playStatus = document.getElementById('play-status');
    const playIcon = playBtn.querySelector('.play-icon svg');
    
    if (isPlaying) {
        // Change to pause icon
        playIcon.innerHTML = `<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>`;
        playBtn.querySelector('.play-text').textContent = 'Ndalë';
        playBtn.setAttribute('aria-label', 'Ndalë muzikën');
        if (playStatus) playStatus.textContent = 'Muzika po luhet';
    } else {
        // Change to play icon
        playIcon.innerHTML = `<polygon points="5,3 19,12 5,21" fill="currentColor"/>`;
        playBtn.querySelector('.play-text').textContent = 'Luaj';
        playBtn.setAttribute('aria-label', 'Luaj muzikën');
        if (playStatus) playStatus.textContent = 'Muzika është ndalur';
    }
}

// Helper functions
function showTranscript() {
    transcript.classList.remove('hidden');
}

function hideTranscript() {
    transcript.classList.add('hidden');
}

function showSearchResultsSection() {
    searchResults.classList.remove('hidden');
}

function hideSearchResults() {
    searchResults.classList.add('hidden');
}

function showStatus(message) {
    status.textContent = message;
    status.classList.remove('hidden');
    hideError();
}

function hideStatus() {
    status.classList.add('hidden');
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    hideStatus();
}

function hideError() {
    error.classList.add('hidden');
}

// Handle page visibility for better UX
document.addEventListener('visibilitychange', function() {
    if (document.hidden && currentPlayer) {
        // Keep playing when page is hidden (background)
        console.log('Page hidden, music continues playing');
    }
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', function(e) {
    if (currentPlayer && currentPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
        e.preventDefault();
        e.returnValue = '';
    }
}); 