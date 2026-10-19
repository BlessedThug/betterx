(function () {
    const D = window.DUELS;
    const DOM = D.dom;
    const cbTurnTimerEl = document.getElementById('cb-turn-timer');
    const cbHelpModal = document.getElementById('cb-help-modal');
    const cbHelpBtn = document.getElementById('cb-help-btn');
    const cbHelpClose = document.getElementById('cb-help-close');

    // ============ КОЛОДА КАРТ ============
    const CARDS = {
        // Common
        punch:      { name: 'Тычок',           icon: '👊', desc: '6 урона',              type: 'action', value: 6,  rarity: 1, weight: 12 },
        strike:     { name: 'Удар',            icon: '🗡️', desc: '10 урона',             type: 'action', value: 10, rarity: 1, weight: 16 },
        shield:     { name: 'Блок',            icon: '🛡️', desc: '10 защиты',            type: 'buff',   value: 10, rarity: 1, weight: 10 },
        heal:       { name: 'Лечение',         icon: '💚', desc: '12 HP',                type: 'buff',   value: 12, rarity: 1, weight: 8 },
        fast_heal:  { name: 'Быстрое лечение', icon: '🌿', desc: '7 HP',                 type: 'buff',   value: 7,  rarity: 1, weight: 12 },

        // Uncommon
        heavy:      { name: 'Мощный удар',     icon: '💥', desc: '16 урона',             type: 'action', value: 16, rarity: 2, weight: 8 },
        combo:      { name: 'Комбо',           icon: '🤜🤛', desc: '3×5 урона',           type: 'action', value: 15, rarity: 2, weight: 7 },
        lifesteal:  { name: 'Вампиризм',       icon: '🩸', desc: '8 урона, +8 HP',        type: 'action', value: 8,  rarity: 2, weight: 6 },
        rage:       { name: 'Ярость',          icon: '😡', desc: '+10 к след. атаке',      type: 'buff',   value: 10, rarity: 2, weight: 5 },
        barrier:    { name: 'Барьер',          icon: '🛡️✨', desc: '15 защиты',           type: 'buff',   value: 15, rarity: 2, weight: 5 },
        siphon:     { name: 'Сифон',           icon: '🌀', desc: 'Снять 8 щита, 5 урона', type: 'action', value: 5,  rarity: 2, weight: 4 },
        antidote:   { name: 'Антидот',         icon: '💉', desc: 'Снять яд/кровь, +4 HP', type: 'buff',   value: 4,  rarity: 2, weight: 4 },
        thorns:     { name: 'Шипы',            icon: '🌵', desc: '10 урона атакующему',   type: 'buff',   value: 10, rarity: 2, weight: 4 },
        blessing:   { name: 'Благословение',   icon: '🌟', desc: '+8 HP и +5 щита',       type: 'buff',   value: 8,  rarity: 2, weight: 4 },
        infection:  { name: 'Заражение',       icon: '☠️', desc: '4/10 урона (если есть яд/кровь)', type: 'action', value: 4, rarity: 2, weight: 4 },
        luck:       { name: 'Удача',           icon: '🍀', desc: '+5 к след. атаке',      type: 'buff',   value: 5,  rarity: 2, weight: 4 },
        insight:    { name: 'Прозрение',       icon: '👁️', desc: 'Видеть руку врага (3 х.)', type: 'buff', value: 0, rarity: 2, weight: 4 },
        gamble:     { name: 'Азарт',           icon: '🎰', desc: '50%: 30 урона / 15 себе', type: 'action', value: 0, rarity: 2, weight: 3 },

        // Rare
        fireball:   { name: 'Огненный шар',    icon: '🔥', desc: '12 урона + горение',    type: 'action', value: 12, rarity: 3, weight: 3 },
        bleed:      { name: 'Кровотечение',    icon: '🩸', desc: '6 урона + DOT 3×3',     type: 'action', value: 6,  rarity: 3, weight: 3 },
        vulnerable: { name: 'Уязвимость',      icon: '🎯', desc: 'Враг +50% урона (3 х)', type: 'buff',   value: 0,  rarity: 3, weight: 3 },
        ritual:     { name: 'Ритуал',          icon: '💀', desc: '-8 HP, 20 урона',       type: 'action', value: 20, rarity: 3, weight: 3 },
        reflect:    { name: 'Отражение',       icon: '🔮', desc: '50% урона обратно',     type: 'buff',   value: 0,  rarity: 3, weight: 3 },
        chaos:      { name: 'Хаос',            icon: '🎲', desc: 'Случайно 5–25 урона',   type: 'action', value: 0,  rarity: 3, weight: 3 },
        vengeance:  { name: 'Возмездие',       icon: '⚔️', desc: '5 + 1/3 потерянного HP', type: 'action', value: 0,  rarity: 3, weight: 2 },
        evasion:    { name: 'Уклонение',       icon: '💨', desc: 'Блокирует след. атаку', type: 'buff',   value: 0,  rarity: 3, weight: 3 },
        whirlwind:  { name: 'Вихрь',           icon: '🌪️', desc: '3 урона за карту в руке', type: 'action', value: 3, rarity: 3, weight: 3 },
        amulet:     { name: 'Амулет',          icon: '🧿', desc: 'Иммунитет к DOT (3 х.)', type: 'buff',  value: 0,  rarity: 3, weight: 3 },
        cursed_book:{ name: 'Проклятая книга', icon: '📜', desc: '+3 карты, -5 HP',       type: 'action', value: 5,  rarity: 3, weight: 2 },
        mind_read:  { name: 'Чтение мыслей',   icon: '👁️‍🗨️', desc: 'Раскрыть текущие карты', type: 'buff', value: 0, rarity: 3, weight: 3 },
        frost:      { name: 'Заморозка',       icon: '❄️', desc: 'Пропуск 2 ходов врагом', type: 'action', value: 0,  rarity: 3, weight: 2 },

        // Legendary
        execution:  { name: 'Казнь',           icon: '☠️', desc: '30 урона (<50 HP)',     type: 'action', value: 30, rarity: 4, weight: 1 },
        phoenix:    { name: 'Феникс',          icon: '🦅', desc: 'Полн. лечение (<25 HP)', type: 'buff',  value: 100, rarity: 4, weight: 1 },
        ultimate:   { name: 'Ультиматум',      icon: '⚡', desc: '25 урона, +10 HP',       type: 'action', value: 25, rarity: 4, weight: 1 },
        steal:      { name: 'Кража',           icon: '🦹', desc: 'Украсть 1 карту врага',  type: 'action', value: 0,  rarity: 4, weight: 1 }
    };

    function drawCard() {
        const ids = Object.keys(CARDS);
        const totalWeight = ids.reduce((s, id) => s + CARDS[id].weight, 0);
        let r = Math.random() * totalWeight;
        for (const id of ids) { r -= CARDS[id].weight; if (r <= 0) return id; }
        return ids[0];
    }

    // ============ ЛОКАЛЬНОЕ СОСТОЯНИЕ ============
    let youHP = 100, oppHP = 100;
    let youShield = 0, oppShield = 0;
    let youPoison = 0, oppPoison = 0;
    let youBurn = 0, oppBurn = 0;     // Новый статус: Горение
    let youBleed = 0, oppBleed = 0;
    let youVulnerable = 0, oppVulnerable = 0;
    let youAtkBuff = 0, oppAtkBuff = 0;
    let youLuck = 0, oppLuck = 0;
    let youThorns = 0, oppThorns = 0;
    let youReflect = false, oppReflect = false;
    let youEvasion = false, oppEvasion = false;
    let youAmulet = 0, oppAmulet = 0;
    let youSkipTurns = 0, oppSkipTurns = 0; // Заменили флаг на счётчик ходов

    let youHand = [], oppHand = [];
    
    let currentTurn = 'you';
    let cbPhase = 'idle';
    let cbActionTimer = null;
    let logMessages = [];
    let youBuffsThisTurn = 0, oppBuffsThisTurn = 0;
    let oppDifficulty = 'amateur';
    let oppHandRevealed = 0;

    // ============ ТАЙМЕР ХОДА ============
    const TURN_TIME_LIMIT = 30;
    let turnTimerInterval = null;
    let turnTimerRemaining = 0;

    function stopTurnTimer() {
        if (turnTimerInterval) { clearInterval(turnTimerInterval); turnTimerInterval = null; }
        if (cbTurnTimerEl) cbTurnTimerEl.style.display = 'none';
    }

    function startTurnTimer() {
        stopTurnTimer();
        if (!cbTurnTimerEl || cbPhase !== 'playing') return;

        turnTimerRemaining = TURN_TIME_LIMIT;
        cbTurnTimerEl.style.display = 'inline-flex';
        cbTurnTimerEl.textContent = turnTimerRemaining;
        cbTurnTimerEl.classList.remove('warning');

        turnTimerInterval = setInterval(() => {
            turnTimerRemaining--;
            cbTurnTimerEl.textContent = turnTimerRemaining;
            if (turnTimerRemaining <= 10) cbTurnTimerEl.classList.add('warning');

            if (turnTimerRemaining <= 0) {
                stopTurnTimer();
                logCbMessage('⏰ Время вышло! Ход переходит.', 'system');
                if (currentTurn === 'you' && cbPhase === 'playing') playerPass();
            }
        }, 1000);
    }

    // ============ СЛОЖНОСТЬ ИИ ============
    function pickDifficulty() {
        const r = Math.random();
        if (r < 0.5) return 'amateur';
        return 'expert';
    }

    // ============ ЧАТ-ЛОГ ============
    function logCbMessage(msg, side = 'system') {
        logMessages.push({ text: msg, side });
        if (logMessages.length > 60) logMessages.shift();

        if (DOM.cbLogEl) {
            const empty = DOM.cbLogEl.querySelector('.cb-log-empty');
            if (empty) empty.remove();

            const el = document.createElement('div');
            el.className = `cb-log-entry log-${side}`;
            el.textContent = msg;
            DOM.cbLogEl.appendChild(el);
            DOM.cbLogEl.scrollTop = DOM.cbLogEl.scrollHeight;
        }
    }

    // ============ СТАТУС ХОДА ============
    function updateCbStatus() {
        if (cbPhase !== 'playing') {
            DOM.cbPlayerActions.style.display = 'none';
            return;
        }
        if (currentTurn === 'you') {
            const locked = youBuffsThisTurn > 0;
            let msg = `ВАШ ХОД · Баффы: ${youBuffsThisTurn}/${D.consts.CB_MAX_BUFFS_PER_TURN}`;
            let color = '#4CAF50';
            if (locked) {
                msg = `ВАШ ХОД · Бафф: ${youBuffsThisTurn}/${D.consts.CB_MAX_BUFFS_PER_TURN} (атака/добор закрыты)`;
                color = '#ffb400';
            }
            DOM.cbTurnIndicator.textContent = msg;
            DOM.cbTurnIndicator.style.color = color;
            DOM.cbPlayerActions.style.display = 'flex';

            if (DOM.cbDrawBtn) {
                DOM.cbDrawBtn.disabled = locked;
                DOM.cbDrawBtn.style.opacity = locked ? '0.35' : '1';
                DOM.cbDrawBtn.style.cursor = locked ? 'not-allowed' : 'pointer';
            }
            if (DOM.cbPassBtn) {
                DOM.cbPassBtn.disabled = false;
                DOM.cbPassBtn.style.opacity = '1';
                DOM.cbPassBtn.style.cursor = 'pointer';
            }
        } else {
            DOM.cbTurnIndicator.textContent = 'ХОД СОПЕРНИКА';
            DOM.cbTurnIndicator.style.color = '#ff5555';
            DOM.cbPlayerActions.style.display = 'none';
        }
    }

    // ============ ИКОНКИ СТАТУСОВ ============
    function formatStatusIcons(you) {
        const arr = [];
        if (you) {
            if (youShield > 0) arr.push(`🛡️${youShield}`);
            if (youAtkBuff > 0) arr.push(`😡+${youAtkBuff}`);
            if (youLuck > 0) arr.push(`🍀+${youLuck}`);
            if (youPoison > 0) arr.push(`🧪${youPoison}`);
            if (youBurn > 0) arr.push(`🔥${youBurn}`);
            if (youBleed > 0) arr.push(`🩸${youBleed}`);
            if (youVulnerable > 0) arr.push(`🎯${youVulnerable}`);
            if (youThorns > 0) arr.push(`🌵${youThorns}`);
            if (youReflect) arr.push(`🔮`);
            if (youEvasion) arr.push(`💨`);
            if (youAmulet > 0) arr.push(`🧿${youAmulet}`);
        } else {
            if (oppShield > 0) arr.push(`🛡️${oppShield}`);
            if (oppAtkBuff > 0) arr.push(`😡+${oppAtkBuff}`);
            if (oppLuck > 0) arr.push(`🍀+${oppLuck}`);
            if (oppPoison > 0) arr.push(`🧪${oppPoison}`);
            if (oppBurn > 0) arr.push(`🔥${oppBurn}`);
            if (oppBleed > 0) arr.push(`🩸${oppBleed}`);
            if (oppVulnerable > 0) arr.push(`🎯${oppVulnerable}`);
            if (oppThorns > 0) arr.push(`🌵${oppThorns}`);
            if (oppReflect) arr.push(`🔮`);
            if (oppEvasion) arr.push(`💨`);
            if (oppAmulet > 0) arr.push(`🧿${oppAmulet}`);
        }
        return arr.length ? `<span class="cb-statuses">${arr.map(a => `<span>${a}</span>`).join('')}</span>` : '';
    }

    // ============ РЕНДЕР ============
    function renderCardBattle() {
        DOM.cbYouHPFill.style.width = Math.max(0, youHP) + '%';
        DOM.cbOppHPFill.style.width = Math.max(0, oppHP) + '%';
        DOM.cbYouHPText.innerHTML = `${youHP} / 100 ${formatStatusIcons(true)}`;
        DOM.cbOppHPText.innerHTML = `${oppHP} / 100 ${formatStatusIcons(false)}`;

        DOM.cbYouHandEl.innerHTML = '';
        youHand.forEach((cardObj, i) => {
            const card = CARDS[cardObj.id];
            const el = document.createElement('div');
            el.className = `cb-card type-${card.type} rarity-${card.rarity}`;

            let disabled = currentTurn !== 'you' || cbPhase !== 'playing';
            if (!disabled && card.type === 'action' && youBuffsThisTurn > 0) disabled = true;
            if (!disabled && card.type === 'buff' && youBuffsThisTurn >= D.consts.CB_MAX_BUFFS_PER_TURN) disabled = true;

            if (disabled) el.classList.add('disabled');

            el.innerHTML = `
                <div class="cb-card-icon">${card.icon}</div>
                <div class="cb-card-name">${card.name}</div>
                <div class="cb-card-desc">${card.desc}</div>
            `;

            if (!disabled) el.addEventListener('click', () => playCbCard(i, true));
            DOM.cbYouHandEl.appendChild(el);
        });

        DOM.cbOppHandEl.innerHTML = '';
        oppHand.forEach((cardObj, i) => {
            const el = document.createElement('div');
            const isRevealed = cardObj.revealed || oppHandRevealed > 0;

            if (isRevealed) {
                const card = CARDS[cardObj.id];
                el.className = `cb-card type-${card.type} rarity-${card.rarity} disabled`;
                el.innerHTML = `
                    <div class="cb-card-icon">${card.icon}</div>
                    <div class="cb-card-name">${card.name}</div>
                    <div class="cb-card-desc">${card.desc}</div>
                `;
                el.style.opacity = '0.6';
            } else {
                el.className = 'cb-card card-back';
            }
            DOM.cbOppHandEl.appendChild(el);
        });
    }

    // ============ УРОН ============
    function applyCbDamage(target, amount, bypassShield = false) {
        if (target === 'you') {
            let dmg = amount;
            let absorbed = 0;
            if (!bypassShield && youShield > 0) {
                absorbed = Math.min(youShield, dmg);
                youShield -= absorbed;
                dmg -= absorbed;
            }
            if (youVulnerable > 0) dmg = Math.floor(dmg * 1.5);
            youHP = Math.max(0, youHP - dmg);
            return { hpLost: dmg, absorbed: absorbed };
        } else {
            let dmg = amount;
            let absorbed = 0;
            if (!bypassShield && oppShield > 0) {
                absorbed = Math.min(oppShield, dmg);
                oppShield -= absorbed;
                dmg -= absorbed;
            }
            if (oppVulnerable > 0) dmg = Math.floor(dmg * 1.5);
            oppHP = Math.max(0, oppHP - dmg);
            return { hpLost: dmg, absorbed: absorbed };
        }
    }

    function dealCardDamage(attackerIsPlayer, amount) {
        const target = attackerIsPlayer ? 'opp' : 'you';

        if (target === 'you' && youEvasion) {
            youEvasion = false;
            return { hpLost: 0, absorbed: 0, evaded: true };
        }
        if (target === 'opp' && oppEvasion) {
            oppEvasion = false;
            return { hpLost: 0, absorbed: 0, evaded: true };
        }

        const result = applyCbDamage(target, amount);
        const actualDamage = result.hpLost;

        if (actualDamage > 0) {
            if (attackerIsPlayer) {
                if (oppReflect) {
                    oppReflect = false;
                    const reflected = Math.floor(actualDamage / 2);
                    if (reflected > 0) {
                        applyCbDamage('you', reflected, true);
                        logCbMessage(`🔮 Соперник отражает ${reflected} урона`, 'opp');
                    }
                }
                if (oppThorns > 0) {
                    const thornsDmg = oppThorns;
                    oppThorns = 0;
                    applyCbDamage('you', thornsDmg, true);
                    logCbMessage(`🌵 Шипы соперника: ${thornsDmg} урона вам`, 'opp');
                }
            } else {
                if (youReflect) {
                    youReflect = false;
                    const reflected = Math.floor(actualDamage / 2);
                    if (reflected > 0) {
                        applyCbDamage('opp', reflected, true);
                        logCbMessage(`🔮 Вы отражаете ${reflected} урона`, 'you');
                    }
                }
                if (youThorns > 0) {
                    const thornsDmg = youThorns;
                    youThorns = 0;
                    applyCbDamage('opp', thornsDmg, true);
                    logCbMessage(`🌵 Ваши шипы: ${thornsDmg} урона сопернику`, 'you');
                }
            }
        }

        return result;
    }

    // ============ ЭФФЕКТЫ КАРТ ============
    function applyCbCardEffect(card, isPlayer) {
        let actionValue = card.value;

        if (card.type === 'action') {
            if (isPlayer) {
                actionValue += youAtkBuff + youLuck;
                youAtkBuff = 0; youLuck = 0;
            } else {
                actionValue += oppAtkBuff + oppLuck;
                oppAtkBuff = 0; oppLuck = 0;
            }
        }

        switch (card.name) {
            case 'Тычок':
            case 'Удар':
            case 'Мощный удар': {
                const res = dealCardDamage(isPlayer, actionValue);
                let msg = `${card.name} → ${res.hpLost} урона`;
                if (res.evaded) msg = `${card.name} → соперник уклонился`;
                else if (res.absorbed > 0) msg += ` (щит: -${res.absorbed})`;
                logCbMessage(msg, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Огненный шар': {
                const res = dealCardDamage(isPlayer, actionValue);
                if (isPlayer) oppBurn += 3; else youBurn += 3;
                let msg = `${res.hpLost} урона + горение`;
                if (res.evaded) msg = `уклонился`;
                else if (res.absorbed > 0) msg += ` (щит: -${res.absorbed})`;
                logCbMessage(`🔥 ${msg}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Кровотечение': {
                const res = dealCardDamage(isPlayer, actionValue);
                if (isPlayer) oppBleed += 3; else youBleed += 3;
                let msg = `${res.hpLost} урона + кровотечение`;
                if (res.evaded) msg = `уклонился`;
                else if (res.absorbed > 0) msg += ` (щит: -${res.absorbed})`;
                logCbMessage(`🩸 ${msg}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Комбо': {
                let totalDmg = 0;
                let blockedTotal = 0;
                for (let i = 0; i < 3; i++) {
                    const r = dealCardDamage(isPlayer, 5);
                    totalDmg += r.hpLost;
                    blockedTotal += r.absorbed;
                }
                let msg = `комбо на ${totalDmg} урона`;
                if (blockedTotal > 0) msg += ` (щит: -${blockedTotal})`;
                logCbMessage(`🤜🤛 ${msg}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Вампиризм': {
                const res = dealCardDamage(isPlayer, actionValue);
                if (isPlayer) youHP = Math.min(100, youHP + 8);
                else oppHP = Math.min(100, oppHP + 8);
                let msg = `${res.hpLost} урона, +8 HP`;
                if (res.evaded) msg = `уклонился, +8 HP`;
                else if (res.absorbed > 0) msg += ` (щит: -${res.absorbed})`;
                logCbMessage(`🩸 ${msg}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Сифон': {
                if (isPlayer) {
                    const removed = Math.min(oppShield, 8);
                    oppShield -= removed;
                    dealCardDamage(true, 5);
                    logCbMessage(`🌀 Сняли ${removed} щита и нанесли 5 урона`, 'you');
                } else {
                    const removed = Math.min(youShield, 8);
                    youShield -= removed;
                    dealCardDamage(false, 5);
                    logCbMessage(`🌀 Соперник снял ${removed} щита и нанёс 5 урона`, 'opp');
                }
                break;
            }
            case 'Хаос': {
                const roll = 5 + Math.floor(Math.random() * 21);
                const dmg = dealCardDamage(isPlayer, roll);
                logCbMessage(`🎲 Хаос выкинул ${roll} → ${dmg.hpLost} урона`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Возмездие': {
                const myMissing = 100 - (isPlayer ? youHP : oppHP);
                const bonus = 5 + Math.floor(myMissing / 3);
                const dmg = dealCardDamage(isPlayer, bonus);
                logCbMessage(`⚔️ Возмездие на ${dmg.hpLost} урона`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Казнь': {
                const targetHP = isPlayer ? oppHP : youHP;
                const dmg = targetHP < 50 ? 30 : 8;
                const res = dealCardDamage(isPlayer, dmg);
                logCbMessage(`☠️ Казнь на ${res.hpLost} урона!`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Ультиматум': {
                const res = dealCardDamage(isPlayer, 25);
                if (isPlayer) youHP = Math.min(100, youHP + 10);
                else oppHP = Math.min(100, oppHP + 10);
                logCbMessage(`⚡ Ультиматум: ${res.hpLost} урона и +10 HP`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Ритуал': {
                if (isPlayer) youHP = Math.max(0, youHP - 8);
                else oppHP = Math.max(0, oppHP - 8);
                const res = dealCardDamage(isPlayer, 20);
                logCbMessage(`💀 Ритуал: -8 HP, ${res.hpLost} урона`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Азарт': {
                if (Math.random() < 0.5) {
                    dealCardDamage(isPlayer, 30);
                    logCbMessage(`🎰 Азарт: удача! 30 урона врагу!`, isPlayer ? 'you' : 'opp');
                } else {
                    if (isPlayer) youHP = Math.max(0, youHP - 15);
                    else oppHP = Math.max(0, oppHP - 15);
                    logCbMessage(`🎰 Азарт: не повезло... 15 урона себе.`, isPlayer ? 'you' : 'opp');
                }
                break;
            }
            case 'Кража': {
                if (isPlayer) {
                    if (oppHand.length > 0) {
                        const idx = Math.floor(Math.random() * oppHand.length);
                        const stolen = oppHand.splice(idx, 1)[0];
                        youHand.push(stolen);
                        logCbMessage(`🦹 Вы украли карту!`, 'you');
                    } else {
                        logCbMessage('У соперника нет карт!', 'system');
                    }
                } else {
                    if (youHand.length > 0) {
                        const idx = Math.floor(Math.random() * youHand.length);
                        const stolen = youHand.splice(idx, 1)[0];
                        oppHand.push(stolen);
                        logCbMessage(`🦹 Соперник украл карту!`, 'opp');
                    } else {
                        logCbMessage('Соперник не смог украсть карту!', 'system');
                    }
                }
                break;
            }
            case 'Заморозка': {
                if (isPlayer) {
                    oppSkipTurns = 2;
                    logCbMessage(`❄️ Вы заморозили соперника на 2 хода!`, 'you');
                } else {
                    youSkipTurns = 2;
                    logCbMessage(`❄️ Соперник заморозил вас на 2 хода!`, 'opp');
                }
                break;
            }
            case 'Лечение':
            case 'Быстрое лечение': {
                if (isPlayer) youHP = Math.min(100, youHP + card.value);
                else oppHP = Math.min(100, oppHP + card.value);
                logCbMessage(`${card.icon} Лечение ${card.value} HP`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Антидот': {
                if (isPlayer) {
                    const cleansed = youPoison + youBleed + youBurn;
                    youPoison = 0; youBleed = 0; youBurn = 0;
                    youHP = Math.min(100, youHP + card.value);
                    logCbMessage(`💉 Антидот (${cleansed} эффектов) +4 HP`, 'you');
                } else {
                    const cleansed = oppPoison + oppBleed + oppBurn;
                    oppPoison = 0; oppBleed = 0; oppBurn = 0;
                    oppHP = Math.min(100, oppHP + card.value);
                    logCbMessage(`💉 Соперник: антидот (${cleansed} эффектов)`, 'opp');
                }
                break;
            }
            case 'Благословение': {
                if (isPlayer) {
                    youHP = Math.min(100, youHP + 8);
                    youShield += 5;
                } else {
                    oppHP = Math.min(100, oppHP + 8);
                    oppShield += 5;
                }
                logCbMessage(`🌟 Благословение: +8 HP, +5 щита`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Блок':
            case 'Барьер': {
                if (isPlayer) youShield += card.value;
                else oppShield += card.value;
                logCbMessage(`${card.icon} +${card.value} щита`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Ярость': {
                if (isPlayer) youAtkBuff += 10;
                else oppAtkBuff += 10;
                logCbMessage(`😡 Ярость +10 к след. атаке`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Удача': {
                if (isPlayer) youLuck += 5;
                else oppLuck += 5;
                logCbMessage(`🍀 Удача +5 к след. атаке`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Шипы': {
                if (isPlayer) youThorns = card.value;
                else oppThorns = card.value;
                logCbMessage(`🌵 Шипы на ${card.value}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Отражение': {
                if (isPlayer) youReflect = true;
                else oppReflect = true;
                logCbMessage(`🔮 Отражение активно`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Уклонение': {
                if (isPlayer) youEvasion = true;
                else oppEvasion = true;
                logCbMessage(`💨 Уклонение активно`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Амулет': {
                if (isPlayer) youAmulet = 3;
                else oppAmulet = 3;
                logCbMessage(`🧿 Амулет активен (3 х.)`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Прозрение': {
                if (isPlayer) {
                    oppHandRevealed = 3;
                    logCbMessage(`👁️ Вы видите руку соперника (3 х.)!`, 'you');
                } else {
                    logCbMessage(`👁️ Соперник узнал ваши карты!`, 'opp');
                }
                break;
            }
            case 'Чтение мыслей': {
                if (isPlayer) {
                    oppHand.forEach(c => c.revealed = true);
                    logCbMessage(`👁️‍🗨️ Вы раскрыли текущие карты соперника!`, 'you');
                } else {
                    youHand.forEach(c => c.revealed = true);
                    logCbMessage(`👁️‍🗨️ Соперник раскрыл ваши текущие карты!`, 'opp');
                }
                break;
            }
            case 'Уязвимость': {
                if (isPlayer) oppVulnerable += 3;
                else youVulnerable += 3;
                logCbMessage(`🎯 Уязвимость +50% урона на 3 х.`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Заражение': {
                const hasDot = isPlayer ? (oppPoison > 0 || oppBleed > 0 || oppBurn > 0) : (youPoison > 0 || youBleed > 0 || youBurn > 0);
                const dmg = hasDot ? 10 : 4;
                const res = dealCardDamage(isPlayer, dmg);
                logCbMessage(`☠️ Заражение: ${res.hpLost} урона${hasDot ? ' (усилено)' : ''}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Проклятая книга': {
                if (isPlayer) {
                    drawCards(youHand, 3);
                    youHP = Math.max(0, youHP - 5);
                } else {
                    drawCards(oppHand, 3);
                    oppHP = Math.max(0, oppHP - 5);
                }
                logCbMessage(`📜 Проклятая книга: +3 карты, -5 HP`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Вихрь': {
                const handSize = isPlayer ? youHand.length : oppHand.length;
                const dmg = Math.min(15, handSize * 3);
                const res = dealCardDamage(isPlayer, dmg);
                logCbMessage(`🌪️ Вихрь на ${res.hpLost} урона`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Феникс': {
                const myHP = isPlayer ? youHP : oppHP;
                const heal = myHP < 25 ? (100 - myHP) : 10;
                if (isPlayer) youHP = Math.min(100, youHP + heal);
                else oppHP = Math.min(100, oppHP + heal);
                logCbMessage(`🦅 Феникс +${heal} HP`, isPlayer ? 'you' : 'opp');
                break;
            }
            default: {
                dealCardDamage(isPlayer, actionValue);
                logCbMessage(`${actionValue} урона`, isPlayer ? 'you' : 'opp');
            }
        }
    }

    function drawCards(hand, count) {
        for (let i = 0; i < count; i++) {
            if (hand.length < 7) hand.push({ id: drawCard(), revealed: false });
        }
    }

    // ============ РАЗЫГРЫШ КАРТЫ ============
    function playCbCard(index, isPlayer) {
        if (cbPhase !== 'playing') return;
        if (isPlayer && currentTurn !== 'you') return;
        if (!isPlayer && currentTurn !== 'opp') return;

        const hand = isPlayer ? youHand : oppHand;
        const cardObj = hand[index];
        if (!cardObj) return;

        const cardId = cardObj.id;
        const card = CARDS[cardId];
        const buffsThisTurn = isPlayer ? youBuffsThisTurn : oppBuffsThisTurn;

        if (card.type === 'buff' && buffsThisTurn >= D.consts.CB_MAX_BUFFS_PER_TURN) return;
        if (card.type === 'action' && buffsThisTurn > 0) return;

        hand.splice(index, 1);
        applyCbCardEffect(card, isPlayer);
        renderCardBattle();

        if (youHP <= 0 || oppHP <= 0) { endCardBattle(); return; }

        if (card.type === 'action') {
            startCbTurn(isPlayer ? 'opp' : 'you');
        } else {
            if (isPlayer) {
                youBuffsThisTurn++;
                if (youBuffsThisTurn >= D.consts.CB_MAX_BUFFS_PER_TURN) {
                    logCbMessage('Лимит баффов исчерпан. Ход переходит.', 'system');
                    setTimeout(() => startCbTurn('opp'), 500);
                } else {
                    updateCbStatus();
                    renderCardBattle();
                    startTurnTimer();
                }
            } else {
                oppBuffsThisTurn++;
                if (oppBuffsThisTurn >= D.consts.CB_MAX_BUFFS_PER_TURN) {
                    setTimeout(() => startCbTurn('you'), 500);
                } else {
                    const delay = oppDifficulty === 'expert' ? 400 : 800;
                    cbActionTimer = setTimeout(botCbTurn, delay);
                }
            }
        }
    }

    // ============ ДЕЙСТВИЯ ИГРОКА ============
    function playerDraw() {
        if (cbPhase !== 'playing' || currentTurn !== 'you') return;
        if (youBuffsThisTurn > 0) {
            logCbMessage('❌ Нельзя добрать карты после баффа.', 'system');
            return;
        }
        stopTurnTimer();
        drawCards(youHand, 2);
        logCbMessage('Вы берете 2 карты', 'you');
        renderCardBattle();
        startCbTurn('opp');
    }

    function playerPass() {
        if (cbPhase !== 'playing' || currentTurn !== 'you') return;
        stopTurnTimer();
        logCbMessage('Вы завершаете ход', 'you');
        startCbTurn('opp');
    }

    // ============ СМЕНА ХОДА ============
    function startCbTurn(actor) {
        currentTurn = actor;
        youBuffsThisTurn = 0;
        oppBuffsThisTurn = 0;

        if (actor === 'you') {
            if (youSkipTurns > 0) {
                youSkipTurns--;
                logCbMessage(`❄️ Вы пропускаете ход (заморожены, осталось: ${youSkipTurns + 1})!`, 'system');
                renderCardBattle();
                setTimeout(() => startCbTurn('opp'), 1500);
                return;
            }
            if (youAmulet > 0) {
                youAmulet--;
                logCbMessage(`🧿 Амулет блокирует эффекты`, 'you');
            } else {
                if (youPoison > 0) { youPoison--; youHP = Math.max(0, youHP - 5); logCbMessage('Яд: -5 HP', 'system'); }
                if (youBurn > 0) { youBurn--; youHP = Math.max(0, youHP - 3); logCbMessage('Горение: -3 HP', 'system'); }
                if (youBleed > 0) { youBleed--; youHP = Math.max(0, youHP - 3); logCbMessage('Кровотечение: -3 HP', 'system'); }
            }
            if (youVulnerable > 0) youVulnerable--;
        } else {
            if (oppSkipTurns > 0) {
                oppSkipTurns--;
                logCbMessage(`❄️ Соперник пропускает ход (осталось: ${oppSkipTurns + 1})!`, 'system');
                renderCardBattle();
                setTimeout(() => startCbTurn('you'), 1500);
                return;
            }
            if (oppHandRevealed > 0) oppHandRevealed--;
            
            if (oppAmulet > 0) {
                oppAmulet--;
                logCbMessage(`🧿 Амулет соперника блокирует эффекты`, 'opp');
            } else {
                if (oppPoison > 0) { oppPoison--; oppHP = Math.max(0, oppHP - 5); logCbMessage('Яд соперника: -5 HP', 'system'); }
                if (oppBurn > 0) { oppBurn--; oppHP = Math.max(0, oppHP - 3); logCbMessage('Горение соперника: -3 HP', 'system'); }
                if (oppBleed > 0) { oppBleed--; oppHP = Math.max(0, oppHP - 3); logCbMessage('Кровотечение соперника: -3 HP', 'system'); }
            }
            if (oppVulnerable > 0) oppVulnerable--;
        }

        renderCardBattle();

        if (youHP <= 0 || oppHP <= 0) { endCardBattle(); return; }

        updateCbStatus();

        if (actor === 'opp') {
            stopTurnTimer();
            const delay = oppDifficulty === 'expert' ? 800 : 1500;
            cbActionTimer = setTimeout(botCbTurn, delay);
        } else {
            startTurnTimer();
        }
    }

    // ============ ОЦЕНКА КАРТ ИИ ============
    function scoreCard(cardId, difficulty) {
        const card = CARDS[cardId];
        let score = 0;

        if (card.name === 'Лечение' || card.name === 'Быстрое лечение') {
            const healAmount = card.value;
            const missingHP = 100 - oppHP;
            
            // ЖЕСТКИЙ ЗАПРЕТ: Если хп почти полное, не лечимся
            if (missingHP < 5) return -999; 
            
            if (difficulty === 'amateur') {
                score = missingHP >= healAmount ? 100 : -20;
                if (oppHP < 45) score += 50;
            } else {
                if (missingHP >= healAmount * 1.5) score = 120;
                else if (missingHP >= healAmount) score = 50;
                else score = -100;
                if (oppHP < 30) score += 80;
            }
        }
        else if (card.name === 'Антидот') {
            const dotDamage = oppPoison * 5 + oppBleed * 3 + oppBurn * 3;
            if (difficulty === 'amateur') score = dotDamage > 0 ? 100 : -50;
            else {
                if (dotDamage >= 10) score = 140;
                else if (dotDamage > 0) score = 20;
                else score = -80;
            }
        }
        else if (card.name === 'Феникс') {
            // ЖЕСТКИЙ ЗАПРЕТ: Если хп больше 25, не используем
            if (oppHP > 25) return -999;
            
            if (difficulty === 'amateur') score = 400;
            else score = 900;
        }
        else if (card.name === 'Ярость' || card.name === 'Удача') {
            const hasStrongAttack = oppHand.some(c => CARDS[c.id].type === 'action' && (CARDS[c.id].value || 0) >= 10);
            const alreadyBuffed = (card.name === 'Ярость' && oppAtkBuff > 0) || (card.name === 'Удача' && oppLuck > 0);

            if (alreadyBuffed) score = -100;
            else if (hasStrongAttack) score = difficulty === 'amateur' ? 60 : 100;
            else score = -50;
        }
        else if (card.name === 'Блок' || card.name === 'Барьер') {
            const alreadyHasShield = oppShield > 0;
            if (difficulty === 'amateur') {
                if (oppHP < 50 && !alreadyHasShield) score = 70;
                else if (oppHP < 50) score = -30;
                else score = 10;
            } else {
                if (alreadyHasShield) score = -80;
                else if (oppHP < 40) score = 100;
                else if (oppHP < 60 && youHP > 50) score = 30;
                else score = -20;
            }
        }
        else if (card.name === 'Благословение') {
            const missingHP = 100 - oppHP;
            if (difficulty === 'amateur') score = missingHP > 15 ? 70 : -10;
            else {
                score = missingHP > 20 ? 90 : -30;
                if (oppShield === 0 && oppHP < 60) score += 40;
            }
        }
        else if (card.name === 'Шипы') {
            if (oppThorns > 0) score = -100;
            else if (difficulty === 'amateur') score = oppHP > 40 ? 50 : 20;
            else score = oppHP > 50 && youHP > 40 ? 70 : 20;
        }
        else if (card.name === 'Отражение') {
            if (oppReflect) score = -100;
            else if (difficulty === 'amateur') score = 40;
            else score = oppHP > 40 ? 60 : 10;
        }
        else if (card.name === 'Уклонение') {
            if (oppEvasion) score = -100;
            else if (difficulty === 'amateur') score = oppHP < 50 ? 80 : 20;
            else score = oppHP < 35 ? 150 : oppHP < 60 ? 60 : -20;
        }
        else if (card.name === 'Амулет') {
            const hasDot = oppPoison > 0 || oppBleed > 0 || oppBurn > 0;
            if (oppAmulet > 0) score = -100;
            else if (difficulty === 'expert') score = hasDot ? 150 : 20;
            else score = hasDot ? 90 : 10;
        }
        else if (card.name === 'Прозрение' || card.name === 'Чтение мыслей') {
            if (oppHandRevealed > 0) score = -100;
            else {
                const hasHiddenCards = oppHand.some(c => !c.revealed);
                score = hasHiddenCards ? 50 : -50;
            }
        }
        else if (card.name === 'Уязвимость') {
            if (oppVulnerable > 0) score = -100;
            else if (difficulty === 'amateur') score = 30;
            else {
                const hasFollowUp = oppHand.some(c => CARDS[c.id].type === 'action');
                score = hasFollowUp ? 50 : -20;
            }
        }
        else if (card.type === 'action') {
            let dmg = card.value || 0;
            if (oppAtkBuff > 0) dmg += oppAtkBuff;
            if (oppLuck > 0) dmg += oppLuck;

            if (dmg >= youHP) score = 2000;
            else score = dmg;

            if (card.name === 'Казнь') {
                const realDmg = youHP < 50 ? 30 : 8;
                if (realDmg >= youHP) score = 2500;
                else score = realDmg;
            }
            if (card.name === 'Ультиматум') {
                if (25 >= youHP) score = 2400;
                else score = 30;
            }
            if (card.name === 'Хаос') {
                if (difficulty === 'expert') score = youHP < 20 ? 30 : 10;
                else score = 15;
            }
            if (card.name === 'Возмездие') {
                const dmgV = 5 + Math.floor((100 - oppHP) / 3);
                if (difficulty === 'amateur') score = dmgV * 0.7;
                else score = dmgV;
            }
            if (card.name === 'Сифон') {
                score = youShield > 0 ? 40 + Math.min(youShield, 8) : 10;
            }
            if (card.name === 'Вихрь') {
                const dmgV = Math.min(15, oppHand.length * 3);
                if (dmgV >= youHP) score = 2000;
                else score = dmgV;
            }
            if (card.name === 'Заражение') {
                const hasDot = youPoison > 0 || youBleed > 0 || youBurn > 0;
                score = hasDot ? 10 : 4;
            }
            if (card.name === 'Проклятая книга') {
                if (difficulty === 'expert') score = oppHP > 20 ? 70 : -50;
                else score = oppHP > 30 ? 50 : -20;
            }
            if (card.name === 'Кража') {
                score = oppHand.length > 0 ? 150 : -100;
            }
            if (card.name === 'Заморозка') {
                score = 120;
            }
            if (card.name === 'Азарт') {
                score = oppHP < 30 ? -100 : 25;
            }
        }
        else {
            score = 10;
        }

        if (difficulty === 'amateur') score += Math.random() * 20 - 10;

        return score;
    }

    function pickBotCardIndex() {
        if (oppHand.length === 0) return -1;

        if (oppDifficulty === 'amateur' && Math.random() < 0.15) {
            return Math.floor(Math.random() * oppHand.length);
        }

        let bestIdx = 0;
        let bestScore = -Infinity;

        for (let i = 0; i < oppHand.length; i++) {
            const s = scoreCard(oppHand[i].id, oppDifficulty);
            if (s > bestScore) { bestScore = s; bestIdx = i; }
        }

        const drawThreshold = oppDifficulty === 'expert' ? 5 : -20;
        if (bestScore < drawThreshold) return -1;

        return bestIdx;
    }

    // ============ ХОД ИИ ============
    function botCbTurn() {
        if (cbPhase !== 'playing' || currentTurn !== 'opp') return;

        if (oppBuffsThisTurn > 0) {
            let bestBuffIdx = -1;
            let bestBuffScore = -100;
            for (let i = 0; i < oppHand.length; i++) {
                if (CARDS[oppHand[i].id].type === 'buff') {
                    const s = scoreCard(oppHand[i].id, oppDifficulty);
                    if (s > bestBuffScore) { bestBuffScore = s; bestBuffIdx = i; }
                }
            }

            if (bestBuffIdx !== -1 && bestBuffScore > 0) {
                playCbCard(bestBuffIdx, false); return;
            }

            startCbTurn('you');
            return;
        }

        const idx = pickBotCardIndex();

        if (idx >= 0) {
            playCbCard(idx, false);
        } else {
            drawCards(oppHand, 2);
            logCbMessage('Соперник берет 2 карты', 'opp');
            renderCardBattle();
            startCbTurn('you');
        }
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function initCardBattle() {
        youHP = 100; oppHP = 100;
        youShield = 0; oppShield = 0;
        youPoison = 0; oppPoison = 0;
        youBurn = 0; oppBurn = 0;
        youBleed = 0; oppBleed = 0;
        youVulnerable = 0; oppVulnerable = 0;
        youAtkBuff = 0; oppAtkBuff = 0;
        youLuck = 0; oppLuck = 0;
        youThorns = 0; oppThorns = 0;
        youReflect = false; oppReflect = false;
        youEvasion = false; oppEvasion = false;
        youAmulet = 0; oppAmulet = 0;
        youSkipTurns = 0; oppSkipTurns = 0;
        
        youBuffsThisTurn = 0;
        oppBuffsThisTurn = 0;
        oppHandRevealed = 0;

        oppDifficulty = pickDifficulty();

        youHand = [{ id: drawCard(), revealed: false }, { id: drawCard(), revealed: false }, { id: drawCard(), revealed: false }];
        oppHand = [{ id: drawCard(), revealed: false }, { id: drawCard(), revealed: false }, { id: drawCard(), revealed: false }];

        cbPhase = 'playing';
        logMessages = [];
        logCbMessage('⚔️ Бой начался!', 'system');

        renderCardBattle();

        const first = Math.random() < 0.5 ? 'you' : 'opp';
        startCbTurn(first);
    }

    function endCardBattle() {
        stopTurnTimer();
        cbPhase = 'done';
        if (cbActionTimer) { clearTimeout(cbActionTimer); cbActionTimer = null; }

        let playerWins = oppHP <= 0 && youHP > 0;
        let isPush = youHP <= 0 && oppHP <= 0;

        if (isPush) {
            D.flow.resolvePush();
            DOM.duelMessage.textContent = `🤝 ПУШ! Оба погибли. Ставка возвращена.`;
            DOM.duelMessage.className = 'duel-message';
            DOM.duelStatus.textContent = 'Ничья';
            DOM.duelStatus.style.color = '#ffb400';
            setTimeout(() => D.flow.finalizeReturnButton(), 500);
        } else {
            D.flow.resolveDuel(playerWins, 'cardbattle');
        }
    }

    // ============ СТАНДАРТНЫЙ ИНТЕРФЕЙС ============
    function prepare(config) {
        DOM.cbArenaEl.style.display = 'flex';

        const cg = D.state.currentGame;
        DOM.cbOppNameEl.textContent = cg.opponentName;
        DOM.cbTurnIndicator.textContent = 'Ожидание...';
        DOM.cbTurnIndicator.style.color = '#ffb400';
        DOM.cbLogEl.innerHTML = '<div class="cb-log-empty">Бой начнётся, как только нажмёте «Начать»</div>';
        DOM.cbYouHandEl.innerHTML = '';
        DOM.cbOppHandEl.innerHTML = '';
        DOM.cbYouHPFill.style.width = '100%';
        DOM.cbOppHPFill.style.width = '100%';
        DOM.cbYouHPText.textContent = '100 / 100';
        DOM.cbOppHPText.textContent = '100 / 100';
        DOM.cbPlayerActions.style.display = 'none';
        stopTurnTimer();
    }

    function start() {
        DOM.rollBtn.style.display = 'none';
        D.state.isRolling = true;
        initCardBattle();
    }

    // ============ МОДАЛКА "КАК ИГРАТЬ" ============
    if (cbHelpBtn && cbHelpModal) {
        cbHelpBtn.addEventListener('click', () => { cbHelpModal.style.display = 'flex'; });
    }
    if (cbHelpClose && cbHelpModal) {
        cbHelpClose.addEventListener('click', () => { cbHelpModal.style.display = 'none'; });
    }
    if (cbHelpModal) {
        cbHelpModal.addEventListener('click', (e) => {
            if (e.target === cbHelpModal) cbHelpModal.style.display = 'none';
        });
    }

    D.games.cardbattle = {
        usesBotStart: false,
        startButtonText: '⚔️ НАЧАТЬ БОЙ',
        readyText: '🎯 Подготовка к бою...',
        prepare,
        start,
        onDraw: playerDraw,
        onPass: playerPass,
        cleanup: () => {
            if (cbActionTimer) { clearTimeout(cbActionTimer); cbActionTimer = null; }
            stopTurnTimer();
        }
    };
})();