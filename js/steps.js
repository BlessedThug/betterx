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
    
    // Модальное окно
    const resultModal = document.getElementById('steps-result-modal');
    const resultTitle = document.getElementById('steps-result-title');
    const resultText = document.getElementById('steps-result-text');
    const resultBtn = document.getElementById('steps-result-btn');

    // Константы
    const TOTAL_TILES = 25;
    
    // Состояние игры
    let isPlaying = false;
    let currentStep = -1; 
    let currentWin = 0;
    let baseBet = 0;
    let tilesData = [];
    let selectedInventoryItem = null;

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

        // Обработка ручного ввода ставки
        betInput.addEventListener('input', () => {
            if (!isPlaying && selectedInventoryItem) {
                selectedInventoryItem = null;
                betInput.disabled = false;
                updateInventoryDisplay();
            }
        });

        // Обработка кнопок быстрой ставки
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
            if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
                itemCard.classList.add('selected');
            }
            if (isPlaying) {
                itemCard.classList.add('disabled');
            }

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

    // ========== ГЕНЕРАЦИЯ ПУТИ (УСЛОЖНЕННАЯ) ==========
    function generatePath() {
        tilesData = [];
        
        for (let i = 0; i < TOTAL_TILES; i++) {
            let p = i / TOTAL_TILES; 
            let r = Math.random();
            let type;

            // 1. Определяем шансы на тип клетки
            if (p < 0.3) {
                if (r < 0.45) type = 'add';
                else if (r < 0.85) type = 'sub'; 
                else if (r < 0.92) type = 'mult';
                else if (r < 0.95) type = 'lose'; // 3% на краш
                else type = 'bonus';
            } 
            else if (p < 0.7) {
                if (r < 0.35) type = 'add';
                else if (r < 0.60) type = 'sub';
                else if (r < 0.80) type = 'mult';
                else if (r < 0.95) type = 'lose'; // 15% на краш
                else type = 'bonus';
            } 
            else {
                if (r < 0.25) type = 'add';
                else if (r < 0.40) type = 'sub';
                else if (r < 0.70) type = 'mult';
                else if (r < 0.95) type = 'lose'; // 25% на краш
                else type = 'bonus';
            }

            // 2. Определяем величину награды/штрафа (взвешенный рандом)
            let val = 0;
            let text = '';

            if (type === 'add') {
                let r2 = Math.random();
                let percent;
                if (p < 0.3) {
                    if (r2 < 0.7) percent = Math.floor(Math.random() * 8) + 5; // 5-12%
                    else if (r2 < 0.95) percent = Math.floor(Math.random() * 8) + 13; // 13-20%
                    else percent = Math.floor(Math.random() * 15) + 21; // 21-35% (редкий шанс)
                } else if (p < 0.7) {
                    if (r2 < 0.4) percent = Math.floor(Math.random() * 11) + 5; // 5-15%
                    else if (r2 < 0.8) percent = Math.floor(Math.random() * 15) + 16; // 16-30%
                    else percent = Math.floor(Math.random() * 20) + 31; // 31-50%
                } else {
                    if (r2 < 0.2) percent = Math.floor(Math.random() * 11) + 10; // 10-20%
                    else if (r2 < 0.6) percent = Math.floor(Math.random() * 20) + 21; // 21-40%
                    else percent = Math.floor(Math.random() * 40) + 41; // 41-80%
                }
                val = percent / 100;
                text = `+${percent}%`;
            } 
            else if (type === 'sub') {
                let r2 = Math.random();
                let percent;
                if (p < 0.3) {
                    if (r2 < 0.7) percent = Math.floor(Math.random() * 8) + 5; // 5-12%
                    else if (r2 < 0.95) percent = Math.floor(Math.random() * 8) + 13; // 13-20%
                    else percent = Math.floor(Math.random() * 15) + 21; // 21-35%
                } else if (p < 0.7) {
                    if (r2 < 0.4) percent = Math.floor(Math.random() * 11) + 5; // 5-15%
                    else if (r2 < 0.8) percent = Math.floor(Math.random() * 15) + 16; // 16-30%
                    else percent = Math.floor(Math.random() * 20) + 31; // 31-50%
                } else {
                    if (r2 < 0.2) percent = Math.floor(Math.random() * 11) + 10; // 10-20%
                    else if (r2 < 0.6) percent = Math.floor(Math.random() * 20) + 21; // 21-40%
                    else percent = Math.floor(Math.random() * 40) + 41; // 41-80%
                }
                val = percent / 100;
                text = `-${percent}%`;
            } 
            else if (type === 'mult') {
                let r2 = Math.random();
                let mult;
                if (p < 0.3) {
                    if (r2 < 0.8) mult = (Math.random() * 0.4 + 1.2).toFixed(1); // 1.2 - 1.6
                    else mult = (Math.random() * 0.4 + 1.6).toFixed(1); // 1.6 - 2.0
                } else if (p < 0.7) {
                    if (r2 < 0.6) mult = (Math.random() * 0.6 + 1.3).toFixed(1); // 1.3 - 1.9
                    else mult = (Math.random() * 0.8 + 1.9).toFixed(1); // 1.9 - 2.7
                } else {
                    if (r2 < 0.4) mult = (Math.random() * 1.0 + 1.5).toFixed(1); // 1.5 - 2.5
                    else mult = (Math.random() * 2.0 + 2.5).toFixed(1); // 2.5 - 4.5
                }
                val = parseFloat(mult);
                text = `x${mult}`;
            } 
            else if (type === 'lose') {
                text = '💀';
            } 
            else if (type === 'bonus') {
                text = '🎁';
            }

            tilesData.push({ type, value: val, text });
        }
        
        return tilesData;
    }

    function initBoard() {
        generatePath();
        board.innerHTML = ''; // Очищаем доску
        
        // ВАЖНО: Возвращаем аватар обратно, так как innerHTML = '' удалил его из DOM
        board.appendChild(player);
        
        // 1. Стартовая клетка
        const startTile = document.createElement('div');
        startTile.className = 'step-tile start-tile';
        startTile.dataset.index = -1;
        startTile.innerHTML = '🏁';
        board.appendChild(startTile);

        // 2. Игровые клетки
        tilesData.forEach((data, index) => {
            const tile = document.createElement('div');
            tile.className = 'step-tile';
            tile.dataset.index = index;
            tile.addEventListener('click', () => handleStep(index));
            board.appendChild(tile);
        });

        // 3. Показываем аватар на старте
        player.style.display = 'block';
        setTimeout(() => {
            movePlayerToTile(-1);
        }, 100);
    }

    // ========== ИГРА ==========
    function startGame() {
        if (isPlaying) return;

        let betAmount = parseFloat(betInput.value);
        
        if (selectedInventoryItem) {
            const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];
            const itemExists = inventory.some(item => item.id === selectedInventoryItem.id);
            if (!itemExists) {
                alert('Выбранный предмет больше не доступен!');
                selectedInventoryItem = null;
                betInput.disabled = false;
                updateInventoryDisplay();
                return;
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
        
        const firstTile = board.querySelector('.step-tile[data-index="0"]');
        if (firstTile) firstTile.classList.add('current');
    }

    function handleStep(index) {
        if (!isPlaying || index !== currentStep + 1) return;
        
        const tileEl = board.querySelector(`.step-tile[data-index="${index}"]`);
        if (!tileEl || tileEl.classList.contains('revealed')) return;

        const data = tilesData[index];

        tileEl.classList.add('revealed', `tile-${data.type}`);
        tileEl.textContent = data.text;

        if (data.type === 'add') {
            currentWin += (baseBet * data.value);
        } 
        else if (data.type === 'sub') {
            currentWin -= (baseBet * data.value);
            if (currentWin < 0) currentWin = 0;
        } 
        else if (data.type === 'mult') {
            currentWin *= data.value;
        } 
        else if (data.type === 'bonus') {
            const item = getRandomDrop(currentStep);
            if (item && window.InventoryManager) {
                window.InventoryManager.addItem(item.name, item.image, item.tier, item.price);
                tileEl.innerHTML = `<img src="${item.image}">`;
                tileEl.style.boxShadow = '0 0 20px #00BCD4';
                showFloatingNotification(`🎁 Дроп: ${item.name}`, '#00BCD4');
                statusText.textContent = `Выпал предмет!`;
            } else {
                currentWin *= 2;
                showFloatingNotification('🎁 Бонус x2!', '#00BCD4');
            }
        } 
        else if (data.type === 'lose') {
            currentWin = 0;
            movePlayerToTile(index);
            setTimeout(() => gameOver(), 500);
            return;
        }

        currentStep++;
        movePlayerToTile(currentStep);
        updateStatsUI();

        const nextTile = board.querySelector(`.step-tile[data-index="${currentStep + 1}"]`);
        if (nextTile) {
            nextTile.classList.add('current');
        }

        if (currentStep >= TOTAL_TILES - 1) {
            cashoutGame(true); 
        }
    }

    // ========== ПОЗИЦИОНИРОВАНИЕ АВАТАРА ==========
    function movePlayerToTile(tileIndex) {
        const targetTile = board.querySelector(`.step-tile[data-index="${tileIndex}"]`);
        if (!targetTile) return;

        board.querySelectorAll('.step-tile').forEach(el => el.classList.remove('current'));

        const boardRect = board.getBoundingClientRect();
        const tileRect = targetTile.getBoundingClientRect();

        const left = tileRect.left - boardRect.left;
        const top = tileRect.top - boardRect.top;

        const isMobile = window.innerWidth <= 900;

        if (isMobile) {
            player.style.left = `${left - 55}px`;
            player.style.top = `${top + 5}px`;
        } else {
            player.style.left = `${left + 10}px`;
            player.style.top = `${top - 65}px`;
        }

        targetTile.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    // ========== КОНЕЦ ИГРЫ ==========
    function cashoutGame(isAuto = false) {
        if (!isPlaying) return;
        isPlaying = false;
        
        if (currentWin > 0) {
            window.globalBalance += currentWin;
            updateBalanceUI();
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
    }

    // ========== УВЕДОМЛЕНИЯ ==========
    function showFloatingNotification(text, color) {
        const notif = document.createElement('div');
        notif.textContent = text;
        notif.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: #000;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 20px;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.5s';
            setTimeout(() => notif.remove(), 500);
        }, 2500);
    }

    window.addEventListener('resize', () => {
        if (currentStep !== undefined) {
            movePlayerToTile(currentStep);
        }
    });
})();