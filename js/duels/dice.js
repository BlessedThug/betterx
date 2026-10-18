(function () {
    const D = window.DUELS;
    const DOM = D.dom;

    function renderDiceFace(diceEl, value) {
        let html = '';
        for (let i = 1; i <= 9; i++) html += `<div class="dot p${i}"></div>`;
        diceEl.innerHTML = html;
        (D.consts.DICE_FACE_MAP[value] || []).forEach(pos => {
            const dot = diceEl.querySelector('.' + pos);
            if (dot) dot.classList.add('on');
        });
    }

    function renderRandomDiceFace(diceEl) {
        renderDiceFace(diceEl, D.utils.randomInt(1, 6));
    }

    function determineDiceValues(playerWins) {
        let winnerValue, loserValue;
        if (Math.random() < 0.65) {
            winnerValue = D.utils.randomInt(5, 6);
            loserValue = D.utils.randomInt(1, Math.min(4, winnerValue - 1));
        } else {
            winnerValue = D.utils.randomInt(4, 6);
            loserValue = D.utils.randomInt(1, winnerValue - 1);
        }
        return playerWins
            ? { player: winnerValue, opponent: loserValue }
            : { player: loserValue, opponent: winnerValue };
    }

    function prepare(config) {
        DOM.diceArenaEl.style.display = 'grid';

        const cg = D.state.currentGame;
        const youItemSuffix = cg.playerItem ? ` · 🎒 ${cg.playerItem.name}` : '';
        const oppItemSuffix = cg.opponentItem ? ` · 🎒 ${cg.opponentItem.name}` : '';
        const p = D.bet.calcPlayerWinChance(cg.playerBetValue, cg.opponentBetValue);

        DOM.youNameEl.textContent = 'Вы';
        DOM.oppNameEl.textContent = cg.opponentName;
        DOM.youBetDisplay.textContent = config.playerBet.value.toLocaleString('ru-RU') + ' ₽' + youItemSuffix;
        DOM.oppBetDisplay.textContent = config.opponentBet.toLocaleString('ru-RU') + ' ₽' + oppItemSuffix;
        DOM.youChanceEl.innerHTML = `Победа: <b>${(p * 100).toFixed(1)}%</b>`;
        DOM.oppChanceEl.innerHTML = `Победа: <b>${((1 - p) * 100).toFixed(1)}%</b>`;

        renderDiceFace(DOM.youDiceEl, 1);
        renderDiceFace(DOM.oppDiceEl, 1);
        DOM.youDiceEl.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));
        DOM.oppDiceEl.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));
        document.querySelectorAll('.dice-side').forEach(el => el.classList.remove('winner', 'loser'));
    }

    function start() {
        const S = D.state;
        S.isRolling = true;
        DOM.rollBtn.disabled = true;
        DOM.rollBtn.textContent = '🎲 БРОСАЕМ...';
        DOM.duelStatus.textContent = 'Кубики в полёте...';
        DOM.duelStatus.style.color = '';
        DOM.duelMessage.textContent = '';

        DOM.youDiceEl.classList.add('rolling');
        DOM.oppDiceEl.classList.add('rolling');

        const rollInterval = setInterval(() => {
            renderRandomDiceFace(DOM.youDiceEl);
            renderRandomDiceFace(DOM.oppDiceEl);
        }, 70);

        setTimeout(() => {
            clearInterval(rollInterval);
            DOM.youDiceEl.classList.remove('rolling');
            DOM.oppDiceEl.classList.remove('rolling');
            finishRoll();
        }, 1300);
    }

    function finishRoll() {
        const cg = D.state.currentGame;
        const p = D.bet.calcPlayerWinChance(cg.playerBetValue, cg.opponentBetValue);
        const playerWins = Math.random() < p;
        const dice = determineDiceValues(playerWins);
        renderDiceFace(DOM.youDiceEl, dice.player);
        renderDiceFace(DOM.oppDiceEl, dice.opponent);

        DOM.youDiceEl.classList.add('result-pop');
        DOM.oppDiceEl.classList.add('result-pop');
        setTimeout(() => {
            DOM.youDiceEl.classList.remove('result-pop');
            DOM.oppDiceEl.classList.remove('result-pop');
        }, 550);

        setTimeout(() => {
            const youSide = document.querySelector('.dice-side-you');
            const oppSide = document.querySelector('.dice-side-opp');
            if (playerWins) {
                youSide.classList.add('winner');
                oppSide.classList.add('loser');
            } else {
                oppSide.classList.add('winner');
                youSide.classList.add('loser');
            }
            D.flow.resolveDuel(playerWins, 'dice');
        }, 450);
    }

    D.games.dice = {
        usesBotStart: true,
        startButtonText: '🎲 БРОСИТЬ КУБИКИ',
        botTurnText: '🎲 СОПЕРНИК БРОСАЕТ...',
        prepare,
        start,
        cleanup: () => {}
    };
})();