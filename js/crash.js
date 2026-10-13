(function () {
  const multEl = document.getElementById('x');
  const balanceEl = document.getElementById('bal-header');
  const btn = document.getElementById('startBtn');
  const betAmountInput = document.getElementById('betAmount');
  const betMultiplierInput = document.getElementById('betMultiplier');
  const errorMsgEl = document.getElementById('status');
  const historyContainer = document.getElementById('slots');
  const balanceHistoryContainer = document.getElementById('hb');
  const xBlock = document.getElementById('x-block');
  const statusSpan = document.getElementById('status');

  // ========== ИНВЕНТАРЬ ==========
  let selectedInventoryItem = null;

  function updateInventoryDisplay() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];
    if (!inventory || inventory.length === 0) {
      inventoryList.innerHTML = '<div class="inventory-empty">🎒 Нет предметов в инвентаре</div>';
      return;
    }
    inventoryList.innerHTML = '';
    inventory.forEach(item => {
      const card = document.createElement('div');
      card.className = 'inventory-item-card';
      if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
        card.classList.add('selected');
      }
      if (isGameBlocked) {
        card.classList.add('disabled');
      }
      let borderColor = '#888';
      if (item.tier === 'tier1') borderColor = '#3880ec';
      else if (item.tier === 'tier2') borderColor = '#7e1a7e';
      else if (item.tier === 'tier3') borderColor = '#f14df1';
      else if (item.tier === 'tier4') borderColor = '#dd3131';
      else if (item.tier === 'tier5') borderColor = '#f7f723';
      card.style.borderColor = selectedInventoryItem && selectedInventoryItem.id === item.id ? 'orange' : 'transparent';
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="inventory-item-img" onerror="this.src='../img/logo.png'">
        <div class="inventory-item-info">
          <div class="inventory-item-name" style="color: ${borderColor};">${item.name}</div>
          <div class="inventory-item-price">${item.price.toLocaleString()} ₽</div>
        </div>
        <div class="inventory-item-select">${selectedInventoryItem && selectedInventoryItem.id === item.id ? '✓' : '→'}</div>
      `;
      card.addEventListener('click', () => {
        if (isGameBlocked) return;
        if (selectedInventoryItem && selectedInventoryItem.id === item.id) {
          selectedInventoryItem = null;
          betAmountInput.disabled = false;
          betAmountInput.style.opacity = '1';
          betAmountInput.value = '';
          updateCurrentBetDisplay();
        } else {
          selectedInventoryItem = item;
          betAmountInput.disabled = true;
          betAmountInput.style.opacity = '0.5';
          betAmountInput.value = item.price;
          updateCurrentBetDisplay();
        }
        updateInventoryDisplay();
      });
      inventoryList.appendChild(card);
    });
  }

  function updateCurrentBetDisplay() {
    const amountEl = document.getElementById('current-bet-amount');
    const itemEl = document.getElementById('current-bet-item');
    if (!amountEl || !itemEl) return;
    const amount = parseFloat(betAmountInput.value) || 0;
    amountEl.textContent = `${amount.toLocaleString()} ₽`;
    if (selectedInventoryItem) {
      itemEl.textContent = `🎒 ${selectedInventoryItem.name}`;
      itemEl.style.color = '#4CAF50';
    } else {
      itemEl.textContent = '';
    }
  }

  // ========== ОСНОВНАЯ ЛОГИКА ==========
  function updateStatus(text) {
    if (statusSpan) {
      statusSpan.textContent = text;
      statusSpan.classList.remove('status-waiting', 'status-game', 'status-finished');
      if (text === 'Ожидание') {
        statusSpan.classList.add('status-waiting');
      } else if (text === 'Идёт игра') {
        statusSpan.classList.add('status-game');
      } else if (text === 'Игра завершена') {
        statusSpan.classList.add('status-finished');
      }
    }
    if (errorMsgEl) {
      errorMsgEl.textContent = text;
    }
  }

  const crashText = document.createElement('div');
  crashText.id = 'crash-text';
  crashText.style.cssText = `
    color: #ff3333;
    font-size: 48px;
    font-weight: bold;
    text-align: center;
    margin-top: 20px;
    text-shadow: 0 0 20px rgba(255, 51, 51, 0.8);
    opacity: 0;
    transition: opacity 0.5s;
  `;
  crashText.textContent = 'CRASH!';
  xBlock.appendChild(crashText);

  const timerContainer = document.createElement('div');
  timerContainer.id = 'timer-container';
  timerContainer.style.cssText = `
    text-align: center;
    margin: 10px 0;
    padding: 10px;
    background: rgba(0,0,0,0.5);
    border-radius: 8px;
    font-size: 24px;
    font-weight: bold;
    display: none;
  `;
  const timerText = document.createElement('span');
  timerText.id = 'timer-text';
  timerText.style.cssText = `
    color: orange;
    text-shadow: 0 0 10px rgba(255,165,0,0.5);
  `;
  timerContainer.innerHTML = 'Следующая игра через: ';
  timerContainer.appendChild(timerText);
  xBlock.insertBefore(timerContainer, crashText);

  let isGameBlocked = false;
  let isWaitingForNextGame = false;
  let countdownInterval = null;
  let remainingTime = 15;

  let confirmedBetAmount = 0;
  let confirmedBetMultiplier = 0;
  let isBetConfirmed = false;
  let isItemBet = false;

  // ========== ГЕНЕРАЦИЯ КРАШ-МНОЖИТЕЛЯ ==========
  // Дизайн: базовое распределение даёт RTP ~88–92% (без учёта адаптации),
  // а поверх него работает «память» о последних раундах игрока —
  // после крупных множителей резко повышается шанс мгновенного краша.
  const MAX_MULT = 1000;

  // Скользящее окно последних фактических результатов игрока
  // (забор или точка краха — что игрок реально «получил»).
  const recentResults = [];
  const RECENT_LIMIT = 5;

  function pushRecentResult(mult) {
    if (typeof mult !== 'number' || !isFinite(mult) || mult <= 0) return;
    recentResults.unshift(mult);
    while (recentResults.length > RECENT_LIMIT) recentResults.pop();
  }

  function chance() {
    // ===== 1. БАЗОВОЕ РАСПРЕДЕЛЕНИЕ (зонная модель) =====
    // 30% — мгновенный краш (1.00–1.15)
    // 27% — низкий          (1.15–2.00)
    // 20% — средний         (2.00–4.00)
    // 12% — хороший         (4.00–10.00)
    // 7%  — крупный         (10.00–25.00)
    // 3%  — большой         (25.00–75.00)
    // 1%  — джекпот         (75.00–300.00)
    const u = Math.random();
    let raw;

    if (u < 0.30) {
      raw = 1.00 + Math.random() * 0.15;
    } else if (u < 0.57) {
      raw = 1.15 + Math.random() * 0.85;
    } else if (u < 0.77) {
      raw = 2.00 + Math.random() * 2.00;
    } else if (u < 0.89) {
      raw = 4.00 + Math.random() * 6.00;
    } else if (u < 0.96) {
      raw = 10.00 + Math.random() * 15.00;
    } else if (u < 0.99) {
      raw = 25.00 + Math.random() * 50.00;
    } else {
      raw = 75.00 + Math.random() * 225.00;
    }

    // ===== 2. АДАПТАЦИЯ ПО СЕРИИ =====
    if (recentResults.length > 0) {
      const r0 = recentResults[0];
      const r1 = recentResults[1];
      const r2 = recentResults[2];

      // (a) Джекпот (>= 50x) — почти гарантированно красный следующий раунд
      if (r0 >= 50.00) {
        if (Math.random() < 0.90) {
          raw = Math.min(raw, 1.00 + Math.random() * 0.20);
        }
      }
      // (b) Крупный (>= 5x) — вероятность краша растёт пропорционально размеру
      else if (r0 >= 5.00) {
        const crushChance = Math.min(0.80, 0.50 + r0 / 200);
        if (Math.random() < crushChance) {
          raw = Math.min(raw, 1.00 + Math.random() * 0.30);
        }
      }

      // (c) Два подряд >= 2x — следующий скорее низкий
      if (r1 !== undefined && r0 >= 2.00 && r1 >= 2.00) {
        if (Math.random() < 0.55) {
          raw = Math.min(raw, 1.00 + Math.random() * 0.40);
        }
      }

      // (d) Три подряд >= 1.5x — почти наверняка следующий ниже 1.5x
      if (r2 !== undefined && r0 >= 1.50 && r1 >= 1.50 && r2 >= 1.50) {
        if (Math.random() < 0.80) {
          raw = Math.min(raw, 1.00 + Math.random() * 0.30);
        }
      }
    }

    // ===== 3. ОГРАНИЧЕНИЕ И ОКРУГЛЕНИЕ =====
    const capped = Math.min(raw, MAX_MULT);
    return Math.max(1.00, Math.floor(capped * 100) / 100);
  }

  // ========== КРИВАЯ РОСТА МНОЖИТЕЛЯ ==========
  // m(t) = exp(RATE * t^EXP)
  //   EXP > 1 → dm/dt = 0 при t = 0, старт очень плавный.
  //   Формула НЕ зависит от итогового краша — первые секунды любого
  //   раунда проходят одинаково медленно, что критично для ручного забора.
  const GROWTH_RATE = 0.05;
  const GROWTH_EXP  = 1.4;

  function multiplierAt(elapsedSec) {
    const t = Math.max(elapsedSec, 0);
    return Math.exp(GROWTH_RATE * Math.pow(t, GROWTH_EXP));
  }

  if (typeof window.globalBalance === 'undefined') {
    const savedBalance = localStorage.getItem('userBalance');
    if (savedBalance !== null && !isNaN(parseFloat(savedBalance))) {
      window.globalBalance = parseFloat(savedBalance);
    } else {
      window.globalBalance = 0;
    }
  }

  function updateGlobalBalance(amount, operation = 'add') {
    if (operation === 'add') {
      window.globalBalance += amount;
    } else if (operation === 'subtract') {
      window.globalBalance -= amount;
    }
    if (window.globalBalance < 0) window.globalBalance = 0;
    updateBalanceDisplay();
    saveBalanceToStorage();
    return window.globalBalance;
  }

  function saveBalanceToStorage() {
    try {
      localStorage.setItem('userBalance', window.globalBalance.toString());
    } catch (error) {
      console.error('Ошибка сохранения баланса:', error);
    }
  }

  function updateBalanceDisplay() {
    if (balanceEl) {
      balanceEl.textContent = window.globalBalance.toFixed(2);
    }
    const allBalanceElements = document.querySelectorAll('.balance-display, [data-balance]');
    allBalanceElements.forEach(element => {
      element.textContent = window.globalBalance.toFixed(2);
    });
  }

  updateBalanceDisplay();

  const historyMuls = [];

  function getMultiplierColor(multiplier) {
    if (multiplier >= 2.00) return '#4CAF50';
    else if (multiplier >= 1.21) return 'orange';
    else return '#ff3333';
  }

  function updateHistoryDisplay() {
    historyContainer.innerHTML = '';
    const displayCount = Math.min(10, historyMuls.length);
    for (let i = 0; i < displayCount; i++) {
      const val = historyMuls[i];
      const div = document.createElement('div');
      div.className = 'slot';
      div.textContent = val !== undefined ? val.toFixed(2) + 'x' : '';
      if (val !== undefined) {
        div.style.color = getMultiplierColor(val);
        div.style.borderColor = getMultiplierColor(val);
        div.style.boxShadow = `0 4px 6px ${getMultiplierColor(val)}40`;
      }
      historyContainer.appendChild(div);
    }
    for (let i = displayCount; i < 10; i++) {
      const div = document.createElement('div');
      div.className = 'slot';
      div.textContent = '';
      historyContainer.appendChild(div);
    }
  }

  const balanceHistory = [];
  function updateBalanceHistoryDisplay() {
    balanceHistoryContainer.innerHTML = '';
    for (let entry of balanceHistory) {
      const div = document.createElement('div');
      div.className = 'hb';
      div.innerHTML = entry.html;
      div.style.borderLeftColor = entry.color;
      balanceHistoryContainer.appendChild(div);
    }
  }

  function blockInputElements() {
    isGameBlocked = true;
    btn.disabled = true;
    betAmountInput.disabled = true;
    betMultiplierInput.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    betAmountInput.style.opacity = '0.5';
    betAmountInput.style.cursor = 'not-allowed';
    betMultiplierInput.style.opacity = '0.5';
    betMultiplierInput.style.cursor = 'not-allowed';
  }

  function unblockInputElements() {
    isGameBlocked = false;
    if (isWaitingForNextGame) {
      btn.disabled = false;
      betAmountInput.disabled = false;
      betMultiplierInput.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      betAmountInput.style.opacity = '1';
      betAmountInput.style.cursor = 'text';
      betMultiplierInput.style.opacity = '1';
      betMultiplierInput.style.cursor = 'text';
      updateBetButtonText();
    }
  }

  function updateBetButtonText() {
    if (isBetConfirmed) {
      if (confirmedBetMultiplier > 0) {
        btn.textContent = `✅ ${confirmedBetAmount}₽ → ${confirmedBetMultiplier.toFixed(2)}x`;
      } else {
        btn.textContent = `✅ ${confirmedBetAmount}₽ (ручной забор)`;
      }
      btn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
    } else {
      btn.textContent = 'СТАВКА';
      btn.style.background = 'linear-gradient(45deg, #ff7e33, #ffb400)';
    }
  }

  function confirmBet() {
    if (!isWaitingForNextGame) {
      updateStatus('Ожидание');
      return;
    }

    let betAmount = parseFloat(betAmountInput.value);
    const targetRaw = betMultiplierInput.value.trim();
    let targetMultiplier = targetRaw === '' ? 0 : parseFloat(targetRaw);
    const currentBalance = window.globalBalance;

    if (selectedInventoryItem) {
      betAmount = selectedInventoryItem.price;
      const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];
      const itemExists = inventory.some(item => item.id === selectedInventoryItem.id);
      if (!itemExists) {
        updateStatus('Ожидание');
        selectedInventoryItem = null;
        betAmountInput.disabled = false;
        betAmountInput.style.opacity = '1';
        betAmountInput.value = '';
        updateInventoryDisplay();
        updateCurrentBetDisplay();
        return;
      }
      isItemBet = true;
    } else {
      if (isNaN(betAmount) || betAmount <= 0) {
        updateStatus('Ожидание');
        return;
      }
      if (betAmount > currentBalance) {
        updateStatus('Ожидание');
        return;
      }
      isItemBet = false;
    }

    // Автостоп ОПЦИОНАЛЕН: пустое поле = ручной забор
    if (targetMultiplier !== 0) {
      if (isNaN(targetMultiplier) || targetMultiplier < 1.01) {
        updateStatus('Ожидание');
        return;
      }
      if (targetMultiplier > MAX_MULT) {
        targetMultiplier = MAX_MULT;
        betMultiplierInput.value = MAX_MULT;
      }
    } else {
      targetMultiplier = 0;
    }

    confirmedBetAmount = betAmount;
    confirmedBetMultiplier = targetMultiplier;
    isBetConfirmed = true;

    updateStatus('Ожидание');
    updateBetButtonText();
    btn.classList.add('confirmed');

    betAmountInput.disabled = true;
    betMultiplierInput.disabled = true;
    betAmountInput.style.opacity = '0.5';
    betMultiplierInput.style.opacity = '0.5';
  }

  function resetBetConfirmation() {
    isBetConfirmed = false;
    confirmedBetAmount = 0;
    confirmedBetMultiplier = 0;
    isItemBet = false;

    betAmountInput.disabled = false;
    betMultiplierInput.disabled = false;
    betAmountInput.style.opacity = '1';
    betMultiplierInput.style.opacity = '1';

    btn.classList.remove('confirmed');
    updateBetButtonText();
  }

  let isGrowing = false;
  let startTime = 0;
  let currentMultiplier = 1.00;
  let endMultiplier = 1.00;
  let hasCashedOut = false;
  let cashoutMultiplier = 0;

  function showCrashText() {
    crashText.style.opacity = '1';
    crashText.style.animation = 'crash-text-pulse 0.5s infinite alternate';
    multEl.classList.add('crash-active');
    if (!document.getElementById('crash-text-animation')) {
      const style = document.createElement('style');
      style.id = 'crash-text-animation';
      style.textContent = `
        @keyframes crash-text-pulse {
          from { opacity: 0.7; transform: scale(1); text-shadow: 0 0 20px rgba(255, 51, 51, 0.8); }
          to { opacity: 1; transform: scale(1.1); text-shadow: 0 0 40px rgba(255, 51, 51, 1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function hideCrashText() {
    crashText.style.opacity = '0';
    crashText.style.animation = 'none';
    multEl.classList.remove('crash-active');
    multEl.style.color = 'orange';
    multEl.style.textShadow = '0 0 30px rgba(255, 165, 0, 0.7)';
    multEl.style.animation = '';
  }

  function animateMul(start, end) {
    startTime = performance.now();
    currentMultiplier = start;
    endMultiplier = end;
    isGrowing = true;
    hasCashedOut = false;
    cashoutMultiplier = 0;
    blockInputElements();
    hideCrashText();
    multEl.style.animation = 'none';
    multEl.style.color = 'orange';
    multEl.style.textShadow = '0 0 30px rgba(255, 165, 0, 0.7)';
    multEl.textContent = '1.00';

    // Кнопка превращается в «ЗАБРАТЬ» на время раунда
    if (isBetConfirmed) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.textContent = '💰 ЗАБРАТЬ 1.00x';
      btn.style.background = 'linear-gradient(45deg, #4CAF50, #2e7d32)';
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.textContent = '— (ставка не сделана)';
    }

    requestAnimationFrame(frame);
  }

  function frame(now) {
    if (!isGrowing) return;

    const elapsedSec = (now - startTime) / 1000;
    const rawMult = multiplierAt(elapsedSec);

    // ===== АВТОСТОП (опциональная страховка) =====
    // Срабатывает ТОЛЬКО если цель меньше точки краша и ещё не забрано
    if (!hasCashedOut && isBetConfirmed && confirmedBetMultiplier > 0 &&
        confirmedBetMultiplier < endMultiplier && rawMult >= confirmedBetMultiplier) {
      executeCashout(confirmedBetMultiplier);
    }

    // ===== КРАШ =====
    if (rawMult >= endMultiplier) {
      currentMultiplier = endMultiplier;
      isGrowing = false;
      multEl.textContent = endMultiplier.toFixed(2);

      // Записываем результат игрока в «память» для адаптации сложности.
      // Если ставки не было — серия не сбивается.
      if (isBetConfirmed) {
        pushRecentResult(hasCashedOut ? cashoutMultiplier : endMultiplier);
      }

      showCrashText();

      if (hasCashedOut) {
        multEl.style.color = '#4CAF50';
        multEl.style.textShadow = '0 0 30px rgba(76, 175, 80, 0.9)';
      } else {
        processCrashLoss();
      }

      historyMuls.unshift(endMultiplier);
      if (historyMuls.length > 10) historyMuls.pop();
      updateHistoryDisplay();

      // Multiplayer читает #x и точку краха именно в момент смены статуса
      updateStatus('Игра завершена');

      finalizeCrashVisual();
      return;
    }

    // ===== ОБНОВЛЕНИЕ ЭКРАНА =====
    currentMultiplier = rawMult;
    const displayStr = rawMult.toFixed(2);
    multEl.textContent = displayStr;

    if (!hasCashedOut && isBetConfirmed && !btn.disabled) {
      btn.textContent = `💰 ЗАБРАТЬ ${displayStr}x`;
    }

    requestAnimationFrame(frame);
  }

  // ========== РУЧНОЙ / АВТО-КЭШАУТ ==========
  function executeCashout(mult) {
    if (hasCashedOut) return;
    if (!isBetConfirmed || confirmedBetAmount <= 0) return;
    if (!isGrowing) return;

    hasCashedOut = true;
    cashoutMultiplier = Math.floor(mult * 100) / 100;

    processCashoutWinnings(cashoutMultiplier);

    btn.textContent = `✅ Забрано ${cashoutMultiplier.toFixed(2)}x`;
    btn.style.background = 'linear-gradient(45deg, #4CAF50, #2e7d32)';
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';

    // isGrowing НЕ трогаем — анимация продолжается до точки краха
  }

  function processCashoutWinnings(mult) {
    const betAmount = confirmedBetAmount;
    const totalPayout = betAmount * mult;
    let winAmount;

    if (isItemBet) {
      winAmount = totalPayout;              // предмет уже изъят — платим полную сумму
    } else {
      winAmount = totalPayout - betAmount;  // чистая прибыль
    }

    updateGlobalBalance(winAmount, 'add');

    const timestamp = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const color = '#4CAF50';
    const html = `
      <span style="color: ${color}; font-weight: bold;">+${winAmount.toFixed(2)} ₽</span> 
      (Забрано на ${mult.toFixed(2)}x) 
      <span style="color: orange;">→ ${window.globalBalance.toFixed(2)} ₽</span>
      <span style="color: #888; font-size: 14px; margin-left: 10px;">${timestamp}</span>
    `;
    balanceHistory.unshift({ html, color });
    updateBalanceHistoryDisplay();
  }

  // ========== ПРОИГРЫШ ПО КРАШУ ==========
  function processCrashLoss() {
    const betAmount = confirmedBetAmount;
    if (!isBetConfirmed || betAmount <= 0) return;

    let displayAmount, sign;
    if (isItemBet) {
      displayAmount = '0';
      sign = '';
    } else {
      displayAmount = betAmount.toFixed(2);
      sign = '-';
      updateGlobalBalance(betAmount, 'subtract');
    }

    const timestamp = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const color = '#f44336';
    const html = `
      <span style="color: ${color}; font-weight: bold;">${sign}${displayAmount} ₽</span> 
      (Краш на ${endMultiplier.toFixed(2)}x) 
      <span style="color: orange;">→ ${window.globalBalance.toFixed(2)} ₽</span>
      <span style="color: #888; font-size: 14px; margin-left: 10px;">${timestamp}</span>
    `;
    balanceHistory.unshift({ html, color });
    updateBalanceHistoryDisplay();
  }

  function finalizeCrashVisual() {
    if (hasCashedOut) {
      btn.textContent = `✅ Забрано ${cashoutMultiplier.toFixed(2)}x · Краш ${endMultiplier.toFixed(2)}x`;
      btn.style.background = 'linear-gradient(45deg, #4CAF50, #2e7d32)';
    } else {
      btn.textContent = `💀 Краш ${endMultiplier.toFixed(2)}x`;
      btn.style.background = 'linear-gradient(45deg, #cc2222, #8a1111)';
    }
    btn.disabled = true;

    setTimeout(() => {
      hideCrashText();
      cleanupAfterRound();
    }, 5000);
  }

  function cleanupAfterRound() {
    hideCrashText();
    multEl.textContent = '1.00';
    multEl.style.color = 'orange';
    multEl.style.textShadow = '0 0 30px rgba(255, 165, 0, 0.7)';
    isGrowing = false;
    hasCashedOut = false;
    cashoutMultiplier = 0;
    resetBetConfirmation();
    startCountdown();
  }

  // ========== ТАЙМЕР ==========
  function showTimer() {
    timerContainer.style.display = 'block';
  }

  function hideTimer() {
    timerContainer.style.display = 'none';
  }

  function startCountdown() {
    isWaitingForNextGame = true;
    remainingTime = 15;
    showTimer();
    updateTimerDisplay();
    unblockInputElements();
    resetBetConfirmation();
    updateStatus('Ожидание');
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      remainingTime--;
      updateTimerDisplay();
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        startGame();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (timerText) {
      timerText.textContent = `${remainingTime} секунд`;
      if (remainingTime <= 5) {
        timerText.style.color = '#ff4444';
        timerText.style.animation = 'pulse 0.5s infinite';
      } else {
        timerText.style.color = 'orange';
        timerText.style.animation = 'none';
      }
    }
  }

  function startGame() {
    isWaitingForNextGame = false;
    hideTimer();
    updateStatus('Идёт игра');

    if (isBetConfirmed && isItemBet && selectedInventoryItem) {
      if (window.InventoryManager) {
        const removed = window.InventoryManager.removeItem(selectedInventoryItem.id);
        if (removed) {
          console.log('Предмет удален для ставки:', selectedInventoryItem.name);
          selectedInventoryItem = null;
          updateInventoryDisplay();
          updateCurrentBetDisplay();
        } else {
          console.warn('Не удалось удалить предмет, отмена ставки');
          isBetConfirmed = false;
          isItemBet = false;
          resetBetConfirmation();
          startCountdown();
          return;
        }
      } else {
        console.warn('InventoryManager не найден, отмена ставки');
        isBetConfirmed = false;
        isItemBet = false;
        resetBetConfirmation();
        startCountdown();
        return;
      }
    }

    animateMul(1.00, chance());
  }

  function generateInitialHistory() {
    for (let i = 0; i < 10; i++) {
      historyMuls.push(chance());
    }
    updateHistoryDisplay();
  }

  function onMainButtonClick() {
    if (isGrowing && isBetConfirmed && !hasCashedOut) {
      executeCashout(currentMultiplier);
    } else if (isWaitingForNextGame && !isBetConfirmed) {
      confirmBet();
    }
  }

  // ========== ИНИЦИАЛИЗАЦИЯ ==========
  document.addEventListener('DOMContentLoaded', function () {
    generateInitialHistory();
    btn.addEventListener('click', onMainButtonClick);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
        100% { opacity: 1; transform: scale(1); }
      }
      #x-block { transition: all 0.3s; }
      .crash-active { color: #ff3333 !important; text-shadow: 0 0 20px rgba(255, 51, 51, 0.8) !important; }
      #startBtn { transition: all 0.3s; }
      #startBtn:hover { transform: scale(1.05); }
    `;
    document.head.appendChild(style);

    if (betMultiplierInput) {
      betMultiplierInput.placeholder = 'Автостоп (опц.)';
    }

    setTimeout(() => {
      startCountdown();
    }, 1000);

    updateInventoryDisplay();
    updateCurrentBetDisplay();
    betAmountInput.addEventListener('input', updateCurrentBetDisplay);

    setInterval(() => {
      updateInventoryDisplay();
      const displayedBalance = parseFloat(balanceEl.textContent);
      if (!isNaN(displayedBalance) && displayedBalance !== window.globalBalance) {
        window.globalBalance = displayedBalance;
      }
    }, 2000);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        updateInventoryDisplay();
        updateCurrentBetDisplay();
      }
    });
  });
})();
