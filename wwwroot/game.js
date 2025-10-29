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

// Fish visual varieties - exotic aquarium creatures
const fishTypes = {
    0: { // Small - Tropical Fish
        name: 'Clownfish',
        colors: ['#FF6B35', '#FFFFFF', '#FFA500'],
        pattern: 'stripes',
        tailType: 'fan'
    },
    1: { // Medium - Fancy Fish  
        name: 'Angelfish',
        colors: ['#FFD700', '#FFA500', '#FF6B35'],
        pattern: 'gradient',
        tailType: 'long'
    },
    2: { // Large - Exotic Creatures
        name: 'Octopus',
        colors: ['#9B59B6', '#E74C3C', '#8E44AD'],
        pattern: 'spots',
        tailType: 'tentacles'
    },
    3: { // Boss - Legendary
        name: 'Golden Dragon',
        colors: ['#FFD700', '#FFA500', '#FF6B00'],
        pattern: 'dragon',
        tailType: 'dragon'
    },
    4: { // Special - Sea Turtle
        name: 'Sea Turtle',
        colors: ['#2E8B57', '#3CB371', '#228B22'],
        pattern: 'turtle',
        tailType: 'flippers'
    },
    5: { // Special - Manta Ray
        name: 'Manta Ray',
        colors: ['#1E3A5F', '#2E5090', '#4169E1'],
        pattern: 'manta',
        tailType: 'wings'
    },
    6: { // Special - Giant Jellyfish
        name: 'Giant Jellyfish',
        colors: ['#FF69B4', '#FF1493', '#C71585'],
        pattern: 'jellyfish',
        tailType: 'tentacles'
    },
    7: { // Special - Hammerhead Shark
        name: 'Hammerhead Shark',
        colors: ['#708090', '#778899', '#696969'],
        pattern: 'hammerhead',
        tailType: 'shark'
    },
    8: { // Special - Nautilus
        name: 'Nautilus',
        colors: ['#DEB887', '#D2691E', '#CD853F'],
        pattern: 'nautilus',
        tailType: 'shell'
    },
    9: { // Ultra-Rare - Kaiju Megalodon
        name: 'Kaiju Megalodon',
        colors: ['#1C1C1C', '#8B0000', '#FF0000'],
        pattern: 'megalodon',
        tailType: 'massive'
    },
    10: { // Ultra-Rare - Emperor Kraken
        name: 'Emperor Kraken',
        colors: ['#4B0082', '#8B008B', '#FF00FF'],
        pattern: 'kraken',
        tailType: 'tentacles'
    },
    11: { // Ultra-Rare - Cosmic Leviathan
        name: 'Cosmic Leviathan',
        colors: ['#000033', '#6A0DAD', '#00FFFF'],
        pattern: 'leviathan',
        tailType: 'cosmic'
    },
    12: { // Ultra-Rare - Samurai Swordfish
        name: 'Samurai Swordfish',
        colors: ['#C0C0C0', '#FF0000', '#FFD700'],
        pattern: 'samurai',
        tailType: 'blade'
    },
    13: { // Ultra-Rare - Carnival King Crab
        name: 'Carnival King Crab',
        colors: ['#FF1493', '#FFD700', '#00CED1'],
        pattern: 'carnival',
        tailType: 'claws'
    },
    14: { // Ultra-Rare - Wizard Octopus
        name: 'Wizard Octopus',
        colors: ['#4B0082', '#9370DB', '#FFD700'],
        pattern: 'wizard',
        tailType: 'magic'
    },
    15: { // Ultra-Rare - Rocket Hammerhead
        name: 'Rocket Hammerhead',
        colors: ['#FF4500', '#1E90FF', '#FFFFFF'],
        pattern: 'rocket',
        tailType: 'boosters'
    },
    16: { // Ultra-Rare - Pirate Captain Whale
        name: 'Pirate Captain Whale',
        colors: ['#2F4F4F', '#8B4513', '#FFD700'],
        pattern: 'pirate',
        tailType: 'whale'
    },
    17: { // Ultra-Rare - Frozen Narwhal King
        name: 'Frozen Narwhal King',
        colors: ['#B0E0E6', '#4682B4', '#FFFFFF'],
        pattern: 'narwhal',
        tailType: 'frozen'
    },
    18: { // Ultra-Rare - Phoenix Ray
        name: 'Phoenix Ray',
        colors: ['#FF4500', '#FFD700', '#FF6347'],
        pattern: 'phoenix',
        tailType: 'flames'
    },
    19: { // Ultra-Rare - Steampunk Turtle Fortress
        name: 'Steampunk Turtle',
        colors: ['#8B4513', '#C0C0C0', '#FFD700'],
        pattern: 'steampunk',
        tailType: 'fortress'
    },
    20: { // Extended - Lantern Fish
        name: 'Lantern Fish',
        colors: ['#FFD700', '#FFA500', '#FFFF00'],
        pattern: 'gradient',
        tailType: 'fan'
    },
    21: { // Extended - Deep Sea Turtle
        name: 'Deep Sea Turtle',
        colors: ['#006400', '#228B22', '#32CD32'],
        pattern: 'turtle',
        tailType: 'flippers'
    },
    22: { // Extended - Saw Shark
        name: 'Saw Shark',
        colors: ['#4682B4', '#5F9EA0', '#87CEEB'],
        pattern: 'hammerhead',
        tailType: 'shark'
    },
    23: { // Extended - Devilfish (Manta)
        name: 'Devilfish',
        colors: ['#2F4F4F', '#000080', '#191970'],
        pattern: 'manta',
        tailType: 'wings'
    },
    24: { // Extended - Jumbo Fish
        name: 'Jumbo Fish',
        colors: ['#FF6347', '#FF4500', '#DC143C'],
        pattern: 'spots',
        tailType: 'tentacles'
    },
    25: { // Extended - Great White Shark
        name: 'Great White Shark',
        colors: ['#708090', '#DCDCDC', '#696969'],
        pattern: 'hammerhead',
        tailType: 'shark'
    },
    26: { // Extended - Killer Whale (Orca)
        name: 'Killer Whale',
        colors: ['#000000', '#FFFFFF', '#2F4F4F'],
        pattern: 'pirate',
        tailType: 'whale'
    },
    27: { // Extended - Golden Dragon King
        name: 'Golden Dragon King',
        colors: ['#FFD700', '#FFA500', '#FF8C00'],
        pattern: 'dragon',
        tailType: 'dragon'
    }
};

