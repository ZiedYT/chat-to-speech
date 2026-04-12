// Constants
const TWITCH_CLIENT_ID = '48qvdm74m75e66o093h6p4efixf9tx';
const SCOPES = ['chat:read'];
const REDIRECT_URI = 'https://twitchapps.com/tokengen/';

// State Management - Initialize from localStorage
const state = {
    token: localStorage.getItem('twitchToken') || '',
    channel: localStorage.getItem('twitchChannel') || '',
    readUsername: localStorage.getItem('readUsername') === 'true',
    volume: parseFloat(localStorage.getItem('speechVolume')) || 1.0,
    rate: parseFloat(localStorage.getItem('speechRate')) || 1.0,
    voiceIndex: parseInt(localStorage.getItem('voiceIndex')) || 0,
    isConnected: false,
    isPaused: false,
    client: null,
    queue: [],
    isSpeaking: false,
};

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// ===== AUTH URL GENERATION =====
function generateAuthUrl() {
    const scope_str = SCOPES.join('%20');
    return (
        `https://id.twitch.tv/oauth2/authorize` +
        `?response_type=token` +
        `&client_id=${TWITCH_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${scope_str}`
    );
}

// ===== TEXT TO SPEECH =====
function speakMessage(username, message) {
    if (state.isPaused) {
        state.queue.push({ username, message });
        return;
    }

    let fullText = message;
    if (state.readUsername) {
        fullText = `${username} says, ${message}`;
    }

    const utterance = new SpeechSynthesisUtterance(fullText);
    
    // Use selected voice
    const voices = speechSynthesis.getVoices();
    if (voices[state.voiceIndex]) {
        utterance.voice = voices[state.voiceIndex];
    }

    utterance.volume = state.volume;
    utterance.rate = state.rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
        state.isSpeaking = true;
    };

    utterance.onend = () => {
        state.isSpeaking = false;
        if (state.queue.length > 0 && !state.isPaused) {
            const next = state.queue.shift();
            speakMessage(next.username, next.message);
        }
    };

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        state.isSpeaking = false;
    };

    speechSynthesis.speak(utterance);
    addMessageToUI(username, message);
}

// ===== TWITCH CHAT CONNECTION =====
async function connectToTwitchChat() {
    const channel = document.getElementById('channelInput').value.trim();
    var token = document.getElementById('tokenInput').value.trim();

    if (!channel) {
        showStatus('Please enter a channel name', 'error');
        return;
    }

    if (!token) {
        showStatus('Please enter an OAuth token', 'error');
        return;
    }

    // Add oauth: prefix if missing
    if (!token.startsWith('oauth:')) {
        token = 'oauth:' + token;
        document.getElementById('tokenInput').value = token;
    }

    state.channel = channel.toLowerCase();
    state.token = token;
    state.readUsername = document.getElementById('readUsernameCheckbox').checked;
    state.voiceIndex = parseInt(document.getElementById('voiceSelect').value);

    // Save all settings to localStorage
    localStorage.setItem('twitchToken', state.token);
    localStorage.setItem('twitchChannel', state.channel);
    localStorage.setItem('readUsername', state.readUsername);
    localStorage.setItem('speechVolume', state.volume);
    localStorage.setItem('speechRate', state.rate);
    localStorage.setItem('voiceIndex', state.voiceIndex);

    showStatus('Connecting to chat...', 'info');

    try {
        // Since TMI.js might not be loaded, we'll use the Twitch IRC protocol directly
        connectViaTwitchIRC();
    } catch (error) {
        showStatus('Connection failed: ' + error.message, 'error');
    }
}

function connectViaTwitchIRC() {
    const username = 'justinfan' + Math.floor(Math.random() * 100000);
    const channel = state.channel;
    const token = state.token;

    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(`PASS ${token}`);
        ws.send(`NICK ${username}`);
        ws.send(`JOIN #${channel}`);
    };

    ws.onmessage = (event) => {
        const message = event.data;
        console.log('IRC Message:', message);

        // Handle PING
        if (message.includes('PING')) {
            ws.send('PONG :tmi.twitch.tv');
            return;
        }

        // Parse chat messages
        const chatMessageRegex = /:(.+?)!.+?@.+?\.tmi\.twitch\.tv PRIVMSG #\w+ :(.+)/;
        const match = message.match(chatMessageRegex);

        if (match) {
            const username = match[1];
            const text = match[2];

            console.log(`${username}: ${text}`);
            speakMessage(username, text);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showStatus('Connection error occurred', 'error');
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        state.isConnected = false;
        updateConnectionStatus();
    };

    state.client = ws;
    state.isConnected = true;
    updateConnectionStatus();

    // Update UI
    document.getElementById('channelInfo').textContent = `Connected to: #${channel}`;
    showPage('chatPage');
    showStatus('Connected to chat!', 'success');
}

function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    if (state.isConnected) {
        statusEl.textContent = '● Connected';
        statusEl.classList.add('connected');
    } else {
        statusEl.textContent = '● Disconnected';
        statusEl.classList.remove('connected');
    }
}

