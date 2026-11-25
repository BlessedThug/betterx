(function () {
    // DOM Элементы
    const betInput = document.getElementById('stepBetAmount');
    const startBtn = document.getElementById('stepStartBtn');
    const cashoutBtn = document.getElementById('stepCashoutBtn');
    const board = document.getElementById('steps-board');
    const player = document.getElementById('player-avatar');
    const winDisplay = document.getElementById('step-current-win');
    const stepCountDisplay = document.getElementById('step-count');
    const statusText = document.getElementById('step-status-text');
    const balanceEl = document.getElementById('bal-header');
    const inventoryListEl = document.getElementById('inventory-list');
    const riskBar = document.getElementById('risk-bar');
    
    // Модальное окно
    const resultModal = document.getElementById('steps-result-modal');
    const resultTitle = document.getElementById('steps-result-title');
    const resultText = document.getElementById('steps-result-text');
    const resultBtn = document.getElementById('steps-result-btn');

    const TOTAL_TILES = 25;
    let isPlaying = false;
    let currentStep = -1; 
    let currentWin = 0;
    let baseBet = 0;
    let tilesData = [];
    let selectedInventoryItem = null;

    // ========== ЗВУКИ (Web Audio API) ==========
    let audioCtx = null;
    function playSound(type) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'step') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                osc.start(); osc.stop(audioCtx.currentTime + 0.1);
            } else if (type === 'win') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
                osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                osc.start(); osc.stop(audioCtx.currentTime + 0.4);
            } else if (type === 'lose') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                osc.start(); osc.stop(audioCtx.currentTime + 0.4);
            }
        } catch(e) { console.log('Audio error', e); }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    document.addEventListener('DOMContentLoaded', () => {
        updateBalanceUI();
        initBoard(); 
        
        startBtn.addEventListener('click', startGame);
        cashoutBtn.addEventListener('click', () => cashoutGame(false));
        resultBtn.addEventListener('click', () => {
            resultModal.classList.remove('active');
            resetBoard();
        });

        betInput.addEventListener('input', () => {
            if (!isPlaying && selectedInventoryItem) {
                selectedInventoryItem = null;
                betInput.disabled = false;
                updateInventoryDisplay();
            }
        });

        const quickBetBtns = document.querySelectorAll('.quick-bet');
        quickBetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (isPlaying) return;
                betInput.value = btn.dataset.amount;
                if (selectedInventoryItem) {
                    selectedInventoryItem = null;
                    betInput.disabled = false;
                    updateInventoryDisplay();
                }
            });
        });
        
        setInterval(updateBalanceUI, 1000);
        updateInventoryDisplay();
    });

    function updateBalanceUI() {
        if (balanceEl) balanceEl.textContent = window.globalBalance.toFixed(2);
    }

    // ========== ИНВЕНТАРЬ ==========
    function updateInventoryDisplay() {
        if (!inventoryListEl) return;
        const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];

        if (!inventory || inventory.length === 0) {
            inventoryListEl.innerHTML = '<div class="inventory-empty">🎒 Нет предметов</div>';
            return;
        }

        inventoryListEl.innerHTML = '';
        inventory.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'inventory-item-card';
            if (selectedInventoryItem && selectedInventoryItem.id === item.id) itemCard.classList.add('selected');
            if (isPlaying) itemCard.classList.add('disabled');

            let borderColor = '#888';
            if (item.tier === 'tier1') borderColor = '#3880ec';
            else if (item.tier === 'tier2') borderColor = '#7e1a7e';
            else if (item.tier === 'tier3') borderColor = '#f14df1';
            else if (item.tier === 'tier4') borderColor = '#dd3131';
            else if (item.tier === 'tier5') borderColor = '#f7f723';

            itemCard.style.borderColor = selectedInventoryItem && selectedInventoryItem.id === item.id ? 'orange' : 'transparent';

            itemCard.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="inventory-item-img" onerror="this.src='../img/logo.png'">
                <div class="inventory-item-info">
                    <div class="inventory-item-name" style="color: ${borderColor};">${item.name}</div>
                    <div class="inventory-item-price">${item.price.toLocaleString()} ₽</div>
                </div>
                <div class="inventory-item-select">${selectedInventoryItem && selectedInventoryItem.id === item.id ? '✓' : '→'}</div>
            `;

            itemCard.addEventListener('click', () => {
                if (isPlaying) return;
                if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
                    selectedInventoryItem = null;
                    betInput.disabled = false;
                    betInput.value = '';
                } else {
                    selectedInventoryItem = item;
                    betInput.disabled = true;
                    betInput.value = item.price;
                }
                updateInventoryDisplay();
            });

            inventoryListEl.appendChild(itemCard);
        });
    }

    // ========== ДРОП ПРЕДМЕТОВ ==========
    function getAllItems() {
        const moneyItems = window.MONEY_CASE_DATA || [];
        const regularItems = window.ITEMS_CASE_DATA || [];
        const cs2Items = window.CS2_SKINS || [];
        const gameItems = window.GAMES_CASE_DATA || [];
        return [...moneyItems, ...regularItems, ...cs2Items, ...gameItems];
    }

    function getRandomDrop(currentStepIndex) {
        const allItems = getAllItems();
        if (allItems.length === 0) return null;

        let eligibleItems = allItems;
        if (currentStepIndex < 5) {
            eligibleItems = allItems.filter(i => i.tier === 'tier1' || i.tier === 'tier2');
        } else if (currentStepIndex < 15) {
            eligibleItems = allItems.filter(i => i.tier !== 'tier5');
        }
        if (eligibleItems.length === 0) eligibleItems = allItems;
        return eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
    }

    // ========== ГЕНЕРАЦИЯ ПУТИ ==========
    function generatePath() {
        tilesData = [];
        for (let i = 0; i < TOTAL_TILES; i++) {
            let p = i / TOTAL_TILES; 
            let r = Math.random();
            let type;

            if (p < 0.3) {
                if (r < 0.45) type = 'add'; else if (r < 0.85) type = 'sub'; else if (r < 0.92) type = 'mult'; else if (r < 0.95) type = 'lose'; else type = 'bonus';
            } else if (p < 0.7) {
                if (r < 0.35) type = 'add'; else if (r < 0.60) type = 'sub'; else if (r < 0.80) type = 'mult'; else if (r < 0.95) type = 'lose'; else type = 'bonus';
            } else {
                if (r < 0.25) type = 'add'; else if (r < 0.40) type = 'sub'; else if (r < 0.70) type = 'mult'; else if (r < 0.95) type = 'lose'; else type = 'bonus';
            }

            let val = 0, text = '';
            if (type === 'add') {
                let r2 = Math.random(), percent;
                if (p < 0.3) { if (r2 < 0.7) percent = Math.floor(Math.random() * 8) + 5; else if (r2 < 0.95) percent = Math.floor(Math.random() * 8) + 13; else percent = Math.floor(Math.random() * 15) + 21; } 
                else if (p < 0.7) { if (r2 < 0.4) percent = Math.floor(Math.random() * 11) + 5; else if (r2 < 0.8) percent = Math.floor(Math.random() * 15) + 16; else percent = Math.floor(Math.random() * 20) + 31; } 
                else { if (r2 < 0.2) percent = Math.floor(Math.random() * 11) + 10; else if (r2 < 0.6) percent = Math.floor(Math.random() * 20) + 21; else percent = Math.floor(Math.random() * 40) + 41; }
                val = percent / 100; text = `+${percent}%`;
            } else if (type === 'sub') {
                let r2 = Math.random(), percent;
                if (p < 0.3) { if (r2 < 0.7) percent = Math.floor(Math.random() * 8) + 5; else if (r2 < 0.95) percent = Math.floor(Math.random() * 8) + 13; else percent = Math.floor(Math.random() * 15) + 21; } 
                else if (p < 0.7) { if (r2 < 0.4) percent = Math.floor(Math.random() * 11) + 5; else if (r2 < 0.8) percent = Math.floor(Math.random() * 15) + 16; else percent = Math.floor(Math.random() * 20) + 31; } 
                else { if (r2 < 0.2) percent = Math.floor(Math.random() * 11) + 10; else if (r2 < 0.6) percent = Math.floor(Math.random() * 20) + 21; else percent = Math.floor(Math.random() * 40) + 41; }
                val = percent / 100; text = `-${percent}%`;
            } else if (type === 'mult') {
                let r2 = Math.random(), mult;
                if (p < 0.3) { if (r2 < 0.8) mult = (Math.random() * 0.4 + 1.2).toFixed(1); else mult = (Math.random() * 0.4 + 1.6).toFixed(1); } 
                else if (p < 0.7) { if (r2 < 0.6) mult = (Math.random() * 0.6 + 1.3).toFixed(1); else mult = (Math.random() * 0.8 + 1.9).toFixed(1); } 
                else { if (r2 < 0.4) mult = (Math.random() * 1.0 + 1.5).toFixed(1); else mult = (Math.random() * 2.0 + 2.5).toFixed(1); }
                val = parseFloat(mult); text = `x${mult}`;
            } else if (type === 'lose') { text = '💀'; } 
            else if (type === 'bonus') { text = '🎁'; }

            tilesData.push({ type, value: val, text });
        }
        return tilesData;
    }

    function initBoard() {
        generatePath();
        board.innerHTML = ''; 
        board.appendChild(player);
        
        const startTile = document.createElement('div');
        startTile.className = 'step-tile start-tile';
        startTile.dataset.index = -1;
        startTile.innerHTML = '🏁';
        board.appendChild(startTile);

        tilesData.forEach((data, index) => {
            const tile = document.createElement('div');
            tile.className = 'step-tile';
            tile.dataset.index = index;
            tile.dataset.step = index + 1;
            tile.addEventListener('click', () => handleStep(index));
            board.appendChild(tile);
        });

        player.style.display = 'block';
        if (riskBar) riskBar.style.width = '0%';
        setTimeout(() => { movePlayerToTile(-1); }, 100);
    }

    // ========== ИГРА ==========
    function startGame() {
        if (isPlaying) return;

        let betAmount = parseFloat(betInput.value);
        
        if (selectedInventoryItem) {
            const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];
            if (!inventory.some(item => item.id === selectedInventoryItem.id)) {
                alert('Выбранный предмет больше не доступен!');
                selectedInventoryItem = null; betInput.disabled = false; updateInventoryDisplay(); return;
            }
            baseBet = selectedInventoryItem.price;
            window.InventoryManager.removeItem(selectedInventoryItem.id);
            selectedInventoryItem = null;
            updateInventoryDisplay();
        } else {
            if (isNaN(betAmount) || betAmount < 10) return alert('Минимальная ставка 10 ₽');
            if (betAmount > window.globalBalance) return alert('Недостаточно средств!');
            baseBet = betAmount;
            window.globalBalance -= baseBet;
        }

        updateBalanceUI();
        isPlaying = true;
        currentStep = -1; 
        currentWin = baseBet; 
        
        betInput.disabled = true;
        startBtn.style.display = 'none';
        cashoutBtn.style.display = 'block';
        statusText.textContent = 'Делайте шаг!';
        statusText.style.color = '#4CAF50';
        
        updateStatsUI();
        highlightNextTile(0);
    }

    function handleStep(index) {
        if (!isPlaying || index !== currentStep + 1) return;
        
        const tileEl = board.querySelector(`.step-tile[data-index="${index}"]`);
        if (!tileEl || tileEl.classList.contains('revealed')) return;

        playSound('step');

        const data = tilesData[index];
        tileEl.classList.remove('next-step');
        tileEl.classList.add('revealed', `tile-${data.type}`);
        tileEl.textContent = data.text;

        let changeText = '';
        let changeColor = '';

        if (data.type === 'add') {
            currentWin += (baseBet * data.value);
            changeText = `+${data.text}`;
            changeColor = '#4CAF50';
        } else if (data.type === 'sub') {
            currentWin -= (baseBet * data.value);
            if (currentWin < 0) currentWin = 0;
            changeText = `${data.text}`;
            changeColor = '#f44336';
        } else if (data.type === 'mult') {
            currentWin *= data.value;
            changeText = `${data.text}`;
            changeColor = '#ffc107';
        } else if (data.type === 'bonus') {
            const item = getRandomDrop(currentStep);
            if (item && window.InventoryManager) {
                window.InventoryManager.addItem(item.name, item.image, item.tier, item.price);
                tileEl.innerHTML = `<img src="${item.image}">`;
                tileEl.style.boxShadow = '0 0 20px #00BCD4';
                showFloatingNotification(`🎁 Дроп: ${item.name}`, '#00BCD4');
                statusText.textContent = `Выпал предмет!`;
                changeText = '🎁';
                changeColor = '#00BCD4';
            } else {
                currentWin *= 2;
                showFloatingNotification('🎁 Бонус x2!', '#00BCD4');
                changeText = 'x2';
                changeColor = '#00BCD4';
            }
        } else if (data.type === 'lose') {
            currentWin = 0;
            movePlayerToTile(index);
            playSound('lose');
            setTimeout(() => gameOver(), 500);
            return;
        }

        if (changeText) {
            showFloatingText(tileEl, changeText, changeColor);
        }

        currentStep++;
        movePlayerToTile(currentStep);
        updateStatsUI();

        if (riskBar) {
            riskBar.style.width = `${(currentStep / TOTAL_TILES) * 100}%`;
        }

        if (currentStep < TOTAL_TILES - 1) {
            highlightNextTile(currentStep + 1);
        } else {
            cashoutGame(true); 
        }
    }

    function highlightNextTile(index) {
        board.querySelectorAll('.step-tile').forEach(el => el.classList.remove('next-step'));
        const nextTile = board.querySelector(`.step-tile[data-index="${index}"]`);
        if (nextTile) nextTile.classList.add('next-step');
    }

    // ========== ПОЗИЦИОНИРОВАНИЕ АВАТАРА ==========
    function movePlayerToTile(tileIndex) {
        const targetTile = board.querySelector(`.step-tile[data-index="${tileIndex}"]`);
        if (!targetTile) return;

        // Используем offsetLeft/offsetTop и парсим матрицу трансформации для учета волны
        let x = targetTile.offsetLeft;
        let y = targetTile.offsetTop;

        const style = window.getComputedStyle(targetTile);
        const transform = style.transform || style.webkitTransform || style.mozTransform;
        if (transform && transform !== 'none') {
            const values = transform.split('(')[1].split(')')[0].split(',');
            if (values.length === 6) { // matrix(a, b, c, d, tx, ty)
                x += parseFloat(values[4]);
                y += parseFloat(values[5]);
            } else if (values.length === 16) { // matrix3d
                x += parseFloat(values[12]);
                y += parseFloat(values[13]);
            }
        }

        if (window.innerWidth <= 900) {
            player.style.left = `${x - 15}px`; // Слева от клетки
            player.style.top = `${y + targetTile.offsetHeight / 2}px`;
        } else {
            player.style.left = `${x + targetTile.offsetWidth / 2}px`; // Над клеткой
            player.style.top = `${y - 10}px`;
        }

        targetTile.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    function showFloatingText(tileEl, text, color) {
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-text';
        floatEl.textContent = text;
        floatEl.style.color = color;
        tileEl.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1000);
    }

    // ========== КОНЕЦ ИГРЫ ==========
    function cashoutGame(isAuto = false) {
        if (!isPlaying) return;
        isPlaying = false;
        
        if (currentWin > 0) {
            window.globalBalance += currentWin;
            updateBalanceUI();
            playSound('win');
            showGameResult('УСПЕХ!', `Вы забрали ${currentWin.toFixed(2)} ₽ ${isAuto ? '(Дошли до конца!)' : ''}`, 'win');
        }
    }

    function gameOver() {
        if (!isPlaying) return;
        isPlaying = false;
        showGameResult('КРАШ!', `Вы наступили на ловушку и потеряли ставку.`, 'lose');
    }

    function showGameResult(title, text, type) {
        resultTitle.textContent = title;
        resultText.textContent = text;
        
        if (type === 'win') {
            resultTitle.style.color = '#4CAF50';
            resultTitle.style.textShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
            resultBtn.className = 'btn-success';
            resultBtn.style.background = 'linear-gradient(45deg, #4CAF50, #2e7d32)';
        } else {
            resultTitle.style.color = '#f44336';
            resultTitle.style.textShadow = '0 0 20px rgba(244, 67, 54, 0.5)';
            resultBtn.className = 'btn-primary';
            resultBtn.style.background = '#555';
        }
        resultModal.classList.add('active');
    }

    function resetBoard() {
        isPlaying = false;
        betInput.disabled = false;
        startBtn.style.display = 'block';
        startBtn.textContent = 'ИГРАТЬ СНОВА';
        cashoutBtn.style.display = 'none';
        statusText.textContent = 'Ожидание ставки';
        statusText.style.color = 'orange';
        
        initBoard();
        
        winDisplay.textContent = '0.00 ₽';
        stepCountDisplay.textContent = '0';
        updateInventoryDisplay();
    }

    function updateStatsUI() {
        winDisplay.textContent = `${currentWin.toFixed(2)} ₽`;
        stepCountDisplay.textContent = Math.max(0, currentStep + 1);
        if (isPlaying) {
            cashoutBtn.textContent = `💰 ЗАБРАТЬ ${currentWin.toFixed(2)} ₽`;
        }
    }

    function showFloatingNotification(text, color) {
        const notif = document.createElement('div');
        notif.textContent = text;
        notif.style.cssText = `
            position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
            background: ${color}; color: #000; padding: 15px 30px; border-radius: 10px;
            font-weight: bold; font-size: 20px; z-index: 10000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.style.opacity = '0'; notif.style.transition = 'opacity 0.5s';
            setTimeout(() => notif.remove(), 500);
        }, 2500);
    }

    window.addEventListener('resize', () => {
        if (currentStep !== undefined) movePlayerToTile(currentStep);
    });
})();