const fishSizes = [15, 25, 40, 70, 38, 45, 40, 43, 35, 120, 130, 140, 110, 115, 105, 125, 135, 100, 128, 118, 45, 50, 55, 60, 65, 85, 95, 150]; // Regular 0-8, Ultra-rare 9-19, Extended 20-27

// Turret positions for each player slot (0-7) - positioned at table corners and sides
const cannonPositions = [
    { x: 50, y: 50, rotation: 135 },      // Slot 0: Top-left corner
    { x: 533, y: 20, rotation: 180 },     // Slot 1: Top-left third
    { x: 1067, y: 20, rotation: 180 },    // Slot 2: Top-right third  
    { x: 1550, y: 50, rotation: 225 },    // Slot 3: Top-right corner
    { x: 1550, y: 750, rotation: 315 },   // Slot 4: Bottom-right corner
    { x: 1067, y: 780, rotation: 0 },     // Slot 5: Bottom-right third
    { x: 533, y: 780, rotation: 0 },      // Slot 6: Bottom-left third
    { x: 50, y: 750, rotation: 45 }       // Slot 7: Bottom-left corner
];

// Track current turret rotation angles for smooth animation
const turretRotations = [135, 180, 180, 225, 315, 0, 0, 45]; // Initialize with default rotations
const turretTargetRotations = [135, 180, 180, 225, 315, 0, 0, 45]; // Target rotations for interpolation

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
    // Maintain billiards table aspect ratio (2:1 like a pool table)
    const container = document.getElementById('gameContainer');
    const width = container.clientWidth;
    const height = Math.round(width * 0.5); // 2:1 ratio
    
    canvas.width = 1600;
    canvas.height = 800; // Billiards table proportions
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
    selectionCanvas.width = 1600;
    selectionCanvas.height = 800;
    
    // Draw turret positions
    function drawSelectionScreen() {
        // Ocean background
        const gradient = selCtx.createLinearGradient(0, 0, 0, selectionCanvas.height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(1, '#004d7a');
        selCtx.fillStyle = gradient;
        selCtx.fillRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        
        // Draw all 8 turret positions
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
    
    // Get the player's cannon position based on their slot
    const cannonPos = getCannonPosition(gameState.myPlayerSlot);
    const playerX = cannonPos.x;
    const playerY = cannonPos.y;
    
    const dx = canvasX - playerX;
    const dy = canvasY - playerY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Update turret target rotation for smooth animation
    if (length > 0 && gameState.myPlayerSlot >= 0 && gameState.myPlayerSlot < 8) {
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
    updateBetDisplay();
    sendBetValueToServer();
}

function decreaseBet() {
    betValue = Math.max(10, betValue - 10);
    updateBetDisplay();
    sendBetValueToServer();
}

function updateBetDisplay() {
    const betValueElement = document.getElementById('betValue');
    if (betValueElement) {
        betValueElement.textContent = betValue;
    }
}

function sendBetValueToServer() {
    if (connection) {
        connection.invoke("SetBetValue", betValue)
            .catch(err => console.error('Bet value error:', err));
    }
}

function handleStateDelta(delta) {
    gameState.tickId = delta.tickId;
    gameState.players = delta.players;
    gameState.fish = delta.fish;
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
    for (let i = 0; i < 8; i++) {
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
    
    // Determine if fish is moving left or right based on position change
    const movingRight = (fish.x > (fish.lastX || fish.x));
    fish.lastX = fish.x;
    
    ctx.save();
    ctx.translate(fish.x, fish.y);
    
    // Flip if moving left
    if (!movingRight) {
        ctx.scale(-1, 1);
    }
    
    // Draw based on type
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
}

function drawClownfish(size, colors, swimming) {
    // Orange body with white stripes
    const gradient = ctx.createLinearGradient(-size, -size / 2, size, size / 2);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[2]);
    gradient.addColorStop(1, colors[0]);
    
    // Body
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // White stripes
    ctx.fillStyle = colors[1];
    ctx.fillRect(-size * 0.3, -size * 0.7, size * 0.2, size * 1.4);
    ctx.fillRect(size * 0.3, -size * 0.7, size * 0.15, size * 1.4);
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 0.5, -size * 0.2, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(-size * 1.5, -size * 0.5 + swimming * size);
    ctx.lineTo(-size * 1.5, size * 0.5 + swimming * size);
    ctx.closePath();
    ctx.fill();
}

function drawAngelfish(size, colors, swimming) {
    // Tall, elegant fish
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    // Tall body
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.8, size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Top fin
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.2);
    ctx.lineTo(size * 0.5, -size * 1.8 + swimming * size * 0.5);
    ctx.lineTo(size * 0.3, -size * 1.2);
    ctx.closePath();
    ctx.fill();
    
    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(0, size * 1.2);
    ctx.lineTo(size * 0.5, size * 1.8 + swimming * size * 0.5);
    ctx.lineTo(size * 0.3, size * 1.2);
    ctx.closePath();
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 0.4, -size * 0.3, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail fin
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, 0);
    ctx.lineTo(-size * 1.3, -size * 0.8 + swimming * size);
    ctx.lineTo(-size * 1.1, 0);
    ctx.lineTo(-size * 1.3, size * 0.8 + swimming * size);
    ctx.closePath();
    ctx.fill();
}

