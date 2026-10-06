(function () {
    // ============ DOM ЭЛЕМЕНТЫ ============
    const spinBtn = document.getElementById('spin-btn');
    const infoBtn = document.getElementById('info-btn');
    const betAmountInput = document.getElementById('bet-amount');
    const resultText = document.getElementById('result-text');
    const historyList = document.getElementById('history-list');
    const balanceEl = document.getElementById('bal-header');
    const inventoryListEl = document.getElementById('inventory-list');
    const reelsContainer = document.getElementById('reels-container');

    const infoOverlay = document.getElementById('info-overlay');
    const infoBlock = document.getElementById('info-block');
    const closeInfoBtn = document.getElementById('closeInfoBtn');
    const combosList = document.querySelector('.combos-list');

    // ============ СОСТОЯНИЕ ============
    let spinning = false;
    let selectedInventoryItem = null;

    // ============ КОНФИГУРАЦИЯ СИМВОЛОВ ============
    // weight — вес (шанс выпадения). Суммарный вес не обязательно 100 — алгоритм нормализует.
    const SYMBOLS = [
        { emoji: '🍒', name: 'Вишня',    value: 2,  weight: 30, tier: 'common' },
        { emoji: '🍋', name: 'Лимон',    value: 3,  weight: 25, tier: 'common' },
        { emoji: '🍇', name: 'Виноград', value: 5,  weight: 20, tier: 'uncommon' },
        { emoji: '🔔', name: 'Колокол',  value: 10, weight: 12, tier: 'rare' },
        { emoji: '💎', name: 'Алмаз',    value: 20, weight: 8,  tier: 'epic' },
        { emoji: '7️⃣', name: 'Семёрка',  value: 30, weight: 4,  tier: 'legendary' },
        { emoji: '⭐', name: 'Звезда',   value: 50, weight: 1,  tier: 'mythic' },
    ];

    // Линии выплат: [row, col] для каждой из 3 ячеек
    // row: 0=верх, 1=центр, 2=низ; col: 0..2 = номер барабана
    const PAYLINES = [
        { id: 1, name: 'Верхняя',       cells: [[0, 0], [0, 1], [0, 2]] },
        { id: 2, name: 'Средняя',       cells: [[1, 0], [1, 1], [1, 2]] },
        { id: 3, name: 'Нижняя',        cells: [[2, 0], [2, 1], [2, 2]] },
        { id: 4, name: 'Диагональ ↘',   cells: [[0, 0], [1, 1], [2, 2]] },
        { id: 5, name: 'Диагональ ↗',   cells: [[2, 0], [1, 1], [0, 2]] },
    ];

    // ============ УТИЛИТЫ ============
    function getRandomSymbol() {
        const total = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
        let r = Math.random() * total;
        for (const s of SYMBOLS) {
            r -= s.weight;
            if (r <= 0) return s;
        }
        return SYMBOLS[0];
    }

    // Генерируем финальную сетку [row][col] (3x3)
    function generateGrid() {
        const grid = [[], [], []];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                grid[row][col] = getRandomSymbol();
            }
        }
        return grid;
    }

    // ============ БЛОКИРОВКА ЭЛЕМЕНТОВ СТАВКИ ============
    function toggleBetInputs(disabled) {
        if (betAmountInput) {
            betAmountInput.disabled = disabled;
            betAmountInput.style.opacity = disabled ? '0.5' : '1';
            betAmountInput.style.cursor = disabled ? 'not-allowed' : 'text';
        }

        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.5' : '1';
            btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        });

        if (!selectedInventoryItem) {
            document.querySelectorAll('.inventory-item-card').forEach(item => {
                if (disabled) item.classList.add('disabled');
                else item.classList.remove('disabled');
            });
        }
    }

    // ============ ОТОБРАЖЕНИЕ ТЕКУЩЕЙ СТАВКИ ============
    function updateCurrentBetDisplay() {
        const amount = parseFloat(betAmountInput.value) || 0;
        const amountEl = document.getElementById('current-bet-amount');
        const itemEl = document.getElementById('current-bet-item');

        if (amountEl) amountEl.textContent = `${amount.toLocaleString()} ₽`;

        if (itemEl) {
            if (selectedInventoryItem) {
                itemEl.textContent = `🎒 ${selectedInventoryItem.name}`;
                itemEl.style.color = '#4CAF50';
            } else {
                itemEl.textContent = '';
            }
        }
    }

    // ============ РЕНДЕР СЕТКИ ============
    function renderGrid(grid) {
        const reels = document.querySelectorAll('.reel');
        reels.forEach((reelEl, col) => {
            const symbols = reelEl.querySelectorAll('.symbol');
            symbols.forEach((el, row) => {
                el.textContent = grid[row][col].emoji;
                el.classList.remove('winning');
            });
        });
    }

    // Начальная заливка барабанов случайными символами
    function initReelsRandom() {
        const reels = document.querySelectorAll('.reel');
        reels.forEach(reelEl => {
            reelEl.querySelectorAll('.symbol').forEach(el => {
                el.textContent = getRandomSymbol().emoji;
            });
        });
    }

    // ============ АНИМАЦИЯ ВРАЩЕНИЯ ============
    function animateReels(finalGrid, onComplete) {
        const reels = document.querySelectorAll('.reel');
        let completed = 0;

        reels.forEach((reelEl, reelIndex) => {
            const symbolEls = reelEl.querySelectorAll('.symbol');
            const duration = 900 + reelIndex * 400; // 900, 1300, 1700
            const startTime = performance.now();
            const interval = 55;

            reelEl.classList.add('spinning');

            const timer = setInterval(() => {
                const elapsed = performance.now() - startTime;

                if (elapsed >= duration) {
                    clearInterval(timer);
                    reelEl.classList.remove('spinning');

                    // Финальные символы
                    symbolEls.forEach((el, row) => {
                        el.textContent = finalGrid[row][reelIndex].emoji;
                    });

                    completed++;
                    if (completed === reels.length) {
                        onComplete();
                    }
                } else {
                    // Крутим случайные символы
                    symbolEls.forEach(el => {
                        el.textContent = getRandomSymbol().emoji;
                    });
                }
            }, interval);
        });
    }

    // ============ ПРОВЕРКА ВЫИГРЫШЕЙ ============
    function checkWins(grid, betAmount) {
        let totalWin = 0;
        const winLines = [];

        for (const line of PAYLINES) {
            const cells = line.cells.map(([r, c]) => grid[r][c]);
            const first = cells[0];
            if (cells.every(s => s.emoji === first.emoji)) {
                const win = betAmount * first.value;
                totalWin += win;
                winLines.push({ ...line, symbol: first, win });
            }
        }

        return { totalWin, winLines };
    }

    // ============ ПОДСВЕТКА ВЫИГРЫШНЫХ СИМВОЛОВ ============
    function highlightWinningSymbols(winLines) {
        // Сброс
        document.querySelectorAll('.symbol.winning').forEach(el => el.classList.remove('winning'));

        if (winLines.length === 0) return;

        const reels = document.querySelectorAll('.reel');

        winLines.forEach(line => {
            line.cells.forEach(([row, col]) => {
                const reel = reels[col];
                if (!reel) return;
                const symbols = reel.querySelectorAll('.symbol');
                const el = symbols[row];
                if (el) el.classList.add('winning');
            });
        });
    }

    // ============ ОСНОВНАЯ ЛОГИКА СПИНА ============
    function startSpin() {
        if (spinning) return;

        const betAmount = parseFloat(betAmountInput.value);
        const currentBalance = window.globalBalance || 0;

        if (isNaN(betAmount) || betAmount <= 0) {
            resultText.innerHTML = '❌ Введите сумму ставки!';
            resultText.className = 'result-lose';
            return;
        }

        if (!selectedInventoryItem && betAmount > currentBalance) {
            resultText.innerHTML = `❌ Недостаточно средств! Баланс: ${currentBalance.toFixed(2)} ₽`;
            resultText.className = 'result-lose';
            return;
        }

        if (selectedInventoryItem) {
            const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];
            const exists = inventory.some(i => i.id === selectedInventoryItem.id);
            if (!exists) {
                resultText.innerHTML = '❌ Выбранный предмет больше не доступен!';
                resultText.className = 'result-lose';
                selectedInventoryItem = null;
                betAmountInput.disabled = false;
                betAmountInput.style.opacity = '1';
                updateInventoryDisplay();
                updateCurrentBetDisplay();
                return;
            }
        }

        spinning = true;
        spinBtn.disabled = true;
        spinBtn.textContent = '🌀 ВРАЩЕНИЕ... 🌀';
        resultText.innerHTML = '🎰 Барабаны крутятся...';
        resultText.className = '';

        toggleBetInputs(true);

        // Генерируем финальную сетку
        const finalGrid = generateGrid();

        // Анимируем
        animateReels(finalGrid, () => {
            finishSpin(finalGrid);
        });
    }

    function finishSpin(finalGrid) {
        // Скрываем старую подсветку и ставим финальные символы
        renderGrid(finalGrid);

        const betAmount = parseFloat(betAmountInput.value) || 0;
        let actualBetAmount = betAmount;
        let usedInventoryItem = null;

        // Снятие ставки
        if (selectedInventoryItem) {
            actualBetAmount = selectedInventoryItem.price;
            usedInventoryItem = selectedInventoryItem;

            if (window.InventoryManager) {
                const removed = window.InventoryManager.removeItem(usedInventoryItem.id);
                if (!removed) {
                    resultText.innerHTML = '❌ Ошибка: предмет не найден!';
                    resultText.className = 'result-lose';
                    finishSpinCleanup();
                    return;
                }
            }

            selectedInventoryItem = null;
            betAmountInput.disabled = false;
            betAmountInput.style.opacity = '1';
            updateInventoryDisplay();
            updateCurrentBetDisplay();
        } else {
            if (actualBetAmount > (window.globalBalance || 0)) {
                resultText.innerHTML = '❌ Недостаточно средств!';
                resultText.className = 'result-lose';
                finishSpinCleanup();
                return;
            }
            window.globalBalance -= actualBetAmount;
            updateBalanceDisplay();
        }

        // Проверка выигрышей
        const { totalWin, winLines } = checkWins(finalGrid, actualBetAmount);

        // Подсветка
        highlightWinningSymbols(winLines);

        let resultMessage = '';
        let resultClass = '';

        if (totalWin === 0) {
            resultMessage = `💀 ПРОИГРЫШ!<br>Ставка ${actualBetAmount.toLocaleString()} ₽ сгорела.`;
            resultClass = 'result-lose';
            addBalanceHistory(-actualBetAmount, 'Проигрыш в Slots');
        } else {
            window.globalBalance += totalWin;
            const profit = totalWin - actualBetAmount;
            const profitStr = profit >= 0 ? `+${profit.toLocaleString()}` : profit.toLocaleString();

            if (profit < 0) {
                // Частичный возврат
                resultMessage = `😐 Совпадения!<br>Выплата: ${totalWin.toLocaleString()} ₽ (${profitStr} ₽)`;
                resultClass = 'result-lose';
                addBalanceHistory(profit, `Slots (${winLines.length} лин.)`);
            } else if (totalWin >= actualBetAmount * 10) {
                resultMessage = `🔥 МЕГА-ВЫИГРЫШ! 🔥<br>${totalWin.toLocaleString()} ₽ (+${profit.toLocaleString()} ₽)`;
                resultClass = 'result-big-win';
                triggerWinEffect();
                addBalanceHistory(profit, `КРУПНЫЙ ВЫИГРЫШ в Slots! ${winLines.length} лин.`);
            } else {
                resultMessage = `🎉 ВЫИГРЫШ!<br>${totalWin.toLocaleString()} ₽ (+${profit.toLocaleString()} ₽)`;
                resultClass = 'result-win';
                addBalanceHistory(profit, `Выигрыш в Slots (${winLines.length} лин.)`);
            }
        }

        updateBalanceDisplay();
        resultText.innerHTML = resultMessage;
        resultText.className = resultClass;

        addToHistory(winLines, actualBetAmount, totalWin);

        if (window.forceSaveBalance) window.forceSaveBalance();

        updateCurrentBetDisplay();
        finishSpinCleanup();
    }

    function finishSpinCleanup() {
        spinning = false;
        spinBtn.disabled = false;
        spinBtn.textContent = 'КРУТИТЬ СЛОТЫ';
        toggleBetInputs(false);
    }

    // ============ ЭФФЕКТ ВЫИГРЫША (КОНФЕТТИ) ============
    function triggerWinEffect() {
        for (let i = 0; i < 60; i++) createConfetti();

        const machine = document.querySelector('.slots-machine');
        if (machine) {
            machine.style.boxShadow = '0 0 80px rgba(255, 215, 0, 0.9), inset 0 0 30px rgba(0,0,0,0.9)';
            setTimeout(() => {
                machine.style.boxShadow = '0 0 40px rgba(255, 165, 0, 0.35), inset 0 0 30px rgba(0,0,0,0.9)';
            }, 1200);
        }
    }

    function createConfetti() {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: hsl(${Math.random() * 360}, 100%, 55%);
            left: ${Math.random() * window.innerWidth}px;
            top: -10px;
            pointer-events: none;
            z-index: 9999;
            border-radius: 2px;
            animation: confettiFall ${Math.random() * 2 + 1}s linear forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => {
            if (confetti.parentNode) confetti.remove();
        }, 3000);
    }

    function addConfettiAnimation() {
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ============ ИСТОРИЯ БАЛАНСА (как в wheel.js) ============
    function addBalanceHistory(amount, description) {
        const historyContainer = document.getElementById('hb');
        if (!historyContainer) return;

        const historyItem = document.createElement('div');
        historyItem.className = 'hb';

        const timestamp = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const sign = amount >= 0 ? '+' : '';
        const color = amount >= 0 ? '#4CAF50' : '#f44336';

        historyItem.innerHTML = `
            <span style="color: ${color}; font-weight: bold;">${sign}${Math.abs(amount).toFixed(2)} ₽</span>
            (${description})
            <span style="color: orange;">→ ${(window.globalBalance || 0).toFixed(2)} ₽</span>
            <span style="color: #888; font-size: 14px; margin-left: 10px;">${timestamp}</span>
        `;
        historyItem.style.borderLeftColor = color;

        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
        while (historyContainer.children.length > 20) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }

    // ============ ИСТОРИЯ СПИНОВ ============
    function addToHistory(winLines, betAmount, totalWin) {
        if (!historyList) return;

        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const profit = totalWin - betAmount;

        if (winLines.length === 0) {
            historyItem.classList.add('history-lose');
            historyItem.innerHTML = `💀 −${betAmount.toLocaleString()}₽`;
        } else {
            const maxMultiplier = Math.max(...winLines.map(l => l.symbol.value));
            if (maxMultiplier >= 10 || totalWin >= betAmount * 5) {
                historyItem.classList.add('history-big-win');
            } else {
                historyItem.classList.add('history-win');
            }
            const sign = profit >= 0 ? '+' : '';
            historyItem.innerHTML = `${winLines.length}🎯 ${sign}${profit.toLocaleString()}₽`;
        }

        historyList.insertBefore(historyItem, historyList.firstChild);
        while (historyList.children.length > 15) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    // ============ БАЛАНС ============
    function updateBalanceDisplay() {
        if (balanceEl) {
            balanceEl.textContent = (window.globalBalance || 0).toFixed(2);
        }
    }

    function initBalance() {
        if (typeof window.globalBalance === 'undefined') {
            const saved = localStorage.getItem('userBalance');
            if (saved !== null && !isNaN(parseFloat(saved))) {
                window.globalBalance = parseFloat(saved);
            } else {
                window.globalBalance = 0;
            }
        }
        updateBalanceDisplay();
    }

    // ============ ИНВЕНТАРЬ ============
    function updateInventoryDisplay() {
        if (!inventoryListEl) return;

        const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];

        if (!inventory || inventory.length === 0) {
            inventoryListEl.innerHTML = '<div class="inventory-empty">🎒 Нет предметов в инвентаре</div>';
            return;
        }

        inventoryListEl.innerHTML = '';

        inventory.forEach(item => {
            const card = document.createElement('div');
            card.className = 'inventory-item-card';
            if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
                card.classList.add('selected');
            }
            if (spinning) card.classList.add('disabled');

            let borderColor = '#888';
            if (item.tier === 'tier1') borderColor = '#3880ec';
            else if (item.tier === 'tier2') borderColor = '#7e1a7e';
            else if (item.tier === 'tier3') borderColor = '#f14df1';
            else if (item.tier === 'tier4') borderColor = '#dd3131';
            else if (item.tier === 'tier5') borderColor = '#f7f723';

            card.style.borderColor = (selectedInventoryItem && selectedInventoryItem.id === item.id)
                ? 'orange' : 'transparent';

            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="inventory-item-img" onerror="this.src='../img/logo.png'">
                <div class="inventory-item-info">
                    <div class="inventory-item-name" style="color: ${borderColor};">${item.name}</div>
                    <div class="inventory-item-price">${item.price.toLocaleString()} ₽</div>
                </div>
                <div class="inventory-item-select">${selectedInventoryItem && selectedInventoryItem.id === item.id ? '✓' : '→'}</div>
            `;

            card.addEventListener('click', () => {
                if (spinning) return;

                if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
                    selectedInventoryItem = null;
                    betAmountInput.disabled = false;
                    betAmountInput.style.opacity = '1';
                    resultText.innerHTML = '💰 Используется денежная ставка';
                    resultText.className = '';
                } else {
                    selectedInventoryItem = item;
                    betAmountInput.disabled = true;
                    betAmountInput.style.opacity = '0.5';
                    betAmountInput.value = item.price;
                    resultText.innerHTML = `🎒 Используется предмет: ${item.name} (${item.price.toLocaleString()} ₽)`;
                    resultText.className = 'result-win';
                }
                updateInventoryDisplay();
                updateCurrentBetDisplay();
            });

            inventoryListEl.appendChild(card);
        });
    }

    // ============ МОДАЛЬНОЕ ОКНО ИНФО ============
    function buildInfoModal() {
        if (!combosList) return;
        combosList.innerHTML = '';

        // Сортируем по возрастанию множителя
        const sorted = [...SYMBOLS].sort((a, b) => a.value - b.value);

        sorted.forEach(sym => {
            const row = document.createElement('div');
            row.className = 'combo-row';
            row.dataset.tier = sym.tier;
            row.innerHTML = `
                <div class="combo-symbols">
                    <span>${sym.emoji}</span><span>${sym.emoji}</span><span>${sym.emoji}</span>
                </div>
                <div class="combo-name">${sym.name}</div>
                <div class="combo-payout">x${sym.value}</div>
            `;
            combosList.appendChild(row);
        });
    }

    function openInfoModal() {
        if (!infoOverlay || !infoBlock) return;
        infoOverlay.classList.add('active');
        infoBlock.classList.add('active');
    }

    function closeInfoModal() {
        if (!infoOverlay || !infoBlock) return;
        infoOverlay.classList.remove('active');
        infoBlock.classList.remove('active');
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function init() {
        addConfettiAnimation();
        buildInfoModal();
        initReelsRandom();
        initBalance();
        updateInventoryDisplay();
        updateCurrentBetDisplay();

        // Кнопки
        spinBtn.addEventListener('click', startSpin);
        if (infoBtn) infoBtn.addEventListener('click', openInfoModal);
        if (closeInfoBtn) closeInfoBtn.addEventListener('click', closeInfoModal);
        if (infoOverlay) infoOverlay.addEventListener('click', closeInfoModal);

        // Быстрые ставки
        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.addEventListener('click', () => {
                if (spinning) return;
                if (selectedInventoryItem) {
                    selectedInventoryItem = null;
                    updateInventoryDisplay();
                    betAmountInput.disabled = false;
                    betAmountInput.style.opacity = '1';
                }
                const amount = parseFloat(btn.dataset.amount);
                betAmountInput.value = amount;
                resultText.innerHTML = `💰 Сумма ставки: ${amount.toLocaleString()} ₽`;
                resultText.className = '';
                updateCurrentBetDisplay();
            });
        });

        betAmountInput.addEventListener('input', () => {
            if (!selectedInventoryItem && !spinning) {
                updateCurrentBetDisplay();
            }
        });

        // Синхронизация баланса и обновление инвентаря
        setInterval(() => {
            if (balanceEl) {
                const displayed = parseFloat(balanceEl.textContent);
                if (!isNaN(displayed) && displayed !== window.globalBalance) {
                    window.globalBalance = displayed;
                }
            }
            updateInventoryDisplay();
        }, 1000);

        // Хук на добавление предметов
        if (window.InventoryManager) {
            const originalAddItem = window.InventoryManager.addItem;
            window.InventoryManager.addItem = function (...args) {
                const result = originalAddItem.apply(this, args);
                updateInventoryDisplay();
                return result;
            };
        }

        // Esc закрывает инфо-модалку
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeInfoModal();
        });

        console.log('Slots инициализирован. Символов: ' + SYMBOLS.length + ', линий: ' + PAYLINES.length);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();