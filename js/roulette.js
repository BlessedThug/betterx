(function () {
    // ============ DOM ============
    const canvas = document.getElementById('rouletteCanvas');
    const ctx = canvas.getContext('2d');
    const confirmBtn = document.getElementById('confirm-btn');
    const betAmountInput = document.getElementById('bet-amount');
    const resultText = document.getElementById('result-text');
    const historyList = document.getElementById('history-list');
    const balanceEl = document.getElementById('bal-header');
    const inventoryListEl = document.getElementById('inventory-list');
    const tableEl = document.getElementById('betting-table');
    const timerBox = document.getElementById('timer-box');
    const timerValue = document.getElementById('timer-value');
    const undoBtn = document.getElementById('undo-bet-btn');
    const clearBtn = document.getElementById('clear-bets-btn');

    // ============ КОНСТАНТЫ ============
    const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const ZERO_ZERO = 37; // внутренний код для "00"

    const WHEEL_ORDER = [
        0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1,
        ZERO_ZERO,
        27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2
    ];

    const SECTOR_STEP = (Math.PI * 2) / WHEEL_ORDER.length;
    const TOP_ANGLE = -Math.PI / 2;

    // Множители
    const MULTIPLIER_ZERO = 50;       // 0 и 00 → x50
    const MULTIPLIER_STRAIGHT = 36;   // 1–36 → x36
    const MULTIPLIER_OUTSIDE_2 = 2;   // Red/Black/Even/Odd/Low/High
    const MULTIPLIER_OUTSIDE_3 = 3;   // Dozen/Column
    const MAX_BETS = 3; // максимум ставок за раунд

    // ============ СОСТОЯНИЕ ============
    let currentAngle = 0;
    let spinning = false;
    let animationId = null;

    let placedBets = [];               // [{ data, el, amount, item }]
    let selectedInventoryItem = null;  // «заряженный» предмет

    let ballAngle = TOP_ANGLE;
    let ballRadius = 0;

    let isWaitingForNextGame = true;
    let isBetConfirmed = false;
    let confirmedTotal = 0;
    let confirmedBets = [];            // копия placedBets на момент подтверждения
    let countdownInterval = null;
    let remainingTime = 15;
    const ROUND_TIME = 20;

    // ============ УТИЛИТЫ ============
    function displayNum(n) {
        if (n === ZERO_ZERO) return '00';
        return String(n);
    }
    function numberColor(n) {
        if (n === 0 || n === ZERO_ZERO) return 'green';
        return RED_NUMBERS.has(n) ? 'red' : 'black';
    }
    function numberColorHex(n) {
        if (n === 0 || n === ZERO_ZERO) return '#1f8a3e';
        return RED_NUMBERS.has(n) ? '#a81f24' : '#1a1a1a';
    }
    function isZero(n) {
        return n === 0 || n === ZERO_ZERO;
    }
    function multiplierForNumber(n) {
        return isZero(n) ? MULTIPLIER_ZERO : MULTIPLIER_STRAIGHT;
    }
    function adjustBrightness(hex, percent) {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) + percent));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + percent));
        const b = Math.max(0, Math.min(255, (num & 0xFF) + percent));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    function formatChipAmount(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
        if (n >= 1000)    return Math.round(n / 1000) + 'k';
        return String(Math.round(n));
    }

    // ============ СТОЛ ============
    function buildBettingTable() {
        tableEl.innerHTML = '';
        const cells = [];

        // Зеро 0
        cells.push({
            rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2,
            type: 'straight', number: 0, multiplier: MULTIPLIER_ZERO,
            label: '0', colorClass: 'cell-green cell-zero'
        });
        // Зеро 00
        cells.push({
            rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2,
            type: 'straight', number: ZERO_ZERO, multiplier: MULTIPLIER_ZERO,
            label: '00', colorClass: 'cell-green cell-zero cell-double-zero'
        });
        // Пустая клетка
        cells.push({
            rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2,
            type: 'empty', multiplier: 0,
            label: '', colorClass: 'cell-empty'
        });

        // 1..36
        for (let n = 1; n <= 36; n++) {
            const row = ((n - 1) % 3) + 1;
            const col = Math.floor((n - 1) / 3) + 2;
            cells.push({
                rowStart: row, rowEnd: row + 1,
                colStart: col, colEnd: col + 1,
                type: 'straight', number: n, multiplier: MULTIPLIER_STRAIGHT,
                label: String(n),
                colorClass: RED_NUMBERS.has(n) ? 'cell-red' : 'cell-black'
            });
        }

        // Колонки 2:1
        for (let c = 1; c <= 3; c++) {
            cells.push({
                rowStart: c, rowEnd: c + 1,
                colStart: 14, colEnd: 15,
                type: 'column', colIndex: c, multiplier: MULTIPLIER_OUTSIDE_3,
                label: '2:1', colorClass: 'cell-outside'
            });
        }

        // Дюжины
        [
            { index: 1, label: '1st 12', colStart: 2,  colEnd: 6 },
            { index: 2, label: '2nd 12', colStart: 6,  colEnd: 10 },
            { index: 3, label: '3rd 12', colStart: 10, colEnd: 14 }
        ].forEach(d => {
            cells.push({
                rowStart: 4, rowEnd: 5,
                colStart: d.colStart, colEnd: d.colEnd,
                type: 'dozen', dozenIndex: d.index, multiplier: MULTIPLIER_OUTSIDE_3,
                label: d.label, colorClass: 'cell-outside'
            });
        });

        // Внешние
        [
            { type: 'low',   label: '1-18',  colStart: 2,  colEnd: 4,  multiplier: MULTIPLIER_OUTSIDE_2 },
            { type: 'even',  label: 'EVEN',  colStart: 4,  colEnd: 6,  multiplier: MULTIPLIER_OUTSIDE_2 },
            { type: 'red',   label: '🔴',    colStart: 6,  colEnd: 8,  multiplier: MULTIPLIER_OUTSIDE_2 },
            { type: 'black', label: '⚫',    colStart: 8,  colEnd: 10, multiplier: MULTIPLIER_OUTSIDE_2 },
            { type: 'odd',   label: 'ODD',   colStart: 10, colEnd: 12, multiplier: MULTIPLIER_OUTSIDE_2 },
            { type: 'high',  label: '19-36', colStart: 12, colEnd: 14, multiplier: MULTIPLIER_OUTSIDE_2 }
        ].forEach(o => {
            cells.push({
                rowStart: 5, rowEnd: 6,
                colStart: o.colStart, colEnd: o.colEnd,
                type: o.type, multiplier: o.multiplier,
                label: o.label, colorClass: 'cell-outside'
            });
        });

        cells.forEach(c => {
            const el = document.createElement('div');
            el.className = 'bet-cell ' + (c.colorClass || '');
            el.style.gridRow = `${c.rowStart} / ${c.rowEnd}`;
            el.style.gridColumn = `${c.colStart} / ${c.colEnd}`;

            if (c.type === 'red')        el.innerHTML = '<span class="color-dot red"></span>';
            else if (c.type === 'black') el.innerHTML = '<span class="color-dot black"></span>';
            else if (c.type === 'empty') el.innerHTML = '';
            else                         el.textContent = c.label;

            if (c.type !== 'empty') {
                el.addEventListener('click', () => handleCellClick(c, el));
            } else {
                el.style.cursor = 'default';
                el.style.opacity = '0.4';
            }

            tableEl.appendChild(el);
        });
    }

    // ============ КЛИК ПО КЛЕТКЕ ============
    function handleCellClick(cellData, cellEl) {
        if (spinning || !isWaitingForNextGame) return;
        if (isBetConfirmed) {
            resultText.innerHTML = '⏳ Ставка уже подтверждена, дождитесь вращения';
            return;
        }

        if (!canAddBet(cellEl)) {
            resultText.innerHTML = `⚠️ Максимум ${MAX_BETS} ставки за раунд. Уберите одну фишку, чтобы поставить на новую клетку.`;
            resultText.className = 'result-lose';
            return;
        }

        const existingIndex = placedBets.findIndex(b => b.el === cellEl);

        // === Ставка предметом ===
        if (selectedInventoryItem) {
            // Есть ли уже ставка предметом на другой клетке?
            const itemBetIndex = placedBets.findIndex(b => b.item);

            if (existingIndex !== -1 && placedBets[existingIndex].item) {
                // Клик по той же клетке — убираем предмет-ставку и разряжаем предмет
                removeChipVisual(cellEl);
                placedBets.splice(existingIndex, 1);
                selectedInventoryItem = null;
                betAmountInput.disabled = false;
                betAmountInput.style.opacity = '1';
                updateInventoryDisplay();
                updateBetsDisplay();
                return;
            }

            if (existingIndex !== -1) {
                // Клик по клетке с денежной ставкой — убираем её
                removeChipVisual(cellEl);
                placedBets.splice(existingIndex, 1);
            }

            // Снимаем предыдущую предмет-ставку, если была
            if (itemBetIndex !== -1 && itemBetIndex < placedBets.length) {
                const old = placedBets[itemBetIndex];
                removeChipVisual(old.el);
                placedBets.splice(itemBetIndex, 1);
            }

            // Ставим предмет на эту клетку
            const newBet = {
                data: cellData,
                el: cellEl,
                amount: selectedInventoryItem.price,
                item: selectedInventoryItem
            };
            placedBets.push(newBet);
            addChipVisual(cellEl, selectedInventoryItem.price, true);
            updateBetsDisplay();
            return;
        }

        // === Денежная ставка ===
        if (existingIndex !== -1) {
            // Убираем существующую денежную ставку
            removeChipVisual(cellEl);
            placedBets.splice(existingIndex, 1);
            updateBetsDisplay();
            return;
        }

        const amount = parseFloat(betAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            resultText.innerHTML = '❌ Введите сумму ставки!';
            resultText.className = 'result-lose';
            return;
        }

        placedBets.push({
            data: cellData,
            el: cellEl,
            amount: amount,
            item: null
        });
        addChipVisual(cellEl, amount, false);
        updateBetsDisplay();
    }

    function canAddBet(cellEl) {
        // Клик по занятой клетке — всегда снятие, разрешаем
        if (placedBets.some(b => b.el === cellEl)) return true;

        // Ставка предметом: если предмет уже где-то стоит, он «переезжает» — не увеличивает счёт
        if (selectedInventoryItem && placedBets.some(b => b.item)) return true;

        return placedBets.length < MAX_BETS;
    }

    function addChipVisual(cellEl, amount, isItem) {
        // Удаляем предыдущую фишку, если была
        const old = cellEl.querySelector('.bet-chip');
        if (old) old.remove();

        cellEl.classList.add('has-bet');

        const chip = document.createElement('div');
        chip.className = 'bet-chip' + (isItem ? ' item-chip' : '');
        chip.textContent = isItem ? '🎒' : formatChipAmount(amount);
        cellEl.appendChild(chip);
    }

    function removeChipVisual(cellEl) {
        cellEl.classList.remove('has-bet', 'winning');
        const chip = cellEl.querySelector('.bet-chip');
        if (chip) chip.remove();
    }

    function clearAllChips() {
        document.querySelectorAll('.bet-cell.has-bet').forEach(el => {
            el.classList.remove('has-bet');
            const chip = el.querySelector('.bet-chip');
            if (chip) chip.remove();
        });
    }

    // ============ ОТОБРАЖЕНИЕ СТАВОК ============
    function updateBetsDisplay() {
        const amountEl = document.getElementById('current-bet-amount');
        const countEl = document.getElementById('current-bet-count');
        const itemEl = document.getElementById('current-bet-item');

        const total = placedBets.reduce((s, b) => s + b.amount, 0);
        const count = placedBets.length;
        const itemsCount = placedBets.filter(b => b.item).length;
        const atLimit = count >= MAX_BETS;

        if (amountEl) amountEl.textContent = `${total.toLocaleString()} ₽`;

        if (countEl) {
            countEl.textContent = `клеток: ${count}/${MAX_BETS}`;
            countEl.classList.toggle('at-limit', atLimit);
        }

        if (itemEl) {
            if (itemsCount > 0) {
                const itemBet = placedBets.find(b => b.item);
                itemEl.textContent = `🎒 ${itemBet.item.name}`;
                itemEl.style.color = '#4CAF50';
            } else {
                itemEl.textContent = '';
            }
        }

        // Кнопки отмены / очистки
        if (undoBtn) undoBtn.disabled = count === 0;
        if (clearBtn) clearBtn.disabled = count === 0;

        // Визуально гасим пустые клетки, когда лимит достигнут
        document.querySelectorAll('.bet-cell').forEach(c => {
            if (c.classList.contains('cell-empty')) return;
            const occupied = c.classList.contains('has-bet');
            if (atLimit && !occupied) {
                c.classList.add('limit-blocked');
            } else {
                c.classList.remove('limit-blocked');
            }
        });
    }

    // ============ ОТМЕНА / ОЧИСТКА ============
    function undoLastBet() {
        if (spinning || isBetConfirmed) return;
        if (placedBets.length === 0) return;

        const last = placedBets[placedBets.length - 1];
        removeChipVisual(last.el);
        placedBets.pop();

        if (last.item) {
            // Возвращаем предмет в «заряженное» состояние
            selectedInventoryItem = null;
            betAmountInput.disabled = false;
            betAmountInput.style.opacity = '1';
            updateInventoryDisplay();
        }

        updateBetsDisplay();
    }

    function clearAllBets() {
        if (spinning || isBetConfirmed) return;
        if (placedBets.length === 0) return;

        clearAllChips();
        const hadItem = placedBets.some(b => b.item);
        placedBets = [];

        if (hadItem) {
            selectedInventoryItem = null;
            betAmountInput.disabled = false;
            betAmountInput.style.opacity = '1';
            updateInventoryDisplay();
        }

        updateBetsDisplay();
    }

    // ============ БЛОКИРОВКА ============
    function toggleInputs(disabled) {
        if (betAmountInput) {
            // Не блокируем, если «заряжен» предмет — он и так держит disabled
            if (!selectedInventoryItem) {
                betAmountInput.disabled = disabled;
                betAmountInput.style.opacity = disabled ? '0.5' : '1';
            }
        }
        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.5' : '1';
        });
        if (!selectedInventoryItem) {
            document.querySelectorAll('.inventory-item-card').forEach(item => {
                if (disabled) item.classList.add('disabled');
                else item.classList.remove('disabled');
            });
        }
        document.querySelectorAll('.bet-cell').forEach(c => {
            if (c.classList.contains('cell-empty')) return;
            if (disabled) c.classList.add('disabled');
            else c.classList.remove('disabled');
        });
        if (undoBtn) undoBtn.disabled = disabled || placedBets.length === 0;
        if (clearBtn) clearBtn.disabled = disabled || placedBets.length === 0;
    }

    // ============ РИСОВАНИЕ КОЛЕСА ============
    function drawWheel() {
        const size = canvas.width;
        const cx = size / 2, cy = size / 2;
        const radius = size / 2 - 12;
        const outerTrackR  = radius * 0.96;
        const numberRingR  = radius * 0.82;
        const numberInnerR = radius * 0.66;
        const hubR         = radius * 0.40;

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius);
        rimGrad.addColorStop(0, '#2a1a0a');
        rimGrad.addColorStop(0.5, '#5a3a1a');
        rimGrad.addColorStop(1, '#1a0e04');
        ctx.fillStyle = rimGrad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 180, 0, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, outerTrackR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(180, 140, 60, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, outerTrackR - 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        for (let i = 0; i < WHEEL_ORDER.length; i++) {
            const num = WHEEL_ORDER[i];
            const startAngle = currentAngle + i * SECTOR_STEP;
            const endAngle = startAngle + SECTOR_STEP;

            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(startAngle) * numberInnerR, cy + Math.sin(startAngle) * numberInnerR);
            ctx.arc(cx, cy, numberRingR, startAngle, endAngle);
            ctx.lineTo(cx + Math.cos(endAngle) * numberInnerR, cy + Math.sin(endAngle) * numberInnerR);
            ctx.arc(cx, cy, numberInnerR, endAngle, startAngle, true);
            ctx.closePath();

            const baseColor = numberColorHex(num);
            const grad = ctx.createRadialGradient(cx, cy, numberInnerR, cx, cy, numberRingR);
            grad.addColorStop(0, adjustBrightness(baseColor, -18));
            grad.addColorStop(1, baseColor);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(startAngle) * numberInnerR, cy + Math.sin(startAngle) * numberInnerR);
            ctx.lineTo(cx + Math.cos(startAngle) * numberRingR,  cy + Math.sin(startAngle) * numberRingR);
            ctx.strokeStyle = 'rgba(220, 180, 100, 0.55)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            const midAngle = startAngle + SECTOR_STEP / 2;
            ctx.rotate(midAngle);

            let norm = midAngle % (Math.PI * 2);
            if (norm < 0) norm += Math.PI * 2;
            const flip = norm > Math.PI / 2 && norm < Math.PI * 1.5;
            const fontSize = Math.max(8, radius * 0.066);
            const label = displayNum(num);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${fontSize}px "Noto Sans"`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.9)';

            if (flip) {
                ctx.rotate(Math.PI);
                ctx.fillText(label, -numberRingR * 0.9, 0);
            } else {
                ctx.fillText(label, numberRingR * 0.9, 0);
            }
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, numberInnerR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(220, 180, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const hubGrad = ctx.createRadialGradient(cx, cy - hubR * 0.3, hubR * 0.1, cx, cy, hubR);
        hubGrad.addColorStop(0, '#3a2a10');
        hubGrad.addColorStop(0.6, '#1a1208');
        hubGrad.addColorStop(1, '#080502');
        ctx.beginPath();
        ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
        ctx.fillStyle = hubGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, hubR * 0.75, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 180, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, hubR * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 180, 0, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, hubR * 0.18, 0, Math.PI * 2);
        const capGrad = ctx.createRadialGradient(cx - hubR * 0.05, cy - hubR * 0.05, 2, cx, cy, hubR * 0.18);
        capGrad.addColorStop(0, '#ffe08a');
        capGrad.addColorStop(0.7, '#cc8800');
        capGrad.addColorStop(1, '#5a3a00');
        ctx.fillStyle = capGrad;
        ctx.fill();
    }

    function drawBall() {
        if (ballRadius <= 0) return;
        const size = canvas.width;
        const cx = size / 2, cy = size / 2;
        const x = cx + Math.cos(ballAngle) * ballRadius;
        const y = cy + Math.sin(ballAngle) * ballRadius;
        const ballSize = Math.max(7, size * 0.022);

        ctx.beginPath();
        ctx.arc(x + ballSize * 0.35, y + ballSize * 0.5, ballSize * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.filter = 'blur(2px)';
        ctx.fill();
        ctx.filter = 'none';

        const ballGrad = ctx.createRadialGradient(
            x - ballSize * 0.35, y - ballSize * 0.4, ballSize * 0.05,
            x, y, ballSize * 1.05
        );
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.35, '#f0f0f0');
        ballGrad.addColorStop(0.75, '#c8c8cc');
        ballGrad.addColorStop(1, '#6a6a72');

        ctx.beginPath();
        ctx.arc(x, y, ballSize, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x - ballSize * 0.38, y - ballSize * 0.42, ballSize * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
    }

    // ============ АНИМАЦИЯ ============
    function animateSpin(outcome, onComplete) {
        const size = canvas.width;
        const radius = size / 2 - 12;
        const outerTrackR = radius * 0.96;
        const pocketR     = radius * 0.73;
        const startBallR  = outerTrackR + 45;

        const startTime = performance.now();
        const duration = 5800;

        const idx = WHEEL_ORDER.indexOf(outcome);
        const sectorMid = idx * SECTOR_STEP + SECTOR_STEP / 2;
        const pocketAbsAngle = currentAngle + sectorMid;

        const TURNS = 12;
        const startBallAngle  = TOP_ANGLE;
        const targetBallAngle = pocketAbsAngle - TURNS * Math.PI * 2;

        function frame(now) {
            if (!spinning) return;
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);

            const ballEase = 1 - Math.pow(1 - t, 4);
            ballAngle = startBallAngle + (targetBallAngle - startBallAngle) * ballEase;

            let r;
            if (t < 0.12) {
                const tt = t / 0.12;
                const ease = 1 - Math.pow(1 - tt, 2);
                r = startBallR + (outerTrackR - startBallR) * ease;
            } else if (t < 0.68) {
                const tt = (t - 0.12) / 0.56;
                const wobble = Math.sin(tt * Math.PI * 9) * 3.5 * (1 - tt);
                r = outerTrackR + wobble;
            } else {
                const tt = (t - 0.68) / 0.32;
                const ease = tt * tt * tt;
                r = outerTrackR + (pocketR - outerTrackR) * ease;
            }
            ballRadius = r;

            drawWheel();
            drawBall();

            if (t < 1) {
                animationId = requestAnimationFrame(frame);
            } else {
                ballAngle  = targetBallAngle;
                ballRadius = pocketR;
                drawWheel();
                drawBall();
                onComplete();
            }
        }
        animationId = requestAnimationFrame(frame);
    }

    // ============ ПРОВЕРКА ВЫИГРЫША ============
    function checkWin(d, outcome) {
        const zero = isZero(outcome);
        switch (d.type) {
            case 'straight': return d.number === outcome;
            case 'red':      return !zero && RED_NUMBERS.has(outcome);
            case 'black':    return !zero && !RED_NUMBERS.has(outcome);
            case 'even':     return !zero && outcome % 2 === 0;
            case 'odd':      return !zero && outcome % 2 === 1;
            case 'low':      return !zero && outcome >= 1 && outcome <= 18;
            case 'high':     return !zero && outcome >= 19 && outcome <= 36;
            case 'dozen':
                if (zero) return false;
                if (d.dozenIndex === 1) return outcome >= 1 && outcome <= 12;
                if (d.dozenIndex === 2) return outcome >= 13 && outcome <= 24;
                if (d.dozenIndex === 3) return outcome >= 25 && outcome <= 36;
                return false;
            case 'column':
                if (zero) return false;
                if (d.colIndex === 1) return outcome % 3 === 1;
                if (d.colIndex === 2) return outcome % 3 === 2;
                if (d.colIndex === 3) return outcome % 3 === 0;
                return false;
        }
        return false;
    }

    // ============ ПОДТВЕРЖДЕНИЕ ============
    function confirmBet() {
        if (spinning || !isWaitingForNextGame) return;
        if (isBetConfirmed) return;

        if (placedBets.length === 0) {
            resultText.innerHTML = '❌ Сначала сделайте хотя бы одну ставку!';
            resultText.className = 'result-lose';
            return;
        }

        // Считаем общую сумму
        const total = placedBets.reduce((s, b) => s + b.amount, 0);
        const currentBalance = window.globalBalance || 0;

        // Есть ли ставка предметом?
        const itemBet = placedBets.find(b => b.item);

        // Проверяем наличие всех предметов в инвентаре
        if (itemBet) {
            const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];
            const exists = inventory.some(i => i.id === itemBet.item.id);
            if (!exists) {
                resultText.innerHTML = '❌ Предмет больше не доступен!';
                resultText.className = 'result-lose';
                // Снимаем предмет-ставку
                removeChipVisual(itemBet.el);
                placedBets = placedBets.filter(b => b !== itemBet);
                selectedInventoryItem = null;
                betAmountInput.disabled = false;
                betAmountInput.style.opacity = '1';
                updateInventoryDisplay();
                updateBetsDisplay();
                return;
            }
        }

        // Считаем денежную часть
        const moneyTotal = placedBets.filter(b => !b.item).reduce((s, b) => s + b.amount, 0);

        if (moneyTotal > currentBalance) {
            resultText.innerHTML = `❌ Недостаточно средств! Нужно ${moneyTotal.toFixed(2)} ₽, у вас ${currentBalance.toFixed(2)} ₽`;
            resultText.className = 'result-lose';
            return;
        }

        // Списываем деньги
        if (moneyTotal > 0) {
            window.globalBalance -= moneyTotal;
        }

        // Удаляем предмет из инвентаря
        if (itemBet && window.InventoryManager) {
            window.InventoryManager.removeItem(itemBet.item.id);
        }

        confirmedBets = placedBets.map(b => ({ ...b }));
        confirmedTotal = total;
        isBetConfirmed = true;

        updateBalanceDisplay();
        updateInventoryDisplay();

        confirmBtn.classList.add('confirmed');
        const countLabel = placedBets.length === 1 ? '1 ставка' : `${placedBets.length} ставки`;
        confirmBtn.textContent = `✅ ПОДТВЕРЖДЕНО · ${total.toLocaleString()} ₽ (${countLabel})`;

        toggleInputs(true);
        selectedInventoryItem = null;

        resultText.innerHTML = `✅ Ставка принята! Ждём вращения (${remainingTime}с)`;
        resultText.className = 'result-win';

        if (window.forceSaveBalance) window.forceSaveBalance();
    }

    // ============ ЗАПУСК ============
    function runSpin() {
        if (spinning) return;
        spinning = true;
        isWaitingForNextGame = false;
        timerBox.classList.add('hidden');

        // ⬇⬇⬇ НОВОЕ: сигнал «игра началась» ⬇⬇⬇
        if (window.rouletteOnline && window.rouletteOnline.onGameStart) {
            window.rouletteOnline.onGameStart();
        }

        resultText.innerHTML = '🎯 Вращение...';
        resultText.className = '';

        const outcome = Math.floor(Math.random() * 38);

        animateSpin(outcome, () => {
            finishSpin(outcome);
        });
    }

    function finishSpin(outcome) {
        highlightWinningCells(outcome);

        const colorName = numberColor(outcome) === 'green' ? '🟢' :
                          numberColor(outcome) === 'red' ? '🔴' : '⚫';
        const label = displayNum(outcome);

        if (isBetConfirmed && confirmedBets.length > 0) {
            let totalWin = 0;
            let wonCount = 0;
            let lostMoney = 0;

            confirmedBets.forEach(bet => {
                const won = checkWin(bet.data, outcome);
                if (won) {
                    totalWin += bet.amount * bet.data.multiplier;
                    wonCount++;
                    // Подсветка выигравшей фишки
                    if (bet.el) {
                        const chip = bet.el.querySelector('.bet-chip');
                        if (chip) chip.classList.add('won');
                    }
                } else {
                    if (!bet.item) lostMoney += bet.amount;
                    if (bet.el) {
                        const chip = bet.el.querySelector('.bet-chip');
                        if (chip) chip.classList.add('lost');
                    }
                }
            });

            const profit = totalWin - confirmedTotal;

            if (totalWin > 0) {
                window.globalBalance += totalWin;
                addBalanceHistory(
                    profit,
                    `Roulette ${label}: ${wonCount}/${confirmedBets.length} (x${confirmedBets.map(b => b.data.multiplier).join('/')})`
                );

                if (totalWin >= confirmedTotal * 5) {
                    resultText.innerHTML = `🔥 БОЛЬШОЙ ВЫИГРЫШ! ${colorName} ${label}<br>Выплата: ${totalWin.toLocaleString()} ₽ (+${profit.toLocaleString()} ₽)`;
                    resultText.className = 'result-big-win';
                    triggerWinEffect();
                } else if (profit > 0) {
                    resultText.innerHTML = `🎉 ВЫИГРЫШ! ${colorName} ${label}<br>Выплата: ${totalWin.toLocaleString()} ₽ (+${profit.toLocaleString()} ₽)<br><span style="font-size:13px;opacity:0.8;">Совпало ставок: ${wonCount}/${confirmedBets.length}</span>`;
                    resultText.className = 'result-win';
                } else {
                    resultText.innerHTML = `😐 Совпадения! ${colorName} ${label}<br>Выплата: ${totalWin.toLocaleString()} ₽ (${profit.toLocaleString()} ₽)<br><span style="font-size:13px;opacity:0.8;">Совпало ставок: ${wonCount}/${confirmedBets.length}</span>`;
                    resultText.className = 'result-lose';
                }
            } else {
                addBalanceHistory(-confirmedTotal, `Проигрыш в Roulette (${label})`);
                resultText.innerHTML = `💀 ПРОИГРЫШ! ${colorName} ${label}<br>Ставка ${confirmedTotal.toLocaleString()} ₽ сгорела.`;
                resultText.className = 'result-lose';
            }

            updateBalanceDisplay();
        } else {
            resultText.innerHTML = `${colorName} Выпало: <b>${label}</b><br><span style="color:#888;font-size:14px;">Вы не делали ставку</span>`;
            resultText.className = '';
        }

        addToHistory(outcome);

        if (window.rouletteOnline) {
            window.rouletteOnline.resolveRound(outcome, checkWin);
        }

        // Сброс
        isBetConfirmed = false;
        confirmedBets = [];

        // Стираем фишки через паузу
        setTimeout(() => {
            clearAllChips();
            placedBets = [];
            updateBetsDisplay();
            confirmBtn.classList.remove('confirmed');
            confirmBtn.textContent = '🎯 ПОДТВЕРДИТЬ СТАВКУ';
        }, 2200);

        setTimeout(() => {
            spinning = false;
            ballRadius = 0;
            drawWheel();

            setTimeout(() => {
                document.querySelectorAll('.bet-cell.winning').forEach(el => el.classList.remove('winning'));
            }, 500);

            startCountdown();
        }, 2500);
    }

    function highlightWinningCells(outcome) {
        document.querySelectorAll('.bet-cell.winning').forEach(el => el.classList.remove('winning'));
        const target = displayNum(outcome);
        document.querySelectorAll('.bet-cell').forEach(el => {
            if (el.classList.contains('cell-outside') || el.classList.contains('cell-empty')) return;
            const txt = el.textContent.trim();
            // Учитываем, что в клетке может быть текст + фишка — берём первый текстовый узел
            if (txt.startsWith(target)) {
                el.classList.add('winning');
            }
        });
    }

    // ============ ТАЙМЕР ============
    function startCountdown() {
        isWaitingForNextGame = true;
        remainingTime = ROUND_TIME;

        if (window.rouletteOnline && window.rouletteOnline.onNewRound) {
            window.rouletteOnline.onNewRound();
        }

        timerBox.classList.remove('hidden');
        updateTimerUI();

        toggleInputs(false);
        updateBetsDisplay();

        confirmBtn.classList.remove('confirmed');
        confirmBtn.textContent = '🎯 ПОДТВЕРДИТЬ СТАВКУ';
        confirmBtn.disabled = false;

        resultText.innerHTML = 'Ставьте! Следующее вращение — по таймеру';
        resultText.className = '';

        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            remainingTime--;
            updateTimerUI();

            if (remainingTime <= 5 && remainingTime > 0) timerBox.classList.add('urgent');

            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                timerBox.classList.remove('urgent');
                runSpin();
            }
        }, 1000);
    }

    function updateTimerUI() {
        if (timerValue) timerValue.textContent = remainingTime;
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
            animation: confettiFall ${Math.random() * 2 + 1}s linear forwards;
        `;
        document.body.appendChild(c);
        setTimeout(() => { if (c.parentNode) c.remove(); }, 3000);
    }
    function addConfettiAnimation() {
        if (!document.getElementById('confetti-style-roulette')) {
            const style = document.createElement('style');
            style.id = 'confetti-style-roulette';
            style.textContent = `
                @keyframes confettiFall {
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

    function addToHistory(outcome) {
        if (!historyList) return;
        const chip = document.createElement('div');
        chip.className = 'roulette-history-chip ' + numberColor(outcome);
        chip.textContent = displayNum(outcome);
        historyList.insertBefore(chip, historyList.firstChild);
        while (historyList.children.length > 24) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    // ============ БАЛАНС ============
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
            const atLimitWithoutItemBet = placedBets.length >= MAX_BETS && !placedBets.some(b => b.item);
            if (spinning || isBetConfirmed || atLimitWithoutItemBet) card.classList.add('disabled');

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
                if (spinning || isBetConfirmed) return;

                if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
                    // Снимаем выбор → убираем предмет-ставку со стола
                    selectedInventoryItem = null;
                    betAmountInput.disabled = false;
                    betAmountInput.style.opacity = '1';
                    const itemBet = placedBets.find(b => b.item);
                    if (itemBet) {
                        removeChipVisual(itemBet.el);
                        placedBets = placedBets.filter(b => b !== itemBet);
                    }
                } else {
                    // Ставим новый предмет — снимаем предыдущий (если был)
                    const oldItemBet = placedBets.find(b => b.item);
                    if (oldItemBet) {
                        removeChipVisual(oldItemBet.el);
                        placedBets = placedBets.filter(b => b !== oldItemBet);
                    }
                    selectedInventoryItem = item;
                    betAmountInput.disabled = true;
                    betAmountInput.style.opacity = '0.5';
                }
                updateInventoryDisplay();
                updateBetsDisplay();
            });

            inventoryListEl.appendChild(card);
        });
    }

    // ============ РАЗМЕР ============
    function resizeCanvas() {
        const wrapper = document.querySelector('.roulette-wheel-zone .wheel-wrapper');
        if (!wrapper) return;

        const wrapperWidth = wrapper.clientWidth || 420;
        const maxSize = Math.min(wrapperWidth, window.innerHeight * 0.55, 480);
        const size = Math.max(280, maxSize);

        canvas.width = size;
        canvas.height = size;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        drawWheel();
        if (ballRadius > 0) drawBall();
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function init() {
        addConfettiAnimation();
        buildBettingTable();
        initBalance();
        updateInventoryDisplay();
        updateBetsDisplay();

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.addEventListener('click', () => {
                if (spinning || isBetConfirmed) return;
                const amount = parseFloat(btn.dataset.amount);
                betAmountInput.value = amount;
            });
        });

        confirmBtn.addEventListener('click', confirmBet);
        if (undoBtn)  undoBtn.addEventListener('click', undoLastBet);
        if (clearBtn) clearBtn.addEventListener('click', clearAllBets);

        setInterval(() => {
            if (balanceEl) {
                const shown = parseFloat(balanceEl.textContent);
                if (!isNaN(shown) && shown !== window.globalBalance) {
                    window.globalBalance = shown;
                }
            }
            if (!isBetConfirmed && !spinning) updateInventoryDisplay();
        }, 1500);

        if (window.InventoryManager) {
            const origAdd = window.InventoryManager.addItem;
            window.InventoryManager.addItem = function (...args) {
                const r = origAdd.apply(this, args);
                updateInventoryDisplay();
                return r;
            };
        }

        setTimeout(() => {
            startCountdown();
        }, 1200);

        console.log('Roulette: мультиставки включены. Zero (0, 00) → x50. 1–36 → x36.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.rouletteGame = {
        getIsWaiting: () => isWaitingForNextGame,
        getRemainingTime: () => remainingTime,
        getRoundTime: () => ROUND_TIME
    };
})();