function drawOctopus(size, colors, swimming) {
    // Round head with tentacles
    const gradient = ctx.createRadialGradient(0, -size * 0.3, 0, 0, -size * 0.3, size * 1.2);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.6, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    // Head/mantle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-size * 0.3, -size * 0.5, size * 0.25, 0, Math.PI * 2);
    ctx.arc(size * 0.3, -size * 0.5, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-size * 0.3, -size * 0.5, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.3, -size * 0.5, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Tentacles (8 of them, animated)
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = size * 0.25;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const wave = Math.sin(animationTime * 4 + i) * size * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(0, size * 0.5);
        const endX = Math.cos(angle) * size * 1.5 + wave;
        const endY = size * 1.2 + Math.sin(angle) * size * 0.8;
        ctx.quadraticCurveTo(endX * 0.5, size + wave * 0.5, endX, endY);
        ctx.stroke();
    }
}

function drawDragon(size, colors, swimming) {
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

function drawSeaTurtle(size, colors, swimming) {
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

function drawMantaRay(size, colors, swimming) {
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

function drawGiantJellyfish(size, colors, swimming) {
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

function drawHammerheadShark(size, colors, swimming) {
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

function drawNautilus(size, colors, swimming) {
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
    // Glowing energy bullet
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    
    const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 8);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Energy trail
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(proj.x, proj.y);
    ctx.lineTo(proj.x - proj.directionX * 15, proj.y - proj.directionY * 15);
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
    
    // Player name with background
    const nameOffset = player.playerSlot < 4 ? 100 : -100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(pos.x - 60, pos.y + nameOffset - 18, 120, 24);
    
    ctx.fillStyle = isMe ? '#00ffff' : '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.displayName, pos.x, pos.y + nameOffset);
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

function drawBoss_Megalodon(size, colors, swimming) {
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

function drawBoss_Kraken(size, colors, swimming) {
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

function drawBoss_CosmicLeviathan(size, colors, swimming) {
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

function drawBoss_SamuraiSwordfish(size, colors, swimming) {
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

function drawBoss_CarnivalCrab(size, colors, swimming) {
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

function drawBoss_WizardOctopus(size, colors, swimming) {
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

function drawBoss_RocketHammerhead(size, colors, swimming) {
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

function drawBoss_PirateWhale(size, colors, swimming) {
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

function drawBoss_NarwhalKing(size, colors, swimming) {
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

function drawBoss_PhoenixRay(size, colors, swimming) {
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

function drawBoss_SteampunkTurtle(size, colors, swimming) {
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
