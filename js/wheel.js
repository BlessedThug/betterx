(function () {
    // DOM элементы
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spin-btn');
    const betAmountInput = document.getElementById('bet-amount');
    const resultText = document.getElementById('result-text');
    const historyList = document.getElementById('history-list');
    const balanceEl = document.getElementById('bal-header');
    const inventoryListEl = document.getElementById('inventory-list');

    // Настройки колеса
    let segments = [];
    let currentAngle = 0;
    let spinning = false;
    let animationId = null;
    let spinStartTime = 0;
    let spinDuration = 3000;
    let spinStartAngle = 0;
    let spinTargetRotation = 0;
    let selectedInventoryItem = null;
    let currentBetDisplay = null;

    // Функция блокировки/разблокировки элементов ставки
    function toggleBetInputs(disabled) {
        // Блокируем/разблокируем поле ввода ставки
        if (betAmountInput) {
            betAmountInput.disabled = disabled;
            betAmountInput.style.opacity = disabled ? '0.5' : '1';
            betAmountInput.style.cursor = disabled ? 'not-allowed' : 'text';
        }

        // Блокируем/разблокируем кнопки быстрой ставки
        const quickBetBtns = document.querySelectorAll('.quick-bet');
        quickBetBtns.forEach(btn => {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.5' : '1';
            btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        });

        // Блокируем/разблокируем элементы инвентаря (только если не выбран предмет)
        if (!selectedInventoryItem) {
            const inventoryItems = document.querySelectorAll('.inventory-item-card');
            inventoryItems.forEach(item => {
                if (disabled) {
                    item.classList.add('disabled');
                } else {
                    item.classList.remove('disabled');
                }
            });
        }

        // Если выбран предмет, то при блокировке его нельзя отменить, но сам предмет остается
        if (selectedInventoryItem && disabled) {
            // Предмет выбран - ничего не делаем с ним
        } else if (selectedInventoryItem && !disabled) {
            // Разблокировано - предмет остается выбранным
        }
    }

    // Создаем отображение текущей ставки
    function createCurrentBetDisplay() {
        const gameArea = document.querySelector('.wheel-game-area');
        const wheelWrapper = document.querySelector('.wheel-wrapper');

        if (gameArea && !document.querySelector('.current-bet-display')) {
            const display = document.createElement('div');
            display.className = 'current-bet-display';
            display.innerHTML = `
                <div class="label">ТЕКУЩАЯ СТАВКА</div>
                <div class="amount" id="current-bet-amount">0 ₽</div>
                <div class="item-name" id="current-bet-item"></div>
            `;
            gameArea.insertBefore(display, wheelWrapper);
            currentBetDisplay = display;
        }
    }

    function updateCurrentBetDisplay() {
        if (!currentBetDisplay) createCurrentBetDisplay();

        const amount = parseFloat(betAmountInput.value) || 0;
        const amountEl = document.getElementById('current-bet-amount');
        const itemEl = document.getElementById('current-bet-item');

        if (amountEl) {
            amountEl.textContent = `${amount.toLocaleString()} ₽`;
        }

        if (itemEl) {
            if (selectedInventoryItem) {
                itemEl.textContent = `🎒 ${selectedInventoryItem.name}`;
                itemEl.style.color = '#4CAF50';
            } else {
                itemEl.textContent = '';
            }
        }
    }

    // Обновленные шансы секций колеса
    const wheelSegments = [
        // { label: '0x', value: 0, color: '#f44336', textColor: '#fff', chance: 55 },
        // { label: '1.5x', value: 1.5, color: '#2196F3', textColor: '#fff', chance: 30 },
        // { label: '2x', value: 2, color: '#4CAF50', textColor: '#fff', chance: 10 },
        // { label: '5x', value: 5, color: '#9C27B0', textColor: '#fff', chance: 4 },
        // { label: '10x', value: 10, color: '#FF9800', textColor: '#1a1a1a', chance: 1 }
        { label: '0x', value: 0, color: '#f44336', textColor: '#fff', chance: 11},
        { label: '1.5x', value: 1.5, color: '#2196F3', textColor: '#fff', chance: 10},
        { label: '2x', value: 2, color: '#4CAF50', textColor: '#fff', chance: 5 },
        { label: '0x', value: 0, color: '#f44336', textColor: '#fff', chance: 11},
        { label: '5x', value: 5, color: '#9C27B0', textColor: '#fff', chance: 2 },
        { label: '1.5x', value: 1.5, color: '#2196F3', textColor: '#fff', chance: 10},
        { label: '0x', value: 0, color: '#f44336', textColor: '#fff', chance: 10},
        { label: '2x', value: 2, color: '#4CAF50', textColor: '#fff', chance: 5 },
        { label: '1.5x', value: 1.5, color: '#2196F3', textColor: '#fff', chance: 10},
        { label: '0x', value: 0, color: '#f44336', textColor: '#fff', chance: 11},
        { label: '5x', value: 5, color: '#9C27B0', textColor: '#fff', chance: 2 },
        { label: '10x', value: 10, color: '#FF9800', textColor: '#1a1a1a', chance: 2 },
        { label: '0x', value: 0, color: '#f44336', textColor: '#fff', chance: 11},
    ];

    // Генерация секций на основе шансов
    function generateSegments() {
        segments = [];

        let currentPercent = 0;

        wheelSegments.forEach((segment) => {
            segments.push({
                ...segment,
                percent: segment.chance,
                startPercent: currentPercent,
                endPercent: currentPercent + segment.chance
            });
            currentPercent += segment.chance;
        });

        // Перемешиваем порядок секций
        for (let i = segments.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [segments[i], segments[j]] = [segments[j], segments[i]];
        }
    }

    // Отрисовка колеса - тёмная тема с акцентом на цифры
    function drawWheel() {
        if (!canvas || !ctx) return;

        const size = canvas.width;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 10;

        const angleStep = (Math.PI * 2) / 100;

        ctx.clearRect(0, 0, size, size);

        let currentAnglePos = currentAngle;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const startAngle = currentAnglePos;
            const endAngle = startAngle + (segment.chance * angleStep);

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Тёмная тема - приглушенные цвета с акцентом только на текст
            let bgColor;
            switch (segment.value) {
                case 0:
                    bgColor = '#2a1a1a'; // тёмно-красный
                    break;
                case 1.5:
                    bgColor = '#1a2a3a'; // тёмно-синий
                    break;
                case 2:
                    bgColor = '#1a2a1a'; // тёмно-зелёный
                    break;
                case 5:
                    bgColor = '#2a1a3a'; // тёмно-фиолетовый
                    break;
                case 10:
                    bgColor = '#3a2a1a'; // тёмно-оранжевый
                    break;
                default:
                    bgColor = '#1a1a2a';
            }

            // Градиент от тёмного к чуть светлее
            const gradient = ctx.createLinearGradient(
                centerX + Math.cos(startAngle) * radius * 0.3,
                centerY + Math.sin(startAngle) * radius * 0.3,
                centerX + Math.cos(endAngle) * radius * 0.7,
                centerY + Math.sin(endAngle) * radius * 0.7
            );
            gradient.addColorStop(0, bgColor);
            gradient.addColorStop(1, adjustColor(bgColor, 15));
            ctx.fillStyle = gradient;
            ctx.fill();

            // Тонкая обводка
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Рисуем текст - яркий, заметный
            ctx.save();
            ctx.translate(centerX, centerY);
            const midAngle = startAngle + (segment.chance * angleStep) / 2;
            ctx.rotate(midAngle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const fontSize = Math.max(18, Math.min(34, radius * 0.16));
            ctx.font = `bold ${fontSize}px "Noto Sans"`;

            // Цвет текста в зависимости от множителя
            let textColor;
            switch (segment.value) {
                case 0:
                    textColor = '#ff6666';
                    break;
                case 1.5:
                    textColor = '#66b3ff';
                    break;
                case 2:
                    textColor = '#66ff66';
                    break;
                case 5:
                    textColor = '#cc66ff';
                    break;
                case 10:
                    textColor = '#ffcc66';
                    break;
                default:
                    textColor = '#ffffff';
            }

            ctx.fillStyle = textColor;
            ctx.shadowBlur = 8;
            ctx.shadowColor = textColor;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            const textRadius = radius * 0.65;
            ctx.fillText(segment.label, textRadius, 8);

            ctx.restore();

            currentAnglePos = endAngle;
        }

        // Центральный круг
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0f';
        ctx.fill();
        ctx.strokeStyle = '#ffb400';
        ctx.lineWidth = size > 400 ? 3 : 2;
        ctx.stroke();

        // Внутренний декоративный круг
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#ffb400';
        ctx.fill();

        // Декоративные линии
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 180, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function adjustColor(color, percent) {
        // Простое осветление цвета
        const num = parseInt(color.slice(1), 16);
        const r = Math.min(255, ((num >> 16) & 0xFF) + percent);
        const g = Math.min(255, ((num >> 8) & 0xFF) + percent);
        const b = Math.min(255, (num & 0xFF) + percent);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    // Анимация вращения
    function animateSpin(timestamp) {
        if (!spinning) return;

        const elapsed = timestamp - spinStartTime;
        let progress = Math.min(1, elapsed / spinDuration);

        const easeOut = (t) => 1 - Math.pow(1 - t, 4);
        const easedProgress = easeOut(progress);

        const totalRotation = spinTargetRotation * easedProgress;
        currentAngle = spinStartAngle + totalRotation;

        drawWheel();

        if (progress < 1) {
            animationId = requestAnimationFrame(animateSpin);
        } else {
            spinning = false;
            spinBtn.disabled = false;
            spinBtn.textContent = 'КРУТИТЬ КОЛЕСО';

            // Разблокируем элементы ставки после завершения игры
            toggleBetInputs(false);

            const winningSegment = getCurrentSegment();
            processResult(winningSegment);
        }
    }

    function getCurrentSegment() {
        const pointerAngle = -Math.PI / 2;
        let rawAngle = (pointerAngle - currentAngle) % (Math.PI * 2);
        if (rawAngle < 0) rawAngle += Math.PI * 2;

        const percent = (rawAngle / (Math.PI * 2)) * 100;

        let accumulatedPercent = 0;
        for (const segment of segments) {
            const segmentStart = accumulatedPercent;
            const segmentEnd = accumulatedPercent + segment.chance;
            if (percent >= segmentStart && percent < segmentEnd) {
                return segment;
            }
            accumulatedPercent += segment.chance;
        }

        return segments[0];
    }

    async function processResult(segment) {
        let betAmount = parseFloat(betAmountInput.value);
        const currentBalance = window.globalBalance || 0;

        if (isNaN(betAmount) || betAmount <= 0) {
            resultText.innerHTML = '❌ Введите корректную сумму ставки!';
            resultText.className = 'result-lose';
            return;
        }

        let actualBetAmount = betAmount;
        let usedInventoryItem = null;

        if (selectedInventoryItem) {
            actualBetAmount = selectedInventoryItem.price;
            usedInventoryItem = selectedInventoryItem;
        } else {
            if (betAmount > currentBalance) {
                resultText.innerHTML = `❌ Недостаточно средств! Баланс: ${currentBalance.toFixed(2)} ₽`;
                resultText.className = 'result-lose';
                return;
            }
        }

        // Снимаем ставку
        if (usedInventoryItem) {
            if (window.InventoryManager) {
                const removed = window.InventoryManager.removeItem(usedInventoryItem.id);
                if (!removed) {
                    resultText.innerHTML = '❌ Ошибка: предмет не найден в инвентаре!';
                    resultText.className = 'result-lose';
                    return;
                }
            }
            selectedInventoryItem = null;
            betAmountInput.disabled = false;
            betAmountInput.style.opacity = '1';
            updateInventoryDisplay();
            updateCurrentBetDisplay();
        } else {
            window.globalBalance -= betAmount;
            updateBalanceDisplay();
        }

        const multiplier = segment.value;
        let winAmount = 0;
        let resultMessage = '';
        let resultClass = '';

        if (multiplier === 0) {
            winAmount = 0;
            resultMessage = `💀 ПРОИГРЫШ! ${segment.label}\nСтавка: ${actualBetAmount.toLocaleString()} ₽ сгорела.`;
            resultClass = 'result-lose';
            addBalanceHistory(-actualBetAmount, `Проигрыш в Wheel (${segment.label})`);
        } else {
            winAmount = actualBetAmount * multiplier;
            window.globalBalance += winAmount;

            const profit = winAmount - actualBetAmount;
            resultMessage = `🎉 ПОБЕДА! ${segment.label}\nВыигрыш: ${winAmount.toLocaleString()} ₽ (+${profit.toLocaleString()} ₽)`;

            if (multiplier >= 5) {
                resultClass = 'result-big-win';
                addBalanceHistory(profit, `КРУПНЫЙ ВЫИГРЫШ в Wheel! ${segment.label}`);
                triggerWinEffect();
            } else {
                resultClass = 'result-win';
                addBalanceHistory(profit, `Выигрыш в Wheel (${segment.label})`);
            }
        }

        updateBalanceDisplay();

        resultText.innerHTML = resultMessage.replace(/\n/g, '<br>');
        resultText.className = resultClass;

        addToHistory(segment, actualBetAmount, winAmount);
        highlightWinningSegment(segment);

        if (window.forceSaveBalance) {
            window.forceSaveBalance();
        }

        updateCurrentBetDisplay();
    }

    function triggerWinEffect() {
        for (let i = 0; i < 50; i++) {
            createConfetti();
        }

        canvas.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.8)';
        setTimeout(() => {
            canvas.style.boxShadow = '0 0 40px rgba(255, 165, 0, 0.3)';
        }, 1000);
    }

    function createConfetti() {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: hsl(${Math.random() * 360}, 100%, 50%);
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

    function highlightWinningSegment(segment) {
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            if (flashCount >= 6) {
                clearInterval(flashInterval);
                drawWheel();
            } else {
                drawWheel();
                flashCount++;
            }
        }, 150);
    }

    function addBalanceHistory(amount, description) {
        const historyContainer = document.getElementById('hb');
        if (!historyContainer) return;

        const historyItem = document.createElement('div');
        historyItem.className = 'hb';

        const timestamp = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
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

    function addToHistory(segment, betAmount, winAmount) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const isWin = segment.value > 0;
        const multiplierClass = segment.value >= 5 ? 'history-big-win' : (isWin ? 'history-win' : 'history-lose');
        historyItem.classList.add(multiplierClass);

        const profit = isWin ? winAmount - betAmount : -betAmount;
        const profitSign = profit >= 0 ? '+' : '';

        historyItem.innerHTML = `${segment.label} | ${profitSign}${Math.abs(profit).toLocaleString()}₽`;

        historyList.insertBefore(historyItem, historyList.firstChild);

        while (historyList.children.length > 15) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    function startSpin() {
        if (spinning) return;

        let betAmount = parseFloat(betAmountInput.value);
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
            const itemExists = inventory.some(item => item.id === selectedInventoryItem.id);
            if (!itemExists) {
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
        resultText.innerHTML = '';

        // Блокируем элементы ставки во время вращения
        toggleBetInputs(true);

        generateSegments();

        const fullRotations = Math.floor(Math.random() * 8) + 10;
        spinTargetRotation = fullRotations * Math.PI * 2;
        spinStartAngle = currentAngle;
        spinStartTime = performance.now();

        animationId = requestAnimationFrame(animateSpin);
    }

    function updateBalanceDisplay() {
        if (balanceEl) {
            balanceEl.textContent = (window.globalBalance || 0).toFixed(2);
        }
    }

    function updateInventoryDisplay() {
        if (!inventoryListEl) return;

        const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];

        if (!inventory || inventory.length === 0) {
            inventoryListEl.innerHTML = '<div class="inventory-empty">🎒 Нет предметов в инвентаре</div>';
            return;
        }

        inventoryListEl.innerHTML = '';

        inventory.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'inventory-item-card';
            if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
                itemCard.classList.add('selected');
            }
            if (spinning) {
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
                if (spinning) return; // Нельзя менять во время игры

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

            inventoryListEl.appendChild(itemCard);
        });
    }

    function initBalance() {
        if (typeof window.globalBalance === 'undefined') {
            const savedBalance = localStorage.getItem('userBalance');
            if (savedBalance !== null && !isNaN(parseFloat(savedBalance))) {
                window.globalBalance = parseFloat(savedBalance);
            } else {
                window.globalBalance = 0;
            }
        }
        updateBalanceDisplay();
    }

    function addConfettiAnimation() {
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function resizeCanvas() {
        const wrapper = document.querySelector('.wheel-wrapper');
        if (!wrapper) return;

        // Получаем доступную ширину
        const wrapperWidth = wrapper.clientWidth;
        // Ограничиваем максимальный размер
        const maxSize = Math.min(wrapperWidth, window.innerHeight * 0.6);
        const size = Math.max(200, maxSize);

        canvas.width = size;
        canvas.height = size;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        drawWheel();
    }

    function init() {
        addConfettiAnimation();
        generateSegments();

        // Настройка resize observer для адаптации размера колеса
        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });

        const wrapper = document.querySelector('.wheel-wrapper');
        if (wrapper) {
            resizeObserver.observe(wrapper);
        }

        window.addEventListener('resize', () => {
            resizeCanvas();
        });

        resizeCanvas();
        initBalance();
        updateInventoryDisplay();
        createCurrentBetDisplay();
        updateCurrentBetDisplay();

        spinBtn.addEventListener('click', startSpin);

        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.addEventListener('click', () => {
                if (spinning) return; // Нельзя менять ставку во время игры

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

        setInterval(() => {
            if (balanceEl) {
                const displayedBalance = parseFloat(balanceEl.textContent);
                if (!isNaN(displayedBalance) && displayedBalance !== window.globalBalance) {
                    window.globalBalance = displayedBalance;
                }
            }
            updateInventoryDisplay();
        }, 1000);

        if (window.InventoryManager) {
            const originalAddItem = window.InventoryManager.addItem;
            window.InventoryManager.addItem = function (...args) {
                const result = originalAddItem.apply(this, args);
                updateInventoryDisplay();
                return result;
            };
        }

        console.log('Wheel.js инициализирован. Шансы: 0x-46%, 1.5x-31%, 2x-15%, 5x-6%, 10x-3%');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();