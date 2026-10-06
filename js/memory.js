(function () {
    // ============ КОНСТАНТЫ ============
    const SYMBOLS = ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒'];
    const MULTIPLIERS = [4, 8, 12, 16, 20, 24, 28, 50];
    const CARD_FLIP_DELAY = 800;  // ms — задержка после неправильной пары
    const TOTAL_PAIRS = 8;

    // ============ DOM ============
    const boardEl = document.getElementById('memory-board');
    const startBtn = document.getElementById('memory-start-btn');
    const cashoutBtn = document.getElementById('memory-cashout-btn');
    const continueBtn = document.getElementById('memory-continue-btn');
    const decisionEl = document.getElementById('memory-decision');
    const decisionTitleEl = document.getElementById('memory-decision-title');
    const decisionTextEl = document.getElementById('memory-decision-text');
    const statusEl = document.getElementById('memory-status');
    const betAmountInput = document.getElementById('bet-amount');
    const inventoryListEl = document.getElementById('inventory-list');
    const currentBetAmountEl = document.getElementById('current-bet-amount');
    const currentBetItemEl = document.getElementById('current-bet-item');
    const pairsCountEl = document.getElementById('memory-pairs-count');
    const currentMultEl = document.getElementById('memory-current-mult');
    const currentWinEl = document.getElementById('memory-current-win');
    const ladderEl = document.getElementById('memory-ladder');
    const historyListEl = document.getElementById('history-list');
    const balanceEl = document.getElementById('bal-header');

    // ============ СОСТОЯНИЕ ============
    let state = {
        board: [],
        firstPick: null,
        pairsFound: 0,
        phase: 'idle',      // idle | playing | decision | resolving | gameover
        bet: 0,
        usedItem: null,
        revealTimer: null,
        locked: false
    };

    let selectedInventoryItem = null;

    // ============ УТИЛИТЫ ============
    function setStatus(text, cls = '') {
        statusEl.innerHTML = text;
        statusEl.className = 'memory-status ' + cls;
    }

    function updateBalanceDisplay() {
        if (balanceEl) balanceEl.textContent = (window.globalBalance || 0).toFixed(2);
    }

    function initBalance() {
        if (typeof window.globalBalance === 'undefined') {
            const saved = localStorage.getItem('userBalance');
            window.globalBalance = saved !== null && !isNaN(parseFloat(saved)) ? parseFloat(saved) : 0;
        }
        updateBalanceDisplay();
    }

    function formatMoney(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(2).replace('.00', '') + 'M';
        if (n >= 1000)    return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.0', '') + 'k';
        return Math.round(n).toString();
    }

    // ============ ГЕНЕРАЦИЯ ДОСКИ ============
    function generateBoard() {
        const cards = [];
        for (let i = 0; i < TOTAL_PAIRS; i++) {
            cards.push({ symbol: SYMBOLS[i], revealed: false, matched: false, wrong: false });
            cards.push({ symbol: SYMBOLS[i], revealed: false, matched: false, wrong: false });
        }
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        return cards;
    }

    // ============ РЕНДЕР ============
    function renderBoard() {
        boardEl.innerHTML = '';
        state.board.forEach((card, idx) => {
            const el = document.createElement('div');
            el.className = 'memory-card';
            if (card.revealed || card.matched) el.classList.add('revealed');
            if (card.matched) el.classList.add('matched');
            if (card.wrong)  el.classList.add('wrong');
            if (state.locked || state.phase !== 'playing') el.classList.add('disabled');

            el.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-face memory-card-back">?</div>
                    <div class="memory-card-face memory-card-front">${card.symbol}</div>
                </div>
            `;

            el.addEventListener('click', () => onCardClick(idx));
            boardEl.appendChild(el);
        });
    }

    function updateCardVisual(idx) {
        const el = boardEl.children[idx];
        if (!el) return;
        const card = state.board[idx];
        el.classList.toggle('revealed', card.revealed || card.matched);
        el.classList.toggle('matched', card.matched);
        el.classList.toggle('wrong', card.wrong);
        el.classList.toggle('disabled', state.locked || state.phase !== 'playing');
    }

    function updateAllCardsVisual() {
        state.board.forEach((_, idx) => updateCardVisual(idx));
    }

    // ============ ЛЕСТНИЦА ============
    function renderLadder() {
        ladderEl.innerHTML = '';
        MULTIPLIERS.forEach((m, i) => {
            const el = document.createElement('div');
            el.className = 'memory-ladder-step';
            el.textContent = 'x' + m;

            if (state.pairsFound > i) {
                el.classList.add('passed');
            } else if (state.pairsFound === i && state.phase === 'decision') {
                el.classList.add('current');
            }

            ladderEl.appendChild(el);
        });
    }

    // ============ ПРОГРЕСС ============
    function updateProgress() {
        pairsCountEl.textContent = `${state.pairsFound} / ${TOTAL_PAIRS}`;

        if (state.pairsFound === 0) {
            currentMultEl.textContent = '—';
            currentWinEl.textContent = '0 ₽';
        } else {
            const mult = MULTIPLIERS[state.pairsFound - 1];
            currentMultEl.textContent = 'x' + mult;
            currentWinEl.textContent = formatMoney(state.bet * mult) + ' ₽';
        }

        renderLadder();
    }

    // ============ СТАВКА ============
    function updateCurrentBetDisplay() {
        const amount = parseFloat(betAmountInput.value) || 0;
        if (currentBetAmountEl) currentBetAmountEl.textContent = `${amount.toLocaleString()} ₽`;
        if (currentBetItemEl) {
            if (selectedInventoryItem) {
                currentBetItemEl.textContent = `🎒 ${selectedInventoryItem.name}`;
                currentBetItemEl.style.color = '#4CAF50';
            } else {
                currentBetItemEl.textContent = '';
            }
        }
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
            if (selectedInventoryItem && selectedInventoryItem.id === item.id) card.classList.add('selected');
            if (state.phase !== 'idle' && state.phase !== 'gameover') card.classList.add('disabled');

            let borderColor = '#888';
            if (item.tier === 'tier1') borderColor = '#3880ec';
            else if (item.tier === 'tier2') borderColor = '#7e1a7e';
            else if (item.tier === 'tier3') borderColor = '#f14df1';
            else if (item.tier === 'tier4') borderColor = '#dd3131';
            else if (item.tier === 'tier5') borderColor = '#f7f723';

            card.style.borderColor = (selectedInventoryItem && selectedInventoryItem.id === item.id) ? 'orange' : 'transparent';

            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="inventory-item-img" onerror="this.src='../img/logo.png'">
                <div class="inventory-item-info">
                    <div class="inventory-item-name" style="color:${borderColor};">${item.name}</div>
                    <div class="inventory-item-price">${item.price.toLocaleString()} ₽</div>
                </div>
                <div class="inventory-item-select">${selectedInventoryItem && selectedInventoryItem.id === item.id ? '✓' : '→'}</div>
            `;

            card.addEventListener('click', () => {
                if (state.phase !== 'idle' && state.phase !== 'gameover') return;

                if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
                    selectedInventoryItem = null;
                    betAmountInput.disabled = false;
                    betAmountInput.style.opacity = '1';
                } else {
                    selectedInventoryItem = item;
                    betAmountInput.disabled = true;
                    betAmountInput.style.opacity = '0.5';
                    betAmountInput.value = item.price;
                }
                updateInventoryDisplay();
                updateCurrentBetDisplay();
            });

            inventoryListEl.appendChild(card);
        });
    }

    // ============ СТАРТ ============
    function startGame() {
        if (state.phase !== 'idle' && state.phase !== 'gameover') return;

        const bet = parseFloat(betAmountInput.value);
        const balance = window.globalBalance || 0;

        if (!selectedInventoryItem && (isNaN(bet) || bet <= 0)) {
            setStatus('❌ Введите сумму ставки!', 'error');
            return;
        }

        if (!selectedInventoryItem && bet > balance) {
            setStatus(`❌ Недостаточно средств! Баланс: ${balance.toFixed(2)} ₽`, 'error');
            return;
        }

        if (selectedInventoryItem) {
            const inv = window.InventoryManager ? window.InventoryManager.getInventory() : [];
            if (!inv.some(i => i.id === selectedInventoryItem.id)) {
                setStatus('❌ Предмет больше не доступен', 'error');
                selectedInventoryItem = null;
                betAmountInput.disabled = false;
                betAmountInput.style.opacity = '1';
                updateInventoryDisplay();
                return;
            }
        }

        // Списание
        let betAmount;
        let usedItem = null;

        if (selectedInventoryItem) {
            betAmount = selectedInventoryItem.price;
            usedItem = selectedInventoryItem;
            window.InventoryManager.removeItem(usedItem.id);
            selectedInventoryItem = null;
            betAmountInput.disabled = false;
            betAmountInput.style.opacity = '1';
            updateInventoryDisplay();
        } else {
            betAmount = bet;
            window.globalBalance -= betAmount;
            updateBalanceDisplay();
        }

        state.bet = betAmount;
        state.usedItem = usedItem;
        state.pairsFound = 0;
        state.firstPick = null;
        state.board = generateBoard();
        state.phase = 'playing';
        state.locked = false;

        startBtn.disabled = true;
        startBtn.textContent = '🎯 ИГРА ИДЁТ...';
        setStatus('🎯 Найдите первую пару! Кликните по карточке, затем по её паре.');
        hideDecision();
        renderBoard();
        updateProgress();
        updateCurrentBetDisplay();

        if (window.forceSaveBalance) window.forceSaveBalance();
    }

    // ============ КЛИК ПО КАРТЕ ============
    function onCardClick(idx) {
        if (state.phase !== 'playing') return;
        if (state.locked) return;

        const card = state.board[idx];
        if (card.matched) return;
        if (card.revealed) return;

        // Первая карта
        if (state.firstPick === null) {
            card.revealed = true;
            state.firstPick = idx;
            updateCardVisual(idx);
            setStatus('🤔 Теперь найдите её пару...');
            return;
        }

        // Вторая карта
        card.revealed = true;
        updateCardVisual(idx);

        const first = state.board[state.firstPick];
        const second = card;

        if (first.symbol === second.symbol) {
            // ✅ MATCH
            state.locked = true;
            setTimeout(() => {
                first.matched = true;
                second.matched = true;
                state.pairsFound++;
                state.firstPick = null;
                state.locked = false;

                updateCardVisual(state.board.indexOf(first));
                updateCardVisual(state.board.indexOf(second));
                updateProgress();

                if (state.pairsFound === TOTAL_PAIRS) {
                    setTimeout(() => cashout(true), 400);
                } else {
                    state.phase = 'decision';
                    showDecision();
                }
            }, 350);
        } else {
            // ❌ MISMATCH
            state.locked = true;
            first.wrong = true;
            second.wrong = true;
            updateCardVisual(state.firstPick);
            updateCardVisual(idx);

            setStatus('❌ Не пара! Ставка сгорела...', 'error');

            state.phase = 'resolving';
            state.revealTimer = setTimeout(() => {
                first.wrong = false;
                second.wrong = false;
                first.revealed = false;
                second.revealed = false;
                updateCardVisual(state.board.indexOf(first));
                updateCardVisual(state.board.indexOf(second));

                state.firstPick = null;
                loseGame();
            }, CARD_FLIP_DELAY);
        }
    }

    // ============ РЕШЕНИЕ ============
    function showDecision() {
        const mult = MULTIPLIERS[state.pairsFound - 1];
        const nextMult = MULTIPLIERS[state.pairsFound];
        const win = state.bet * mult;

        decisionTitleEl.textContent = `🎉 ПАРА НАЙДЕНА!`;
        decisionTextEl.innerHTML = `Множитель <b style="color:#ffb400;">x${mult}</b> · К выплате <b style="color:#4CAF50;">${formatMoney(win)} ₽</b>`;

        cashoutBtn.textContent = `💰 ЗАБРАТЬ ${formatMoney(win)} ₽`;
        continueBtn.textContent = `➡ ПРОДОЛЖИТЬ → x${nextMult}`;
        continueBtn.style.display = '';

        decisionEl.classList.add('active');
        updateProgress();
    }

    function hideDecision() {
        decisionEl.classList.remove('active');
    }

    // ============ ЗАБРАТЬ ============
    function cashout(auto = false) {
        if (state.phase !== 'decision' && !auto) return;
        if (state.pairsFound === 0) return;

        const mult = MULTIPLIERS[state.pairsFound - 1];
        const winAmount = state.bet * mult;
        const profit = winAmount - state.bet;

        window.globalBalance += winAmount;
        updateBalanceDisplay();

        setStatus(`🎉 ВЫИГРЫШ! x${mult} · +${formatMoney(profit)} ₽`, 'success');

        addBalanceHistory(
            state.usedItem ? winAmount : profit,
            `Memory (${state.pairsFound} пар, x${mult})`
        );

        addToHistory(state.pairsFound, profit, true, mult);

        if (state.pairsFound >= 3) triggerWinEffect();

        state.phase = 'gameover';
        state.locked = true;
        hideDecision();
        updateAllCardsVisual();
        resetButtons();

        if (window.forceSaveBalance) window.forceSaveBalance();
    }

    // ============ ПРОИГРЫШ ============
    function loseGame() {
        state.phase = 'gameover';
        state.locked = true;

        setStatus(`💀 ПРОИГРЫШ! Ставка ${state.bet.toLocaleString()} ₽ сгорела.`, 'error');

        addBalanceHistory(-state.bet, `Memory (промах на ${state.pairsFound + 1}-й паре)`);
        addToHistory(state.pairsFound, -state.bet, false, 0);

        resetButtons();

        if (window.forceSaveBalance) window.forceSaveBalance();
    }

    function resetButtons() {
        startBtn.disabled = false;
        startBtn.textContent = '🎴 НАЧАТЬ ЗАНОВО';
    }

    // ============ ПРОДОЛЖИТЬ ============
    function continueGame() {
        if (state.phase !== 'decision') return;
        hideDecision();
        state.phase = 'playing';
        state.locked = false;
        updateAllCardsVisual();
        updateProgress();
        setStatus(`🎯 Найдите пару #${state.pairsFound + 1}!`);
    }

    // ============ ЭФФЕКТЫ ============
    function triggerWinEffect() {
        for (let i = 0; i < 60; i++) createConfetti();
    }

    function createConfetti() {
        const c = document.createElement('div');
        c.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: hsl(${Math.random() * 360}, 100%, 55%);
            left: ${Math.random() * window.innerWidth}px;
            top: -10px;
            pointer-events: none;
            z-index: 9999;
            border-radius: 2px;
            animation: confettiFallMem ${Math.random() * 2 + 1}s linear forwards;
        `;
        document.body.appendChild(c);
        setTimeout(() => { if (c.parentNode) c.remove(); }, 3000);
    }

    function addConfettiAnimation() {
        if (!document.getElementById('confetti-style-memory')) {
            const style = document.createElement('style');
            style.id = 'confetti-style-memory';
            style.textContent = `
                @keyframes confettiFallMem {
                    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ============ ИСТОРИЯ ============
    function addBalanceHistory(amount, description) {
        const container = document.getElementById('hb');
        if (!container) return;
        const item = document.createElement('div');
        item.className = 'hb';
        const timestamp = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const sign = amount >= 0 ? '+' : '';
        const color = amount >= 0 ? '#4CAF50' : '#f44336';
        item.innerHTML = `
            <span style="color:${color};font-weight:bold;">${sign}${Math.abs(amount).toFixed(2)} ₽</span>
            (${description})
            <span style="color:orange;">→ ${(window.globalBalance || 0).toFixed(2)} ₽</span>
            <span style="color:#888;font-size:12px;margin-left:8px;">${timestamp}</span>
        `;
        item.style.borderLeftColor = color;
        container.insertBefore(item, container.firstChild);
        while (container.children.length > 20) container.removeChild(container.lastChild);
    }

    function addToHistory(pairs, profit, won, mult) {
        if (!historyListEl) return;
        const item = document.createElement('div');
        item.className = 'history-item';
        if (won) {
            item.classList.add(profit >= state.bet * 10 ? 'history-big-win' : 'history-win');
            const sign = profit >= 0 ? '+' : '';
            item.innerHTML = `🎴 ${pairs} пар · x${mult} · ${sign}${formatMoney(profit)}₽`;
        } else {
            item.classList.add('history-lose');
            item.innerHTML = `💀 ${pairs} пар · ${formatMoney(profit)}₽`;
        }
        historyListEl.insertBefore(item, historyListEl.firstChild);
        while (historyListEl.children.length > 12) {
            historyListEl.removeChild(historyListEl.lastChild);
        }
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function init() {
        addConfettiAnimation();
        initBalance();
        updateInventoryDisplay();
        updateCurrentBetDisplay();
        renderLadder();
        updateProgress();

        state.board = [];
        renderBoard();

        startBtn.addEventListener('click', startGame);
        cashoutBtn.addEventListener('click', () => cashout(false));
        continueBtn.addEventListener('click', continueGame);

        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.addEventListener('click', () => {
                if (state.phase !== 'idle' && state.phase !== 'gameover') return;
                if (selectedInventoryItem) {
                    selectedInventoryItem = null;
                    updateInventoryDisplay();
                    betAmountInput.disabled = false;
                    betAmountInput.style.opacity = '1';
                }
                betAmountInput.value = btn.dataset.amount;
                updateCurrentBetDisplay();
            });
        });

        betAmountInput.addEventListener('input', updateCurrentBetDisplay);

        setInterval(() => {
            if (balanceEl) {
                const shown = parseFloat(balanceEl.textContent);
                if (!isNaN(shown) && shown !== window.globalBalance) {
                    window.globalBalance = shown;
                }
            }
            updateInventoryDisplay();
        }, 1500);

        if (window.InventoryManager) {
            const origAdd = window.InventoryManager.addItem;
            window.InventoryManager.addItem = function (...args) {
                const r = origAdd.apply(this, args);
                updateInventoryDisplay();
                return r;
            };
        }

        console.log('Memory: 4×4, 8 пар, множители x4→x8→x12→...→x32. Без preview.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();