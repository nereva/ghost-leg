document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // 1. STATE & CONSTANTS
    // -----------------------------------------------------------------
    let participantCount = 3;
    const minParticipants = 2;
    const maxParticipants = 10;

    let isGameRunning = false;
    let isAnimationFinished = false;
    let fastMode = false;
    let totalWinnersCount = 0;
    let foundWinnersCount = 0;

    // Generated Ladder Data
    let cols = []; // Column coordinates & names
    let rowsCount = 20; // Grid rows resolution
    let horizontalLines = []; // [{ col, row }] (col connects with col+1)
    let participantPaths = []; // Array of calculated paths: each is an array of {x, y}

    // Animation Tracking
    let currentParticipantIndex = 0;
    let pathAnimationProgress = 0; // 0 to 1
    let currentSegmentIndex = 0;
    let segmentProgress = 0; // 0 to 1 along current segment
    let activePathLines = []; // Paths drawn so far
    let animationFrameId = null;
    let canvasWidth = 0;
    let canvasHeight = 0;

    // Default presets
    const defaultParticipants = ["아이유", "카리나", "원빈", "장원영", "제니", "도영", "안유진", "윈터", "연준", "미연"];
    const defaultPrizes = ["야구 관람 ⚾", "꽝", "꽝", "꽝", "꽝", "꽝", "꽝", "꽝", "꽝", "꽝"];

    // Distinct premium neon colors for each participant's path
    const participantColors = [
        { stroke: '#00f2fe', glow: 'rgba(0, 242, 254, 0.5)' },   // Neon Cyan
        { stroke: '#ff007f', glow: 'rgba(255, 0, 127, 0.5)' },   // Neon Pink
        { stroke: '#39ff14', glow: 'rgba(57, 255, 20, 0.5)' },   // Neon Green
        { stroke: '#ffaa00', glow: 'rgba(255, 170, 0, 0.5)' },   // Neon Orange
        { stroke: '#9d50bb', glow: 'rgba(157, 80, 187, 0.5)' },  // Neon Purple
        { stroke: '#ffff00', glow: 'rgba(255, 255, 0, 0.5)' },   // Neon Yellow
        { stroke: '#00ffcc', glow: 'rgba(0, 255, 204, 0.5)' },   // Neon Turquoise
        { stroke: '#ff4e50', glow: 'rgba(255, 78, 80, 0.5)' },   // Neon Coral
        { stroke: '#e0c3fc', glow: 'rgba(224, 195, 252, 0.5)' }, // Neon Lavender
        { stroke: '#a8ff78', glow: 'rgba(168, 255, 120, 0.5)' }  // Neon Lime
    ];

    // DOM Elements
    const setupPanel = document.getElementById('setup-panel');
    const gamePanel = document.getElementById('game-panel');
    const resultModal = document.getElementById('result-modal');
    const btnShareLink = document.getElementById('btn-share-link');
    const toastMessage = document.getElementById('toast-message');

    const displayCount = document.getElementById('display-count');
    const btnDecreaseCount = document.getElementById('btn-decrease-count');
    const btnIncreaseCount = document.getElementById('btn-increase-count');
    const entriesList = document.getElementById('entries-list');
    const btnGenerateLadder = document.getElementById('btn-generate-ladder');

    const activeGameTitle = document.getElementById('active-game-title');
    const gameStatusBadge = document.getElementById('game-status-badge');
    const participantsRow = document.getElementById('participants-row');
    const prizesRow = document.getElementById('prizes-row');
    const canvas = document.getElementById('ladder-canvas');
    const ctx = canvas.getContext('2d');
    const ladderBlind = document.getElementById('ladder-blind');

    const btnStartLadder = document.getElementById('btn-start-ladder');
    const btnBackToSetup = document.getElementById('btn-back-to-setup');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnReplay = document.getElementById('btn-replay');

    const winnerHighlightCard = document.getElementById('winner-highlight-card');
    const winnerName = document.getElementById('winner-name');
    const winnerPrizeName = document.getElementById('winner-prize-name');
    const resultsTableBody = document.getElementById('results-table-body');
    const modalCelebrationTitle = document.getElementById('modal-celebration-title');

    // -----------------------------------------------------------------
    // 2. SETUP FORM & LIST MANAGEMENT
    // -----------------------------------------------------------------
    function initSetup() {
        renderEntryInputs();

        // Counter Event Listeners
        btnDecreaseCount.addEventListener('click', () => {
            if (participantCount > minParticipants) {
                participantCount--;
                displayCount.textContent = participantCount;
                renderEntryInputs();
            }
        });

        btnIncreaseCount.addEventListener('click', () => {
            if (participantCount < maxParticipants) {
                participantCount++;
                displayCount.textContent = participantCount;
                renderEntryInputs();
            }
        });

        btnGenerateLadder.addEventListener('click', generateLadderGame);
        btnBackToSetup.addEventListener('click', showSetupScreen);
        btnStartLadder.addEventListener('click', startLadderAnimation);

        btnShareLink.addEventListener('click', () => {
            const shareUrl = window.location.href;
            navigator.clipboard.writeText(shareUrl).then(() => {
                // Show toast notification
                toastMessage.classList.add('active');
                setTimeout(() => {
                    toastMessage.classList.remove('active');
                }, 3000);
            }).catch(err => {
                console.error('Could not copy link: ', err);
            });
        });

        btnCloseModal.addEventListener('click', closeModal);
        btnReplay.addEventListener('click', () => {
            closeModal();
            // Automatically regenerate and stay on board or start
            resetGameUI();
        });
    }

    function renderEntryInputs() {
        entriesList.innerHTML = '';
        for (let i = 0; i < participantCount; i++) {
            const row = document.createElement('div');
            row.className = 'entry-row';

            // Name Input
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'input-participant-name';
            nameInput.placeholder = `참가자 ${i + 1}`;
            nameInput.value = defaultParticipants[i] || `참가자 ${i + 1}`;

            // Prize Input
            const prizeInput = document.createElement('input');
            prizeInput.type = 'text';
            prizeInput.className = 'input-prize-name';
            prizeInput.placeholder = `상품 ${i + 1}`;
            // Default first to '야구 관람', rest to '꽝'
            prizeInput.value = i === 0 ? "야구 관람 ⚾" : (defaultPrizes[i] || "꽝");

            // Winner Checkbox Toggle
            const checkContainer = document.createElement('div');
            checkContainer.className = 'winner-check-container';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `winner-check-${i}`;
            checkbox.className = 'winner-checkbox';
            // Set baseball game (index 0) as winning item initially
            checkbox.checked = i === 0;

            const label = document.createElement('label');
            label.htmlFor = `winner-check-${i}`;
            label.className = 'winner-toggle';

            // Link checkbox changes (e.g. "야구 관람" is typed -> automatically toggle check if not "꽝")
            prizeInput.addEventListener('input', (e) => {
                const val = e.target.value.trim();
                if (val === "꽝" || val === "") {
                    checkbox.checked = false;
                } else if (val.includes("관람") || val.includes("선물") || val.includes("상품") || val !== "꽝") {
                    checkbox.checked = true;
                }
            });

            checkContainer.appendChild(checkbox);
            checkContainer.appendChild(label);

            row.appendChild(nameInput);
            row.appendChild(prizeInput);
            row.appendChild(checkContainer);

            entriesList.appendChild(row);
        }
    }

    // -----------------------------------------------------------------
    // 3. LADDER GENERATION & ROUTING ALGORITHM
    // -----------------------------------------------------------------
    function generateLadderGame() {
        const gameTitleInput = document.getElementById('game-title').value.trim();
        const activeTitle = gameTitleInput || "행운의 사다리 게임 🍀";
        activeGameTitle.textContent = activeTitle;

        // Collect Participant & Prize Info
        const participantInputs = document.querySelectorAll('.input-participant-name');
        const prizeInputs = document.querySelectorAll('.input-prize-name');
        const winnerChecks = document.querySelectorAll('.winner-checkbox');

        cols = [];
        const tempPrizes = [];

        for (let i = 0; i < participantCount; i++) {
            const name = participantInputs[i].value.trim() || `참가자 ${i + 1}`;
            const prize = prizeInputs[i].value.trim() || `상품 ${i + 1}`;
            const isWinner = winnerChecks[i].checked;

            cols.push({ index: i, name: name });
            tempPrizes.push({ index: i, name: prize, isWinner: isWinner, originalIndex: i });
        }

        // Shuffle Prizes for mystery
        // To make the ladder exciting, we shuffle the prizes mapping to physical bottom nodes.
        // We will keep physical bottoms indexed 0..N-1, but assign the shuffled prizes to them.
        const shuffledPrizes = [...tempPrizes].sort(() => Math.random() - 0.5);

        // Reset game board
        renderGameBoard(cols, shuffledPrizes);

        // Generate Horizontal Lines based on complexity
        const complexity = document.querySelector('input[name="complexity"]:checked').value;
        generateHorizontalLines(complexity);

        // Calculate exact paths for each starting column
        calculatePaths(shuffledPrizes);

        // Reset state
        isGameRunning = false;
        isAnimationFinished = false;
        fastMode = false;
        currentParticipantIndex = 0;
        activePathLines = [];

        totalWinnersCount = shuffledPrizes.filter(p => p.isWinner).length;
        foundWinnersCount = 0;

        ladderBlind.classList.remove('revealed');
        gameStatusBadge.textContent = "대기 중";
        gameStatusBadge.style.color = "var(--neon-blue)";
        btnStartLadder.style.display = "flex";

        // Switch Panels
        setupPanel.classList.remove('active');
        gamePanel.classList.add('active');

        // Prep Canvas size and clear (after panel becomes visible so dimensions are non-zero)
        resizeCanvas();
        drawInitialGuidelines();
    }

    function renderGameBoard(participants, shuffledPrizes) {
        participantsRow.innerHTML = '';
        prizesRow.innerHTML = '';

        // Render Top Row (Participants)
        participants.forEach(p => {
            const card = document.createElement('div');
            card.className = 'node-card';
            card.id = `participant-node-${p.index}`;
            card.textContent = p.name;
            participantsRow.appendChild(card);
        });

        // Render Bottom Row (Prizes)
        shuffledPrizes.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'node-card';
            card.id = `prize-node-${idx}`;
            card.textContent = p.name;
            card.dataset.isWinner = p.isWinner;
            card.dataset.prizeName = p.name;
            prizesRow.appendChild(card);
        });
    }

    function generateHorizontalLines(complexity) {
        horizontalLines = [];
        const N = participantCount;
        rowsCount = complexity === 'complex' ? 24 : 14;

        // Simple vs Complex target lines
        // For each column bridge (0 to N-2), we want to inject lines.
        // We ensure no two lines attach to the exact same vertical node at the same height.
        const lineChance = complexity === 'complex' ? 0.65 : 0.35;

        for (let r = 2; r < rowsCount - 2; r++) {
            for (let c = 0; c < N - 1; c++) {
                if (Math.random() < lineChance) {
                    // Check if adjacent bridges already have a line at this exact row
                    // to prevent overlaps / grid collisions (each node degree <= 3)
                    const leftOverlap = horizontalLines.some(l => l.col === c - 1 && l.row === r);
                    const rightOverlap = horizontalLines.some(l => l.col === c + 1 && l.row === r);
                    const selfOverlap = horizontalLines.some(l => l.col === c && l.row === r);

                    if (!leftOverlap && !rightOverlap && !selfOverlap) {
                        horizontalLines.push({ col: c, row: r });
                    }
                }
            }
        }

        // Safety: Ensure every vertical line has at least 1 horizontal connection
        // so it's not a direct straight line (which is boring)
        for (let c = 0; c < N; c++) {
            const hasConnection = horizontalLines.some(l => l.col === c || l.col === c - 1);
            if (!hasConnection) {
                // Force-add a line at a safe random row
                const safeRows = Array.from({ length: rowsCount - 6 }, (_, i) => i + 3);
                for (let r of safeRows.sort(() => Math.random() - 0.5)) {
                    const targetCol = c === N - 1 ? c - 1 : c;
                    const leftOverlap = horizontalLines.some(l => l.col === targetCol - 1 && l.row === r);
                    const rightOverlap = horizontalLines.some(l => l.col === targetCol + 1 && l.row === r);
                    const selfOverlap = horizontalLines.some(l => l.col === targetCol && l.row === r);

                    if (!leftOverlap && !rightOverlap && !selfOverlap) {
                        horizontalLines.push({ col: targetCol, row: r });
                        break;
                    }
                }
            }
        }
    }

    function calculatePaths(shuffledPrizes) {
        participantPaths = [];
        const N = participantCount;

        for (let startCol = 0; startCol < N; startCol++) {
            let currentCol = startCol;
            const path = [];

            // Path always starts at the top card node
            path.push({ col: currentCol, row: 0 });

            // Traverse grid row by row
            for (let r = 1; r <= rowsCount; r++) {
                // Check if there is a horizontal bridge at the previous grid step
                // that connects our current column to another
                const leftBridge = horizontalLines.find(l => l.col === currentCol - 1 && l.row === r - 1);
                const rightBridge = horizontalLines.find(l => l.col === currentCol && l.row === r - 1);

                if (leftBridge) {
                    // Turn left: slide horizontally first, then go down
                    path.push({ col: currentCol, row: r - 1 });
                    currentCol = currentCol - 1;
                    path.push({ col: currentCol, row: r - 1 });
                } else if (rightBridge) {
                    // Turn right: slide horizontally first, then go down
                    path.push({ col: currentCol, row: r - 1 });
                    currentCol = currentCol + 1;
                    path.push({ col: currentCol, row: r - 1 });
                }

                // Add vertical step
                path.push({ col: currentCol, row: r });
            }

            // Store path along with its final prize reference
            participantPaths.push({
                participantIndex: startCol,
                finalCol: currentCol,
                prize: shuffledPrizes[currentCol],
                gridPoints: path // List of Grid coordinates { col, row }
            });
        }
    }

    // -----------------------------------------------------------------
    // 4. CANVAS RENDERING & LAYOUT
    // -----------------------------------------------------------------
    function resizeCanvas() {
        const rect = canvas.parentNode.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        canvasWidth = rect.width;
        canvasHeight = rect.height;
    }

    // Grid coordinates to Pixel coordinates mapping
    function getPixelCoords(col, row) {
        const colSpacing = canvasWidth / participantCount;
        const rowSpacing = canvasHeight / rowsCount;

        // Align with the centers of column cards
        const x = (col * colSpacing) + (colSpacing / 2);
        const y = row * rowSpacing;

        return { x, y };
    }

    function drawInitialGuidelines() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw vertical columns (Faint guide paths)
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';

        for (let c = 0; c < participantCount; c++) {
            const start = getPixelCoords(c, 0);
            const end = getPixelCoords(c, rowsCount);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }

    // Redraws all permanently revealed lines so far
    function drawActivePaths() {
        // Draw all finished paths in full neon glow
        activePathLines.forEach(pathLine => {
            const color = participantColors[pathLine.participantIndex % participantColors.length];

            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw in participant's unique neon color
            ctx.strokeStyle = color.stroke;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color.glow;

            pathLine.points.forEach((pt, index) => {
                if (index === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();

            // Also draw horizontal bars that were traversed
            pathLine.horizontalSegments.forEach(seg => {
                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.strokeStyle = color.stroke;
                ctx.shadowBlur = 10;
                ctx.shadowColor = color.glow;
                ctx.moveTo(seg.start.x, seg.start.y);
                ctx.lineTo(seg.end.x, seg.end.y);
                ctx.stroke();
            });
        });

        // Reset shadow defaults
        ctx.shadowBlur = 0;
    }

    // -----------------------------------------------------------------
    // 5. ANIMATION CONTROL LOOP
    // -----------------------------------------------------------------
    function startLadderAnimation() {
        if (isGameRunning) return;

        isGameRunning = true;
        isAnimationFinished = false;
        fastMode = false;
        currentParticipantIndex = 0;
        activePathLines = [];
        foundWinnersCount = 0;

        gameStatusBadge.textContent = "진행 중...";
        gameStatusBadge.style.color = "var(--neon-green)";
        btnStartLadder.style.display = "none";

        // Add style to blind to show it's "engaged" but translucent so neon shines through
        ladderBlind.classList.add('revealed');

        // Highlight active participant node card
        highlightNode(`participant-node-${currentParticipantIndex}`, 'active-node');

        // Start animating first participant
        startParticipantPath(0);
    }

    function startParticipantPath(index) {
        currentParticipantIndex = index;
        currentSegmentIndex = 0;
        segmentProgress = 0;

        animate();
    }

    function animate() {
        if (!isGameRunning) return;

        const pathData = participantPaths[currentParticipantIndex];
        const gridPoints = pathData.gridPoints;
        const totalSegments = gridPoints.length - 1;

        // Clear canvas and draw everything
        drawInitialGuidelines();
        drawActivePaths();

        // Calculate speed based on fastMode
        // In normal mode: segment draws smoothly
        // In fastMode: segment draws nearly instantly (jump 0.35 per frame or immediately complete)
        const speedStep = fastMode ? 0.4 : 0.08;

        segmentProgress += speedStep;

        if (segmentProgress >= 1) {
            segmentProgress = 0;
            currentSegmentIndex++;
        }

        // Draw the current progressing path
        const activeColor = participantColors[currentParticipantIndex % participantColors.length];

        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Current active color is glowing unique color of participant
        ctx.strokeStyle = activeColor.stroke;
        ctx.shadowBlur = 15;
        ctx.shadowColor = activeColor.stroke;

        // Draw completed segments of this active path
        for (let i = 0; i <= currentSegmentIndex; i++) {
            const pt = getPixelCoords(gridPoints[i].col, gridPoints[i].row);
            if (i === 0) {
                ctx.moveTo(pt.x, pt.y);
            } else {
                ctx.lineTo(pt.x, pt.y);
            }
        }

        // Draw current moving segment
        if (currentSegmentIndex < totalSegments) {
            const startPt = getPixelCoords(gridPoints[currentSegmentIndex].col, gridPoints[currentSegmentIndex].row);
            const endPt = getPixelCoords(gridPoints[currentSegmentIndex + 1].col, gridPoints[currentSegmentIndex + 1].row);

            // Interpolate coordinates
            const currentX = startPt.x + (endPt.x - startPt.x) * segmentProgress;
            const currentY = startPt.y + (endPt.y - startPt.y) * segmentProgress;

            ctx.lineTo(currentX, currentY);
            ctx.stroke();

            // Draw a shiny laser indicator at the front tip
            ctx.beginPath();
            ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = activeColor.stroke;
            ctx.fill();
        } else {
            // Reached the end!
            ctx.stroke();

            // 1. Permanently register this path
            const pixelPoints = gridPoints.map(gp => getPixelCoords(gp.col, gp.row));

            // Identify horizontal lines crossed
            const horizontalSegments = [];
            for (let i = 0; i < gridPoints.length - 1; i++) {
                const ptA = gridPoints[i];
                const ptB = gridPoints[i + 1];
                if (ptA.row === ptB.row && ptA.col !== ptB.col) {
                    horizontalSegments.push({
                        start: getPixelCoords(ptA.col, ptA.row),
                        end: getPixelCoords(ptB.col, ptB.row)
                    });
                }
            }

            const isWinner = pathData.prize.isWinner;
            if (isWinner) {
                foundWinnersCount++;
            }

            activePathLines.push({
                participantIndex: currentParticipantIndex,
                points: pixelPoints,
                horizontalSegments: horizontalSegments,
                isWinnerPath: isWinner
            });

            // Highlight bottom node
            const bottomNodeId = `prize-node-${pathData.finalCol}`;
            highlightNode(bottomNodeId, isWinner ? 'winner-node' : 'active-node');

            // Remove active highlight from top card
            removeHighlight(`participant-node-${currentParticipantIndex}`, 'active-node');

            // Check if there is next participant
            if (currentParticipantIndex < participantCount - 1) {
                // If all winning prizes have been claimed, fast-forward the remaining participants
                if (foundWinnersCount >= totalWinnersCount) {
                    fastMode = true;
                }

                // Animate next person
                currentParticipantIndex++;
                highlightNode(`participant-node-${currentParticipantIndex}`, 'active-node');
                startParticipantPath(currentParticipantIndex);
            } else {
                // All animations complete!
                endGame();
            }
            return;
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    function endGame() {
        isGameRunning = false;
        isAnimationFinished = true;
        gameStatusBadge.textContent = "게임 완료";
        gameStatusBadge.style.color = "var(--winner-gold)";

        // Redraw finally
        drawInitialGuidelines();
        drawActivePaths();

        // Wait briefly, then launch result modal
        setTimeout(() => {
            showResultModal();
        }, 800);
    }

    function highlightNode(id, className) {
        const node = document.getElementById(id);
        if (node) node.classList.add(className);
    }

    function removeHighlight(id, className) {
        const node = document.getElementById(id);
        if (node) node.classList.remove(className);
    }

    // -----------------------------------------------------------------
    // 6. RESULT PRESENTATION & CONFETTI
    // -----------------------------------------------------------------
    function showResultModal() {
        resultsTableBody.innerHTML = '';

        let winningParticipant = null;
        let winningPrize = null;

        // Find all paths that landed on a winning prize
        const winningPaths = participantPaths.filter(path => path.prize.isWinner);
        if (winningPaths.length > 0) {
            // Sort by originalIndex of the prize (setup order) to find the primary winner
            winningPaths.sort((a, b) => a.prize.originalIndex - b.prize.originalIndex);
            const primaryWinnerPath = winningPaths[0];
            winningParticipant = cols[primaryWinnerPath.participantIndex].name;
            winningPrize = primaryWinnerPath.prize.name;
        }

        // Build table
        participantPaths.forEach(path => {
            const row = document.createElement('tr');

            const nameTd = document.createElement('td');
            nameTd.textContent = cols[path.participantIndex].name;
            nameTd.style.fontWeight = 'bold';

            const prizeTd = document.createElement('td');
            prizeTd.textContent = path.prize.name;

            const badgeTd = document.createElement('td');
            const badge = document.createElement('span');

            if (path.prize.isWinner) {
                badge.className = 'badge-win';
                badge.textContent = '당첨! 🎉';

                // Highlight winning row in table
                row.style.background = 'rgba(255, 219, 1, 0.08)';
            } else {
                badge.className = 'badge-lose';
                badge.textContent = '꽝';
            }

            badgeTd.appendChild(badge);
            row.appendChild(nameTd);
            row.appendChild(prizeTd);
            row.appendChild(badgeTd);

            resultsTableBody.appendChild(row);
        });

        // Set up Celebration Card
        if (winningParticipant && winningPrize) {
            modalCelebrationTitle.textContent = "축하합니다! 당첨자가 나왔습니다 🥳";
            winnerHighlightCard.style.display = "flex";
            winnerName.textContent = winningParticipant;
            winnerPrizeName.textContent = winningPrize;

            // Trigger Confetti & triumphant fanfare sound!
            triggerConfettiCelebration();
            playSynthesizedFanfare();
        } else {
            // No winner items checked in setup
            modalCelebrationTitle.textContent = "사다리 타기 결과 🎈";
            winnerHighlightCard.style.display = "none";
        }

        resultModal.classList.add('active');
    }

    function triggerConfettiCelebration() {
        // Classy full-screen firework-like confetti burst
        const duration = 4 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Confetti bursts from random positions
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
        }, 250);
    }

    function playSynthesizedFanfare() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const playNote = (freq, startTime, duration, type = 'sine') => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0, startTime);
            // Slightly softer volume to avoid clipping
            gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.04);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;

        // Celebratory synthesized arpeggio + triumphant trumpets chord
        playNote(261.63, now, 0.15, 'triangle');       // C4
        playNote(329.63, now + 0.12, 0.15, 'triangle'); // E4
        playNote(392.00, now + 0.24, 0.15, 'triangle'); // G4
        playNote(523.25, now + 0.36, 0.15, 'triangle'); // C5
        playNote(659.25, now + 0.48, 0.20, 'triangle'); // E5
        playNote(783.99, now + 0.60, 0.20, 'triangle'); // G5

        // High arpeggio to final triumphant chord
        playNote(1046.50, now + 0.72, 1.2, 'sine');     // C6

        // Triumphant final chord (trumpet sawtooth style)
        playNote(523.25, now + 0.72, 1.0, 'sawtooth');  // C5
        playNote(659.25, now + 0.72, 1.0, 'sawtooth');  // E5
        playNote(783.99, now + 0.72, 1.0, 'sawtooth');  // G5
        playNote(1046.50, now + 0.72, 1.2, 'sawtooth'); // C6
    }

    // -----------------------------------------------------------------
    // 7. STATE TRANSITIONS & SCREEN SWITCHING
    // -----------------------------------------------------------------
    function showSetupScreen() {
        cancelAnimationFrame(animationFrameId);
        setupPanel.classList.add('active');
        gamePanel.classList.remove('active');
    }

    function resetGameUI() {
        // Cancel active animations
        cancelAnimationFrame(animationFrameId);

        // Re-generate current parameters (fresh layout)
        generateLadderGame();
    }

    function closeModal() {
        resultModal.classList.remove('active');
    }

    // Handle window resizing dynamically
    window.addEventListener('resize', () => {
        if (gamePanel.classList.contains('active')) {
            resizeCanvas();
            if (isAnimationFinished) {
                drawInitialGuidelines();
                drawActivePaths();
            } else if (!isGameRunning) {
                drawInitialGuidelines();
            }
        }
    });

    // Initialize Page
    initSetup();
});