function addMessageToUI(username, message) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.innerHTML = `<span class="username">${escapeHtml(username)}:</span><span class="text">${escapeHtml(message)}</span>`;
    messagesDiv.appendChild(messageEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Keep only last 100 messages
    while (messagesDiv.children.length > 100) {
        messagesDiv.removeChild(messagesDiv.firstChild);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== UI HELPERS =====
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;

    if (type !== 'error') {
        setTimeout(() => {
            statusEl.className = 'status-message';
        }, 3000);
    }
}

function loadSettings() {
    document.getElementById('channelInput').value = state.channel;
    document.getElementById('tokenInput').value = state.token;
    document.getElementById('readUsernameCheckbox').checked = state.readUsername;
    document.getElementById('volumeSlider').value = state.volume;
    document.getElementById('rateSlider').value = state.rate;
    document.getElementById('voiceSelect').value = state.voiceIndex;
    updateLabels();
}

function updateLabels() {
    document.getElementById('volumeLabel').textContent = Math.round(state.volume * 100) + '%';
    const rateLabel = document.getElementById('rateLabel');
    if (state.rate === 1) {
        rateLabel.textContent = 'Normal';
    } else if (state.rate < 1) {
        rateLabel.textContent = 'Slower';
    } else {
        rateLabel.textContent = 'Faster';
    }
}

function populateVoices() {
    const voices = speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('voiceSelect');
    voiceSelect.innerHTML = '';
    
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = voice.name + (voice.default ? ' (Default)' : '');
        voiceSelect.appendChild(option);
    });
    
    // Set to saved voice index if available
    voiceSelect.value = state.voiceIndex;
}

// ===== EVENT LISTENERS =====
document.getElementById('settingsBtn').addEventListener('click', () => {
    loadSettings();
    showPage('credentialsPage');
});

document.getElementById('settingsBtn2').addEventListener('click', () => {
    loadSettings();
    showPage('credentialsPage');
});

document.getElementById('backBtn').addEventListener('click', () => {
    showPage('startingPage');
});

document.getElementById('authBtn').addEventListener('click', () => {
    const authUrl = generateAuthUrl();
    window.open(authUrl, 'TwitchAuth', 'width=500,height=600');
    showStatus('A new window has opened. Copy the token and paste it in the field below.', 'info');
});

document.getElementById('toggleTokenBtn').addEventListener('click', (e) => {
    const tokenInput = document.getElementById('tokenInput');
    const btn = e.target;
    if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        btn.textContent = 'Hide';
    } else {
        tokenInput.type = 'password';
        btn.textContent = 'Show';
    }
});

document.getElementById('tokenInput').addEventListener('change', () => {
    state.token = document.getElementById('tokenInput').value;
});

document.getElementById('channelInput').addEventListener('change', () => {
    state.channel = document.getElementById('channelInput').value.toLowerCase();
});

document.getElementById('readUsernameCheckbox').addEventListener('change', (e) => {
    state.readUsername = e.target.checked;
    localStorage.setItem('readUsername', state.readUsername);
});

document.getElementById('volumeSlider').addEventListener('input', (e) => {
    state.volume = parseFloat(e.target.value);
    localStorage.setItem('speechVolume', state.volume);
    updateLabels();
});

document.getElementById('rateSlider').addEventListener('input', (e) => {
    state.rate = parseFloat(e.target.value);
    localStorage.setItem('speechRate', state.rate);
    updateLabels();
});

document.getElementById('voiceSelect').addEventListener('change', (e) => {
    state.voiceIndex = parseInt(e.target.value);
    localStorage.setItem('voiceIndex', state.voiceIndex);
});

document.getElementById('connectBtn').addEventListener('click', connectToTwitchChat);

document.getElementById('stopBtn').addEventListener('click', () => {
    if (state.client) {
        state.client.close();
    }
    speechSynthesis.cancel();
    state.queue = [];
    state.isConnected = false;
    showPage('startingPage');
});

document.getElementById('pauseBtn').addEventListener('click', (e) => {
    state.isPaused = !state.isPaused;
    const btn = e.target;
    if (state.isPaused) {
        btn.textContent = 'Resume';
        speechSynthesis.pause();
    } else {
        btn.textContent = 'Pause';
        speechSynthesis.resume();
        // Process queue if any
        if (state.queue.length > 0) {
            const next = state.queue.shift();
            speakMessage(next.username, next.message);
        }
    }
});

// ===== INITIALIZATION =====
window.addEventListener('load', () => {
    // Load and populate voices
    speechSynthesis.onvoiceschanged = () => {
        populateVoices();
    };
    
    // Populate voices immediately (may be already loaded)
    populateVoices();

    // If we have saved credentials and are on starting page, show prompt to reconnect
    if (state.token && state.channel) {
        // Show a message that they can restore their connection
        // User can click "Get Started" to use saved credentials
    }
});
