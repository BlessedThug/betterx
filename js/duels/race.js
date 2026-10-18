(function () {
    const D = window.DUELS;
    const DOM = D.dom;
    let raceTimer = null;

    function generateRaceProgress(totalTicks) {
        const deltas = [];
        for (let i = 0; i < totalTicks; i++) {
            let s = 0.6 + Math.random() * 0.9;
            const r = Math.random();
            if (r < 0.06) s *= 0.3;
            else if (r < 0.12) s *= 1.8;
            deltas.push(s);
        }
        return deltas;
    }

    function cumsum(arr) {
        const out = []; let s = 0;
        for (const v of arr) { s += v; out.push(s); }
        return out;
    }

    function normalizeSeq(seq, finalValue) {
        const max = seq[seq.length - 1];
        if (max <= 0) return seq.map(() => 0);
        return seq.map(v => (v / max) * finalValue);
    }

    function computeRaceSequences(totalTicks, playerWins) {
        const youCum = cumsum(generateRaceProgress(totalTicks));
        const oppCum = cumsum(generateRaceProgress(totalTicks));
        const youTotal = youCum[youCum.length - 1];
        const oppTotal = oppCum[oppCum.length - 1];
        const naturalYouWins = youTotal > oppTotal;

        let winnerCum, loserCum;
        if (naturalYouWins === playerWins) {
            winnerCum = playerWins ? youCum : oppCum;
            loserCum  = playerWins ? oppCum : youCum;
        } else {
            winnerCum = playerWins ? oppCum : youCum;
            loserCum  = playerWins ? youCum : oppCum;
        }
        const loserFinal = 92 + Math.random() * 6;
        const winnerPos = normalizeSeq(winnerCum, 100);
        const loserPos  = normalizeSeq(loserCum, loserFinal);

        return playerWins
            ? { youPos: winnerPos, oppPos: loserPos }
            : { youPos: loserPos, oppPos: winnerPos };
    }

    function prepare(config) {
        DOM.raceArenaEl.style.display = 'block';

        const cg = D.state.currentGame;
        const youItemSuffix = cg.playerItem ? ` · 🎒 ${cg.playerItem.name}` : '';
        const oppItemSuffix = cg.opponentItem ? ` · 🎒 ${cg.opponentItem.name}` : '';
        const p = D.bet.calcPlayerWinChance(cg.playerBetValue, cg.opponentBetValue);

        DOM.raceYouName.textContent = 'Вы';
        DOM.raceOppName.textContent = cg.opponentName;
        DOM.raceYouBet.textContent = config.playerBet.value.toLocaleString('ru-RU') + ' ₽' + youItemSuffix;
        DOM.raceOppBet.textContent = config.opponentBet.toLocaleString('ru-RU') + ' ₽' + oppItemSuffix;
        DOM.raceYouChance.innerHTML = `Победа: <b>${(p * 100).toFixed(1)}%</b>`;
        DOM.raceOppChance.innerHTML = `Победа: <b>${((1 - p) * 100).toFixed(1)}%</b>`;

        DOM.raceYouRunner.style.left = '2%';
        DOM.raceOppRunner.style.left = '2%';
        DOM.raceYouRunner.className = 'race-runner race-runner-you';
        DOM.raceOppRunner.className = 'race-runner race-runner-opp';
        DOM.raceLaneYou.classList.remove('race-active');
        DOM.raceLaneOpp.classList.remove('race-active');
    }

    function start() {
        const S = D.state;
        S.isRolling = true;
        DOM.rollBtn.disabled = true;
        DOM.rollBtn.textContent = '🏁 ГОНКА ИДЁТ...';
        DOM.duelStatus.textContent = 'И кони понеслись!';
        DOM.duelStatus.style.color = '';
        DOM.duelMessage.textContent = '';

        DOM.raceLaneYou.classList.add('race-active');
        DOM.raceLaneOpp.classList.add('race-active');

        const cg = S.currentGame;
        const p = D.bet.calcPlayerWinChance(cg.playerBetValue, cg.opponentBetValue);
        const playerWins = Math.random() < p;

        const totalTicks = 34;
        const tickMs = 90;
        const { youPos, oppPos } = computeRaceSequences(totalTicks, playerWins);

        DOM.raceYouRunner.style.left = '2%';
        DOM.raceOppRunner.style.left = '2%';

        let tick = 0;
        if (raceTimer) clearInterval(raceTimer);
        raceTimer = setInterval(() => {
            if (tick >= totalTicks) {
                clearInterval(raceTimer);
                raceTimer = null;
                finishRace(playerWins);
                return;
            }
            DOM.raceYouRunner.style.left = (2 + youPos[tick] * 0.86) + '%';
            DOM.raceOppRunner.style.left = (2 + oppPos[tick] * 0.86) + '%';
            tick++;
        }, tickMs);
    }

    function finishRace(playerWins) {
        DOM.raceLaneYou.classList.remove('race-active');
        DOM.raceLaneOpp.classList.remove('race-active');

        if (playerWins) {
            DOM.raceYouRunner.style.left = '88%';
            DOM.raceOppRunner.style.left = '82%';
            DOM.raceYouRunner.classList.add('race-winner');
            DOM.raceOppRunner.classList.add('race-loser');
        } else {
            DOM.raceOppRunner.style.left = '88%';
            DOM.raceYouRunner.style.left = '82%';
            DOM.raceOppRunner.classList.add('race-winner');
            DOM.raceYouRunner.classList.add('race-loser');
        }

        setTimeout(() => D.flow.resolveDuel(playerWins, 'race'), 800);
    }

    D.games.race = {
        usesBotStart: true,
        startButtonText: '🏁 НАЧАТЬ ГОНКУ',
        botTurnText: '🏁 СОПЕРНИК СТАРТУЕТ...',
        prepare,
        start,
        cleanup: () => {
            if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }
        }
    };
})();