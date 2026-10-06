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
  let isItemBet = false; // true, если ставка сделана предметом

  function ChanceNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function chance() {
    let ch00 = 1.0
    let ch01 = ChanceNumber(1, 2) + '.' + ChanceNumber(0, 9) + ChanceNumber(0, 9)
    let ch02 = 1 + '.' + ChanceNumber(0, 9) + ChanceNumber(0, 9)
    let ch03 = ChanceNumber(1, 3) + '.' + ChanceNumber(0, 9) + ChanceNumber(0, 9)
    let ch04 = ChanceNumber(1, 4) + '.' + ChanceNumber(0, 9) + ChanceNumber(0, 9)
    let ch05 = ChanceNumber(1, 5) + '.' + ChanceNumber(0, 9) + ChanceNumber(0, 9)
    let ch06 = 1 + '.' + ChanceNumber(0, 3) + ChanceNumber(0, 9)
    let ch07 = ChanceNumber(1, 2) + '.' + ChanceNumber(0, 9) + ChanceNumber(0, 9)
    let ch08 = ChanceNumber(1, 50) + '.' + ChanceNumber(0, 9) + ChanceNumber(0, 9)
    let ch09 = 1 + '.' + ChanceNumber(0, 5) + ChanceNumber(0, 9)
    let ch10 = ChanceNumber(1, 250) + '.' + ChanceNumber(0, 9) + ChanceNumber(0, 9)
    let ch11 = 1.01
    let ch12 = 1.03
    let ch = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12, ch00]
    let chance = ch[Math.floor(Math.random() * 13)]
    return parseFloat(chance)
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
    const oldBalance = window.globalBalance;
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

  function calculateDuration(start, end) {
    const diff = Math.abs(end - start);
    const minTime = 100;
    const maxTime = 10000;
    let duration = minTime + (maxTime - minTime) * Math.pow(diff / Math.max(end, 1), 0.5);
    return Math.min(duration, 15000);
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
      btn.textContent = `✅ ${confirmedBetAmount}₽ x${confirmedBetMultiplier.toFixed(2)}`;
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
    const betMultiplier = parseFloat(betMultiplierInput.value);
    const currentBalance = window.globalBalance;

    // Проверяем, выбран ли предмет
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

    if (isNaN(betMultiplier) || betMultiplier < 1.00) {
      updateStatus('Ожидание');
      return;
    }

    confirmedBetAmount = betAmount;
    confirmedBetMultiplier = betMultiplier;
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
  let startMultiplier = 1.00;
  let currentMultiplier = 1.00;
  let endMultiplier = 1.00;
  let duration = 0;

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
    duration = calculateDuration(start, end);
    startMultiplier = start;
    endMultiplier = end;
    isGrowing = true;
    blockInputElements();
    hideCrashText();
    multEl.style.animation = 'none';
    requestAnimationFrame(frame);
  }

  function frame(now) {
    if (!isGrowing) return;

    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const easedProgress = Math.pow(t, 3);
    currentMultiplier = startMultiplier + (endMultiplier - startMultiplier) * easedProgress;

    multEl.textContent = currentMultiplier.toFixed(2);

    if (t >= 1) {
      showCrashText();

      const betAmount = confirmedBetAmount;
      const betMultiplier = confirmedBetMultiplier;

      let winAmount = 0;
      let totalPayout = 0;
      let isWin = false;
      let timestamp = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Обработка результата
      if (isBetConfirmed && betAmount > 0 && currentMultiplier >= betMultiplier) {
        totalPayout = betAmount * betMultiplier;
        if (isItemBet) {
          // Ставка предметом – начисляем полную сумму выигрыша
          winAmount = totalPayout;
        } else {
          // Денежная ставка – начисляем только прибыль
          winAmount = totalPayout - betAmount;
        }
        updateGlobalBalance(winAmount, 'add');
        isWin = true;
      } else if (isBetConfirmed && betAmount > 0) {
        if (isItemBet) {
          // Предмет уже удалён – баланс не трогаем
          winAmount = 0;
        } else {
          winAmount = -betAmount;
          updateGlobalBalance(betAmount, 'subtract');
        }
        isWin = false;
      }

      updateStatus('Игра завершена');

      if (!isNaN(currentMultiplier)) {
        historyMuls.unshift(currentMultiplier);
        if (historyMuls.length > 10) historyMuls.pop();
        updateHistoryDisplay();
      }

      if (isBetConfirmed && betAmount > 0) {
        let color = isWin ? '#4CAF50' : '#f44336';
        let displayAmount;
        let sign;
        if (isWin) {
          displayAmount = winAmount.toFixed(2);
          sign = '+';
        } else {
          if (isItemBet) {
            displayAmount = '0'; // предмет утерян, баланс не менялся
            sign = '';
          } else {
            displayAmount = betAmount.toFixed(2);
            sign = '-';
          }
        }
        let html = `
          <span style="color: ${color}; font-weight: bold;">${sign}${displayAmount} ₽</span> 
          (${betMultiplier.toFixed(2)}x → ${currentMultiplier.toFixed(2)}x) 
          <span style="color: orange;">→ ${window.globalBalance.toFixed(2)} ₽</span>
          <span style="color: #888; font-size: 14px; margin-left: 10px;">${timestamp}</span>
        `;
        balanceHistory.unshift({ html: html, color: color });
        updateBalanceHistoryDisplay();
      }

      resetBetConfirmation();

      setTimeout(() => {
        hideCrashText();
        multEl.textContent = '1.00';
        isGrowing = false;
        startCountdown();
      }, 5000);
    } else {
      requestAnimationFrame(frame);
    }
  }

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

    // Если ставка с предметом – удаляем его сейчас (до анимации)
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

  document.addEventListener('DOMContentLoaded', function () {
    generateInitialHistory();
    btn.addEventListener('click', confirmBet);

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