document.addEventListener('DOMContentLoaded', function () {
    const depBtn = document.getElementById('depBtn');
    const depOverlay = document.getElementById('dep-overlay');
    const depBlock = document.getElementById('dep-block');
    const closeDepBtn = document.getElementById('closeDepBtn');
    const confirmDepBtn = document.getElementById('confirmDepBtn');
    const balHeader = document.getElementById('bal-header');

    if (!depBtn || !depOverlay || !depBlock || !closeDepBtn || !confirmDepBtn || !balHeader) {
        console.error('Не найдены необходимые элементы для работы депозита');
        return;
    }

    const depAmountInput = document.getElementById('depAmount');
    const cardNumberInput = document.getElementById('cardNumber');
    const cardCvvInput = document.getElementById('cardCvv');
    const cardExpiryInput = document.getElementById('cardExpiry');

    // Глобальный баланс (совместно с crash.js)
    if (typeof window.globalBalance === 'undefined') {
        // Пытаемся загрузить баланс из localStorage
        const savedBalance = localStorage.getItem('userBalance');
        if (savedBalance !== null && !isNaN(parseFloat(savedBalance))) {
            window.globalBalance = parseFloat(savedBalance);
            console.log('Баланс загружен из localStorage:', window.globalBalance);
        } else {
            window.globalBalance = 0; // Начальный баланс
            console.log('Нет сохраненного баланса, устанавливаем 0');
        }
    }

    // Обновляем отображение баланса при загрузке
    updateBalanceDisplay();

    // Функция сохранения баланса в localStorage
    function saveBalanceToStorage() {
        try {
            localStorage.setItem('userBalance', window.globalBalance.toString());
            console.log('Баланс сохранен в localStorage:', window.globalBalance);
        } catch (error) {
            console.error('Ошибка сохранения баланса в localStorage:', error);
        }
    }

    // Прокси для отслеживания изменений глобального баланса
    let globalBalanceProxy = window.globalBalance;

    // Создаем геттер и сеттер для window.globalBalance
    Object.defineProperty(window, 'globalBalance', {
        get: function () {
            return globalBalanceProxy;
        },
        set: function (value) {
            const oldValue = globalBalanceProxy;
            globalBalanceProxy = parseFloat(value) || 0;

            // Сохраняем в localStorage при каждом изменении
            if (oldValue !== globalBalanceProxy) {
                console.log('Баланс изменен с', oldValue, 'на', globalBalanceProxy);
                saveBalanceToStorage();
                updateBalanceDisplay();
            }
        },
        configurable: true,
        enumerable: true
    });

    // Открытие окна пополнения
    depBtn.addEventListener('click', function (e) {
        e.preventDefault();
        depOverlay.style.display = 'block';
        depBlock.style.display = 'block';
        resetDepositForm();
    });

    // Закрытие окна пополнения
    closeDepBtn.addEventListener('click', function () {
        depOverlay.style.display = 'none';
        depBlock.style.display = 'none';
    });

    // Клик по оверлею тоже закрывает окно
    depOverlay.addEventListener('click', function () {
        depOverlay.style.display = 'none';
        depBlock.style.display = 'none';
    });

    // Подтверждение пополнения
    confirmDepBtn.addEventListener('click', function () {
        console.log('Подтверждение пополнения');
        processDeposit();
    });

    // Валидация ввода карты
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function () {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 16) value = value.substring(0, 16);

            // Форматирование с пробелами
            let formatted = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formatted += ' ';
                }
                formatted += value[i];
            }
            this.value = formatted;
        });
    }

    // Валидация CVV
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').substring(0, 3);
        });
    }

    // Валидация срока действия
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function () {
            let value = this.value.replace(/[^\d]/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value.substring(0, 5);
        });
    }

    // Функции

    function resetDepositForm() {
        if (depAmountInput) depAmountInput.value = '';
        if (cardNumberInput) cardNumberInput.value = '';
        if (cardCvvInput) cardCvvInput.value = '';
        if (cardExpiryInput) cardExpiryInput.value = '';
        if (depAmountInput) depAmountInput.focus();
    }

    function validateDepositForm() {
        if (!depAmountInput || !cardNumberInput || !cardCvvInput || !cardExpiryInput) {
            alert('Ошибка формы');
            return false;
        }

        const amount = parseFloat(depAmountInput.value);
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        const cvv = cardCvvInput.value;
        const expiry = cardExpiryInput.value;

        // Проверка суммы
        if (!amount || isNaN(amount) || amount < 10 || amount > 10000) {
            alert('Введена некорректная сумма или на карте недостаточный баланс.');
            return false;
        }

        // Проверка номера карты
        if (cardNumber.length !== 16) {
            alert('Введите корректный 16-значный номер карты');
            return false;
        }

        // Проверка CVV
        if (cvv.length !== 3) {
            alert('Введите корректный 3-значный CVV код');
            return false;
        }

        // Проверка срока действия
        if (!/^\d{2}\/\d{2}$/.test(expiry)) {
            alert('Введите срок действия в формате ММ/ГГ');
            return false;
        }

        // Проверка месяца (должен быть от 01 до 12)
        const month = parseInt(expiry.substring(0, 2));
        if (month < 1 || month > 12) {
            alert('Месяц должен быть от 01 до 12');
            return false;
        }

        return true;
    }

    function processDeposit() {
        if (!validateDepositForm()) {
            return;
        }

        const amount = parseFloat(depAmountInput.value);

        // Показываем сообщение о обработке
        alert(`Обрабатываем платеж на ${amount} ₽...`);

        // Имитация задержки
        setTimeout(() => {
            // Успешное пополнение - изменение через setter автоматически сохранится
            window.globalBalance += amount;

            // Обновляем отображение (уже сделано в setter)

            // Добавляем в историю
            addBalanceHistory(amount, 'Пополнение');

            // Закрываем окно
            depOverlay.style.display = 'none';
            depBlock.style.display = 'none';

            // Показываем успешное сообщение
            alert(`✅ Баланс успешно пополнен на ${amount.toFixed(2)} ₽\n💳 Текущий баланс: ${window.globalBalance.toFixed(2)} ₽`);

        }, 1000);
    }

    function updateBalanceDisplay() {
        // Обновляем текст в элементе баланса
        balHeader.textContent = window.globalBalance.toFixed(2);

        // Также обновляем все элементы с классом balance-display на странице
        const allBalanceElements = document.querySelectorAll('.balance-display, [data-balance]');
        allBalanceElements.forEach(element => {
            element.textContent = window.globalBalance.toFixed(2);
        });
    }

    function addBalanceHistory(amount, type) {
        const historyContainer = document.getElementById('hb');
        if (!historyContainer) return;

        const historyItem = document.createElement('div');
        historyItem.className = 'hb';

        const timestamp = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        historyItem.innerHTML = `
            <span style="color: #4CAF50; font-weight: bold;">+${amount.toFixed(2)} ₽</span> 
            (${type}) 
            <span style="color: orange;">→ ${window.globalBalance.toFixed(2)} ₽</span>
            <span style="color: #888; font-size: 14px; margin-left: 10px;">${timestamp}</span>
        `;
        historyItem.style.borderLeftColor = '#4CAF50';

        historyContainer.insertBefore(historyItem, historyContainer.firstChild);

        // Ограничиваем историю
        const maxHistoryItems = 10;
        while (historyContainer.children.length > maxHistoryItems) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }

    // Функция для безопасного изменения баланса (может использоваться другими скриптами)
    window.safeUpdateBalance = function (amount, operation = 'add') {
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error('Некорректная сумма для обновления баланса:', amount);
            return false;
        }

        const oldBalance = window.globalBalance;

        if (operation === 'add') {
            window.globalBalance += amount;
        } else if (operation === 'subtract') {
            window.globalBalance -= amount;
        } else if (operation === 'set') {
            window.globalBalance = amount;
        } else {
            console.error('Некорректная операция:', operation);
            return false;
        }

        console.log(`Баланс ${operation === 'add' ? 'увеличен' : operation === 'subtract' ? 'уменьшен' : 'установлен'} с ${oldBalance} на ${window.globalBalance}`);
        return true;
    };

    // Функция для получения текущего баланса (может использоваться другими скриптами)
    window.getGlobalBalance = function () {
        return window.globalBalance;
    };

    // Функция для принудительного сохранения баланса
    window.forceSaveBalance = function () {
        saveBalanceToStorage();
        return window.globalBalance;
    };

    // Функция для сброса баланса (для отладки)
    window.resetBalance = function () {
        if (confirm('Вы уверены, что хотите сбросить баланс к 0?')) {
            window.globalBalance = 0;
            alert('Баланс сброшен к 0');
        }
    };

    // Слушатель для обновления баланса при изменениях в других скриптах
    if (balHeader) {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    // Если баланс изменился извне, обновляем глобальную переменную
                    const newBalance = parseFloat(balHeader.textContent);
                    if (!isNaN(newBalance) && newBalance !== window.globalBalance) {
                        console.log('Баланс изменен извне в элементе, обновляем глобальную переменную:', newBalance);
                        window.globalBalance = newBalance;
                    }
                }
            });
        });

        observer.observe(balHeader, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }

    // Также отслеживаем изменения баланса через интервал для надежности
    let lastKnownBalance = window.globalBalance;
    setInterval(() => {
        if (window.globalBalance !== lastKnownBalance) {
            console.log('Обнаружено изменение баланса через интервал:', lastKnownBalance, '->', window.globalBalance);
            lastKnownBalance = window.globalBalance;
            // Автоматически сохраняется через setter
        }

        // Проверяем элемент баланса на странице
        const displayedBalance = parseFloat(balHeader.textContent);
        if (!isNaN(displayedBalance) && displayedBalance !== window.globalBalance) {
            console.log('Расхождение баланса в элементе:', displayedBalance, 'глобальный:', window.globalBalance);
            // Синхронизируем
            balHeader.textContent = window.globalBalance.toFixed(2);
        }
    }, 1000);

    // Сохраняем баланс при закрытии страницы
    window.addEventListener('beforeunload', function () {
        console.log('Страница закрывается, сохраняем баланс:', window.globalBalance);
        saveBalanceToStorage();
    });

    // Сохраняем баланс при изменении видимости страницы
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            console.log('Страница скрыта, сохраняем баланс:', window.globalBalance);
            saveBalanceToStorage();
        }
    });

    // Инициализация
    console.log('Скрипт депозита загружен. Текущий баланс:', window.globalBalance);
});
