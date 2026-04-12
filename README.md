# Twitch Chat to Speech

A web-based tool that listens to Twitch chat messages and converts them to speech in real-time using Microsoft Zira voice. Perfect for integrating into OBS as a web source.

## Features

- 🎤 Real-time Twitch chat monitoring
- 🔊 Text-to-speech conversion with Microsoft Zira voice
- 🎛️ Adjustable volume and speech rate
- 👤 Optional username announcement
- 💾 Persistent settings (stored locally)
- 📱 Responsive design
- 🔒 Secure OAuth token handling

## Setup Instructions

### 1. Get Your Twitch OAuth Token

1. Click "Get Started" on the main page
2. Click "Click Here to Get Token"
3. A new window will open with Twitch's OAuth authorization page
4. Click "Authorize" to grant chat reading permissions
5. Copy the token from the page (it will look like `oauth:xxxxxxxxxxxxxxxxxxxx`)
6. Paste it into the "Paste OAuth Token Here" field

### 2. Configure Settings

- **Twitch Channel Name**: Enter the name of the channel to listen to (your channel name)
- **Read Username**: Check this if you want the bot to announce the username before each message
- **Volume**: Adjust the speech volume from 0-100%
- **Speech Rate**: Control how fast the messages are read

### 3. Connect to Chat

Click "Connect to Chat" to start listening to messages. The page will display incoming messages as they're converted to speech.

## Features Explained

### Volume & Rate Controls
- **Volume**: Ranges from 0% (silent) to 100% (full volume)
- **Speech Rate**: Ranges from 0.5x (slow) to 2x (fast), with 1x being normal speed

### Pause/Resume
- Click "Pause" to stop processing new messages
- Click "Resume" to continue
- Messages received while paused will be queued and processed when resumed

### Stop Listening
Click "Stop Listening" to disconnect from chat and return to the main menu.

## Using with OBS

1. Create a new Browser Source in OBS
2. Paste the URL where you've hosted this page (e.g., `https://yourusername.github.io/chat-to-speech/`)
3. Set the browser source to run in a window resolution (e.g., 1024x768 or higher)
4. Configure your credentials when the page loads
5. Click "Connect to Chat"

The page will remain hidden in OBS (no visual content) while the audio plays through your system audio.

## System Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Text-to-Speech support with voice selection
- Microphone/Speaker access enabled in your browser

## Supported Voices

The app will try to use **Microsoft Zira** if available on your system. If not available, it will fall back to the default system voice. Voice availability depends on your operating system:

- **Windows**: Usually includes Zira and other Microsoft voices
- **macOS**: May have different available voices
- **Linux**: Depends on installed TTS engines

## OAuth Token Security

- Your OAuth token is stored locally in your browser's localStorage
- The token is only used to connect to Twitch IRC
- Never share your OAuth token with anyone
- You can revoke access anytime at https://www.twitch.tv/settings/connections

## Troubleshooting

### No audio playing?
- Check your browser's volume settings
- Ensure speakers/headphones are connected
- Check if the website has permission to use audio output

### Voice not working?
- Refresh the page
- Try a different system voice if available
- Check if your OS has text-to-speech enabled

### Not connecting to chat?
- Verify the channel name is correct (without # symbol)
- Check that your OAuth token starts with "oauth:"
- Ensure your internet connection is stable
- Check browser console (F12) for error messages

### Messages too fast/slow?
- Use the "Speech Rate" slider to adjust
- Reduce rate for slower speech, increase for faster

## Files

- `index.html` - Main HTML page structure
- `styles.css` - Styling and layout
- `app.js` - All JavaScript logic

## Hosting on GitHub Pages

1. Push these files to a GitHub repository
2. Go to Settings > Pages
3. Select "Deploy from a branch"
4. Choose the branch where your files are located
5. Your site will be available at `https://yourusername.github.io/chat-to-speech/`

## License

Free to use and modify for personal use.

## Credits

- Uses the Web Speech API standard
- Integrates with Twitch IRC for chat access
- Built for OBS streaming

---

Enjoy converting your chat to speech! 🎤✨
