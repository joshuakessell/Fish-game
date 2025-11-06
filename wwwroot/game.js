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

let canvas, ctx;
let betValue = 10;
let playerName = '';
let animationTime = 0;

// Animation tracking
let previousFish = [];
let dyingFish = []; // { fish, progress (0-1), x, y, type }
let creditPopups = []; // { x, y, amount, progress (0-1) }

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

// Play area configuration (centered on 2400x1400 canvas)
const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1400;
const PLAY_AREA = {
    x: 300,          // Left margin
    y: 250,          // Top margin
    width: 1800,     // Play area width (2:1 aspect ratio)
    height: 900      // Play area height
};

// Turret positions for 6 players (3 top, 3 bottom)
const cannonPositions = [
    { x: 900, y: 250, rotation: 180 },    // Slot 0: Top-left (2/3 from left edge)
    { x: 1200, y: 250, rotation: 180 },   // Slot 1: Top-center
    { x: 1500, y: 250, rotation: 180 },   // Slot 2: Top-right (2/3 from left edge)
    { x: 900, y: 1150, rotation: 0 },     // Slot 3: Bottom-left (2/3 from left edge)
    { x: 1200, y: 1150, rotation: 0 },    // Slot 4: Bottom-center
    { x: 1500, y: 1150, rotation: 0 }     // Slot 5: Bottom-right (2/3 from left edge)
];

// Track current turret rotation angles for smooth animation
const turretRotations = [180, 180, 180, 0, 0, 0]; // Initialize with default rotations
const turretTargetRotations = [180, 180, 180, 0, 0, 0]; // Target rotations for interpolation

function getCannonPosition(slot) {
    return cannonPositions[slot] || cannonPositions[0];
}

let connection;

