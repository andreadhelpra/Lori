const express = require('express');
const cors = require('cors');
const YouTube = require('youtube-sr').default;

const app = express();

// Enable CORS for all routes
app.use(cors());

// Search endpoint
app.get('/search', async (req, res) => {
    const query = req.query.q;
    
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    try {
        console.log(`🔍 Searching YouTube for: "${query}"`);
        
        // Search YouTube with the query + "music" to get better music results
        const searchQuery = query + ' music';
        const results = await YouTube.search(searchQuery, { 
            limit: 5,
            type: 'video' 
        });
        
        console.log(`📊 Raw YouTube results: ${results?.length || 0}`);
        if (results && results.length > 0) {
            console.log(`📝 First result: ${results[0]?.title} by ${results[0]?.channel?.name}`);
        }
        
        if (!results || results.length === 0) {
            console.log('❌ No results found');
            return res.json([]);
        }

        // Filter and format results
        const formattedResults = results
            .filter(video => {
                // More flexible filtering - just check if it's a video with an ID
                return video && video.id && video.title;
            })
            .slice(0, 3)
            .map(video => ({
                videoId: video.id,
                title: video.title,
                artist: video.channel?.name || 'Unknown Artist',
                thumbnail: video.thumbnail?.displayThumbnailURL('maxresdefault') || video.thumbnail?.url || '',
                duration: video.durationFormatted || (video.duration ? `${Math.floor(video.duration.seconds / 60)}:${(video.duration.seconds % 60).toString().padStart(2, '0')}` : '3:30')
            }));

        console.log(`✅ Found ${formattedResults.length} YouTube results`);
        res.json(formattedResults);

    } catch (error) {
        console.error('❌ YouTube search error:', error);
        res.status(500).json({ 
            error: 'YouTube search failed', 
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Real YouTube Search',
        timestamp: new Date().toISOString(),
        description: 'Searches all YouTube music videos'
    });
});

// Start server
const port = 4000;
app.listen(port, () => {
    console.log(`🎵 Music proxy server running on http://localhost:${port}`);
    console.log(`🔍 Search endpoint: http://localhost:${port}/search?q=your-query`);
    console.log(`❤️  Health check: http://localhost:${port}/health`);
    console.log(`🌐 Using real YouTube search - can find ANY song on YouTube!`);
    console.log(`🎯 Perfect for Albanian, Italian, or any language music`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down music proxy server...');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
}); 