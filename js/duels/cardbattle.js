(function () {
    const D = window.DUELS;
    const DOM = D.dom;

    // ============ КОЛОДА КАРТ ============
    // Логика иконок: чем "тяжелее" оружие/действие — тем больше урон.
    //   👊 тычок (6) < 🗡️ удар (10) < 💥 мощный (16) < ⚡ ультиматум (25) < ☠️ казнь (30)
    const CARDS = {
        // === Common (вес 8–16) ===
        punch:      { name: 'Тычок',           icon: '👊', desc: '6 урона',              type: 'action', value: 6,  rarity: 1, weight: 12 },
        strike:     { name: 'Удар',            icon: '🗡️', desc: '10 урона',             type: 'action', value: 10, rarity: 1, weight: 16 },
        shield:     { name: 'Блок',            icon: '🛡️', desc: '10 защиты',            type: 'buff',   value: 10, rarity: 1, weight: 10 },
        heal:       { name: 'Лечение',         icon: '💚', desc: '12 HP',                type: 'buff',   value: 12, rarity: 1, weight: 8 },
        fast_heal:  { name: 'Быстрое лечение', icon: '🌿', desc: '7 HP',                 type: 'buff',   value: 7,  rarity: 1, weight: 12 },

        // === Uncommon (вес 4–8) ===
        heavy:      { name: 'Мощный удар',     icon: '💥', desc: '16 урона',             type: 'action', value: 16, rarity: 2, weight: 8 },
        combo:      { name: 'Комбо',           icon: '🤜🤛', desc: '3×5 урона',           type: 'action', value: 15, rarity: 2, weight: 7 },
        lifesteal:  { name: 'Вампиризм',       icon: '🩸', desc: '8 урона, +8 HP',        type: 'action', value: 8,  rarity: 2, weight: 6 },
        rage:       { name: 'Ярость',          icon: '😡', desc: '+10 к след. атаке',      type: 'buff',   value: 10, rarity: 2, weight: 5 },
        barrier:    { name: 'Барьер',          icon: '🛡️✨', desc: '15 защиты',           type: 'buff',   value: 15, rarity: 2, weight: 5 },
        siphon:     { name: 'Сифон',           icon: '🌀', desc: 'Снять 8 щита, 5 урона', type: 'action', value: 5,  rarity: 2, weight: 4 },
        antidote:   { name: 'Антидот',         icon: '💉', desc: 'Снять яд/кровь, +4 HP', type: 'buff',   value: 4,  rarity: 2, weight: 4 },
        thorns:     { name: 'Шипы',            icon: '🌵', desc: '10 урона атакующему',   type: 'buff',   value: 10, rarity: 2, weight: 4 },
        blessing:   { name: 'Благословение',   icon: '🌟', desc: '+8 HP и +5 щита',       type: 'buff',   value: 8,  rarity: 2, weight: 4 },

        // === Rare (вес 2–3) ===
        fireball:   { name: 'Огненный шар',    icon: '🔥', desc: '12 урона + поджог',     type: 'action', value: 12, rarity: 3, weight: 3 },
        bleed:      { name: 'Кровотечение',    icon: '🩸', desc: '6 урона + DOT 3×3',     type: 'action', value: 6,  rarity: 3, weight: 3 },
        vulnerable: { name: 'Уязвимость',      icon: '🎯', desc: 'Враг +50% урона (3 х)', type: 'buff',   value: 0,  rarity: 3, weight: 3 },
        ritual:     { name: 'Ритуал',          icon: '💀', desc: '-8 HP, 20 урона',       type: 'action', value: 20, rarity: 3, weight: 3 },
        reflect:    { name: 'Отражение',       icon: '🔮', desc: '50% урона обратно',     type: 'buff',   value: 0,  rarity: 3, weight: 3 },
        chaos:      { name: 'Хаос',            icon: '🎲', desc: 'Случайно 5–25 урона',   type: 'action', value: 0,  rarity: 3, weight: 3 },
        vengeance:  { name: 'Возмездие',       icon: '⚔️', desc: '5 + половина потерянного HP', type: 'action', value: 0, rarity: 3, weight: 2 },
        evasion:    { name: 'Уклонение',       icon: '💨', desc: 'Блокирует след. атаку', type: 'buff',   value: 0,  rarity: 3, weight: 3 },

        // === Legendary (вес 1) ===
        execution:  { name: 'Казнь',           icon: '☠️', desc: '30 урона (<50 HP)',     type: 'action', value: 30, rarity: 4, weight: 1 },
        phoenix:    { name: 'Феникс',          icon: '🦅', desc: 'Полн. лечение (<25 HP)', type: 'buff',  value: 100, rarity: 4, weight: 1 },
        ultimate:   { name: 'Ультиматум',      icon: '⚡', desc: '25 урона, +10 HP',       type: 'action', value: 25, rarity: 4, weight: 1 }
    };

    function drawCard() {
        const ids = Object.keys(CARDS);
        const totalWeight = ids.reduce((s, id) => s + CARDS[id].weight, 0);
        let r = Math.random() * totalWeight;
        for (const id of ids) {
            r -= CARDS[id].weight;
            if (r <= 0) return id;
        }
        return ids[0];
    }

    // ============ ЛОКАЛЬНОЕ СОСТОЯНИЕ ============
    let youHP = 100, oppHP = 100;
    let youShield = 0, oppShield = 0;
    let youPoison = 0, oppPoison = 0;
    let youBleed = 0, oppBleed = 0;
    let youVulnerable = 0, oppVulnerable = 0;
    let youAtkBuff = 0, oppAtkBuff = 0;
    let youThorns = 0, oppThorns = 0;
    let youReflect = false, oppReflect = false;
    let youEvasion = false, oppEvasion = false;
    let youHand = [], oppHand = [];
    let currentTurn = 'you';
    let cbPhase = 'idle';
    let cbActionTimer = null;
    let logMessages = [];
    let youBuffsThisTurn = 0, oppBuffsThisTurn = 0;
    let oppDifficulty = 'amateur';

    // ============ ВЫБОР СЛОЖНОСТИ БОТА ============
    function pickDifficulty() {
        const r = Math.random();
        if (r < 0.33) return 'novice';
        if (r < 0.66) return 'amateur';
        return 'expert';
    }

    function difficultyLabel(d) {
        if (d === 'novice') return 'Новичок';
        if (d === 'expert') return 'Эксперт';
        return 'Любитель';
    }

    // ============ ЛОГ ============
    function logCbMessage(msg) {
        logMessages.push(msg);
        if (logMessages.length > 4) logMessages.shift();
        if (DOM.cbLogEl) {
            DOM.cbLogEl.innerHTML = logMessages.map(m => `<div>${m}</div>`).join('');
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
            if (youPoison > 0) arr.push(`🧪${youPoison}`);
            if (youBleed > 0) arr.push(`🩸${youBleed}`);
            if (youVulnerable > 0) arr.push(`🎯${youVulnerable}`);
            if (youThorns > 0) arr.push(`🌵${youThorns}`);
            if (youReflect) arr.push(`🔮`);
            if (youEvasion) arr.push(`💨`);
        } else {
            if (oppShield > 0) arr.push(`🛡️${oppShield}`);
            if (oppAtkBuff > 0) arr.push(`😡+${oppAtkBuff}`);
            if (oppPoison > 0) arr.push(`🧪${oppPoison}`);
            if (oppBleed > 0) arr.push(`🩸${oppBleed}`);
            if (oppVulnerable > 0) arr.push(`🎯${oppVulnerable}`);
            if (oppThorns > 0) arr.push(`🌵${oppThorns}`);
            if (oppReflect) arr.push(`🔮`);
            if (oppEvasion) arr.push(`💨`);
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
        youHand.forEach((cardId, i) => {
            const card = CARDS[cardId];
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
        oppHand.forEach(() => {
            const el = document.createElement('div');
            el.className = 'cb-card card-back';
            DOM.cbOppHandEl.appendChild(el);
        });
    }

    // ============ УРОН ============
    function applyCbDamage(target, amount, bypassShield = false) {
        if (target === 'you') {
            let dmg = amount;
            if (!bypassShield && youShield > 0) {
                const absorbed = Math.min(youShield, dmg);
                youShield -= absorbed;
                dmg -= absorbed;
            }
            if (youVulnerable > 0) dmg = Math.floor(dmg * 1.5);
            youHP = Math.max(0, youHP - dmg);
            return dmg;
        } else {
            let dmg = amount;
            if (!bypassShield && oppShield > 0) {
                const absorbed = Math.min(oppShield, dmg);
                oppShield -= absorbed;
                dmg -= absorbed;
            }
            if (oppVulnerable > 0) dmg = Math.floor(dmg * 1.5);
            oppHP = Math.max(0, oppHP - dmg);
            return dmg;
        }
    }

    function dealCardDamage(attackerIsPlayer, amount) {
        const target = attackerIsPlayer ? 'opp' : 'you';

        // Уклонение блокирует весь урон
        if (target === 'you' && youEvasion) {
            youEvasion = false;
            logCbMessage('💨 Вы уклонились!');
            return 0;
        }
        if (target === 'opp' && oppEvasion) {
            oppEvasion = false;
            logCbMessage('💨 Соперник уклонился!');
            return 0;
        }

        const actualDamage = applyCbDamage(target, amount);
        if (actualDamage <= 0) return actualDamage;

        if (attackerIsPlayer) {
            if (oppReflect) {
                oppReflect = false;
                const reflected = Math.floor(actualDamage / 2);
                if (reflected > 0) {
                    applyCbDamage('you', reflected, true);
                    logCbMessage(`🔮 Соперник отражает ${reflected} урона.`);
                }
            }
            if (oppThorns > 0) {
                const thornsDmg = oppThorns;
                oppThorns = 0;
                applyCbDamage('you', thornsDmg, true);
                logCbMessage(`🌵 Шипы соперника: ${thornsDmg} урона вам.`);
            }
        } else {
            if (youReflect) {
                youReflect = false;
                const reflected = Math.floor(actualDamage / 2);
                if (reflected > 0) {
                    applyCbDamage('opp', reflected, true);
                    logCbMessage(`🔮 Вы отражаете ${reflected} урона.`);
                }
            }
            if (youThorns > 0) {
                const thornsDmg = youThorns;
                youThorns = 0;
                applyCbDamage('opp', thornsDmg, true);
                logCbMessage(`🌵 Ваши шипы: ${thornsDmg} урона сопернику.`);
            }
        }

        return actualDamage;
    }

    // ============ ЭФФЕКТЫ КАРТ ============
    function applyCbCardEffect(card, isPlayer) {
        let actionValue = card.value;

        if (card.type === 'action') {
            if (isPlayer && youAtkBuff > 0) { actionValue += youAtkBuff; youAtkBuff = 0; }
            if (!isPlayer && oppAtkBuff > 0) { actionValue += oppAtkBuff; oppAtkBuff = 0; }
        }

        switch (card.name) {
            case 'Тычок':
            case 'Удар':
            case 'Мощный удар': {
                const dmg = dealCardDamage(isPlayer, actionValue);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: ${card.name} → ${dmg} урона.`);
                break;
            }
            case 'Огненный шар': {
                const dmg = dealCardDamage(isPlayer, actionValue);
                if (isPlayer) oppPoison += 2; else youPoison += 2;
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: ${dmg} урона + поджог.`);
                break;
            }
            case 'Кровотечение': {
                const dmg = dealCardDamage(isPlayer, actionValue);
                if (isPlayer) oppBleed += 3; else youBleed += 3;
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: ${dmg} урона + кровотечение.`);
                break;
            }
            case 'Комбо': {
                let totalDmg = 0;
                for (let i = 0; i < 3; i++) { totalDmg += dealCardDamage(isPlayer, 5); }
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: комбо на ${totalDmg} урона.`);
                break;
            }
            case 'Вампиризм': {
                const dmg = dealCardDamage(isPlayer, actionValue);
                if (isPlayer) youHP = Math.min(100, youHP + 8);
                else oppHP = Math.min(100, oppHP + 8);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: ${dmg} урона, +8 HP.`);
                break;
            }
            case 'Сифон': {
                if (isPlayer) {
                    const removed = Math.min(oppShield, 8);
                    oppShield -= removed;
                    dealCardDamage(true, 5);
                    logCbMessage(`Вы: сняли ${removed} щита и нанесли 5 урона.`);
                } else {
                    const removed = Math.min(youShield, 8);
                    youShield -= removed;
                    dealCardDamage(false, 5);
                    logCbMessage(`Соперник: снял ${removed} щита и нанёс 5 урона.`);
                }
                break;
            }
            case 'Хаос': {
                const roll = 5 + Math.floor(Math.random() * 21); // 5..25
                const dmg = dealCardDamage(isPlayer, roll);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: хаос выкинул ${roll} → ${dmg} урона.`);
                break;
            }
            case 'Возмездие': {
                const myMissing = 100 - (isPlayer ? youHP : oppHP);
                const bonus = 5 + Math.floor(myMissing / 2);
                const dmg = dealCardDamage(isPlayer, bonus);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: возмездие на ${dmg} урона.`);
                break;
            }
            case 'Казнь': {
                const targetHP = isPlayer ? oppHP : youHP;
                const dmg = targetHP < 50 ? 30 : 8;
                dealCardDamage(isPlayer, dmg);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: казнь на ${dmg} урона!`);
                break;
            }
            case 'Ультиматум': {
                dealCardDamage(isPlayer, 25);
                if (isPlayer) youHP = Math.min(100, youHP + 10);
                else oppHP = Math.min(100, oppHP + 10);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: 25 урона и +10 HP.`);
                break;
            }
            case 'Ритуал': {
                if (isPlayer) youHP = Math.max(0, youHP - 8);
                else oppHP = Math.max(0, oppHP - 8);
                dealCardDamage(isPlayer, 20);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: ритуал: -8 HP, 20 урона.`);
                break;
            }
            case 'Лечение':
            case 'Быстрое лечение': {
                if (isPlayer) youHP = Math.min(100, youHP + card.value);
                else oppHP = Math.min(100, oppHP + card.value);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: лечение ${card.value} HP.`);
                break;
            }
            case 'Антидот': {
                if (isPlayer) {
                    const cleansed = youPoison + youBleed;
                    youPoison = 0; youBleed = 0;
                    youHP = Math.min(100, youHP + card.value);
                    logCbMessage(`Вы: антидот (${cleansed} эффектов) +4 HP.`);
                } else {
                    const cleansed = oppPoison + oppBleed;
                    oppPoison = 0; oppBleed = 0;
                    oppHP = Math.min(100, oppHP + card.value);
                    logCbMessage(`Соперник: антидот (${cleansed} эффектов) +4 HP.`);
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
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: благословение +8 HP, +5 щита.`);
                break;
            }
            case 'Блок':
            case 'Барьер': {
                if (isPlayer) youShield += card.value;
                else oppShield += card.value;
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: +${card.value} щита.`);
                break;
            }
            case 'Ярость': {
                if (isPlayer) youAtkBuff += 10;
                else oppAtkBuff += 10;
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: ярость +10 к след. удару.`);
                break;
            }
            case 'Шипы': {
                if (isPlayer) youThorns = card.value;
                else oppThorns = card.value;
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: шипы на ${card.value}.`);
                break;
            }
            case 'Отражение': {
                if (isPlayer) youReflect = true;
                else oppReflect = true;
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: отражение активно.`);
                break;
            }
            case 'Уклонение': {
                if (isPlayer) youEvasion = true;
                else oppEvasion = true;
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: уклонение активно.`);
                break;
            }
            case 'Уязвимость': {
                if (isPlayer) oppVulnerable += 3;
                else youVulnerable += 3;
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: уязвимость +50% урона на 3 х.`);
                break;
            }
            case 'Феникс': {
                const myHP = isPlayer ? youHP : oppHP;
                const heal = myHP < 25 ? (100 - myHP) : 10;
                if (isPlayer) youHP = Math.min(100, youHP + heal);
                else oppHP = Math.min(100, oppHP + heal);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: феникс +${heal} HP.`);
                break;
            }
            default: {
                dealCardDamage(isPlayer, actionValue);
                logCbMessage(`${isPlayer ? 'Вы' : 'Соперник'}: ${actionValue} урона.`);
            }
        }
    }

    function drawCards(hand, count) {
        for (let i = 0; i < count; i++) {
            if (hand.length < 7) hand.push(drawCard());
        }
    }

    // ============ РАЗЫГРЫШ КАРТЫ ============
    function playCbCard(index, isPlayer) {
        if (cbPhase !== 'playing') return;
        if (isPlayer && currentTurn !== 'you') return;
        if (!isPlayer && currentTurn !== 'opp') return;

        const hand = isPlayer ? youHand : oppHand;
        const cardId = hand[index];
        if (!cardId) return;

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
                    logCbMessage('Лимит баффов исчерпан. Ход переходит.');
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
                    cbActionTimer = setTimeout(botCbTurn, 800);
                }
            }
        }
    }

    // ============ ДЕЙСТВИЯ ИГРОКА ============
    function playerDraw() {
        if (cbPhase !== 'playing' || currentTurn !== 'you') return;
        if (youBuffsThisTurn > 0) {
            logCbMessage('❌ Нельзя добрать карты после баффа.');
            return;
        }
        drawCards(youHand, 2);
        logCbMessage('Вы берете 2 карты.');
        renderCardBattle();
        startCbTurn('opp');
    }

    function playerPass() {
        if (cbPhase !== 'playing' || currentTurn !== 'you') return;
        logCbMessage('Вы завершаете ход.');
        startCbTurn('opp');
    }

    // ============ СМЕНА ХОДА ============
    function startCbTurn(actor) {
        currentTurn = actor;
        youBuffsThisTurn = 0;
        oppBuffsThisTurn = 0;

        if (actor === 'you') {
            if (youPoison > 0) { youPoison--; youHP = Math.max(0, youHP - 5); logCbMessage('Яд: -5 HP'); }
            if (youBleed > 0) { youBleed--; youHP = Math.max(0, youHP - 3); logCbMessage('Кровотечение: -3 HP'); }
            if (youVulnerable > 0) youVulnerable--;
        } else {
            if (oppPoison > 0) { oppPoison--; oppHP = Math.max(0, oppHP - 5); logCbMessage('Яд соперника: -5 HP'); }
            if (oppBleed > 0) { oppBleed--; oppHP = Math.max(0, oppHP - 3); logCbMessage('Кровотечение соперника: -3 HP'); }
            if (oppVulnerable > 0) oppVulnerable--;
        }

        renderCardBattle();

        if (youHP <= 0 || oppHP <= 0) { endCardBattle(); return; }

        updateCbStatus();

        if (actor === 'opp') {
            cbActionTimer = setTimeout(botCbTurn, 1400);
        }
    }

    // ====================================================================
    // БОТ: оценка каждой карты в зависимости от сложности
    // ====================================================================
    function scoreCard(cardId, difficulty) {
        const card = CARDS[cardId];
        let score = 0;

        // ========== Лечение ==========
        if (card.name === 'Лечение' || card.name === 'Быстрое лечение') {
            const healAmount = card.value;
            const missingHP = 100 - oppHP;

            if (difficulty === 'novice') {
                // Новичок лечится, когда даже не сильно ранен
                score = oppHP < 75 ? 100 : -100;
            } else if (difficulty === 'amateur') {
                // Любитель лечится, если потерял хотя бы heal HP
                score = missingHP >= healAmount ? 100 : -20;
                if (oppHP < 45) score += 50;
            } else {
                // Эксперт: лечится только если реально выгодно
                if (missingHP >= healAmount * 1.5) score = 120;
                else if (missingHP >= healAmount) score = 50;
                else score = -100;
                if (oppHP < 30) score += 80;
            }
        }

        // ========== Антидот ==========
        else if (card.name === 'Антидот') {
            const dotDamage = oppPoison * 5 + oppBleed * 3;

            if (difficulty === 'novice') {
                score = 50; // Использует даже без отравления — ошибка
            } else if (difficulty === 'amateur') {
                score = dotDamage > 0 ? 100 : -50;
            } else {
                if (dotDamage >= 10) score = 140;
                else if (dotDamage > 0) score = 20;
                else score = -80;
            }
        }

        // ========== Феникс ==========
        else if (card.name === 'Феникс') {
            if (difficulty === 'novice') {
                score = oppHP < 80 ? 80 : -30;
            } else if (difficulty === 'amateur') {
                score = oppHP < 45 ? 400 : -80;
            } else {
                score = oppHP < 25 ? 900 : oppHP < 40 ? 100 : -150;
            }
        }

        // ========== Ярость ==========
        else if (card.name === 'Ярость') {
            const hasStrongAttack = oppHand.some(c => {
                const ca = CARDS[c];
                return ca.type === 'action' && (ca.value || 0) >= 10;
            });
            const alreadyHasRage = oppAtkBuff > 0;

            if (alreadyHasRage) {
                score = -100;
            } else if (hasStrongAttack) {
                if (difficulty === 'novice') score = 10;
                else if (difficulty === 'amateur') score = 60;
                else score = 100;
            } else {
                score = difficulty === 'novice' ? 20 : -50;
            }
        }

        // ========== Защита ==========
        else if (card.name === 'Блок' || card.name === 'Барьер') {
            const alreadyHasShield = oppShield > 0;

            if (difficulty === 'novice') {
                score = !alreadyHasShield ? 40 : -20;
            } else if (difficulty === 'amateur') {
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

        // ========== Благословение ==========
        else if (card.name === 'Благословение') {
            const missingHP = 100 - oppHP;
            if (difficulty === 'novice') {
                score = 40;
            } else if (difficulty === 'amateur') {
                score = missingHP > 15 ? 70 : -10;
            } else {
                score = missingHP > 20 ? 90 : -30;
                if (oppShield === 0 && oppHP < 60) score += 40;
            }
        }

        // ========== Шипы / Отражение ==========
        else if (card.name === 'Шипы') {
            if (oppThorns > 0) score = -100;
            else if (difficulty === 'novice') score = 30;
            else if (difficulty === 'amateur') score = oppHP > 40 ? 50 : 20;
            else score = oppHP > 50 && youHP > 40 ? 70 : 20;
        }

        else if (card.name === 'Отражение') {
            if (oppReflect) score = -100;
            else if (difficulty === 'novice') score = 30;
            else if (difficulty === 'amateur') score = 40;
            else score = oppHP > 40 ? 60 : 10;
        }

        // ========== Уклонение ==========
        else if (card.name === 'Уклонение') {
            if (oppEvasion) score = -100;
            else if (difficulty === 'novice') score = 25;
            else if (difficulty === 'amateur') score = oppHP < 50 ? 80 : 20;
            else score = oppHP < 35 ? 150 : oppHP < 60 ? 60 : -20;
        }

        // ========== Уязвимость ==========
        else if (card.name === 'Уязвимость') {
            if (oppVulnerable > 0) score = -100;
            else if (difficulty === 'novice') score = 20;
            else if (difficulty === 'amateur') score = 30;
            else {
                const hasFollowUp = oppHand.some(c => CARDS[c].type === 'action');
                score = hasFollowUp ? 50 : -20;
            }
        }

        // ========== Атакующие карты ==========
        else if (card.type === 'action') {
            let dmg = card.value || 0;
            if (oppAtkBuff > 0) dmg += oppAtkBuff;

            const effectiveHP = youShield > 0 ? youHP + youShield : youHP;

            // Убийство врага
            if (dmg >= youHP) {
                score = 2000;
                if (difficulty === 'novice') score -= 1500; // новичок не понимает ценности добивания
            } else {
                score = dmg;
            }

            // Спец-карты
            if (card.name === 'Казнь') {
                const realDmg = youHP < 50 ? 30 : 8;
                if (realDmg >= youHP) score = 2500;
                else score = realDmg;
                if (difficulty === 'novice') score = Math.min(score, 20);
            }

            if (card.name === 'Ультиматум') {
                if (25 >= youHP) score = 2400;
                else score = 30;
            }

            if (card.name === 'Хаос') {
                if (difficulty === 'novice') score = 15;
                else if (difficulty === 'amateur') score = 15;
                else score = youHP < 20 ? 30 : 10; // эксперт избегает рандома
            }

            if (card.name === 'Возмездие') {
                const dmgV = 5 + Math.floor((100 - oppHP) / 2);
                if (difficulty === 'novice') score = 15;
                else if (difficulty === 'amateur') score = dmgV * 0.7;
                else score = dmgV;
            }

            if (card.name === 'Сифон') {
                score = youShield > 0 ? 40 + Math.min(youShield, 8) : 10;
            }
        }

        else {
            score = 10;
        }

        // Небольшой рандом для не-эксперта
        if (difficulty === 'novice') score += Math.random() * 50 - 25;
        else if (difficulty === 'amateur') score += Math.random() * 20 - 10;

        return score;
    }

    function pickBotCardIndex() {
        if (oppHand.length === 0) return -1;

        const difficulty = oppDifficulty;

        // Новичок иногда действует абсолютно случайно
        if (difficulty === 'novice' && Math.random() < 0.35) {
            return Math.floor(Math.random() * oppHand.length);
        }

        let bestIdx = 0;
        let bestScore = -Infinity;

        for (let i = 0; i < oppHand.length; i++) {
            const s = scoreCard(oppHand[i], difficulty);
            if (s > bestScore) {
                bestScore = s;
                bestIdx = i;
            }
        }

        // Если лучшая карта совсем плохая — лучше добрать
        const drawThreshold = difficulty === 'expert' ? 5 : difficulty === 'amateur' ? -20 : -60;
        if (bestScore < drawThreshold) return -1;

        return bestIdx;
    }

    // ============ ХОД БОТА ============
    function botCbTurn() {
        if (cbPhase !== 'playing' || currentTurn !== 'opp') return;

        // Если уже сыграл баф — либо второй баф, либо закончить
        if (oppBuffsThisTurn > 0) {
            // Эксперт берёт второй бафф только если он полезен
            let bestBuffIdx = -1;
            let bestBuffScore = -100;
            for (let i = 0; i < oppHand.length; i++) {
                if (CARDS[oppHand[i]].type === 'buff') {
                    const s = scoreCard(oppHand[i], oppDifficulty);
                    if (s > bestBuffScore) {
                        bestBuffScore = s;
                        bestBuffIdx = i;
                    }
                }
            }

            if (oppDifficulty === 'expert' && bestBuffScore > 40 && bestBuffIdx !== -1) {
                playCbCard(bestBuffIdx, false);
                return;
            }
            if (oppDifficulty === 'novice' && bestBuffIdx !== -1 && Math.random() < 0.6) {
                playCbCard(bestBuffIdx, false);
                return;
            }
            if (oppDifficulty === 'amateur' && bestBuffIdx !== -1 && bestBuffScore > 20) {
                playCbCard(bestBuffIdx, false);
                return;
            }

            startCbTurn('you');
            return;
        }

        const idx = pickBotCardIndex();

        if (idx >= 0) {
            playCbCard(idx, false);
        } else {
            drawCards(oppHand, 2);
            logCbMessage('Соперник берет 2 карты.');
            renderCardBattle();
            startCbTurn('you');
        }
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function initCardBattle() {
        youHP = 100; oppHP = 100;
        youShield = 0; oppShield = 0;
        youPoison = 0; oppPoison = 0;
        youBleed = 0; oppBleed = 0;
        youVulnerable = 0; oppVulnerable = 0;
        youAtkBuff = 0; oppAtkBuff = 0;
        youThorns = 0; oppThorns = 0;
        youReflect = false; oppReflect = false;
        youEvasion = false; oppEvasion = false;
        youBuffsThisTurn = 0;
        oppBuffsThisTurn = 0;

        oppDifficulty = pickDifficulty();

        youHand = [drawCard(), drawCard(), drawCard()];
        oppHand = [drawCard(), drawCard(), drawCard()];

        cbPhase = 'playing';
        logMessages = [];
        logCbMessage(`⚔️ Бой начался! Соперник — ${difficultyLabel(oppDifficulty)}`);

        renderCardBattle();

        const first = Math.random() < 0.5 ? 'you' : 'opp';
        startCbTurn(first);
    }

    function endCardBattle() {
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

    // ============ СТАНДАРТНЫЙ ИНТЕРФЕЙС МОДУЛЯ ============
    function prepare(config) {
        DOM.cbArenaEl.style.display = 'block';

        const cg = D.state.currentGame;
        DOM.cbOppNameEl.textContent = cg.opponentName;
        DOM.cbTurnIndicator.textContent = 'Ожидание...';
        DOM.cbTurnIndicator.style.color = '#ffb400';
        DOM.cbLogEl.innerHTML = '';
        DOM.cbYouHandEl.innerHTML = '';
        DOM.cbOppHandEl.innerHTML = '';
        DOM.cbYouHPFill.style.width = '100%';
        DOM.cbOppHPFill.style.width = '100%';
        DOM.cbYouHPText.textContent = '100 / 100';
        DOM.cbOppHPText.textContent = '100 / 100';
        DOM.cbPlayerActions.style.display = 'none';
    }

    function start() {
        DOM.rollBtn.style.display = 'none';
        D.state.isRolling = true;
        initCardBattle();
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
        }
    };
})();