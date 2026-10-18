(function () {
    const D = window.DUELS;
    const DOM = D.dom;

    // Локальное состояние блэкджека
    let bjDeck = [];
    let bjYouHand = [];
    let bjOppHand = [];
    let bjBotRevealed = false;
    let bjPhase = 'idle';
    let bjActionTimer = null;

    function createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        const deck = [];
        for (const s of suits) for (const r of ranks) deck.push({ rank: r, suit: s });
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    function cardValue(card) {
        if (card.rank === 'A') return 11;
        if (['J','Q','K'].includes(card.rank)) return 10;
        return parseInt(card.rank, 10);
    }

    function handScore(hand) {
        let score = 0, aces = 0;
        for (const c of hand) {
            score += cardValue(c);
            if (c.rank === 'A') aces++;
        }
        while (score > 21 && aces > 0) { score -= 10; aces--; }
        return score;
    }

    function renderCard(card, hidden = false) {
        const el = document.createElement('div');
        el.className = 'bj-card';
        if (hidden) { el.classList.add('back'); return el; }
        const isRed = card.suit === '♥' || card.suit === '♦';
        if (isRed) el.classList.add('red');
        el.innerHTML = `<div class="bj-rank">${card.rank}</div><div class="bj-suit">${card.suit}</div>`;
        return el;
    }

    function renderBlackjackHands() {
        DOM.bjYouCardsEl.innerHTML = '';
        DOM.bjOppCardsEl.innerHTML = '';

        bjYouHand.forEach(c => DOM.bjYouCardsEl.appendChild(renderCard(c)));
        bjOppHand.forEach((c, i) => {
            const hidden = !bjBotRevealed && i === 1;
            DOM.bjOppCardsEl.appendChild(renderCard(c, hidden));
        });

        const youScore = handScore(bjYouHand);
        DOM.bjYouScoreEl.textContent = youScore;
        DOM.bjYouScoreEl.classList.toggle('bust', youScore > 21);

        if (bjBotRevealed) {
            const oppScore = handScore(bjOppHand);
            DOM.bjOppScoreEl.textContent = oppScore;
            DOM.bjOppScoreEl.classList.toggle('bust', oppScore > 21);
        } else {
            const first = bjOppHand[0];
            DOM.bjOppScoreEl.textContent = first ? cardValue(first) : 0;
            DOM.bjOppScoreEl.classList.remove('bust');
        }
    }

    function prepare(config) {
        DOM.bjArenaEl.style.display = 'block';

        const cg = D.state.currentGame;
        const youItemSuffix = cg.playerItem ? ` · 🎒 ${cg.playerItem.name}` : '';
        const oppItemSuffix = cg.opponentItem ? ` · 🎒 ${cg.opponentItem.name}` : '';

        DOM.bjYouNameEl.textContent = 'Вы';
        DOM.bjOppNameEl.textContent = cg.opponentName;
        DOM.bjYouBetEl.textContent = config.playerBet.value.toLocaleString('ru-RU') + ' ₽' + youItemSuffix;
        DOM.bjOppBetEl.textContent = config.opponentBet.toLocaleString('ru-RU') + ' ₽' + oppItemSuffix;

        DOM.bjYouCardsEl.innerHTML = '';
        DOM.bjOppCardsEl.innerHTML = '';
        DOM.bjYouScoreEl.textContent = '0';
        DOM.bjOppScoreEl.textContent = '0';
        DOM.bjYouScoreEl.classList.remove('bust');
        DOM.bjOppScoreEl.classList.remove('bust');
        DOM.bjActionsEl.style.display = 'none';
    }

    function start() {
        const S = D.state;
        S.isRolling = true;
        DOM.rollBtn.disabled = true;
        DOM.rollBtn.textContent = '🃏 РАЗДАЁМ...';
        DOM.duelStatus.textContent = 'Раздача карт';
        DOM.duelStatus.style.color = '';
        DOM.duelMessage.textContent = '';

        bjDeck = createDeck();
        bjYouHand = [];
        bjOppHand = [];
        bjBotRevealed = false;
        bjPhase = 'idle';

        const dealSequence = [
            { target: 'you' }, { target: 'opp' },
            { target: 'you' }, { target: 'opp' }
        ];

        let idx = 0;
        const dealNext = () => {
            if (idx >= dealSequence.length) {
                bjPhase = 'player';
                S.isRolling = false;
                DOM.duelStatus.textContent = 'Ваш ход';
                DOM.duelStatus.style.color = '#4CAF50';
                DOM.rollBtn.style.display = 'none';
                DOM.bjActionsEl.style.display = 'flex';
                DOM.bjHitBtn.disabled = false;
                DOM.bjStandBtn.disabled = false;
                if (handScore(bjYouHand) === 21) {
                    DOM.duelStatus.textContent = '🎉 21! Автоматически';
                    setTimeout(playerStand, 700);
                }
                return;
            }

            const step = dealSequence[idx];
            const card = bjDeck.pop();

            if (step.target === 'you') bjYouHand.push(card);
            else bjOppHand.push(card);

            renderBlackjackHands();
            idx++;
            bjActionTimer = setTimeout(dealNext, 260);
        };

        dealNext();
    }

    function playerHit() {
        if (bjPhase !== 'player') return;
        DOM.bjHitBtn.disabled = true;
        DOM.bjStandBtn.disabled = true;

        if (bjDeck.length === 0) bjDeck = createDeck();
        bjYouHand.push(bjDeck.pop());
        renderBlackjackHands();

        const score = handScore(bjYouHand);

        if (score > 21) {
            bjPhase = 'done';
            DOM.duelMessage.textContent = '💥 ПЕРЕБОР!';
            DOM.duelMessage.className = 'duel-message lose';
            DOM.duelStatus.textContent = 'Вы перебрали...';

            setTimeout(() => {
                DOM.bjActionsEl.style.display = 'none';
                bjBotRevealed = true;
                renderBlackjackHands();
                D.flow.resolveDuel(false, 'blackjack');
            }, 900);
        } else if (score === 21) {
            DOM.duelStatus.textContent = '🎉 21! Автоматически';
            setTimeout(playerStand, 500);
        } else {
            DOM.bjHitBtn.disabled = false;
            DOM.bjStandBtn.disabled = false;
            DOM.duelStatus.textContent = `Ваш ход (${score})`;
        }
    }

    function playerStand() {
        if (bjPhase !== 'player') return;
        bjPhase = 'bot';
        DOM.bjHitBtn.disabled = true;
        DOM.bjStandBtn.disabled = true;
        DOM.bjActionsEl.style.display = 'none';
        DOM.duelStatus.textContent = `${D.state.currentGame.opponentName} думает...`;

        bjBotRevealed = true;
        renderBlackjackHands();

        setTimeout(botBlackjackTurn, 700);
    }

    function botBlackjackTurn() {
        if (!D.state.currentGame) return;

        const character = D.state.currentGame.botCharacter || 'normal';

        const playNext = () => {
            if (!D.state.currentGame) return;

            const oppScore = handScore(bjOppHand);
            const playerScore = handScore(bjYouHand);

            if (oppScore > 21) { finishBlackjack(); return; }
            if (playerScore > 21) { finishBlackjack(); return; }

            let shouldHit = false;
            if (oppScore < 17) shouldHit = true;
            else if (oppScore > playerScore) shouldHit = false;
            else if (oppScore === playerScore) shouldHit = false;
            else {
                const gap = playerScore - oppScore;
                if (gap >= 3) shouldHit = false;
                else {
                    let hitChance;
                    if (character === 'cautious') hitChance = 0.30;
                    else if (character === 'risky') hitChance = 0.80;
                    else hitChance = 0.55;
                    shouldHit = Math.random() < hitChance;
                }
            }

            if (!shouldHit) { finishBlackjack(); return; }

            if (bjDeck.length === 0) bjDeck = createDeck();
            bjOppHand.push(bjDeck.pop());
            renderBlackjackHands();

            if (handScore(bjOppHand) > 21) bjActionTimer = setTimeout(finishBlackjack, 700);
            else bjActionTimer = setTimeout(playNext, 700);
        };

        bjActionTimer = setTimeout(playNext, 700);
    }

    function finishBlackjack() {
        const youScore = handScore(bjYouHand);
        const oppScore = handScore(bjOppHand);

        let playerWins = false;
        let isPush = false;

        if (youScore > 21) playerWins = false;
        else if (oppScore > 21) playerWins = true;
        else if (youScore > oppScore) playerWins = true;
        else if (youScore < oppScore) playerWins = false;
        else { isPush = true; playerWins = false; }

        bjPhase = 'done';

        if (isPush) {
            D.flow.resolvePush();
            DOM.duelMessage.textContent = `🤝 ПУШ! ${youScore} против ${oppScore}. Ставка возвращена.`;
            DOM.duelMessage.className = 'duel-message';
            DOM.duelStatus.textContent = 'Ничья';
            DOM.duelStatus.style.color = '#ffb400';
            setTimeout(() => D.flow.finalizeReturnButton(), 400);
            return;
        }

        setTimeout(() => D.flow.resolveDuel(playerWins, 'blackjack'), 200);
    }

    D.games.blackjack = {
        usesBotStart: false,
        startButtonText: '🃏 РАЗДАТЬ КАРТЫ',
        readyText: '🎯 Раздача карт',
        prepare,
        start,
        onHit: playerHit,
        onStand: playerStand,
        cleanup: () => {
            if (bjActionTimer) { clearTimeout(bjActionTimer); bjActionTimer = null; }
        }
    };
})();