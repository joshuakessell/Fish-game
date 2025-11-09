// Global state
const gameState = {
    players: [],
    fish: [],
    projectiles: [],
    tickId: 0,
    myPlayerId: null,
    myPlayerSlot: null,
    roundNumber: 1,
    timeRemainingTicks: 18000,
    isRoundTransitioning: false,
    activeBossSequences: [],
    pendingInteractions: []
};

// Authentication state
let authToken = null;
let userId = null;
let userCredits = 0;

// Lobby state
let currentPage = 0;
let totalPages = 1;
let roomsData = [];
let selectedRoom = null;
let isSelectingSeat = false;

let canvas, ctx;
let betValue = 10;
let playerName = '';
let animationTime = 0;

// Canvas scaling factors for coordinate projection
let canvasScaleX = 1;
let canvasScaleY = 1;
let canvasOffsetX = 0;
let canvasOffsetY = 0;

// Track last known canvas dimensions for detecting runtime viewport changes
let lastCanvasRect = { width: 0, height: 0, left: 0, top: 0 };

// Targeting and Auto-Fire state
let targetingArmed = false;
let targetedFishId = null;
let autoFireEnabled = false;
let isHoldingDown = false;
let autoFireInterval = null;
let lastMousePos = { x: 0, y: 0 };

// Animation tracking
let previousFish = [];
let dyingFish = []; // { fish, progress (0-1), x, y, type, rotation, scale }
let creditPopups = []; // { x, y, amount, progress (0-1) }
let hitFlashes = []; // { x, y, progress (0-1) }
let shockwaves = []; // { x, y, radius, progress, text, triggeredFishIds }

// Fish visual configuration - Ocean King 3 catalog (29 types: 0-28)
const fishTypes = {
    // SMALL FISH (Types 0-5) - Easy to catch, move in schools
    0: { name: 'Clownfish', colors: ['#FF6B35', '#FFFFFF', '#FFA500'], pattern: 'stripes', category: 'small' },
    1: { name: 'Neon Tetra', colors: ['#00CED1', '#1E90FF', '#4169E1'], pattern: 'gradient', category: 'small' },
    2: { name: 'Butterflyfish', colors: ['#FFD700', '#FFFFFF', '#FFA500'], pattern: 'gradient', category: 'small' },
    3: { name: 'Angelfish', colors: ['#FFD700', '#FFA500', '#FF6B35'], pattern: 'gradient', category: 'small' },
    4: { name: 'Pufferfish', colors: ['#FFFF00', '#FFA500', '#FF6347'], pattern: 'spots', category: 'small' },
    5: { name: 'Wrasse', colors: ['#32CD32', '#00FA9A', '#3CB371'], pattern: 'gradient', category: 'small' },
    
    // MEDIUM FISH (Types 6-11) - Moderate difficulty
    6: { name: 'Lionfish', colors: ['#FF4500', '#FF6347', '#8B0000'], pattern: 'stripes', category: 'medium' },
    7: { name: 'Parrotfish', colors: ['#00CED1', '#48D1CC', '#20B2AA'], pattern: 'gradient', category: 'medium' },
    8: { name: 'Seahorse', colors: ['#FFA500', '#FF8C00', '#FF7F50'], pattern: 'gradient', category: 'medium' },
    9: { name: 'Triggerfish', colors: ['#4169E1', '#1E90FF', '#00BFFF'], pattern: 'spots', category: 'medium' },
    10: { name: 'Grouper', colors: ['#8B4513', '#A0522D', '#D2691E'], pattern: 'spots', category: 'medium' },
    11: { name: 'Boxfish', colors: ['#FFD700', '#FFA500', '#FF8C00'], pattern: 'spots', category: 'medium' },
    
    // LARGE FISH (Types 12-16) - Require focused fire
    12: { name: 'Swordfish', colors: ['#4682B4', '#5F9EA0', '#4169E1'], pattern: 'hammerhead', category: 'large' },
    13: { name: 'Shark', colors: ['#708090', '#778899', '#696969'], pattern: 'hammerhead', category: 'large' },
    14: { name: 'Manta Ray', colors: ['#2F4F4F', '#696969', '#778899'], pattern: 'manta', category: 'large' },
    15: { name: 'Barracuda', colors: ['#C0C0C0', '#A9A9A9', '#808080'], pattern: 'hammerhead', category: 'large' },
    16: { name: 'Moray Eel', colors: ['#2E8B57', '#3CB371', '#228B22'], pattern: 'gradient', category: 'large' },
    
    // HIGH-VALUE FISH (Types 17-20) - Rare, massive rewards
    17: { name: 'Golden Carp', colors: ['#FFD700', '#FFA500', '#FF8C00'], pattern: 'gradient', category: 'highvalue' },
    18: { name: 'Fire Kirin', colors: ['#FF4500', '#FF6347', '#FFD700'], pattern: 'dragon', category: 'highvalue' },
    19: { name: 'Electric Eel', colors: ['#00FFFF', '#1E90FF', '#4169E1'], pattern: 'gradient', category: 'highvalue' },
    20: { name: 'Crimson Whale', colors: ['#8B0000', '#DC143C', '#FF0000'], pattern: 'pirate', category: 'highvalue' },
    
    // SPECIAL ITEMS (Types 21-24) - Power-ups, always 1 active
    21: { name: 'Drill Crab', colors: ['#FF4500', '#FF6347', '#FFA500'], pattern: 'carnival', category: 'special' },
    22: { name: 'Laser Crab', colors: ['#00CED1', '#1E90FF', '#FFD700'], pattern: 'carnival', category: 'special' },
    23: { name: 'Roulette Crab', colors: ['#FF1493', '#FFD700', '#00CED1'], pattern: 'carnival', category: 'special' },
    24: { name: 'Vortex Jelly', colors: ['#9370DB', '#8A2BE2', '#9400D3'], pattern: 'jellyfish', category: 'special' },
    
    // BOSS FISH (Types 25-28) - Massive events, always 1 active
    25: { name: 'Dragon King', colors: ['#FFD700', '#FFA500', '#FF8C00'], pattern: 'dragon', category: 'boss' },
    26: { name: 'Emperor Turtle', colors: ['#2E8B57', '#3CB371', '#FFD700'], pattern: 'turtle', category: 'boss' },
    27: { name: 'Poseidon', colors: ['#1E90FF', '#00CED1', '#FFD700'], pattern: 'wizard', category: 'boss' },
    28: { name: 'Phantom Kraken', colors: ['#4B0082', '#8B008B', '#9400D3'], pattern: 'kraken', category: 'boss' }
};

const fishSizes = [
    18, 16, 17, 19, 20, 17,           // Small (0-5)
    26, 28, 24, 27, 29, 26,           // Medium (6-11)
    45, 60, 55, 50, 52,               // Large (12-16)
    38, 42, 48, 70,                   // High-Value (17-20)
    35, 35, 36, 40,                   // Special Items (21-24)
    80, 75, 85, 90                    // Boss Fish (25-28)
]; // Total: 29 fish types (0-28)

// Canvas configuration (1800x900 canvas, 2:1 aspect ratio)
const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 900;

// Turret positions for 6 players (3 top, 3 bottom)
// Calculated as [0.12, 0.5, 0.88] * CANVAS_WIDTH for x, 90 (top) / 810 (bottom) for y
const cannonPositions = [
    { x: 216, y: 90, rotation: 180 },    // Slot 0: Top-left (12%)
    { x: 900, y: 90, rotation: 180 },    // Slot 1: Top-center (50%)
    { x: 1584, y: 90, rotation: 180 },   // Slot 2: Top-right (88%)
    { x: 216, y: 810, rotation: 0 },     // Slot 3: Bottom-left (12%)
    { x: 900, y: 810, rotation: 0 },     // Slot 4: Bottom-center (50%)
    { x: 1584, y: 810, rotation: 0 }     // Slot 5: Bottom-right (88%)
];

// Track current turret rotation angles for smooth animation
const turretRotations = [180, 180, 180, 0, 0, 0]; // Initialize with default rotations
const turretTargetRotations = [180, 180, 180, 0, 0, 0]; // Target rotations for interpolation

function getCannonPosition(slot) {
    return cannonPositions[slot] || cannonPositions[0];
}

function isWithinPlayArea(x, y) {
    return x >= 0 && x <= 1800 && y >= 0 && y <= 900;
}

let connection;

// ====================
// AUTH & LOBBY SYSTEM
// ====================

async function guestLogin() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name || name.length === 0) {
        alert('Please enter your name');
        return;
    }
    
    if (name.length > 20) {
        alert('Name must be 20 characters or less');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'Login failed');
            return;
        }
        
        const data = await response.json();
        
        // Store auth data
        authToken = data.token;
        userId = data.userId;
        playerName = data.name;
        userCredits = data.credits;
        
        console.log(`Guest login successful: ${playerName} (${userId}) with ${userCredits} credits`);
        
        // Show lobby
        showLobby();
        
    } catch (err) {
        console.error('Guest login error:', err);
        alert('Failed to connect to server. Please try again.');
    }
}

function showLobby() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    
    document.getElementById('lobbyPlayerName').textContent = playerName;
    document.getElementById('lobbyCredits').textContent = userCredits || 0;
    
    // Connect to SignalR and load room list
    connectToLobby();
}

function backToLogin() {
    if (connection) {
        connection.stop();
        connection = null;
    }
    
    authToken = null;
    userId = null;
    playerName = '';
    userCredits = 0;
    
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
}

