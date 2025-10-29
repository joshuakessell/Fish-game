// Global state
const gameState = {
    players: [],
    fish: [],
    projectiles: [],
    tickId: 0,
    myPlayerId: null,
    myPlayerSlot: null
};

let canvas, ctx;
let currentWeapon = 0;
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
    }
};

const fishSizes = [15, 25, 40, 70]; // Small, Medium, Large, Boss

// Cannon positions for each player slot (0-7) - positioned like billiards table pockets
const cannonPositions = [
    { x: 80, y: 80 },      // Slot 0: Top-left corner pocket
    { x: 1520, y: 80 },    // Slot 1: Top-right corner pocket
    { x: 80, y: 720 },     // Slot 2: Bottom-left corner pocket
    { x: 1520, y: 720 },   // Slot 3: Bottom-right corner pocket
    { x: 800, y: 80 },     // Slot 4: Top-middle pocket
    { x: 800, y: 720 },    // Slot 5: Bottom-middle pocket
    { x: 80, y: 400 },     // Slot 6: Left-middle pocket
    { x: 1520, y: 400 }    // Slot 7: Right-middle pocket
];

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
            
            // Hide login, show game
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'flex';
            document.getElementById('connectionStatus').innerHTML = 
                '<span class="status-connected">● Connected</span>';
            
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

function changeWeapon(weaponType) {
    currentWeapon = weaponType;
    
    // Update UI
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Send to server
    if (connection) {
        connection.invoke("ChangeWeapon", weaponType)
            .catch(err => console.error('Weapon change error:', err));
    }
}

function handleStateDelta(delta) {
    gameState.tickId = delta.tickId;
    gameState.players = delta.players;
    gameState.fish = delta.fish;
    gameState.projectiles = delta.projectiles;
    
    // Update players list
    updatePlayersList();
}

function updatePlayersList() {
    const listContent = document.getElementById('playersListContent');
    const playerCount = gameState.players.length;
    
    document.querySelector('#playersList h3').textContent = `Players (${playerCount}/8)`;
    
    let html = '';
    for (let i = 0; i < 8; i++) {
        const player = gameState.players.find(p => p.playerSlot === i);
        if (player) {
            const isMe = player.playerId === gameState.myPlayerId;
            html += `<div class="player-slot active">
                ${i + 1}. ${player.displayName} ${isMe ? '(You)' : ''} - 💰${Math.floor(player.credits)}
            </div>`;
        } else {
            html += `<div class="player-slot">${i + 1}. <em>Empty</em></div>`;
        }
    }
    
    listContent.innerHTML = html;
}

function render() {
    animationTime += 0.016;
    
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
        case 'stripes': // Clownfish
            drawClownfish(size, type.colors, swimming);
            break;
        case 'gradient': // Angelfish
            drawAngelfish(size, type.colors, swimming);
            break;
        case 'spots': // Octopus
            drawOctopus(size, type.colors, swimming);
            break;
        case 'dragon': // Golden Dragon
            drawDragon(size, type.colors, swimming);
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
    
    // Draw pocket/turret housing (darker circle showing the "pocket")
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Pocket rim (brass/metal)
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
    ctx.stroke();
    
    // Cannon glow for active player
    if (isMe) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ffff';
    }
    
    // Cannon turret base (metallic look)
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 28);
    gradient.addColorStop(0, isMe ? '#00ffff' : '#999');
    gradient.addColorStop(0.5, isMe ? '#0099cc' : '#666');
    gradient.addColorStop(1, isMe ? '#006699' : '#333');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
    ctx.fill();
    
    // Turret barrel - points toward center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const angle = Math.atan2(centerY - pos.y, centerX - pos.x);
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    
    // Barrel with gradient
    const barrelGrad = ctx.createLinearGradient(0, -6, 0, 6);
    barrelGrad.addColorStop(0, isMe ? '#004466' : '#444');
    barrelGrad.addColorStop(0.5, isMe ? '#0066aa' : '#666');
    barrelGrad.addColorStop(1, isMe ? '#004466' : '#444');
    
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(0, -6, 30, 12);
    
    // Barrel tip
    ctx.fillStyle = isMe ? '#00ffff' : '#888';
    ctx.beginPath();
    ctx.arc(30, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;
    
    // Player name with background
    const nameOffset = player.playerSlot < 2 || player.playerSlot === 4 ? 50 : -50;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(pos.x - 45, pos.y + nameOffset - 15, 90, 20);
    
    ctx.fillStyle = isMe ? '#00ffff' : '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.displayName, pos.x, pos.y + nameOffset);
}
