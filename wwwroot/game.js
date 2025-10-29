let connection = null;
let gameState = {
    players: [],
    fish: [],
    projectiles: [],
    myPlayerId: null,
    myPlayerSlot: null
};

let canvas, ctx;
let currentWeapon = 0;
let playerName = '';

// Fish sprites (simple colored circles for now)
const fishColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6'];
const fishSizes = [15, 25, 40, 60]; // Small, Medium, Large, Boss

// Cannon positions for each player slot (0-7)
const cannonPositions = [
    { x: 800, y: 870 }, // Slot 0: Bottom center (canvas.width/2 when 1600px)
    { x: 100, y: 870 }, // Slot 1: Bottom left
    { x: 1500, y: 870 }, // Slot 2: Bottom right
    { x: 100, y: 100 }, // Slot 3: Top left
    { x: 1500, y: 100 }, // Slot 4: Top right
    { x: 800, y: 100 }, // Slot 5: Top center
    { x: 50, y: 450 },  // Slot 6: Middle left (canvas.height/2 when 900px)
    { x: 1550, y: 450 } // Slot 7: Middle right
];

function getCannonPosition(slot) {
    return cannonPositions[slot] || cannonPositions[0];
}

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
            
            // Switch to game screen
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'block';
            document.getElementById('playerDisplayName').textContent = playerName;
            document.getElementById('playerSlot').textContent = result.playerSlot + 1;
            document.getElementById('connectionStatus').innerHTML = 
                '<span class="status-connected">● Connected</span>';

            // Initialize game
            initGame();
        } else {
            alert('Failed to join: ' + result.message);
        }
    } catch (error) {
        console.error('Connection error:', error);
        alert('Failed to connect to server');
    }
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Set canvas to fit screen while maintaining aspect ratio
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse click to fire
    canvas.addEventListener('click', handleClick);

    // Start render loop
    requestAnimationFrame(render);
}

function resizeCanvas() {
    const container = document.getElementById('gameScreen');
    const aspectRatio = 1600 / 900;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }
    
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
    document.querySelectorAll('.weapon-btn').forEach((btn, index) => {
        btn.classList.toggle('active', index === weaponType);
    });
    
    // Send to server
    if (connection) {
        connection.invoke("ChangeWeapon", weaponType)
            .catch(err => console.error('ChangeWeapon error:', err));
    }
}

function handleStateDelta(delta) {
    gameState.players = delta.players || [];
    gameState.fish = delta.fish || [];
    gameState.projectiles = delta.projectiles || [];
    
    // Update HUD for current player
    const myPlayer = gameState.players.find(p => p.playerId === gameState.myPlayerId);
    if (myPlayer) {
        document.getElementById('playerCredits').textContent = Math.floor(myPlayer.credits);
        document.getElementById('playerKills').textContent = myPlayer.totalKills;
    }
    
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
    // Clear canvas
    ctx.fillStyle = '#001f3f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw water effect
    drawWater();
    
    // Draw fish
    gameState.fish.forEach(fish => {
        drawFish(fish);
    });
    
    // Draw projectiles
    gameState.projectiles.forEach(proj => {
        drawProjectile(proj);
    });
    
    // Draw players (cannons at bottom)
    gameState.players.forEach(player => {
        drawPlayerCannon(player);
    });
    
    requestAnimationFrame(render);
}

function drawWater() {
    // Simple wave effect
    const time = Date.now() / 1000;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 20) {
            const y = Math.sin((x + time * 100 + i * 50) * 0.01) * 10 + 100 + i * 150;
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
    const size = fishSizes[fish.typeId] || 20;
    const color = fishColors[fish.typeId] || '#FFD700';
    
    // Fish body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(fish.x, fish.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Simple tail
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fish.x - size, fish.y);
    ctx.lineTo(fish.x - size - 10, fish.y - 8);
    ctx.lineTo(fish.x - size - 10, fish.y + 8);
    ctx.closePath();
    ctx.fill();
}

function drawProjectile(proj) {
    // Draw as a glowing bullet
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Trail
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(proj.x, proj.y);
    ctx.lineTo(proj.x - proj.directionX * 10, proj.y - proj.directionY * 10);
    ctx.stroke();
}

function drawPlayerCannon(player) {
    const pos = getCannonPosition(player.playerSlot);
    const isMe = player.playerId === gameState.myPlayerId;
    
    // Cannon base
    ctx.fillStyle = isMe ? '#00ffff' : '#666666';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Player name
    ctx.fillStyle = isMe ? '#00ffff' : '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.displayName, pos.x, pos.y - 30);
}