async function connectToLobby() {
    try {
        // Create SignalR connection with JWT auth
        connection = new signalR.HubConnectionBuilder()
            .withUrl('/gamehub', {
                accessTokenFactory: () => authToken
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();
        
        // Setup connection handlers
        connection.onclose(() => {
            console.log('Connection closed');
        });
        
        // Start connection
        await connection.start();
        console.log('Connected to game server');
        
        // Setup game event handlers immediately after connection
        setupGameEventHandlers();
        console.log('Game event handlers registered');
        
        // Load room list
        loadRoomList(0);
        
    } catch (err) {
        console.error('Failed to connect to game server:', err);
        alert('Failed to connect to game server. Please try again.');
        backToLogin();
    }
}

async function loadRoomList(page) {
    try {
        const result = await connection.invoke('GetRoomList', page);
        
        roomsData = result.rooms;
        currentPage = result.currentPage;
        totalPages = result.totalPages;
        
        renderRoomList();
        updatePagination();
        
    } catch (err) {
        console.error('Failed to load room list:', err);
        alert('Failed to load rooms. Please try again.');
    }
}

function renderRoomList() {
    const container = document.getElementById('roomGridContainer');
    container.innerHTML = '';
    
    if (roomsData.length === 0) {
        container.innerHTML = '<p style="color: #aaa; padding: 20px; grid-column: 1 / -1;">No rooms available...</p>';
        return;
    }
    
    roomsData.forEach((room, index) => {
        const card = document.createElement('div');
        const playerCount = room.playerCount || 0;
        const maxPlayers = room.maxPlayers || 6;
        const isFull = playerCount >= maxPlayers;
        
        card.className = 'room-card';
        if (isFull) {
            card.classList.add('full');
        } else {
            card.onclick = () => selectRoom(room);
        }
        
        const openSeats = maxPlayers - playerCount;
        const statusText = isFull ? '🔒 FULL' : playerCount > 0 ? '🎮 Active' : '⏳ Open';
        const seatsText = isFull ? 'Full' : `${openSeats} ${openSeats === 1 ? 'Seat' : 'Seats'} Open`;
        const roomNumberText = `Table ${index + 1}`;
        
        card.innerHTML = `
            <div class="room-header">
                <div class="room-number">${roomNumberText}</div>
            </div>
            <div class="room-info" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1vh;">
                <p class="room-players" style="font-size: 2.5vh; margin: 0;">${seatsText}</p>
                <p class="room-status" style="margin: 0;">${statusText}</p>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Fill remaining slots to maintain 2x2 grid
    while (container.children.length < 4) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'room-card';
        emptyCard.style.opacity = '0.3';
        emptyCard.style.cursor = 'default';
        emptyCard.innerHTML = `
            <div class="room-header">
                <div class="room-number">-</div>
            </div>
            <div class="room-info" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <p class="room-status" style="margin: 0;">Empty</p>
            </div>
        `;
        container.appendChild(emptyCard);
    }
}

function updatePagination() {
    document.getElementById('pageInfo').textContent = `Page ${currentPage + 1} of ${totalPages}`;
    document.getElementById('prevPageBtn').disabled = currentPage === 0;
    document.getElementById('nextPageBtn').disabled = currentPage >= totalPages - 1;
}

function previousPage() {
    if (currentPage > 0) {
        loadRoomList(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < totalPages - 1) {
        loadRoomList(currentPage + 1);
    }
}

function selectRoom(room) {
    selectedRoom = room;
    isSelectingSeat = true;
    
    // Hide pagination and action buttons
    document.querySelector('.pagination').style.display = 'none';
    document.querySelector('.lobby-actions').style.display = 'none';
    
    // Show seat selection overlay
    showSeatSelection(room);
}

function backToRooms() {
    selectedRoom = null;
    isSelectingSeat = false;
    
    // Hide seat selection overlay
    const seatSelectionView = document.getElementById('seatSelectionView');
    if (seatSelectionView) {
        seatSelectionView.style.display = 'none';
    }
    
    // Show pagination and action buttons
    document.querySelector('.pagination').style.display = 'flex';
    document.querySelector('.lobby-actions').style.display = 'flex';
    
    // Show room grid
    document.getElementById('roomGridContainer').style.display = 'grid';
}

async function joinRoomWithSeat(seatIndex) {
    if (!selectedRoom) {
        alert('No room selected');
        return;
    }
    
    try {
        const result = await connection.invoke('JoinRoom', selectedRoom.matchId, seatIndex);
        
        if (result.success) {
            console.log(`Joined room ${selectedRoom.matchId} at seat ${seatIndex}`);
            // Store player slot
            gameState.myPlayerSlot = result.playerSlot;
            gameState.myPlayerId = result.playerId;
            startGame();
        } else {
            alert(result.message || 'Failed to join room');
        }
        
    } catch (err) {
        console.error('Failed to join room:', err);
        alert('Failed to join room. Please try again.');
    }
}

function showSeatSelection(room) {
    // Create or show seat selection view
    let seatSelectionView = document.getElementById('seatSelectionView');
    
    if (!seatSelectionView) {
        seatSelectionView = document.createElement('div');
        seatSelectionView.id = 'seatSelectionView';
        document.getElementById('lobbyScreen').appendChild(seatSelectionView);
    }
    
    // Hide room grid
    document.getElementById('roomGridContainer').style.display = 'none';
    
    // Build seat selection UI
    const seatOccupancy = room.seatOccupancy || [];
    let seatButtonsHTML = '';
    
    for (let i = 0; i < 6; i++) {
        const seat = seatOccupancy[i];
        const isOccupied = seat && seat.playerId;
        const seatLabel = isOccupied ? seat.displayName : `Seat ${i + 1} - Empty`;
        const seatClass = isOccupied ? 'seat-button occupied' : 'seat-button available';
        const dataAttr = isOccupied ? '' : `data-seat-index="${i}"`;
        
        seatButtonsHTML += `<button class="${seatClass}" ${dataAttr} ${isOccupied ? 'disabled' : ''}>${seatLabel}</button>`;
    }
    
    seatSelectionView.innerHTML = `
        <div class="seat-selection-container">
            <h2>Select Your Seat</h2>
            <p>Room: ${room.matchId}</p>
            <div class="table-container">
                <div class="central-table"></div>
                <div class="seat-buttons-grid">
                    ${seatButtonsHTML}
                </div>
            </div>
            <button class="back-to-rooms-btn" onclick="backToRooms()">← Back to Rooms</button>
        </div>
    `;
    
    //  Add event listeners to seat buttons (better than onclick for touch events)
    seatSelectionView.querySelectorAll('.seat-button[data-seat-index]').forEach(btn => {
        btn.addEventListener('click', function() {
            const seatIndex = parseInt(this.getAttribute('data-seat-index'));
            console.log(`Attempting to join seat ${seatIndex}`);
            joinRoomWithSeat(seatIndex);
        });
    });
    
    seatSelectionView.style.display = 'flex';
}

async function playSolo() {
    try {
        const result = await connection.invoke('CreateSoloGame');
        
        if (result.success) {
            console.log('Solo game created');
            startGame();
        } else {
            alert(result.message || 'Failed to create solo game');
        }
        
    } catch (err) {
        console.error('Failed to create solo game:', err);
        alert('Failed to create solo game. Please try again.');
    }
}

function startGame() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    // Note: setupGameEventHandlers() is already called in showLobby(), so we don't need to call it again here
    
    // Initialize canvas if not done yet
    if (!canvas) {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        // Set canvas size
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Set up click handler
        canvas.addEventListener('click', handleClick);
        
        // Start rendering
        requestAnimationFrame(render);
    }
}

function setupGameEventHandlers() {
    // Set up event handlers for game state updates
    connection.on("statedelta", handleStateDelta);
    
    connection.onreconnecting(() => {
        console.log("Reconnecting...");
    });
    
    connection.onclose(() => {
        console.log("Disconnected from server");
        alert("Lost connection to server");
        backToLogin();
    });
}

// ====================
// END AUTH & LOBBY
// ====================

// Orientation detection for mobile/tablet devices
function isMobileOrTablet() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 1024 || window.innerHeight <= 1024;
    return isMobile || (isTouch && isSmallScreen);
}

let orientationCheckTimeout = null;

function checkOrientation() {
    const rotationOverlay = document.getElementById('rotationOverlay');
    if (!rotationOverlay) return;
    
    if (isMobileOrTablet()) {
        // Use screen dimensions instead of window dimensions to avoid browser chrome issues
        // screen.width/height represent device screen, not affected by address bar
        let isPortrait = false;
        
        // Try to use screen.orientation API first (most reliable)
        if (screen.orientation && screen.orientation.type) {
            isPortrait = screen.orientation.type.includes('portrait');
        } 
        // Fallback to screen dimensions (more stable than window dimensions)
        else if (screen.width && screen.height) {
            isPortrait = screen.height > screen.width;
        }
        // Last resort: use window dimensions with margin of error to prevent flickering
        else {
            // Add 100px margin to account for browser chrome fluctuations
            isPortrait = (window.innerHeight - 100) > window.innerWidth;
        }
        
        if (isPortrait) {
            rotationOverlay.style.display = 'flex';
        } else {
            rotationOverlay.style.display = 'none';
            // When rotating to landscape, show scroll instruction if game is active
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen && gameScreen.style.display === 'flex') {
                showScrollInstruction();
            }
        }
    } else {
        rotationOverlay.style.display = 'none';
    }
}

// Debounced orientation check to prevent rapid flickering
function debouncedCheckOrientation() {
    if (orientationCheckTimeout) {
        clearTimeout(orientationCheckTimeout);
    }
    orientationCheckTimeout = setTimeout(checkOrientation, 100);
}

// Listen for orientation changes
window.addEventListener('orientationchange', checkOrientation);
// Use debounced version for resize to prevent flickering from browser chrome
window.addEventListener('resize', debouncedCheckOrientation);

// Check orientation on page load
window.addEventListener('DOMContentLoaded', checkOrientation);

// Prevent pull-to-refresh and accidental page reload
(function preventPullToRefresh() {
    let lastTouchY = 0;
    let preventPullToRefresh = false;
    
    // Prevent pull-to-refresh on the entire document
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        lastTouchY = e.touches[0].clientY;
        preventPullToRefresh = window.pageYOffset === 0;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        const touchY = e.touches[0].clientY;
        const touchYDelta = touchY - lastTouchY;
        lastTouchY = touchY;
        
        // If at the top of the page and trying to scroll down (pull to refresh), prevent it
        if (preventPullToRefresh) {
            if (touchYDelta > 0) {
                e.preventDefault();
                return false;
            }
            preventPullToRefresh = false;
        }
    }, { passive: false });
    
    // Only prevent touchmove on the canvas itself (not on UI elements like buttons)
    document.addEventListener('DOMContentLoaded', function() {
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, { passive: false });
        }
    });
})();

// Scroll instruction for mobile/tablet devices
function showScrollInstruction() {
    const scrollInstruction = document.getElementById('scrollInstruction');
    if (!scrollInstruction) return;
    
    // Check if user has seen this before
    const hasSeenInstruction = localStorage.getItem('oceanking_scroll_instruction_seen');
    
    if (isMobileOrTablet() && !hasSeenInstruction) {
        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape) {
            scrollInstruction.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                scrollInstruction.style.display = 'none';
                localStorage.setItem('oceanking_scroll_instruction_seen', 'true');
            }, 5000);
            
            // Hide on scroll or touch
            const hideInstruction = () => {
                scrollInstruction.style.display = 'none';
                localStorage.setItem('oceanking_scroll_instruction_seen', 'true');
                window.removeEventListener('scroll', hideInstruction);
                window.removeEventListener('touchstart', hideInstruction);
            };
            
            window.addEventListener('scroll', hideInstruction);
            window.addEventListener('touchstart', hideInstruction);
        }
    }
}

// OLD joinGame() - replaced with new auth & lobby system
// This function is kept for reference but is no longer used

function resizeCanvas() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate scaled size maintaining 2:1 aspect ratio to fill viewport
    let width = viewportWidth;
    let height = width * 0.5; // 900/1800 = 0.5
    
    // If height exceeds viewport, scale down based on height
    if (height > viewportHeight) {
        height = viewportHeight;
        width = height * 2; // 1800/900 = 2
    }
    
    // Set canvas internal resolution (always 1800x900)
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Set canvas display size
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Calculate scale factors for coordinate projection
    canvasScaleX = width / CANVAS_WIDTH;
    canvasScaleY = height / CANVAS_HEIGHT;
    
    // CRITICAL FIX: Defer overlay position update using requestAnimationFrame
    // to ensure browser has flushed layout and getBoundingClientRect() returns accurate values
    requestAnimationFrame(() => {
        // Calculate canvas offset AFTER layout flush
        const rect = canvas.getBoundingClientRect();
        canvasOffsetX = rect.left;
        canvasOffsetY = rect.top;
        
        // Update cached dimensions
        lastCanvasRect = {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
        };
        
        // Update overlay control positions with accurate rect
        updateOverlayPositions();
    });
}

// Helper function to project world coordinates to screen coordinates
function projectToScreen(worldX, worldY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: rect.left + (worldX / CANVAS_WIDTH) * rect.width,
        y: rect.top + (worldY / CANVAS_HEIGHT) * rect.height
    };
}

// Update overlay control positions based on player turret
function updateOverlayPositions() {
    if (gameState.myPlayerSlot === null || gameState.myPlayerSlot < 0) return;
    
    const turretPos = getCannonPosition(gameState.myPlayerSlot);
    const screenPos = projectToScreen(turretPos.x, turretPos.y);
    
    // Position bet buttons on sides of turret
    const betDecreaseBtn = document.getElementById('betDecreaseBtn');
    const betIncreaseBtn = document.getElementById('betIncreaseBtn');
    const creditsDisplay = document.getElementById('creditsDisplay');
    
    if (betDecreaseBtn && betIncreaseBtn && creditsDisplay) {
        // Scale-aware offsets (multiply by canvas scale to shrink on small viewports)
        const leftOffsetX = 80 * canvasScaleX;
        const rightOffsetX = 40 * canvasScaleX;
        const verticalOffsetY = 20 * canvasScaleY;
        const creditsOffsetX = 50 * canvasScaleX;
        const creditsOffsetY = 60 * canvasScaleY;
        
        // Left button (decrease) - positioned to left of turret
        let decreaseLeft = screenPos.x - leftOffsetX;
        let decreaseTop = screenPos.y - verticalOffsetY;
        
        // Right button (increase) - positioned to right of turret
        let increaseLeft = screenPos.x + rightOffsetX;
        let increaseTop = screenPos.y - verticalOffsetY;
        
        // Credits display at base of turret
        const offsetY = turretPos.y < CANVAS_HEIGHT / 2 ? creditsOffsetY : -creditsOffsetY;
        let creditsLeft = screenPos.x - creditsOffsetX;
        let creditsTop = screenPos.y + offsetY;
        
        // Viewport clamping - get element dimensions for accurate bounds checking
        const decreaseWidth = betDecreaseBtn.offsetWidth || 40;
        const decreaseHeight = betDecreaseBtn.offsetHeight || 40;
        const increaseWidth = betIncreaseBtn.offsetWidth || 40;
        const increaseHeight = betIncreaseBtn.offsetHeight || 40;
        const creditsWidth = creditsDisplay.offsetWidth || 100;
        const creditsHeight = creditsDisplay.offsetHeight || 30;
        
        // Clamp decrease button to stay within viewport
        decreaseLeft = Math.max(0, Math.min(window.innerWidth - decreaseWidth, decreaseLeft));
        decreaseTop = Math.max(0, Math.min(window.innerHeight - decreaseHeight, decreaseTop));
        
        // Clamp increase button to stay within viewport
        increaseLeft = Math.max(0, Math.min(window.innerWidth - increaseWidth, increaseLeft));
        increaseTop = Math.max(0, Math.min(window.innerHeight - increaseHeight, increaseTop));
        
        // Clamp credits display to stay within viewport
        creditsLeft = Math.max(0, Math.min(window.innerWidth - creditsWidth, creditsLeft));
        creditsTop = Math.max(0, Math.min(window.innerHeight - creditsHeight, creditsTop));
        
        // Apply clamped positions
        betDecreaseBtn.style.left = decreaseLeft + 'px';
        betDecreaseBtn.style.top = decreaseTop + 'px';
        
        betIncreaseBtn.style.left = increaseLeft + 'px';
        betIncreaseBtn.style.top = increaseTop + 'px';
        
        creditsDisplay.style.left = creditsLeft + 'px';
        creditsDisplay.style.top = creditsTop + 'px';
    }
}

function startGame() {
    // Hide login, show game
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    // Show scroll instruction for mobile/tablet users
    setTimeout(() => {
        showScrollInstruction();
    }, 500);
    
    // Initialize overlay displays
    updateOverlayDisplays();
    updateOverlayPositions();
}

function showTurretSelection(availableSlots) {
    // Hide login screen
    document.getElementById('loginScreen').style.display = 'none';
    
    // Show turret selection overlay
    const overlay = document.getElementById('turretSelectionOverlay');
    overlay.style.display = 'flex';
    
    // Create selection canvas
    const selectionCanvas = document.getElementById('turretSelectionCanvas');
    const selCtx = selectionCanvas.getContext('2d');
    selectionCanvas.width = 1800;
    selectionCanvas.height = 900;
    
    // Draw turret positions
    function drawSelectionScreen() {
        // Ocean background
        const gradient = selCtx.createLinearGradient(0, 0, 0, selectionCanvas.height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(1, '#004d7a');
        selCtx.fillStyle = gradient;
        selCtx.fillRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        
        // Draw all 6 turret positions
        cannonPositions.forEach((pos, idx) => {
            const isAvailable = availableSlots.includes(idx);
            
            // Pulsing glow effect for available slots
            if (isAvailable) {
                const pulseAlpha = 0.3 + 0.3 * Math.sin(Date.now() / 300);
                selCtx.shadowBlur = 30;
                selCtx.shadowColor = `rgba(255, 255, 0, ${pulseAlpha})`;
            }
            
            // Turret housing
            selCtx.fillStyle = isAvailable ? 'rgba(255, 255, 0, 0.3)' : 'rgba(100, 100, 100, 0.3)';
            selCtx.beginPath();
            selCtx.arc(pos.x, pos.y, 60, 0, Math.PI * 2);
            selCtx.fill();
            
            // Turret base
            selCtx.fillStyle = isAvailable ? '#ffcc00' : '#666';
            selCtx.beginPath();
            selCtx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
            selCtx.fill();
            
            selCtx.shadowBlur = 0;
            
            // Slot number
            selCtx.fillStyle = isAvailable ? '#000' : '#333';
            selCtx.font = 'bold 30px Arial';
            selCtx.textAlign = 'center';
            selCtx.textBaseline = 'middle';
            selCtx.fillText(idx + 1, pos.x, pos.y);
            
            // Status text
            selCtx.font = 'bold 14px Arial';
            selCtx.fillStyle = isAvailable ? '#ffff00' : '#888';
            selCtx.fillText(isAvailable ? 'AVAILABLE' : 'OCCUPIED', pos.x, pos.y + 80);
        });
        
        requestAnimationFrame(drawSelectionScreen);
    }
    
    drawSelectionScreen();
    
    // Handle selection click
    selectionCanvas.onclick = async (event) => {
        const rect = selectionCanvas.getBoundingClientRect();
        const scaleX = selectionCanvas.width / rect.width;
        const scaleY = selectionCanvas.height / rect.height;
        
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;
        
        // Check which turret was clicked
        for (let i = 0; i < cannonPositions.length; i++) {
            const pos = cannonPositions[i];
            const dist = Math.sqrt((canvasX - pos.x) ** 2 + (canvasY - pos.y) ** 2);
            
            if (dist < 60 && availableSlots.includes(i)) {
                // Valid selection
                try {
                    const result = await connection.invoke("SelectTurretSlot", i);
                    if (result.success) {
                        gameState.myPlayerSlot = i;
                        overlay.style.display = 'none';
                        
                        // Initialize canvas BEFORE starting game (so scale factors are correct)
                        canvas = document.getElementById('gameCanvas');
                        ctx = canvas.getContext('2d');
                        resizeCanvas();
                        window.addEventListener('resize', resizeCanvas);
                        
                        // Now start game (which will use correct scale factors for overlay positioning)
                        startGame();
                        
                        // Set up input handlers
                        canvas.addEventListener('click', handleClick);
                        canvas.addEventListener('mousedown', handleMouseDown);
                        canvas.addEventListener('mouseup', handleMouseUp);
                        canvas.addEventListener('mousemove', handleMouseMove);
                        requestAnimationFrame(render);
                    } else {
                        alert('Failed to select turret: ' + result.message);
                    }
                } catch (error) {
                    console.error('Error selecting turret:', error);
                    alert('Failed to select turret');
                }
                break;
            }
        }
    };
}

// Listen for PlayerSlotSelected events
connection?.on?.("PlayerSlotSelected", (data) => {
    console.log(`Player ${data.displayName} selected slot ${data.playerSlot}`);
});

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    
    // Store mouse position for auto-fire
    lastMousePos = { x: canvasX, y: canvasY };
    
    // If targeting mode is armed, select a fish instead of firing
    if (targetingArmed) {
        // Find fish at click coordinates
        const clickedFish = gameState.fish.find(fish => {
            const dx = fish.x - canvasX;
            const dy = fish.y - canvasY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const hitboxRadius = fishSizes[fish.typeId] || 20;
            return distance <= hitboxRadius;
        });
        
        if (clickedFish) {
            targetedFishId = clickedFish.fishId;
            targetingArmed = false;
            updateTargetModeButton();
            console.log('Target locked:', clickedFish.fishId);
        } else {
            // No fish clicked, disable targeting mode
            targetingArmed = false;
            updateTargetModeButton();
        }
        return; // Don't fire when in targeting mode
    }
    
    // Don't fire on click if auto-fire is enabled (use mousedown/up instead)
    if (autoFireEnabled) {
        return;
    }
    
    // Get the player's cannon position based on their slot
    const cannonPos = getCannonPosition(gameState.myPlayerSlot);
    const playerX = cannonPos.x;
    const playerY = cannonPos.y;
    
    const dx = canvasX - playerX;
    const dy = canvasY - playerY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Update turret target rotation for smooth animation
    if (length > 0 && gameState.myPlayerSlot >= 0 && gameState.myPlayerSlot < 6) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        turretTargetRotations[gameState.myPlayerSlot] = targetAngle;
    }
    
    if (length > 0) {
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Send fire command to server
        if (connection) {
            connection.invoke("Fire", playerX, playerY, dirX, dirY)
                .catch(err => console.error('Fire error:', err));
        }
    }
}

function increaseBet() {
    betValue = Math.min(200, betValue + 10);
    updateOverlayDisplays();
    sendBetValueToServer();
}

function decreaseBet() {
    betValue = Math.max(10, betValue - 10);
    updateOverlayDisplays();
    sendBetValueToServer();
}

function sendBetValueToServer() {
    if (connection) {
        connection.invoke("SetBetValue", betValue)
            .catch(err => console.error('Bet value error:', err));
    }
}

function updateOverlayDisplays() {
    const myPlayer = gameState.players.find(p => p.playerId === gameState.myPlayerId);
    if (!myPlayer) return;
    
    // Update credits display
    const creditsValue = document.getElementById('creditsValue');
    if (creditsValue) {
        const credits = myPlayer.credits || 0;
        creditsValue.textContent = Math.floor(credits);
    }
}

function handleStateDelta(delta) {
    gameState.tickId = delta.tickId;
    
    // Capture old player state BEFORE updating
    const oldPlayer = gameState.players.find(p => p.playerId === gameState.myPlayerId);
    const newPlayer = delta.players.find(p => p.playerId === gameState.myPlayerId);
    
    // Detect fish deaths for animations
    const newFish = delta.fish || [];
    const newFishIds = new Set(newFish.map(f => f.fishId));
    
    // Find fish that were in previous state but not in new state (they died)
    previousFish.forEach(oldFish => {
        if (!newFishIds.has(oldFish.fishId)) {
            // Fish died - add to dying animation array with rotation and scale
            dyingFish.push({
                fish: oldFish,
                progress: 0,
                x: oldFish.x,
                y: oldFish.y,
                type: oldFish.typeId,
                rotation: 0,
                scale: 1
            });
            
            // Clear target if this was the targeted fish
            if (targetedFishId === oldFish.fishId) {
                clearTarget();
            }
            
            // If this fish was killed by the current player, add credit popup
            if (oldPlayer && newPlayer && (newPlayer.credits || 0) > (oldPlayer.credits || 0)) {
                const creditsEarned = Math.floor((newPlayer.credits || 0) - (oldPlayer.credits || 0));
                creditPopups.push({
                    x: oldFish.x,
                    y: oldFish.y,
                    amount: creditsEarned,
                    progress: 0
                });
            }
        }
    });
    
    // Detect bullet hit flashes (projectiles that disappeared)
    const previousProjectiles = gameState.projectiles || [];
    const newProjectiles = delta.projectiles || [];
    const newProjectileIds = new Set(newProjectiles.map(p => p.projectileId));
    
    previousProjectiles.forEach(oldProj => {
        if (!newProjectileIds.has(oldProj.projectileId)) {
            // Projectile disappeared (likely hit something)
            hitFlashes.push({
                x: oldProj.x,
                y: oldProj.y,
                progress: 0
            });
        }
    });
    
    previousFish = newFish;
    gameState.players = delta.players;
    gameState.fish = newFish;
    gameState.projectiles = newProjectiles;
    gameState.roundNumber = delta.roundNumber || 1;
    gameState.timeRemainingTicks = delta.timeRemainingTicks || 18000;
    gameState.isRoundTransitioning = delta.isRoundTransitioning || false;
    gameState.activeBossSequences = delta.activeBossSequences || [];
    gameState.pendingInteractions = delta.pendingInteractions || [];
    
    // Update overlay displays
    updateOverlayDisplays();
    
    if (gameState.pendingInteractions.length > 0) {
        const myInteraction = gameState.pendingInteractions.find(i => i.playerId === gameState.myPlayerId);
        if (myInteraction) {
            showInteractionUI(myInteraction);
        }
    }
}


function render() {
    animationTime += 0.016;
    
    // CRITICAL FIX: Check if canvas dimensions have changed during runtime (orientation changes, browser chrome, etc.)
    // This ensures overlays stay correctly positioned even when viewport changes during gameplay
    const currentRect = canvas.getBoundingClientRect();
    if (currentRect.width !== lastCanvasRect.width || 
        currentRect.height !== lastCanvasRect.height ||
        currentRect.left !== lastCanvasRect.left ||
        currentRect.top !== lastCanvasRect.top) {
        
        // Update cached dimensions
        lastCanvasRect = {
            width: currentRect.width,
            height: currentRect.height,
            left: currentRect.left,
            top: currentRect.top
        };
        
        // Update scale factors and offsets with accurate rect
        canvasScaleX = currentRect.width / CANVAS_WIDTH;
        canvasScaleY = currentRect.height / CANVAS_HEIGHT;
        canvasOffsetX = currentRect.left;
        canvasOffsetY = currentRect.top;
        
        // Update overlay positions to match new dimensions
        updateOverlayPositions();
    }
    
    // Smooth turret rotation interpolation
    for (let i = 0; i < 6; i++) {
        const current = turretRotations[i];
        const target = turretTargetRotations[i];
        
        // Calculate shortest rotation path
        let diff = target - current;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        
        // Smooth lerp (10% per frame)
        turretRotations[i] = current + diff * 0.15;
    }
    
    // Draw deep ocean background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001a33');    // Deep blue-black at top
    gradient.addColorStop(0.3, '#003366');  // Dark blue
    gradient.addColorStop(0.7, '#004d7a');  // Medium blue  
    gradient.addColorStop(1, '#006994');    // Lighter blue at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add depth with darker edges (vignette)
    const radialGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 200,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
    );
    radialGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    radialGrad.addColorStop(1, 'rgba(0, 0, 20, 0.4)');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw underwater elements
    drawKelp();
    drawBubbles();
    
    // Draw fish (behind bullets)
    gameState.fish.forEach(fish => {
        drawFish(fish);
    });
    
    // Draw visual indicator for targeted fish
    if (targetedFishId) {
        const targetedFish = gameState.fish.find(f => f.fishId === targetedFishId);
        if (targetedFish) {
            const size = fishSizes[targetedFish.typeId] || 20;
            
            ctx.save();
            ctx.translate(targetedFish.x, targetedFish.y);
            
            // Draw pulsing crosshair
            const pulse = Math.sin(animationTime * 4) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
            ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`;
            ctx.lineWidth = 3;
            
            // Draw crosshair lines
            const crosshairSize = size * 2;
            ctx.beginPath();
            ctx.moveTo(-crosshairSize, 0);
            ctx.lineTo(-size * 1.2, 0);
            ctx.moveTo(size * 1.2, 0);
            ctx.lineTo(crosshairSize, 0);
            ctx.moveTo(0, -crosshairSize);
            ctx.lineTo(0, -size * 1.2);
            ctx.moveTo(0, size * 1.2);
            ctx.lineTo(0, crosshairSize);
            ctx.stroke();
            
            // Draw glowing circle around target
            ctx.beginPath();
            ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 0, ${pulse * 0.6})`;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Draw inner circle
            ctx.beginPath();
            ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 0, ${pulse * 0.4})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
        } else {
            // Target fish is gone, clear it
            clearTarget();
        }
    }
    
    // Update and draw dying fish animations (0.5s duration)
    dyingFish = dyingFish.filter(dying => {
        dying.progress += 0.016 / 0.5; // Increment based on frame time / total duration
        if (dying.progress >= 1) return false; // Remove completed animations
        
        // Update rotation and scale based on progress
        dying.rotation = dying.progress * 720; // 720 degrees = 2 full rotations
        dying.scale = 1 - dying.progress; // Scale from 1 to 0
        
        // Draw dying fish with spin, shrink, and fade
        const type = fishTypes[dying.type] || fishTypes[0];
        const size = fishSizes[dying.type] || 20;
        const swimming = Math.sin(animationTime * 3) * 0.2;
        
        ctx.save();
        ctx.translate(dying.x, dying.y);
        
        // Spin effect (use rotation field)
        ctx.rotate((dying.rotation * Math.PI) / 180);
        
        // Shrink effect (use scale field)
        ctx.scale(dying.scale, dying.scale);
        
        // Fade effect
        ctx.globalAlpha = 1 - dying.progress;
        
        // Draw the fish based on pattern
        switch (type.pattern) {
            case 'stripes':
                drawClownfish(size, type.colors, swimming);
                break;
            case 'gradient':
                drawAngelfish(size, type.colors, swimming);
                break;
            case 'spots':
                drawOctopus(size, type.colors, swimming);
                break;
            case 'dragon':
                drawDragon(size, type.colors, swimming);
                break;
            case 'turtle':
                drawSeaTurtle(size, type.colors, swimming);
                break;
            case 'manta':
                drawMantaRay(size, type.colors, swimming);
                break;
            case 'jellyfish':
                drawGiantJellyfish(size, type.colors, swimming);
                break;
            case 'hammerhead':
                drawHammerheadShark(size, type.colors, swimming);
                break;
            case 'nautilus':
                drawNautilus(size, type.colors, swimming);
                break;
            case 'megalodon':
                drawBoss_Megalodon(size, type.colors, swimming);
                break;
            case 'kraken':
                drawBoss_Kraken(size, type.colors, swimming);
                break;
            case 'leviathan':
                drawBoss_CosmicLeviathan(size, type.colors, swimming);
                break;
            case 'samurai':
                drawBoss_SamuraiSwordfish(size, type.colors, swimming);
                break;
            case 'carnival':
                drawBoss_CarnivalCrab(size, type.colors, swimming);
                break;
            case 'wizard':
                drawBoss_WizardOctopus(size, type.colors, swimming);
                break;
            case 'rocket':
                drawBoss_RocketHammerhead(size, type.colors, swimming);
                break;
            case 'pirate':
                drawBoss_PirateWhale(size, type.colors, swimming);
                break;
            case 'narwhal':
                drawBoss_NarwhalKing(size, type.colors, swimming);
                break;
            case 'phoenix':
                drawBoss_PhoenixRay(size, type.colors, swimming);
                break;
            case 'steampunk':
                drawBoss_SteampunkTurtle(size, type.colors, swimming);
                break;
        }
        
        ctx.restore();
        
        return true; // Keep in array
    });
    
    // Update and draw credit popups (2s duration)
    creditPopups = creditPopups.filter(popup => {
        popup.progress += 0.016 / 2.0; // Increment based on frame time / total duration
        if (popup.progress >= 1) return false; // Remove completed animations
        
        // Font size based on amount (larger for bigger payouts)
        let fontSize = 16;
        if (popup.amount >= 1000) fontSize = 48;
        else if (popup.amount >= 500) fontSize = 40;
        else if (popup.amount >= 100) fontSize = 32;
        else if (popup.amount >= 50) fontSize = 24;
        
        // Fade effect
        const alpha = 1 - popup.progress;
        
        // Float up slightly
        const yOffset = -popup.progress * 50;
        
        // Draw credit popup
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(`+${popup.amount}`, popup.x, popup.y + yOffset);
        
        // Fill
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffcc00';
        ctx.fillText(`+${popup.amount}`, popup.x, popup.y + yOffset);
        
        ctx.restore();
        
        return true; // Keep in array
    });
    
    // Update and draw bullet hit flashes (0.3s duration)
    hitFlashes = hitFlashes.filter(flash => {
        flash.progress += 0.016 / 0.3;
        if (flash.progress >= 1) return false;
        
        const radius = flash.progress * 20; // Expand to 20px
        const alpha = 1 - flash.progress; // Fade out
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright flash
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        return true;
    });
    
    // Update and draw shockwave animations (1s duration)
    shockwaves = shockwaves.filter(shockwave => {
        shockwave.progress += 0.016 / 1.0;
        if (shockwave.progress >= 1) return false;
        
        shockwave.radius = shockwave.progress * 150; // Expand to 150px
        const alpha = 1 - shockwave.progress;
        
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        
        // Expanding ring gradient
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring
        ctx.strokeStyle = 'rgba(150, 220, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(shockwave.x, shockwave.y, shockwave.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Shockwave text with rumble effect
        if (shockwave.text && shockwave.progress < 0.7) {
            const rumbleX = (Math.random() - 0.5) * 4;
            const rumbleY = (Math.random() - 0.5) * 4;
            
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(shockwave.text, shockwave.x + rumbleX, shockwave.y + rumbleY - 50);
            
            // Fill
            ctx.fillStyle = 'rgba(100, 200, 255, 1)';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
            ctx.fillText(shockwave.text, shockwave.x + rumbleX, shockwave.y + rumbleY - 50);
        }
        
        ctx.restore();
        
        return true;
    });
    
    // Draw projectiles
    gameState.projectiles.forEach(proj => {
        drawProjectile(proj);
    });
    
    // Draw players (cannons)
    gameState.players.forEach(player => {
        drawPlayerCannon(player);
    });
    
    // Draw caustic light ripples
    drawCaustics();
    
    requestAnimationFrame(render);
}

function drawKelp() {
    // Animated kelp/seaweed at bottom corners and edges
    const kelpPositions = [150, 400, 700, 900, 1200, 1450];
    
    ctx.strokeStyle = 'rgba(34, 139, 34, 0.3)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    kelpPositions.forEach((x, i) => {
        const sway = Math.sin(animationTime * 0.5 + i) * 20;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        
        // Draw wavy kelp strand
        for (let y = canvas.height; y > canvas.height - 150; y -= 20) {
            const offset = Math.sin((y / 30) + animationTime * 0.8 + i) * (15 + sway);
            ctx.lineTo(x + offset, y);
        }
        
        ctx.stroke();
    });
}

function drawBubbles() {
    // Rising bubbles
    const bubbleCount = 15;
    for (let i = 0; i < bubbleCount; i++) {
        const x = (i * 127 + animationTime * 50) % canvas.width;
        const y = canvas.height - ((animationTime * 30 + i * 60) % canvas.height);
        const size = 2 + (i % 4);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCaustics() {
    // Animated light patterns (caustics) from water surface
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.08)';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 30) {
            const y = Math.sin((x + animationTime * 80 + i * 100) * 0.015) * 40 + 
                      Math.cos((x + animationTime * 60) * 0.008) * 30 + i * 110;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

function drawFish(fish) {
    const type = fishTypes[fish.typeId] || fishTypes[0];
    const size = fishSizes[fish.typeId] || 20;
    const swimTime = animationTime * 3 + fish.fishId.charCodeAt(0);
    const swimming = Math.sin(swimTime) * 0.15;
    
    // Enhanced swimming animations
    const tailWag = Math.sin(animationTime * 6 + fish.fishId.charCodeAt(0)) * 0.3;
    const finWave = Math.sin(animationTime * 4 + fish.fishId.charCodeAt(0) * 0.5) * 0.2;
    const bodyUndulate = Math.sin(animationTime * 5 + fish.fishId.charCodeAt(0)) * 0.08;
    
    // Determine if fish is moving left or right based on position change
    const movingRight = (fish.x > (fish.lastX || fish.x));
    fish.lastX = fish.x;
    
    ctx.save();
    ctx.translate(fish.x, fish.y);
    
    // Flip if moving left
    if (!movingRight) {
        ctx.scale(-1, 1);
    }
    
    // Apply subtle body undulation for realistic swimming
    const bodySegments = 5;
    const undulationData = [];
    for (let i = 0; i < bodySegments; i++) {
        undulationData.push(Math.sin(animationTime * 5 + fish.fishId.charCodeAt(0) + i * 0.8) * 0.12);
    }
    
    // Draw based on type with enhanced animation parameters
    const animParams = { tailWag, finWave, bodyUndulate, undulationData, swimming };
    
    switch (type.pattern) {
        case 'stripes':
            drawClownfish(size, type.colors, animParams);
            break;
        case 'gradient':
            drawAngelfish(size, type.colors, animParams);
            break;
        case 'spots':
            drawOctopus(size, type.colors, animParams);
            break;
        case 'dragon':
            drawDragon(size, type.colors, animParams);
            break;
        case 'turtle':
            drawSeaTurtle(size, type.colors, animParams);
            break;
        case 'manta':
            drawMantaRay(size, type.colors, animParams);
            break;
        case 'jellyfish':
            drawGiantJellyfish(size, type.colors, animParams);
            break;
        case 'hammerhead':
            drawHammerheadShark(size, type.colors, animParams);
            break;
        case 'nautilus':
            drawNautilus(size, type.colors, animParams);
            break;
        case 'megalodon':
            drawBoss_Megalodon(size, type.colors, animParams);
            break;
        case 'kraken':
            drawBoss_Kraken(size, type.colors, animParams);
            break;
        case 'leviathan':
            drawBoss_CosmicLeviathan(size, type.colors, animParams);
            break;
        case 'samurai':
            drawBoss_SamuraiSwordfish(size, type.colors, animParams);
            break;
        case 'carnival':
            drawBoss_CarnivalCrab(size, type.colors, animParams);
            break;
        case 'wizard':
            drawBoss_WizardOctopus(size, type.colors, animParams);
            break;
        case 'rocket':
            drawBoss_RocketHammerhead(size, type.colors, animParams);
            break;
        case 'pirate':
            drawBoss_PirateWhale(size, type.colors, animParams);
            break;
        case 'narwhal':
            drawBoss_NarwhalKing(size, type.colors, animParams);
            break;
        case 'phoenix':
            drawBoss_PhoenixRay(size, type.colors, animParams);
            break;
        case 'steampunk':
            drawBoss_SteampunkTurtle(size, type.colors, animParams);
            break;
    }
    
    ctx.restore();
}

function drawClownfish(size, colors, anim) {
    // Enhanced clownfish with realistic body, animated tail, scales
    const bodyGrad = ctx.createRadialGradient(0, -size * 0.2, 0, 0, 0, size * 1.3);
    bodyGrad.addColorStop(0, '#FFB366'); // Bright highlight
    bodyGrad.addColorStop(0.3, colors[0]);
    bodyGrad.addColorStop(0.7, colors[2]);
    bodyGrad.addColorStop(1, '#CC5500'); // Darker edges
    
    // Main body with undulation
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(anim.bodyUndulate * size, 0, size * 1.1, size * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body outline for definition
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // White stripes with soft edges
    ctx.fillStyle = colors[1];
    ctx.shadowBlur = 3;
    ctx.shadowColor = colors[1];
    ctx.fillRect(-size * 0.35, -size * 0.75, size * 0.25, size * 1.5);
    ctx.fillRect(size * 0.25, -size * 0.75, size * 0.2, size * 1.5);
    ctx.shadowBlur = 0;
    
    // Black stripe outlines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size * 0.35, -size * 0.75, size * 0.25, size * 1.5);
    ctx.strokeRect(size * 0.25, -size * 0.75, size * 0.2, size * 1.5);
    
    // Eye (white sclera + black pupil + highlight)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(size * 0.55, -size * 0.25, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 0.55, -size * 0.25, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(size * 0.58, -size * 0.28, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Dorsal fin (top)
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.75);
    ctx.quadraticCurveTo(-size * 0.1, -size * 1.1 + anim.finWave * size, size * 0.3, -size * 0.75);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.stroke();
    
    // Ventral fin (bottom)
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 0.75);
    ctx.quadraticCurveTo(-size * 0.3, size * 1.0 - anim.finWave * size, size * 0.1, size * 0.75);
    ctx.fill();
    ctx.stroke();
    
    // Animated tail with realistic movement
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.moveTo(-size * 1.0, 0);
    ctx.quadraticCurveTo(
        -size * 1.3, anim.tailWag * size,
        -size * 1.5, -size * 0.6 + anim.tailWag * size
    );
    ctx.lineTo(-size * 1.4, 0 + anim.tailWag * size * 0.5);
    ctx.quadraticCurveTo(
        -size * 1.3, -anim.tailWag * size * 0.3,
        -size * 1.5, size * 0.6 + anim.tailWag * size
    );
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size * 0.75, 0, size * 0.12, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
}

function drawAngelfish(size, colors, anim) {
    // Elegant tall angelfish with flowing fins
    const bodyGrad = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 1.5);
    bodyGrad.addColorStop(0, colors[0]);
    bodyGrad.addColorStop(0.5, colors[1]);
    bodyGrad.addColorStop(1, colors[2]);
    
    // Tall compressed body
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.9, size * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Vertical stripes for detail
    ctx.strokeStyle = colors[2] + '66';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size * 0.25, -size * 1.2);
        ctx.lineTo(i * size * 0.25, size * 1.2);
        ctx.stroke();
    }
    
    // Top dorsal fin (flowing with animation)
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 1.3);
    ctx.quadraticCurveTo(
        size * 0.3, -size * 2.0 + anim.finWave * size * 0.8,
        size * 0.5, -size * 1.3
    );
    ctx.lineTo(size * 0.2, -size * 1.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Bottom fin (flowing with animation)
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 1.3);
    ctx.quadraticCurveTo(
        size * 0.3, size * 2.0 - anim.finWave * size * 0.8,
        size * 0.5, size * 1.3
    );
    ctx.lineTo(size * 0.2, size * 1.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Eye with highlight
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(size * 0.45, -size * 0.4, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 0.45, -size * 0.4, size * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(size * 0.48, -size * 0.43, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail fin (elegant fan shape with animation)
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(-size * 0.9, 0);
    ctx.quadraticCurveTo(
        -size * 1.2, -size * 1.0 + anim.tailWag * size,
        -size * 1.4, -size * 0.9 + anim.tailWag * size
    );
    ctx.quadraticCurveTo(
        -size * 1.3, anim.tailWag * size * 0.5,
        -size * 1.2, 0
    );
    ctx.quadraticCurveTo(
        -size * 1.2, size * 1.0 + anim.tailWag * size,
        -size * 1.4, size * 0.9 + anim.tailWag * size
    );
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size * 0.7, 0, size * 0.1, Math.PI * 0.3, Math.PI * 0.7);
    ctx.stroke();
}

function drawOctopus(size, colors, anim) {
    // Octopus with bulbous head and flowing tentacles
    const headGrad = ctx.createRadialGradient(0, -size * 0.4, size * 0.2, 0, -size * 0.3, size * 1.3);
    headGrad.addColorStop(0, colors[0]);
    headGrad.addColorStop(0.5, colors[1]);
    headGrad.addColorStop(1, colors[2]);
    
    // Head/mantle with texture spots
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Texture spots
    ctx.fillStyle = colors[2] + '66';
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const spotX = Math.cos(angle) * size * 0.5;
        const spotY = -size * 0.3 + Math.sin(angle) * size * 0.5;
        ctx.beginPath();
        ctx.arc(spotX, spotY, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Eyes (large expressive)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-size * 0.35, -size * 0.5, size * 0.3, 0, Math.PI * 2);
    ctx.arc(size * 0.35, -size * 0.5, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-size * 0.35, -size * 0.5, size * 0.18, 0, Math.PI * 2);
    ctx.arc(size * 0.35, -size * 0.5, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-size * 0.32, -size * 0.53, size * 0.08, 0, Math.PI * 2);
    ctx.arc(size * 0.38, -size * 0.53, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // 8 undulating tentacles with suckers
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const wave = Math.sin(animationTime * 4 + i) * size * 0.35;
        const wave2 = Math.cos(animationTime * 3 + i * 0.5) * size * 0.2;
        
        // Tentacle gradient
        const tentGrad = ctx.createLinearGradient(0, size * 0.5, Math.cos(angle) * size * 1.8, size * 1.5);
        tentGrad.addColorStop(0, colors[1]);
        tentGrad.addColorStop(1, colors[2]);
        
        ctx.strokeStyle = tentGrad;
        ctx.lineWidth = size * 0.28;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, size * 0.6);
        const midX = Math.cos(angle) * size * 0.8 + wave2;
        const midY = size * 1.0 + wave * 0.5;
        const endX = Math.cos(angle) * size * 1.8 + wave;
        const endY = size * 1.5 + Math.sin(angle) * size * 0.9;
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();
        
        // Suckers on tentacle
        ctx.fillStyle = colors[0] + 'AA';
        for (let j = 0; j < 3; j++) {
            const t = (j + 1) / 4;
            const suckX = midX * (1 - t) + endX * t;
            const suckY = midY * (1 - t) + endY * t;
            ctx.beginPath();
            ctx.arc(suckX, suckY, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawDragon(size, colors, anim) {
    // Mythical dragon fish - elongated with fins
    const gradient = ctx.createLinearGradient(-size * 1.5, 0, size, 0);
    gradient.addColorStop(0, colors[2]);
    gradient.addColorStop(0.5, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    // Long serpentine body
    ctx.strokeStyle = gradient;
    ctx.lineWidth = size * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(-size * 1.5, 0);
    for (let i = 0; i < 5; i++) {
        const x = -size * 1.5 + i * size * 0.6;
        const y = Math.sin(animationTime * 2 + i * 0.5) * size * 0.3;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Head
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.ellipse(size * 0.8, 0, size * 0.9, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Horns
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = size * 0.15;
    ctx.beginPath();
    ctx.moveTo(size * 0.6, -size * 0.7);
    ctx.lineTo(size * 0.8, -size * 1.3);
    ctx.moveTo(size * 0.6, size * 0.7);
    ctx.lineTo(size * 0.8, size * 1.3);
    ctx.stroke();
    
    // Eye - glowing
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFD700';
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(size * 0.9, -size * 0.2, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Dorsal fins
    ctx.fillStyle = colors[1];
    for (let i = 0; i < 4; i++) {
        const x = -size + i * size * 0.5;
        const wave = Math.sin(animationTime * 3 + i) * size * 0.2;
        ctx.beginPath();
        ctx.moveTo(x, -size * 0.4);
        ctx.lineTo(x + size * 0.2, -size * 1.2 + wave);
        ctx.lineTo(x + size * 0.4, -size * 0.4);
        ctx.closePath();
        ctx.fill();
    }
}

function drawSeaTurtle(size, colors, anim) {
    // Sea turtle with shell and flippers
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, colors[1]);
    gradient.addColorStop(0.7, colors[0]);
    gradient.addColorStop(1, colors[2]);
    
    // Shell (oval)
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.1, size * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Shell pattern (hexagons)
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            ctx.beginPath();
            ctx.arc(i * size * 0.5, j * size * 0.4, size * 0.2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Head
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.ellipse(size * 1.3, 0, size * 0.4, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 1.4, -size * 0.1, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Flippers (animated)
    ctx.fillStyle = colors[0];
    const flapAngle = Math.sin(animationTime * 4) * 0.3;
    
    // Front flippers
    ctx.save();
    ctx.translate(size * 0.6, size * 0.6);
    ctx.rotate(flapAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.6, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(size * 0.6, -size * 0.6);
    ctx.rotate(-flapAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.6, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Back flippers
    ctx.save();
    ctx.translate(-size * 0.5, size * 0.5);
    ctx.rotate(flapAngle * 0.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(-size * 0.5, -size * 0.5);
    ctx.rotate(-flapAngle * 0.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawMantaRay(size, colors, anim) {
    // Graceful manta ray with wide wings
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    // Body (diamond shape)
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(size * 1.2, 0); // Front point
    ctx.quadraticCurveTo(0, -size * 1.2, -size * 0.8, 0); // Top wing
    ctx.quadraticCurveTo(0, size * 1.2, size * 1.2, 0); // Bottom wing
    ctx.closePath();
    ctx.fill();
    
    // Wing flapping animation
    const wingFlap = Math.sin(animationTime * 2) * size * 0.2;
    
    // Wing details (lines)
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(size * 0.8 - i * size * 0.3, 0);
        ctx.lineTo(size * 0.3 - i * size * 0.4, -size * 0.9 + wingFlap);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(size * 0.8 - i * size * 0.3, 0);
        ctx.lineTo(size * 0.3 - i * size * 0.4, size * 0.9 - wingFlap);
        ctx.stroke();
    }
    
    // Tail
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, 0);
    ctx.lineTo(-size * 1.8, -size * 0.15);
    ctx.lineTo(-size * 1.8, size * 0.15);
    ctx.closePath();
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(size * 0.5, -size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.5, size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 0.5, -size * 0.3, size * 0.08, 0, Math.PI * 2);
    ctx.arc(size * 0.5, size * 0.3, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
}

function drawGiantJellyfish(size, colors, anim) {
    // Translucent jellyfish with pulsing bell
    const pulse = Math.sin(animationTime * 3) * 0.15 + 1;
    
    // Bell (translucent dome)
    const gradient = ctx.createRadialGradient(0, -size * 0.3, 0, 0, -size * 0.3, size);
    gradient.addColorStop(0, colors[0] + '88'); // Add transparency
    gradient.addColorStop(0.6, colors[1] + '66');
    gradient.addColorStop(1, colors[2] + '44');
    
    ctx.save();
    ctx.scale(pulse, pulse);
    
    // Bell dome
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.3, size * 0.9, size * 0.7, 0, 0, Math.PI);
    ctx.fill();
    
    // Bell rim glow
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.3, size * 0.9, size * 0.7, 0, 0, Math.PI);
    ctx.stroke();
    
    ctx.restore();
    
    // Oral arms (4 thick arms)
    ctx.strokeStyle = colors[1] + 'AA';
    ctx.lineWidth = size * 0.15;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI - Math.PI / 2;
        const wave = Math.sin(animationTime * 4 + i) * size * 0.2;
        
        ctx.beginPath();
        ctx.moveTo(0, size * 0.2);
        ctx.quadraticCurveTo(
            Math.cos(angle) * size * 0.3 + wave,
            size * 0.6,
            Math.cos(angle) * size * 0.4 + wave,
            size * 1.3
        );
        ctx.stroke();
    }
    
    // Tentacles (many thin ones)
    ctx.strokeStyle = colors[0] + '77';
    ctx.lineWidth = size * 0.08;
    
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const length = size * (1.2 + (i % 3) * 0.3);
        const wave = Math.sin(animationTime * 5 + i * 0.5) * size * 0.15;
        
        ctx.beginPath();
        ctx.moveTo(0, size * 0.2);
        ctx.quadraticCurveTo(
            Math.cos(angle) * size * 0.2 + wave,
            size * 0.8,
            Math.cos(angle) * size * 0.3 + wave,
            length
        );
        ctx.stroke();
    }
}

function drawHammerheadShark(size, colors, anim) {
    // Hammerhead shark with distinctive head
    const gradient = ctx.createLinearGradient(-size, 0, size, 0);
    gradient.addColorStop(0, colors[2]);
    gradient.addColorStop(0.5, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    // Body
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.2, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Hammerhead (distinctive T-shape)
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    // Horizontal bar of hammer
    ctx.rect(size * 0.8, -size * 0.7, size * 0.4, size * 1.4);
    ctx.fill();
    
    // Head connection
    ctx.beginPath();
    ctx.rect(size * 0.5, -size * 0.25, size * 0.35, size * 0.5);
    ctx.fill();
    
    // Eyes on ends of hammer
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 1.0, -size * 0.6, size * 0.12, 0, Math.PI * 2);
    ctx.arc(size * 1.0, size * 0.6, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Dorsal fin
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.5);
    ctx.lineTo(size * 0.1, -size * 1.2);
    ctx.lineTo(size * 0.3, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Pectoral fins
    const finSwim = Math.sin(animationTime * 3) * 0.1;
    ctx.save();
    ctx.rotate(finSwim);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.5);
    ctx.lineTo(-size * 0.6, size * 1.0);
    ctx.lineTo(size * 0.2, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.rotate(-finSwim);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(-size * 0.6, -size * 1.0);
    ctx.lineTo(size * 0.2, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Tail
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(-size * 1.2, 0);
    ctx.lineTo(-size * 1.8, -size * 0.6);
    ctx.lineTo(-size * 1.5, 0);
    ctx.lineTo(-size * 1.8, size * 0.4);
    ctx.closePath();
    ctx.fill();
}

function drawNautilus(size, colors, anim) {
    // Spiral shell nautilus
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    // Shell spiral
    ctx.fillStyle = gradient;
    ctx.lineWidth = 3;
    ctx.strokeStyle = colors[2];
    
    // Draw spiral shell
    const spirals = 3;
    for (let s = 0; s < spirals; s++) {
        const radius = size * (0.3 + s * 0.25);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    // Spiral chamber lines
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * size * 0.8, Math.sin(angle) * size * 0.8);
        ctx.stroke();
    }
    
    // Opening for head/tentacles
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.arc(size * 0.9, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Tentacles (many small ones)
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI - Math.PI / 2;
        const tentacleWave = Math.sin(animationTime * 4 + i) * size * 0.1;
        
        ctx.beginPath();
        ctx.moveTo(size * 0.9, 0);
        ctx.quadraticCurveTo(
            size * 1.1 + tentacleWave,
            Math.sin(angle) * size * 0.3,
            size * 1.4,
            Math.sin(angle) * size * 0.5 + tentacleWave
        );
        ctx.stroke();
    }
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 1.0, -size * 0.15, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
}

function drawProjectile(proj) {
    // Glowing energy bullet (3x larger)
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00ffff';
    
    const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 20);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Energy trail (thicker and longer)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(proj.x, proj.y);
    ctx.lineTo(proj.x - proj.directionX * 25, proj.y - proj.directionY * 25);
    ctx.stroke();
}

function drawPlayerCannon(player) {
    const pos = getCannonPosition(player.playerSlot);
    const isMe = player.playerId === gameState.myPlayerId;
    
    // Get current rotation angle for this turret (in degrees)
    const angleInDegrees = turretRotations[player.playerSlot] || 0;
    const angle = angleInDegrees * (Math.PI / 180);
    
    // Draw turret housing (2.5x larger - 80x80 pixels)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // Turret rim (brass/metal)
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 80, 0, Math.PI * 2);
    ctx.stroke();
    
    // Turret glow for active player
    if (isMe) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ffff';
    }
    
    // Turret base (metallic look) - 2.5x larger
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 70);
    gradient.addColorStop(0, isMe ? '#00ffff' : '#999');
    gradient.addColorStop(0.5, isMe ? '#0099cc' : '#666');
    gradient.addColorStop(1, isMe ? '#006699' : '#333');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 70, 0, Math.PI * 2);
    ctx.fill();
    
    // Rotating turret barrel - smooth rotation animation
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    
    // Barrel with gradient (2.5x larger)
    const barrelGrad = ctx.createLinearGradient(0, -15, 0, 15);
    barrelGrad.addColorStop(0, isMe ? '#004466' : '#444');
    barrelGrad.addColorStop(0.5, isMe ? '#0066aa' : '#666');
    barrelGrad.addColorStop(1, isMe ? '#004466' : '#444');
    
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(0, -15, 70, 30);
    
    // Barrel tip (2.5x larger)
    ctx.fillStyle = isMe ? '#00ffff' : '#888';
    ctx.beginPath();
    ctx.arc(70, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;
    
    // Player UI (credits, bet controls, player names) is now rendered in HTML
    // All canvas player UI rendering has been removed
}


function showInteractionUI(interaction) {
    const overlay = document.getElementById('interactionOverlay');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    
    if (interaction.interactionType === 'Megalodon_QTE') {
        const targets = interaction.interactionData.targets || [];
        let html = '<div class="interaction-container">';
        html += '<h2 style="color: #ff0000;">MEGALODON KILL!</h2>';
        html += '<p style="color: #ffcc00;">Click the teeth targets!</p>';
        html += '<div class="teeth-targets">';
        
        targets.forEach((target, idx) => {
            html += `<button class="tooth-target" onclick="clickTooth('${interaction.interactionId}', ${idx})" data-tooth="${idx}">
                <span style="font-size: 40px;">🦷</span>
            </button>`;
        });
        
        html += '</div></div>';
        overlay.innerHTML = html;
        
    } else if (interaction.interactionType === 'Kraken_Choice') {
        const chests = interaction.interactionData.chests || [1, 2, 3];
        let html = '<div class="interaction-container">';
        html += '<h2 style="color: #8b00ff;">KRAKEN TREASURE!</h2>';
        html += '<p style="color: #ffcc00;">Choose a treasure chest!</p>';
        html += '<div class="chest-choices">';
        
        chests.forEach((chest, idx) => {
            html += `<button class="chest-btn" onclick="chooseChest('${interaction.interactionId}', ${idx})">
                <span style="font-size: 60px;">📦</span>
                <div>Chest ${idx + 1}</div>
            </button>`;
        });
        
        html += '</div></div>';
        overlay.innerHTML = html;
    }
}

function clickTooth(interactionId, toothIndex) {
    const teethHit = window.teethHit || new Set();
    teethHit.add(toothIndex);
    window.teethHit = teethHit;
    
    const toothBtn = document.querySelector(`[data-tooth="${toothIndex}"]`);
    if (toothBtn) {
        toothBtn.style.background = '#00ff00';
        toothBtn.disabled = true;
    }
    
    if (teethHit.size >= 5) {
        submitInteraction(interactionId, { teethHit: Array.from(teethHit) });
    }
}

function chooseChest(interactionId, chestIndex) {
    submitInteraction(interactionId, { chestChoice: chestIndex });
}

function submitInteraction(interactionId, data) {
    if (connection) {
        connection.invoke("SubmitInteraction", interactionId, data)
            .catch(err => console.error('Interaction error:', err));
    }
    
    const overlay = document.getElementById('interactionOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    window.teethHit = new Set();
}

function drawBoss_Megalodon(size, colors, anim) {
    const gradient = ctx.createLinearGradient(-size, -size * 0.6, size, size * 0.6);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.shadowBlur = 30;
    ctx.shadowColor = colors[2];
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.5, size * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI - Math.PI / 2;
        const toothX = size * 0.8 + Math.cos(angle) * size * 0.6;
        const toothY = Math.sin(angle) * size * 0.4;
        ctx.moveTo(toothX, toothY);
        ctx.lineTo(toothX + size * 0.15, toothY);
        ctx.lineTo(toothX + size * 0.075, toothY + size * 0.2);
    }
    ctx.fill();
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(size * 0.6, -size * 0.4, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawBoss_Kraken(size, colors, anim) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.6, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = size * 0.15;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const wave = Math.sin(animationTime * 3 + i) * size * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const endX = Math.cos(angle) * size * 2 + wave;
        const endY = Math.sin(angle) * size * 2 + wave;
        ctx.quadraticCurveTo(endX * 0.5, endY * 0.5, endX, endY);
        ctx.stroke();
        
        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.arc(endX, endY, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBoss_CosmicLeviathan(size, colors, anim) {
    ctx.save();
    
    ctx.shadowBlur = 40;
    ctx.shadowColor = colors[2];
    
    const gradient = ctx.createLinearGradient(-size * 1.5, 0, size * 1.5, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    
    for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.3 + i * 0.15;
        ctx.beginPath();
        ctx.ellipse(0, 0, size * (1.6 - i * 0.1), size * (0.7 - i * 0.05), 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1.0;
    
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * size * 2;
        const y = (Math.random() - 0.5) * size * 1.2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

function drawBoss_SamuraiSwordfish(size, colors, anim) {
    const gradient = ctx.createLinearGradient(-size, 0, size, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.2, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors[2];
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size * 1.2, 0);
    ctx.lineTo(size * 2.2, -size * 0.1);
    ctx.lineTo(size * 2.2, size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = colors[1];
    for (let i = 0; i < 3; i++) {
        const y = (i - 1) * size * 0.3;
        ctx.fillRect(-size * 0.5 + i * size * 0.2, y - size * 0.05, size * 0.4, size * 0.1);
    }
}

function drawBoss_CarnivalCrab(size, colors, anim) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.3, size * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = 'round';
    
    [-1, 1].forEach(side => {
        ctx.beginPath();
        ctx.moveTo(side * size * 0.8, 0);
        ctx.lineTo(side * size * 1.5, -size * 0.6);
        ctx.stroke();
        
        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.moveTo(side * size * 1.5, -size * 0.6);
        ctx.lineTo(side * size * 1.7, -size * 0.4);
        ctx.lineTo(side * size * 1.7, -size * 0.8);
        ctx.closePath();
        ctx.fill();
    });
    
    for (let i = 0; i < 6; i++) {
        const x = (i - 2.5) * size * 0.3;
        const y = size * 0.7 + Math.sin(animationTime * 5 + i) * size * 0.1;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = colors[0];
        ctx.fill();
    }
}

function drawBoss_WizardOctopus(size, colors, anim) {
    const gradient = ctx.createRadialGradient(0, -size * 0.3, 0, 0, -size * 0.3, size * 1.5);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.6, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size * 1.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors[2];
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size * 1.2);
    ctx.lineTo(0, -size * 1.8);
    ctx.lineTo(size * 0.4, -size * 1.2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = size * 0.15;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const wave = Math.sin(animationTime * 4 + i) * size * 0.3;
        const sparkle = Math.sin(animationTime * 8 + i) > 0.5;
        
        ctx.strokeStyle = sparkle ? colors[2] : colors[1];
        ctx.beginPath();
        ctx.moveTo(0, size * 0.5);
        const endX = Math.cos(angle) * size * 1.8 + wave;
        const endY = size * 1.5 + Math.sin(angle) * size;
        ctx.quadraticCurveTo(endX * 0.5, size + wave * 0.5, endX, endY);
        ctx.stroke();
        
        if (sparkle) {
            ctx.fillStyle = colors[2];
            ctx.beginPath();
            ctx.arc(endX, endY, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawBoss_RocketHammerhead(size, colors, anim) {
    const gradient = ctx.createLinearGradient(-size, 0, size, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.3, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors[0];
    ctx.fillRect(size * 0.4, -size * 0.9, size * 0.8, size * 0.25);
    ctx.fillRect(size * 0.4, size * 0.65, size * 0.8, size * 0.25);
    
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.arc(size * 0.8, -size * 0.8, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.8, size * 0.8, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    if (Math.sin(animationTime * 10) > 0) {
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-size * 1.2, -size * 0.2);
        ctx.lineTo(-size * 1.8, -size * 0.4);
        ctx.lineTo(-size * 1.8, 0);
        ctx.lineTo(-size * 1.2, size * 0.2);
        ctx.closePath();
        ctx.fill();
    }
}

function drawBoss_PirateWhale(size, colors, anim) {
    const gradient = ctx.createLinearGradient(-size * 1.5, 0, size * 1.5, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[0]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.6, size * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors[2];
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, -size * 0.7);
    ctx.lineTo(-size * 0.4, -size * 1.2);
    ctx.lineTo(0, -size * 0.7);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = size * 0.08;
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, -size * 0.7);
    ctx.lineTo(-size * 0.6, -size * 1.5);
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size * 0.6, -size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size * 0.65, -size * 0.35, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
}

function drawBoss_NarwhalKing(size, colors, anim) {
    const gradient = ctx.createLinearGradient(-size, 0, size, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = colors[2];
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.4, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = size * 0.08;
    ctx.beginPath();
    ctx.moveTo(size * 1.4, 0);
    ctx.lineTo(size * 2.5, -size * 0.3);
    ctx.stroke();
    
    for (let i = 0; i < 10; i++) {
        const t = i / 10;
        const x = size * 1.4 + (size * 1.1 * t);
        const y = -(size * 0.3 * t);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(x, y - size * 0.05, size * 0.1, size * 0.1);
    }
    
    ctx.shadowBlur = 0;
}

function drawBoss_PhoenixRay(size, colors, anim) {
    ctx.save();
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-size * 1.5, -size * 0.8, -size * 1.8, size * 0.8, 0, 0);
    ctx.bezierCurveTo(size * 1.5, -size * 0.8, size * 1.8, size * 0.8, 0, 0);
    ctx.fill();
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + animationTime * 2;
        const dist = size * 1.2;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        
        ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.lineTo(x * 0.9, y * 0.9);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
}

function drawBoss_SteampunkTurtle(size, colors, anim) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.6, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = size * 0.08;
    for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        ctx.arc(0, 0, size * (0.4 + ring * 0.3), 0, Math.PI * 2);
        ctx.stroke();
    }
    
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * size * 0.9;
        const y = Math.sin(angle) * size * 0.9;
        
        ctx.fillStyle = colors[1];
        ctx.fillRect(x - size * 0.08, y - size * 0.08, size * 0.16, size * 0.16);
    }
    
    const gearAngle = animationTime * 2;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + gearAngle;
        const x = Math.cos(angle) * size * 0.5;
        const y = Math.sin(angle) * size * 0.5;
        
        ctx.fillStyle = colors[2];
        ctx.fillRect(x - size * 0.05, y - size * 0.1, size * 0.1, size * 0.2);
    }
}

// Toggle functions for targeting and auto-fire
function toggleTargetMode() {
    targetingArmed = !targetingArmed;
    updateTargetModeButton();
    console.log('Targeting mode:', targetingArmed ? 'ARMED' : 'OFF');
}

function toggleAutoFire() {
    autoFireEnabled = !autoFireEnabled;
    updateAutoFireButton();
    
    // Stop auto-fire if it's being disabled
    if (!autoFireEnabled) {
        stopAutoFire();
    }
    
    console.log('Auto-fire mode:', autoFireEnabled ? 'ENABLED' : 'DISABLED');
}

function clearTarget() {
    targetedFishId = null;
    console.log('Target cleared');
}

function updateTargetModeButton() {
    const btn = document.getElementById('targetModeBtn');
    if (btn) {
        if (targetingArmed) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

function updateAutoFireButton() {
    const btn = document.getElementById('autoFireBtn');
    if (btn) {
        if (autoFireEnabled) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

// Mouse event handlers for auto-fire
function handleMouseDown(event) {
    if (!autoFireEnabled) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    
    // Only start auto-fire if within play area
    if (!isWithinPlayArea(canvasX, canvasY)) {
        return;
    }
    
    // Store mouse position
    lastMousePos = { x: canvasX, y: canvasY };
    
    // Start auto-firing
    isHoldingDown = true;
    startAutoFire();
}

function handleMouseUp(event) {
    if (!autoFireEnabled) return;
    
    // Stop auto-firing
    isHoldingDown = false;
    stopAutoFire();
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    
    // If mouse moves outside play area and auto-fire is active, stop it
    if (!isWithinPlayArea(canvasX, canvasY)) {
        if (autoFireEnabled && isHoldingDown) {
            isHoldingDown = false;
            stopAutoFire();
        }
        return;
    }
    
    // Update mouse position
    lastMousePos = { x: canvasX, y: canvasY };
}

function startAutoFire() {
    // Fire immediately
    fireProjectile();
    
    // Set up interval to fire every 200ms
    if (autoFireInterval) {
        clearInterval(autoFireInterval);
    }
    
    autoFireInterval = setInterval(() => {
        if (isHoldingDown) {
            fireProjectile();
        } else {
            stopAutoFire();
        }
    }, 200);
}

function stopAutoFire() {
    if (autoFireInterval) {
        clearInterval(autoFireInterval);
        autoFireInterval = null;
    }
}

function fireProjectile() {
    if (!connection || gameState.myPlayerSlot === null) return;
    
    const cannonPos = getCannonPosition(gameState.myPlayerSlot);
    const playerX = cannonPos.x;
    const playerY = cannonPos.y;
    
    let targetX, targetY;
    
    // If we have a targeted fish, fire at it
    if (targetedFishId) {
        const targetFish = gameState.fish.find(f => f.fishId === targetedFishId);
        if (targetFish) {
            targetX = targetFish.x;
            targetY = targetFish.y;
        } else {
            // Target fish is gone, clear it
            clearTarget();
            targetX = lastMousePos.x;
            targetY = lastMousePos.y;
        }
    } else {
        // Fire toward mouse cursor
        targetX = lastMousePos.x;
        targetY = lastMousePos.y;
    }
    
    // Don't fire if target is outside play area
    if (!isWithinPlayArea(targetX, targetY)) {
        return;
    }
    
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Update turret target rotation for smooth animation
    if (length > 0 && gameState.myPlayerSlot >= 0 && gameState.myPlayerSlot < 6) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        turretTargetRotations[gameState.myPlayerSlot] = targetAngle;
    }
    
    if (length > 0) {
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Send fire command to server
        connection.invoke("Fire", playerX, playerY, dirX, dirY)
            .catch(err => console.error('Fire error:', err));
    }
}
