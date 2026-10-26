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
        punch:      { name: 'Удар',           icon: '👊', desc: '6 урона',              type: 'action', value: 6,  rarity: 1, weight: 12 },
        strike:     { name: 'Клинок',         icon: '🗡️', desc: '10 урона',             type: 'action', value: 10, rarity: 1, weight: 16 },
        shield:     { name: 'Блок',           icon: '🛡️', desc: '10 защиты',            type: 'buff',   value: 10, rarity: 1, weight: 10 },
        heal:       { name: 'Лечение',        icon: '💚', desc: '12 HP',                type: 'buff',   value: 12, rarity: 1, weight: 8 },
        fast_heal:  { name: 'Быстрое лечение',icon: '🌿', desc: '7 HP',                 type: 'buff',   value: 7,  rarity: 1, weight: 12 },

        // Uncommon
        heavy:      { name: 'Мощный удар',    icon: '💥', desc: '16 урона',             type: 'action', value: 16, rarity: 2, weight: 8 },
        combo:      { name: 'Комбо',          icon: '🤜🤛', desc: '3 удара по 5 (бафф на 1-й)', type: 'action', value: 15, rarity: 2, weight: 7 },
        lifesteal:  { name: 'Вампиризм',      icon: '🩸', desc: '8 урона, +8 HP',        type: 'action', value: 8,  rarity: 2, weight: 6 },
        rage:       { name: 'Ярость',         icon: '😡', desc: '+10 к следующей атаке',      type: 'buff',   value: 10, rarity: 2, weight: 5 },
        barrier:    { name: 'Барьер',         icon: '🛡️✨', desc: '15 защиты',           type: 'buff',   value: 15, rarity: 2, weight: 5 },
        siphon:     { name: 'Сифон',          icon: '🌀', desc: 'Снять 8 щита, 5 урона', type: 'action', value: 5,  rarity: 2, weight: 4 },
        antidote:   { name: 'Антидот',        icon: '💉', desc: 'Снять все статусы, +4 HP', type: 'buff', value: 4, rarity: 2, weight: 4 },
        thorns:     { name: 'Шипы',           icon: '🌵', desc: '10 урона атакующему',   type: 'buff',   value: 10, rarity: 2, weight: 4 },
        blessing:   { name: 'Благословение',  icon: '🌟', desc: '+8 HP и +5 щита',       type: 'buff',   value: 8,  rarity: 2, weight: 4 },
        infection:  { name: 'Заражение',      icon: '☠️', desc: '4 урона (12, если есть статус)', type: 'action', value: 4, rarity: 2, weight: 4 },
        luck:       { name: 'Удача',          icon: '🍀', desc: '+5 к следующей атаке',      type: 'buff',   value: 5,  rarity: 2, weight: 4 },
        insight:    { name: 'Прозрение',      icon: '👁️', desc: 'Видеть карты врага', type: 'buff', value: 0, rarity: 2, weight: 4, turns: 3 },
        gamble:     { name: 'Азарт',          icon: '🎰', desc: '50%: 30 урона / 15 себе', type: 'action', value: 0, rarity: 2, weight: 3 },
        poison_dagger:{name: 'Отравленный клинок', icon: '🗡️🧪', desc: '6 урона, вешает яд', type: 'action', value: 6, rarity: 2, weight: 4, turns: 3 },
        flame_whip: { name: 'Пламенный хлыст',icon: '🔥', desc: '6 урона, вешает горение', type: 'action', value: 6, rarity: 2, weight: 4, turns: 3 },
        slash:      { name: 'Разрез',         icon: '🩸', desc: '5 урона, вешает кровотечение', type: 'action', value: 5, rarity: 2, weight: 4, turns: 3 },
        armor:      { name: 'Броня',          icon: '🛡️🧱', desc: '-50% урона по HP', type: 'buff',   value: 0,  rarity: 2, weight: 4, turns: 3 },
        regen:      { name: 'Регенерация',    icon: '💖', desc: '+5 HP в течение', type: 'buff',  value: 5,  rarity: 2, weight: 4, turns: 3 },
        weakness:   { name: 'Слабость',       icon: '🥀', desc: '-50% урона врага', type: 'buff',   value: 0,  rarity: 2, weight: 4, turns: 3 },
        surge:      { name: 'Прилив сил',     icon: '💪✨', desc: '+5 к следующей атаке и удаче', type: 'buff', value: 5, rarity: 2, weight: 3 },
        lucky_strike:{ name: 'Счастливый случай', icon: '🍀⚔️', desc: '6 урона, +10 удачи', type: 'action', value: 6, rarity: 2, weight: 3 },
        blood_shield:{ name: 'Кровавый щит',  icon: '🛡️🩸', desc: '-10 HP, +25 щита', type: 'buff', value: 0, rarity: 2, weight: 3 },

        // Rare
        fireball:   { name: 'Огненный шар',   icon: '🔥', desc: '12 урона + горение',    type: 'action', value: 12, rarity: 3, weight: 3, turns: 3 },
        bleed:      { name: 'Кровотечение',   icon: '🩸', desc: '6 урона + статус 3 урона',     type: 'action', value: 6,  rarity: 3, weight: 3, turns: 3 },
        vulnerable: { name: 'Уязвимость',     icon: '🎯', desc: 'Враг получает +50% урона', type: 'buff', value: 0, rarity: 3, weight: 3, turns: 3 },
        ritual:     { name: 'Ритуал',         icon: '💀', desc: '-8 HP, 20 урона',       type: 'action', value: 20, rarity: 3, weight: 3 },
        reflect:    { name: 'Отражение',      icon: '🔮', desc: '50% урона обратно',     type: 'buff',   value: 0,  rarity: 3, weight: 3 },
        chaos:      { name: 'Хаос',           icon: '🎲', desc: 'Случайно 5–25 урона',   type: 'action', value: 0,  rarity: 3, weight: 3 },
        vengeance:  { name: 'Возмездие',      icon: '⚔️', desc: '5 + 1/3 потерянного HP', type: 'action', value: 0,  rarity: 3, weight: 2 },
        evasion:    { name: 'Уклонение',      icon: '💨', desc: 'Блокирует следующую атаку', type: 'buff',   value: 0,  rarity: 3, weight: 3 },
        whirlwind:  { name: 'Вихрь',          icon: '🌪️', desc: '3 урона за карту в своей руке', type: 'action', value: 3, rarity: 3, weight: 3 },
        amulet:     { name: 'Амулет',         icon: '🧿', desc: 'Иммунитет к статусам', type: 'buff',  value: 0,  rarity: 3, weight: 3, turns: 3 },
        cursed_book:{ name: 'Проклятая книга',icon: '📜', desc: '+3 карты, -5 HP',       type: 'action', value: 5,  rarity: 3, weight: 2 },
        mind_read:  { name: 'Чтение мыслей',  icon: '👁️‍🗨️', desc: 'Раскрыть текущие карты', type: 'buff', value: 0, rarity: 3, weight: 3 },
        frost:      { name: 'Заморозка',      icon: '❄️', desc: 'Пропуск ходов врагом', type: 'action', value: 0,  rarity: 3, weight: 2, turns: 2 },
        sandstorm:  { name: 'Песчаная буря',  icon: '🌪️', desc: '8 урона, враг может промахнуться', type: 'action', value: 8, rarity: 3, weight: 2 },
        dark_pact:  { name: 'Темный пакт',    icon: '💀', desc: '25 урона, -10 HP себе', type: 'action', value: 25, rarity: 3, weight: 2 },
        fortify:    { name: 'Укрепление',     icon: '🏰', desc: '+20 щита',              type: 'buff',   value: 20, rarity: 3, weight: 3 },
        toxic_cloud:{ name: 'Токсичное облако',icon: '☁️🧪', desc: '3 урона, вешает яд', type: 'action', value: 3, rarity: 3, weight: 2, turns: 5 },
        meteor:     { name: 'Метеор',         icon: '☄️', desc: '15 урона, вешает горение', type: 'action', value: 15, rarity: 3, weight: 2, turns: 3 },
        blindness:  { name: 'Слепота',        icon: '🌫️', desc: 'Враг промахнётся', type: 'action', value: 0, rarity: 3, weight: 2, turns: 1 },
        flame_whirl:{ name: 'Огненный вихрь', icon: '🌪️🔥', desc: '8 урона, вешает горение', type: 'action', value: 8, rarity: 3, weight: 2, turns: 3 },
        blood_ritual:{ name: 'Кровавый ритуал', icon: '🩸🥀', desc: '10 урона (x2, если есть кровь)', type: 'action', value: 10, rarity: 3, weight: 2, turns: 2 },
        mana_burn:  { name: 'Выжигание',      icon: '🔥🧠', desc: 'Урон = горение врага * 2', type: 'action', value: 0, rarity: 3, weight: 2 },
        fire_wall:  { name: 'Стена огня',     icon: '🔥🧱', desc: '15 щита, враг получает горение', type: 'buff', value: 15, rarity: 3, weight: 2, turns: 3 },

        // Legendary
        execution:  { name: 'Казнь',          icon: '☠️', desc: '30 урона, если у врага меньше 50 HP', type: 'action', value: 30, rarity: 4, weight: 1 },
        phoenix:    { name: 'Феникс',         icon: '🦅', desc: 'Полное лечение, если меньше 25 HP', type: 'buff',  value: 100, rarity: 4, weight: 1 },
        ultimate:   { name: 'Ультиматум',     icon: '⚡', desc: '25 урона, +10 HP',       type: 'action', value: 25, rarity: 4, weight: 1 },
        steal:      { name: 'Кража',          icon: '🦹', desc: 'Украсть 1 карту врага',  type: 'action', value: 0,  rarity: 4, weight: 1 }
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
    let youBurn = 0, oppBurn = 0;
    let youBurnDmg = 3, oppBurnDmg = 3;
    let youBleed = 0, oppBleed = 0;
    let youVulnerable = 0, oppVulnerable = 0;
    let youAtkBuff = 0, oppAtkBuff = 0;
    let youLuck = 0, oppLuck = 0;
    let youThorns = 0, oppThorns = 0;
    let youReflect = 0, oppReflect = 0;
    let youEvasion = 0, oppEvasion = 0;
    let youAmulet = 0, oppAmulet = 0;
    let youSkipTurns = 0, oppSkipTurns = 0;
    let youBlind = 0, oppBlind = 0;
    let youArmor = 0, oppArmor = 0;
    let youRegen = 0, oppRegen = 0;
    let youWeak = 0, oppWeak = 0;

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

    function logDamage(cardName, res, isPlayer) {
        let msg = `${cardName} → ${res.hpLost} HP`;
        if (res.blindMiss) msg = `${cardName} → промах (слепота)`;
        else if (res.evaded) msg = `${cardName} → соперник уклонился`;
        else if (res.absorbed > 0) msg += ` (щит: -${res.absorbed})`;
        logCbMessage(msg, isPlayer ? 'you' : 'opp');
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
            if (youBurn > 0) arr.push(`🔥${youBurn}(${youBurnDmg})`);
            if (youBleed > 0) arr.push(`🩸${youBleed}`);
            if (youVulnerable > 0) arr.push(`🎯${youVulnerable}`);
            if (youThorns > 0) arr.push(`🌵${youThorns}`);
            if (youReflect > 0) arr.push(`🔮${youReflect}`);
            if (youEvasion > 0) arr.push(`💨${youEvasion}`);
            if (youAmulet > 0) arr.push(`🧿${youAmulet}`);
            if (youBlind > 0) arr.push(`🌫️${youBlind}`);
            if (youArmor > 0) arr.push(`🧱${youArmor}`);
            if (youRegen > 0) arr.push(`💖${youRegen}`);
            if (youWeak > 0) arr.push(`🥀${youWeak}`);
        } else {
            if (oppShield > 0) arr.push(`🛡️${oppShield}`);
            if (oppAtkBuff > 0) arr.push(`😡+${oppAtkBuff}`);
            if (oppLuck > 0) arr.push(`🍀+${oppLuck}`);
            if (oppPoison > 0) arr.push(`🧪${oppPoison}`);
            if (oppBurn > 0) arr.push(`🔥${oppBurn}(${oppBurnDmg})`);
            if (oppBleed > 0) arr.push(`🩸${oppBleed}`);
            if (oppVulnerable > 0) arr.push(`🎯${oppVulnerable}`);
            if (oppThorns > 0) arr.push(`🌵${oppThorns}`);
            if (oppReflect > 0) arr.push(`🔮${oppReflect}`);
            if (oppEvasion > 0) arr.push(`💨${oppEvasion}`);
            if (oppAmulet > 0) arr.push(`🧿${oppAmulet}`);
            if (oppBlind > 0) arr.push(`🌫️${oppBlind}`);
            if (oppArmor > 0) arr.push(`🧱${oppArmor}`);
            if (oppRegen > 0) arr.push(`💖${oppRegen}`);
            if (oppWeak > 0) arr.push(`🥀${oppWeak}`);
        }
        return arr.length ? `<span class="cb-statuses">${arr.map(a => `<span>${a}</span>`).join('')}</span>` : '';
    }

    // ============ РЕНДЕР ============
    function renderCardBattle() {
        DOM.cbYouHPFill.style.width = Math.max(0, youHP) + '%';
        DOM.cbOppHPFill.style.width = Math.max(0, oppHP) + '%';
        DOM.cbYouHPText.innerHTML = `${youHP} / 100 ${formatStatusIcons(true)}`;
        DOM.cbOppHPText.innerHTML = `${oppHP} / 100 ${formatStatusIcons(false)}`;

        // --- Рука игрока ---
        DOM.cbYouHandEl.innerHTML = '';
        youHand.forEach((cardObj, i) => {
            const card = CARDS[cardObj.id];
            const el = document.createElement('div');
            el.className = `cb-card type-${card.type} rarity-${card.rarity}`;

            let disabled = currentTurn !== 'you' || cbPhase !== 'playing';
            if (!disabled && card.type === 'action' && youBuffsThisTurn > 0) disabled = true;
            if (!disabled && card.type === 'buff' && youBuffsThisTurn >= D.consts.CB_MAX_BUFFS_PER_TURN) disabled = true;

            if (disabled) el.classList.add('disabled');

            const typeLabel = card.type === 'buff' ? 'БАФФ' : 'ДЕЙСТВИЕ';
            const turnsLabel = card.turns ? `${card.turns} ход.` : '';

            el.innerHTML = `
                <div class="cb-card-type">${typeLabel}</div>
                <div class="cb-card-center">
                    <div class="cb-card-icon">${card.icon}</div>
                    <div class="cb-card-name">${card.name}</div>
                    <div class="cb-card-desc">${card.desc}</div>
                </div>
                <div class="cb-card-turns ${card.turns ? '' : 'empty'}">${turnsLabel}</div>
            `;

            if (!disabled) el.addEventListener('click', () => playCbCard(i, true));
            DOM.cbYouHandEl.appendChild(el);
        });

        // --- Рука соперника ---
        DOM.cbOppHandEl.innerHTML = '';
        oppHand.forEach((cardObj, i) => {
            const el = document.createElement('div');
            const isRevealed = cardObj.revealed || oppHandRevealed > 0;

            if (isRevealed) {
                const card = CARDS[cardObj.id];
                el.className = `cb-card type-${card.type} rarity-${card.rarity} disabled`;
                const typeLabel = card.type === 'buff' ? 'БАФФ' : 'ДЕЙСТВИЕ';
                const turnsLabel = card.turns ? `${card.turns} ход.` : '';

                el.innerHTML = `
                    <div class="cb-card-type">${typeLabel}</div>
                    <div class="cb-card-center">
                        <div class="cb-card-icon">${card.icon}</div>
                        <div class="cb-card-name">${card.name}</div>
                        <div class="cb-card-desc">${card.desc}</div>
                    </div>
                    <div class="cb-card-turns ${card.turns ? '' : 'empty'}">${turnsLabel}</div>
                `;
                el.style.opacity = '0.6';
            } else {
                el.className = 'cb-card card-back';
            }
            DOM.cbOppHandEl.appendChild(el);
        });
    }

    // ============ УРОН ============
    function applyCbDamage(target, amount, bypassShield = false, isStatus = false) {
        if (target === 'you') {
            let dmg = amount;
            let absorbed = 0;
            if (!bypassShield && youShield > 0) {
                absorbed = Math.min(youShield, dmg);
                youShield -= absorbed;
                dmg -= absorbed;
            }
            if (!isStatus && youArmor > 0 && dmg > 0) {
                dmg = Math.floor(dmg * 0.5);
            }
            if (youVulnerable > 0) dmg = Math.floor(dmg * 1.5);
            if (youWeak > 0 && !isStatus) dmg = Math.floor(dmg * 0.5);
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
            if (!isStatus && oppArmor > 0 && dmg > 0) {
                dmg = Math.floor(dmg * 0.5);
            }
            if (oppVulnerable > 0) dmg = Math.floor(dmg * 1.5);
            if (oppWeak > 0 && !isStatus) dmg = Math.floor(dmg * 0.5);
            oppHP = Math.max(0, oppHP - dmg);
            return { hpLost: dmg, absorbed: absorbed };
        }
    }

    function dealCardDamage(attackerIsPlayer, amount) {
        if (attackerIsPlayer && youBlind > 0) {
            youBlind--;
            return { hpLost: 0, absorbed: 0, evaded: true, blindMiss: true };
        }
        if (!attackerIsPlayer && oppBlind > 0) {
            oppBlind--;
            return { hpLost: 0, absorbed: 0, evaded: true, blindMiss: true };
        }

        if (attackerIsPlayer && oppEvasion > 0) {
            oppEvasion--;
            return { hpLost: 0, absorbed: 0, evaded: true };
        }
        if (!attackerIsPlayer && youEvasion > 0) {
            youEvasion--;
            return { hpLost: 0, absorbed: 0, evaded: true };
        }

        const target = attackerIsPlayer ? 'opp' : 'you';
        const result = applyCbDamage(target, amount);
        const actualDamage = result.hpLost;

        if (actualDamage > 0) {
            if (attackerIsPlayer) {
                if (oppReflect > 0) {
                    oppReflect--;
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
                if (youReflect > 0) {
                    youReflect--;
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

    function dealBuffedDamage(isPlayer, card, customBase = null) {
        let base = (customBase !== null) ? customBase : (card.value || 0);
        if (isPlayer) {
            base += youAtkBuff + youLuck;
            youAtkBuff = 0;
            youLuck = 0;
        } else {
            base += oppAtkBuff + oppLuck;
            oppAtkBuff = 0;
            oppLuck = 0;
        }
        return dealCardDamage(isPlayer, base);
    }

    // ============ ЭФФЕКТЫ КАРТ ============
    function applyCbCardEffect(card, isPlayer) {
        function applyBurn(isPlayer, turns) {
            if (isPlayer) {
                if (oppBurn === 0) oppBurnDmg = 3;
                oppBurn += turns;
            } else {
                if (youBurn === 0) youBurnDmg = 3;
                youBurn += turns;
            }
        }

        switch (card.name) {
            case 'Тычок': case 'Удар': case 'Мощный удар': {
                const res = dealBuffedDamage(isPlayer, card);
                logDamage(card.name, res, isPlayer);
                break;
            }
            case 'Отравленный клинок': {
                const res = dealBuffedDamage(isPlayer, card);
                if (isPlayer) oppPoison += 3; else youPoison += 3;
                logDamage(`${card.icon} ${card.name} (+яд)`, res, isPlayer);
                break;
            }
            case 'Пламенный хлыст': {
                const res = dealBuffedDamage(isPlayer, card);
                applyBurn(isPlayer, 3);
                logDamage(`${card.icon} ${card.name} (+горение)`, res, isPlayer);
                break;
            }
            case 'Разрез': {
                const res = dealBuffedDamage(isPlayer, card);
                if (isPlayer) oppBleed += 3; else youBleed += 3;
                logDamage(`${card.icon} ${card.name} (+кровь)`, res, isPlayer);
                break;
            }
            case 'Огненный шар': {
                const res = dealBuffedDamage(isPlayer, card);
                applyBurn(isPlayer, 3);
                logDamage(`${card.icon} ${card.name} (+горение)`, res, isPlayer);
                break;
            }
            case 'Токсичное облако': {
                const res = dealBuffedDamage(isPlayer, card);
                if (isPlayer) oppPoison += 5; else youPoison += 5;
                logDamage(`${card.icon} ${card.name} (+яд 5х)`, res, isPlayer);
                break;
            }
            case 'Метеор': {
                const res = dealBuffedDamage(isPlayer, card);
                applyBurn(isPlayer, 3);
                logDamage(`${card.icon} ${card.name} (+горение)`, res, isPlayer);
                break;
            }
            case 'Огненный вихрь': {
                const res = dealBuffedDamage(isPlayer, card);
                applyBurn(isPlayer, 3);
                logDamage(`${card.icon} ${card.name} (+горение)`, res, isPlayer);
                break;
            }
            case 'Кровотечение': {
                const res = dealBuffedDamage(isPlayer, card);
                if (isPlayer) oppBleed += 3; else youBleed += 3;
                logDamage(`${card.icon} ${card.name} (+кровь)`, res, isPlayer);
                break;
            }
            case 'Кровавый ритуал': {
                const hasBleed = isPlayer ? (oppBleed > 0) : (youBleed > 0);
                const dmg = hasBleed ? 20 : 10;
                const res = dealBuffedDamage(isPlayer, card, dmg);
                if (isPlayer) oppBleed += 2; else youBleed += 2;
                logDamage(`${card.icon} ${card.name}${hasBleed ? ' (усилено)' : ''} (+кровь)`, res, isPlayer);
                break;
            }
            case 'Выжигание': {
                const burnStacks = isPlayer ? oppBurn : youBurn;
                const dmg = burnStacks > 0 ? burnStacks * 2 : 5;
                const res = dealBuffedDamage(isPlayer, card, dmg);
                logDamage(`🔥🧠 Выжигание (${dmg})`, res, isPlayer);
                break;
            }
            case 'Стена огня': {
                if (isPlayer) {
                    youShield += 15;
                    oppBurn += 3; oppBurnDmg = 3;
                } else {
                    oppShield += 15;
                    youBurn += 3; youBurnDmg = 3;
                }
                logCbMessage(`🔥🧱 Стена огня: +15 щита, враг получает горение (3 х.)`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Комбо': {
                let totalDmg = 0;
                let blockedTotal = 0;
                for (let i = 0; i < 3; i++) {
                    const r = (i === 0) ? dealBuffedDamage(isPlayer, card, 5) : dealCardDamage(isPlayer, 5);
                    totalDmg += r.hpLost;
                    blockedTotal += r.absorbed;
                }
                let msg = `комбо на ${totalDmg} урона`;
                if (blockedTotal > 0) msg += ` (щит: -${blockedTotal})`;
                logCbMessage(`🤜🤛 ${msg}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Вампиризм': {
                const res = dealBuffedDamage(isPlayer, card);
                if (isPlayer) youHP = Math.min(100, youHP + 8);
                else oppHP = Math.min(100, oppHP + 8);
                let msg = `${res.hpLost} HP, +8 HP`;
                if (res.absorbed > 0) msg += ` (щит: -${res.absorbed})`;
                logCbMessage(`🩸 ${card.name}: ${msg}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Сифон': {
                if (isPlayer) {
                    const removed = Math.min(oppShield, 8);
                    oppShield -= removed;
                    const res = dealBuffedDamage(true, card, 5);
                    logCbMessage(`🌀 Сняли ${removed} щита и нанесли ${res.hpLost} урона`, 'you');
                } else {
                    const removed = Math.min(youShield, 8);
                    youShield -= removed;
                    const res = dealBuffedDamage(false, card, 5);
                    logCbMessage(`🌀 Соперник снял ${removed} щита и нанёс ${res.hpLost} урона`, 'opp');
                }
                break;
            }
            case 'Хаос': {
                const roll = 5 + Math.floor(Math.random() * 21);
                const res = dealBuffedDamage(isPlayer, card, roll);
                logDamage(`🎲 Хаос (${roll})`, res, isPlayer);
                break;
            }
            case 'Возмездие': {
                const myMissing = 100 - (isPlayer ? youHP : oppHP);
                const bonus = 5 + Math.floor(myMissing / 3);
                const res = dealBuffedDamage(isPlayer, card, bonus);
                logDamage(`⚔️ Возмездие`, res, isPlayer);
                break;
            }
            case 'Казнь': {
                const targetHP = isPlayer ? oppHP : youHP;
                const dmg = targetHP < 50 ? 30 : 8;
                const res = dealBuffedDamage(isPlayer, card, dmg);
                logDamage(`☠️ Казнь`, res, isPlayer);
                break;
            }
            case 'Ультиматум': {
                const res = dealBuffedDamage(isPlayer, card, 25);
                if (isPlayer) youHP = Math.min(100, youHP + 10);
                else oppHP = Math.min(100, oppHP + 10);
                logDamage(`⚡ Ультиматум (+10 HP)`, res, isPlayer);
                break;
            }
            case 'Ритуал': {
                if (isPlayer) youHP = Math.max(0, youHP - 8);
                else oppHP = Math.max(0, oppHP - 8);
                const res = dealBuffedDamage(isPlayer, card, 20);
                logDamage(`💀 Ритуал (-8 HP)`, res, isPlayer);
                break;
            }
            case 'Темный пакт': {
                if (isPlayer) youHP = Math.max(0, youHP - 10);
                else oppHP = Math.max(0, oppHP - 10);
                const res = dealBuffedDamage(isPlayer, card, 25);
                logDamage(`💀 Темный пакт (-10 HP)`, res, isPlayer);
                break;
            }
            case 'Кровавый щит': {
                if (isPlayer) youHP = Math.max(0, youHP - 10);
                else oppHP = Math.max(0, oppHP - 10);
                if (isPlayer) youShield += 25;
                else oppShield += 25;
                logCbMessage(`🛡️🩸 Кровавый щит: -10 HP, +25 щита`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Азарт': {
                if (Math.random() < 0.5) {
                    const res = dealBuffedDamage(isPlayer, card, 30);
                    logDamage(`🎰 Азарт (удача!)`, res, isPlayer);
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
            case 'Песчаная буря': {
                const res = dealBuffedDamage(isPlayer, card);
                if (isPlayer) oppBlind += 1; else youBlind += 1;
                logDamage(`🌪️ Песчаная буря (+слепота)`, res, isPlayer);
                break;
            }
            case 'Слепота': {
                if (isPlayer) oppBlind += 1; else youBlind += 1;
                logCbMessage(`🌫️ Слепота: враг промахнётся`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Лечение': case 'Быстрое лечение': {
                if (isPlayer) youHP = Math.min(100, youHP + card.value);
                else oppHP = Math.min(100, oppHP + card.value);
                logCbMessage(`${card.icon} Лечение ${card.value} HP`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Регенерация': {
                if (isPlayer) { youRegen = 3; }
                else { oppRegen = 3; }
                logCbMessage(`💖 Регенерация (+5 HP / 3 хода)`, isPlayer ? 'you' : 'opp');
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
            case 'Блок': case 'Барьер': case 'Укрепление': {
                if (isPlayer) youShield += card.value;
                else oppShield += card.value;
                logCbMessage(`${card.icon} +${card.value} щита`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Броня': {
                if (isPlayer) youArmor = 3;
                else oppArmor = 3;
                logCbMessage(`🧱 Броня активна (-50% урона по HP / 3 хода)`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Слабость': {
                if (isPlayer) oppWeak = 3;
                else youWeak = 3;
                logCbMessage(`🥀 Слабость: -50% урона на 3 хода`, isPlayer ? 'you' : 'opp');
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
            case 'Счастливый случай': {
                const res = dealBuffedDamage(isPlayer, card);
                if (isPlayer) youLuck += 10; else oppLuck += 10;
                logDamage(`🍀⚔️ Счастливый случай (+10 удачи)`, res, isPlayer);
                break;
            }
            case 'Прилив сил': {
                if (isPlayer) { youAtkBuff += 5; youLuck += 5; }
                else { oppAtkBuff += 5; oppLuck += 5; }
                logCbMessage(`💪✨ Прилив сил: +5 к атаке и удаче`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Шипы': {
                if (isPlayer) youThorns += card.value;
                else oppThorns += card.value;
                logCbMessage(`🌵 Шипы на ${card.value}`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Отражение': {
                if (isPlayer) youReflect += 1;
                else oppReflect += 1;
                logCbMessage(`🔮 Отражение активно`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Уклонение': {
                if (isPlayer) youEvasion += 1;
                else oppEvasion += 1;
                logCbMessage(`💨 Уклонение активно`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Амулет': {
                if (isPlayer) youAmulet = Math.max(youAmulet, 3);
                else oppAmulet = Math.max(oppAmulet, 3);
                logCbMessage(`🧿 Амулет активен (3 хода)`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Прозрение': {
                if (isPlayer) {
                    oppHandRevealed = 3;
                    logCbMessage(`👁️ Вы видите руку соперника (3 хода)!`, 'you');
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
                logCbMessage(`🎯 Уязвимость +50% урона на 3 хода`, isPlayer ? 'you' : 'opp');
                break;
            }
            case 'Заражение': {
                const hasDot = isPlayer ? (oppPoison > 0 || oppBleed > 0 || oppBurn > 0) : (youPoison > 0 || youBleed > 0 || youBurn > 0);
                const dmg = hasDot ? 12 : 4;
                const res = dealBuffedDamage(isPlayer, card, dmg);
                logDamage(`☠️ Заражение${hasDot ? ' (усилено)' : ''}`, res, isPlayer);
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
                const res = dealBuffedDamage(isPlayer, card, dmg);
                logDamage(`🌪️ Вихрь`, res, isPlayer);
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
                const res = dealBuffedDamage(isPlayer, card);
                logDamage(card.name, res, isPlayer);
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
                    currentTurn = 'opp';
                    stopTurnTimer();
                    updateCbStatus();
                    renderCardBattle();
                    setTimeout(() => startCbTurn('opp'), 500);
                } else {
                    updateCbStatus();
                    renderCardBattle();
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

    // ============ СМЕНА ХОДА (ОБРАБОТКА СТАТУСОВ) ============
    function startCbTurn(actor) {
        currentTurn = actor;
        youBuffsThisTurn = 0;
        oppBuffsThisTurn = 0;

        if (actor === 'you') {
            if (youSkipTurns > 0) {
                youSkipTurns--;
                logCbMessage(`❄️ Вы пропускаете ход (заморожены, осталось: ${youSkipTurns + 1})!`, 'system');
                currentTurn = 'opp';
                stopTurnTimer();
                updateCbStatus();
                renderCardBattle();
                setTimeout(() => startCbTurn('opp'), 1500);
                return;
            }
            if (youArmor > 0) youArmor--;
            if (youRegen > 0) {
                youRegen--;
                youHP = Math.min(100, youHP + 5);
                logCbMessage(`💖 Регенерация: +5 HP`, 'system');
            }
            if (youWeak > 0) youWeak--;

            if (youAmulet > 0) {
                youAmulet--;
                logCbMessage(`🧿 Амулет блокирует урон от статусов`, 'you');
                if (youPoison > 0) youPoison--;
                if (youBurn > 0) { youBurn--; youBurnDmg++; }
                if (youBleed > 0) youBleed--;
            } else {
                if (youPoison > 0) {
                    youPoison--;
                    let baseDmg = 5;
                    if (youShield > 0) {
                        let dmgToShield = Math.floor(baseDmg * 0.5);
                        let absorbed = Math.min(youShield, dmgToShield);
                        youShield -= absorbed;
                        youHP = Math.max(0, youHP - (dmgToShield - absorbed));
                        logCbMessage(`Яд: -${dmgToShield - absorbed} HP (щит: -${absorbed})`, 'system');
                    } else {
                        let dmgToHP = Math.floor(baseDmg * 1.0);
                        youHP = Math.max(0, youHP - dmgToHP);
                        logCbMessage(`Яд: -${dmgToHP} HP`, 'system');
                    }
                }
                if (youBurn > 0) {
                    youBurn--;
                    let dmg = youBurnDmg;
                    let absorbed = Math.min(youShield, dmg);
                    youShield -= absorbed;
                    youHP = Math.max(0, youHP - (dmg - absorbed));
                    logCbMessage(`Горение: -${dmg - absorbed} HP (щит: -${absorbed})`, 'system');
                    youBurnDmg++;
                }
                if (youBleed > 0) {
                    youBleed--;
                    youHP = Math.max(0, youHP - 3);
                    logCbMessage(`Кровотечение: -3 HP (сквозь щит)`, 'system');
                }
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
            if (oppArmor > 0) oppArmor--;
            if (oppRegen > 0) {
                oppRegen--;
                oppHP = Math.min(100, oppHP + 5);
                logCbMessage(`💖 Регенерация соперника: +5 HP`, 'system');
            }
            if (oppWeak > 0) oppWeak--;

            if (oppHandRevealed > 0) oppHandRevealed--;
            
            if (oppAmulet > 0) {
                oppAmulet--;
                logCbMessage(`🧿 Амулет соперника блокирует урон от статусов`, 'opp');
                if (oppPoison > 0) oppPoison--;
                if (oppBurn > 0) { oppBurn--; oppBurnDmg++; }
                if (oppBleed > 0) oppBleed--;
            } else {
                if (oppPoison > 0) {
                    oppPoison--;
                    let baseDmg = 5;
                    if (oppShield > 0) {
                        let dmgToShield = Math.floor(baseDmg * 0.5);
                        let absorbed = Math.min(oppShield, dmgToShield);
                        oppShield -= absorbed;
                        oppHP = Math.max(0, oppHP - (dmgToShield - absorbed));
                        logCbMessage(`Яд соперника: -${dmgToShield - absorbed} HP (щит: -${absorbed})`, 'system');
                    } else {
                        let dmgToHP = Math.floor(baseDmg * 1.0);
                        oppHP = Math.max(0, oppHP - dmgToHP);
                        logCbMessage(`Яд соперника: -${dmgToHP} HP`, 'system');
                    }
                }
                if (oppBurn > 0) {
                    oppBurn--;
                    let dmg = oppBurnDmg;
                    let absorbed = Math.min(oppShield, dmg);
                    oppShield -= absorbed;
                    oppHP = Math.max(0, oppHP - (dmg - absorbed));
                    logCbMessage(`Горение соперника: -${dmg - absorbed} HP (щит: -${absorbed})`, 'system');
                    oppBurnDmg++;
                }
                if (oppBleed > 0) {
                    oppBleed--;
                    oppHP = Math.max(0, oppHP - 3);
                    logCbMessage(`Кровотечение соперника: -3 HP (сквозь щит)`, 'system');
                }
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
            const dotDamage = oppPoison * 5 + oppBleed * 3 + oppBurn * oppBurnDmg;
            if (difficulty === 'amateur') score = dotDamage > 0 ? 100 : -50;
            else {
                if (dotDamage >= 10) score = 140;
                else if (dotDamage > 0) score = 20;
                else score = -80;
            }
        }
        else if (card.name === 'Феникс') {
            if (oppHP > 25) return -999;
            score = difficulty === 'amateur' ? 400 : 900;
        }
        else if (card.name === 'Броня') {
            if (oppArmor > 0) score = -100;
            else score = difficulty === 'amateur' ? 60 : 120;
        }
        else if (card.name === 'Регенерация') {
            if (oppRegen > 0 || oppHP > 85) score = -100;
            else score = difficulty === 'amateur' ? 70 : 110;
        }
        else if (card.name === 'Слабость') {
            if (oppWeak > 0) score = -100;
            else score = difficulty === 'amateur' ? 60 : 90;
        }
        else if (card.name === 'Слепота') {
            if (oppBlind > 0) score = -100;
            else score = difficulty === 'amateur' ? 50 : 80;
        }
        else if (card.name === 'Ярость' || card.name === 'Удача' || card.name === 'Прилив сил') {
            const hasStrongAttack = oppHand.some(c => CARDS[c.id].type === 'action' && (CARDS[c.id].value || 0) >= 10);
            const alreadyBuffed = (card.name === 'Ярость' && oppAtkBuff > 0) || (card.name === 'Удача' && oppLuck > 0) || (card.name === 'Прилив сил' && oppAtkBuff > 0 && oppLuck > 0);

            if (alreadyBuffed) score = -100;
            else if (hasStrongAttack) score = difficulty === 'amateur' ? 60 : 100;
            else score = -50;
        }
        else if (card.name === 'Блок' || card.name === 'Барьер' || card.name === 'Укрепление' || card.name === 'Стена огня') {
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
            if (card.name === 'Стена огня' && youBurn === 0) score += 20;
        }
        else if (card.name === 'Кровавый щит') {
            if (oppHP < 20 || oppShield > 15) score = -100;
            else score = 60;
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
            if (oppReflect > 0) score = -100;
            else if (difficulty === 'amateur') score = 40;
            else score = oppHP > 40 ? 60 : 10;
        }
        else if (card.name === 'Уклонение') {
            if (oppEvasion > 0) score = -100;
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
                const missingHP = 100 - oppHP;
                if (missingHP < 10) return -999;
                const dmgV = 5 + Math.floor(missingHP / 3);
                if (difficulty === 'amateur') score = dmgV * 0.7;
                else score = dmgV;
            }
            if (card.name === 'Сифон') {
                score = youShield > 0 ? 40 + Math.min(youShield, 8) : 10;
            }
            if (card.name === 'Вихрь') {
                const dmgV = Math.min(15, oppHand.length * 3);
                if (dmgV <= 3) return -999;
                if (dmgV >= youHP) score = 2000;
                else score = dmgV;
            }
            if (card.name === 'Заражение') {
                const hasDot = youPoison > 0 || youBleed > 0 || youBurn > 0;
                if (!hasDot) return -50;
                score = 12;
            }
            if (card.name === 'Кровавый ритуал') {
                const hasBleed = youBleed > 0;
                score = hasBleed ? 25 : 12;
            }
            if (card.name === 'Выжигание') {
                const burnStacks = youBurn;
                score = burnStacks > 0 ? burnStacks * 2 + 5 : 5;
            }
            if (card.name === 'Счастливый случай') {
                score = 10;
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
            if (card.name === 'Песчаная буря') {
                score = 20;
            }
            if (card.name === 'Темный пакт') {
                if (oppHP < 20) return -100;
                score = 30;
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
        youBurnDmg = 3; oppBurnDmg = 3;
        youBleed = 0; oppBleed = 0;
        youVulnerable = 0; oppVulnerable = 0;
        youAtkBuff = 0; oppAtkBuff = 0;
        youLuck = 0; oppLuck = 0;
        youThorns = 0; oppThorns = 0;
        youReflect = 0; oppReflect = 0;
        youEvasion = 0; oppEvasion = 0;
        youAmulet = 0; oppAmulet = 0;
        youSkipTurns = 0; oppSkipTurns = 0;
        youBlind = 0; oppBlind = 0;
        youArmor = 0; oppArmor = 0;
        youRegen = 0; oppRegen = 0;
        youWeak = 0; oppWeak = 0;
        
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

        // Раскрываем карты соперника в конце боя
        oppHand.forEach(c => c.revealed = true);
        renderCardBattle();

        setTimeout(showBattleResult, 900);
    }

    function showBattleResult() {
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