async function joinGame() {
    playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    try {
        // Initialize SignalR connection
        connection = new signalR.HubConnectionBuilder()
            .withUrl("/gamehub")
            .withAutomaticReconnect()
            .build();

        // Set up event handlers
        connection.on("StateDelta", handleStateDelta);

        connection.onreconnecting(() => {
            document.getElementById('connectionStatus').innerHTML = 
                '<span class="status-disconnected">Reconnecting...</span>';
        });

        connection.onreconnected(async () => {
            // Rejoin the match after reconnection
            try {
                const result = await connection.invoke("JoinMatch", playerName);
                if (result.success) {
                    gameState.myPlayerId = result.playerId;
                    gameState.myPlayerSlot = result.playerSlot;
                    document.getElementById('connectionStatus').innerHTML = 
                        '<span class="status-connected">● Connected</span>';
                    console.log("Rejoined match after reconnection");
                }
            } catch (error) {
                console.error("Failed to rejoin match:", error);
            }
        });

        connection.onclose(() => {
            document.getElementById('connectionStatus').innerHTML = 
                '<span class="status-disconnected">● Disconnected</span>';
        });

        // Connect
        await connection.start();
        console.log("Connected to server");

        // Join match
        const result = await connection.invoke("JoinMatch", playerName);
        console.log("Join result:", result);

        if (result.success) {
            gameState.myPlayerId = result.playerId;
            gameState.myPlayerSlot = result.playerSlot;
            
            document.getElementById('connectionStatus').innerHTML = 
                '<span class="status-connected">● Connected</span>';
            
            // Show turret selection if not assigned yet
            if (result.playerSlot === -1 && result.availableSlots && result.availableSlots.length > 0) {
                showTurretSelection(result.availableSlots);
            } else {
                // Start game directly if slot already assigned
                startGame();
                
                // Initialize canvas
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
        } else {
            alert('Failed to join game: ' + result.message);
        }
    } catch (error) {
        console.error('Connection error:', error);
        alert('Failed to connect to server');
    }
}

function resizeCanvas() {
    // Maintain aspect ratio for larger board
    const container = document.getElementById('gameContainer');
    const width = container.clientWidth;
    const height = Math.round(width * (CANVAS_HEIGHT / CANVAS_WIDTH));
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}

function startGame() {
    // Hide login, show game
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
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
    selectionCanvas.width = CANVAS_WIDTH;
    selectionCanvas.height = CANVAS_HEIGHT;
    
    // Draw turret positions
    function drawSelectionScreen() {
        // Ocean background
        const gradient = selCtx.createLinearGradient(0, 0, 0, selectionCanvas.height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(1, '#004d7a');
        selCtx.fillStyle = gradient;
        selCtx.fillRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        
        // Draw play area boundary
        selCtx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        selCtx.lineWidth = 3;
        selCtx.strokeRect(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
        
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
                        startGame();
                        
                        // Initialize canvas for game
                        canvas = document.getElementById('gameCanvas');
                        ctx = canvas.getContext('2d');
                        resizeCanvas();
                        window.addEventListener('resize', resizeCanvas);
                        canvas.addEventListener('click', handleClick);
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
    
    // Check if clicking on +/- buttons for bet value
    if (window.betButtonBounds && window.betButtonBounds[gameState.myPlayerSlot]) {
        const bounds = window.betButtonBounds[gameState.myPlayerSlot];
        
        // Check minus button
        if (canvasX >= bounds.minus.x && canvasX <= bounds.minus.x + bounds.minus.width &&
            canvasY >= bounds.minus.y && canvasY <= bounds.minus.y + bounds.minus.height) {
            decreaseBet();
            return; // Don't fire
        }
        
        // Check plus button
        if (canvasX >= bounds.plus.x && canvasX <= bounds.plus.x + bounds.plus.width &&
            canvasY >= bounds.plus.y && canvasY <= bounds.plus.y + bounds.plus.height) {
            increaseBet();
            return; // Don't fire
        }
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
    sendBetValueToServer();
}

function decreaseBet() {
    betValue = Math.max(10, betValue - 10);
    sendBetValueToServer();
}

function sendBetValueToServer() {
    if (connection) {
        connection.invoke("SetBetValue", betValue)
            .catch(err => console.error('Bet value error:', err));
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
            // Fish died - add to dying animation array (use typeId not fishType)
            dyingFish.push({
                fish: oldFish,
                progress: 0,
                x: oldFish.x,
                y: oldFish.y,
                type: oldFish.typeId
            });
            
            // If this fish was killed by the current player, add credit popup
            if (oldPlayer && newPlayer && newPlayer.credits > oldPlayer.credits) {
                const creditsEarned = Math.floor(newPlayer.credits - oldPlayer.credits);
                creditPopups.push({
                    x: oldFish.x,
                    y: oldFish.y,
                    amount: creditsEarned,
                    progress: 0
                });
            }
        }
    });
    
    previousFish = newFish;
    gameState.players = delta.players;
    gameState.fish = newFish;
    gameState.projectiles = delta.projectiles;
    gameState.roundNumber = delta.roundNumber || 1;
    gameState.timeRemainingTicks = delta.timeRemainingTicks || 18000;
    gameState.isRoundTransitioning = delta.isRoundTransitioning || false;
    gameState.activeBossSequences = delta.activeBossSequences || [];
    gameState.pendingInteractions = delta.pendingInteractions || [];
    
    if (gameState.pendingInteractions.length > 0) {
        const myInteraction = gameState.pendingInteractions.find(i => i.playerId === gameState.myPlayerId);
        if (myInteraction) {
            showInteractionUI(myInteraction);
        }
    }
}


function render() {
    animationTime += 0.016;
    
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
    
    // Draw play area boundary
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
    
    // Add inner glow to play area
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 8;
    ctx.strokeRect(PLAY_AREA.x - 4, PLAY_AREA.y - 4, PLAY_AREA.width + 8, PLAY_AREA.height + 8);
    
    // Draw underwater elements
    drawKelp();
    drawBubbles();
    
    // Draw fish (behind bullets)
    gameState.fish.forEach(fish => {
        drawFish(fish);
    });
    
    // Update and draw dying fish animations (0.25s duration)
    dyingFish = dyingFish.filter(dying => {
        dying.progress += 0.016 / 0.25; // Increment based on frame time / total duration
        if (dying.progress >= 1) return false; // Remove completed animations
        
        // Draw dying fish with spin, shrink, and fade
        const type = fishTypes[dying.type] || fishTypes[0];
        const size = fishSizes[dying.type] || 20;
        const swimming = Math.sin(animationTime * 3) * 0.2;
        
        ctx.save();
        ctx.translate(dying.x, dying.y);
        
        // Spin effect (multiple rotations)
        ctx.rotate(dying.progress * Math.PI * 4); // 2 full rotations
        
        // Shrink effect
        const scale = 1 - dying.progress * 0.7; // Shrink to 30% of original size
        ctx.scale(scale, scale);
        
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
    
    // Determine if turret is on top (slots 0-2) or bottom (slots 3-5)
    const isTopTurret = player.playerSlot < 3;
    
    // Draw UI elements OUTSIDE play area
    // Top turrets: UI goes ABOVE the play area (in top margin)
    // Bottom turrets: UI goes BELOW the play area (in bottom margin)
    const betY = isTopTurret ? pos.y - 100 : pos.y + 100;
    
    if (isMe) {
        // Draw bet value with +/- buttons for active player
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(pos.x - 70, betY - 15, 140, 30);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - 70, betY - 15, 140, 30);
        
        // - button
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(pos.x - 68, betY - 13, 26, 26);
        ctx.strokeStyle = '#00ffff';
        ctx.strokeRect(pos.x - 68, betY - 13, 26, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('-', pos.x - 55, betY + 6);
        
        // + button
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(pos.x + 42, betY - 13, 26, 26);
        ctx.strokeStyle = '#00ffff';
        ctx.strokeRect(pos.x + 42, betY - 13, 26, 26);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('+', pos.x + 55, betY + 6);
        
        // Bet value in center
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`$${betValue}`, pos.x, betY + 5);
        
        // Store button bounds for click detection
        if (!window.betButtonBounds) window.betButtonBounds = {};
        window.betButtonBounds[player.playerSlot] = {
            minus: { x: pos.x - 68, y: betY - 13, width: 26, height: 26 },
            plus: { x: pos.x + 42, y: betY - 13, width: 26, height: 26 }
        };
    } else {
        // Show bet value only for other players
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`$${player.betValue || 10}`, pos.x, betY + 5);
    }
    
    // Player name (further from play area)
    const nameY = isTopTurret ? pos.y - 140 : pos.y + 140;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(pos.x - 60, nameY - 15, 120, 24);
    
    ctx.fillStyle = isMe ? '#00ffff' : '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.displayName, pos.x, nameY);
    
    // Credits (closest to play area)
    const creditsY = isTopTurret ? pos.y - 60 : pos.y + 60;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(pos.x - 65, creditsY - 18, 130, 30);
    ctx.strokeStyle = isMe ? '#00ffff' : '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x - 65, creditsY - 18, 130, 30);
    
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffcc00';
    ctx.fillText(`💰 ${Math.floor(player.credits)}`, pos.x, creditsY);
    ctx.shadowBlur = 0;
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
