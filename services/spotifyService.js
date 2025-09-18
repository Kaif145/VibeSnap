// services/spotifyService.js - Spotify API integration
class SpotifyService {
  static async getSpotifyLink(songTitle, artistName) {
    // If Spotify API credentials are available
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      try {
        const directLink = await this.getDirectLink(songTitle, artistName);
        if (directLink) return directLink;
      } catch (error) {
        console.error('Spotify API error:', error);
      }
    }
    
    // Fallback to search URL
    return this.getSearchLink(songTitle, artistName);
  }

  static async getDirectLink(songTitle, artistName) {
    try {
      // Get access token
      const authResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      const authData = await authResponse.json();
      
      if (!authData.access_token) {
        throw new Error("Could not get Spotify access token");
      }

      // Search for the song
      const searchQuery = encodeURIComponent(`track:"${songTitle}" artist:"${artistName}"`);
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`,
        {
          headers: {
            'Authorization': 'Bearer ' + authData.access_token
          }
        }
      );

      const searchData = await searchResponse.json();
      
      if (searchData.tracks && searchData.tracks.items.length > 0) {
        return searchData.tracks.items[0].external_urls.spotify;
      }

      return null;
    } catch (error) {
      console.error('Direct Spotify link error:', error);
      return null;
    }
  }

  static getSearchLink(songTitle, artistName) {
    const query = encodeURIComponent(`${songTitle} ${artistName}`);
    return `https://open.spotify.com/search/${query}`;
  }

  static async getMultipleLinks(songs) {
    return Promise.all(
      songs.map(async (song) => {
        const spotifyUrl = await this.getSpotifyLink(song.title, song.artist);
        return {
          ...song,
          spotify_url: spotifyUrl
        };
      })
    );
  }
}

module.exports = SpotifyService;