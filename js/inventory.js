// Скрипт для управления инвентарем

document.addEventListener('DOMContentLoaded', function () {
    // ВАЖНО: Всегда гарантируем, что window.inventory - это массив
    if (typeof window.inventory === 'undefined' || !Array.isArray(window.inventory)) {
        console.log('Инициализируем window.inventory как массив');
        window.inventory = [];
    }

    // Инициализируем глобальный баланс если не существует
    if (typeof window.globalBalance === 'undefined') {
        const balanceSpan = document.getElementById('bal-header');
        if (balanceSpan) {
            window.globalBalance = parseFloat(balanceSpan.textContent) || 0;
        } else {
            window.globalBalance = 0;
        }
    }

    // Загружаем инвентарь из localStorage
    loadInventoryFromStorage();

    // Обновляем отображение инвентаря если он виден
    updateInventoryDisplay();
    updateInventoryTotalValue();

    // Функция загрузки инвентаря из localStorage
    function loadInventoryFromStorage() {
        try {
            const savedInventory = localStorage.getItem('inventory');
            if (savedInventory) {
                const parsed = JSON.parse(savedInventory);
                // Гарантируем, что это массив
                if (Array.isArray(parsed)) {
                    window.inventory = parsed;
                    console.log('Инвентарь загружен из localStorage:', window.inventory.length, 'предметов');
                } else {
                    console.warn('Данные в localStorage не являются массивом, сбрасываем инвентарь');
                    window.inventory = [];
                    saveInventoryToStorage(); // Сохраняем правильный массив
                }
            } else {
                console.log('Нет сохраненного инвентаря в localStorage');
            }
        } catch (error) {
            console.error('Ошибка загрузки инвентаря из localStorage:', error);
            // В случае ошибки гарантируем, что inventory - массив
            window.inventory = [];
            saveInventoryToStorage();
        }
    }

    // Функция сохранения инвентаря в localStorage
    function saveInventoryToStorage() {
        try {
            // Гарантируем, что сохраняем массив
            if (!Array.isArray(window.inventory)) {
                console.warn('window.inventory не массив при сохранении, сбрасываем');
                window.inventory = [];
            }
            localStorage.setItem('inventory', JSON.stringify(window.inventory));
            console.log('Инвентарь сохранен в localStorage');
        } catch (error) {
            console.error('Ошибка сохранения инвентаря в localStorage:', error);
        }
    }

    // Функция обновления отображения инвентаря
    function updateInventoryDisplay() {
        const inventoryBlock = document.getElementById('m-inventory');
        if (!inventoryBlock) return;

        // Проверяем, виден ли инвентарь
        if (inventoryBlock.style.display === 'none') {
            return;
        }

        // Создаем контейнер для предметов если его нет
        let itemsContainer = inventoryBlock.querySelector('.inventory-items-container');
        if (!itemsContainer) {
            itemsContainer = document.createElement('div');
            itemsContainer.className = 'inventory-items-container';
            itemsContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
                padding: 20px;
                margin-top: 20px;
            `;

            // Добавляем заголовок
            const itemsHeader = document.createElement('div');
            itemsHeader.style.cssText = `
                grid-column: 1 / -1;
                color: #fff;
                font-size: 24px;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            `;
            // Гарантируем, что используем массив
            const itemCount = Array.isArray(window.inventory) ? window.inventory.length : 0;
            itemsHeader.innerHTML = `<strong>Ваши предметы (${itemCount}):</strong>`;
            itemsContainer.appendChild(itemsHeader);

            inventoryBlock.appendChild(itemsContainer);
        } else {
            // Очищаем существующий контейнер кроме заголовка
            const header = itemsContainer.querySelector(':first-child');
            itemsContainer.innerHTML = '';
            if (header) itemsContainer.appendChild(header);
        }

        // Гарантируем, что inventory - массив
        if (!Array.isArray(window.inventory)) {
            console.error('window.inventory не является массивом в updateInventoryDisplay');
            window.inventory = [];
        }

        // Если инвентарь пуст
        if (window.inventory.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                padding: 50px;
                color: #888;
                font-size: 20px;
            `;
            emptyMessage.textContent = 'В инвентаре пока нет предметов';
            itemsContainer.appendChild(emptyMessage);
            return;
        }

        // Добавляем предметы
        window.inventory.forEach(item => {
            const itemElement = createInventoryItemElement(item);
            itemsContainer.appendChild(itemElement);
        });
    }

    // Функция создания элемента предмета
    function createInventoryItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.dataset.itemId = item.id;
        itemElement.style.cssText = `
            background: rgba(40, 40, 50, 0.8);
            border-radius: 15px;
            border: 2px solid ${getBorderColorByTier(item.tier)};
            padding: 15px;
            text-align: center;
            position: relative;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        `;

        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width: 100px; height: 100px; object-fit: contain; margin-bottom: 10px;">
            <p style="color: ${getTextColorByTier(item.tier)}; font-size: 16px; margin: 5px 0;">${item.name}</p>
            <p style="color: #4CAF50; font-weight: bold; margin: 5px 0;">${item.price.toLocaleString('ru-RU')} ₽</p>
            <p style="color: #888; font-size: 12px; margin: 5px 0;">${item.date} ${item.time}</p>
            <button class="sell-item-btn" style="
                background: linear-gradient(45deg, #ff7e33, #ffb400);
                color: black;
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 10px;
                width: 100%;
            ">Продать</button>
        `;

        // Добавляем анимацию для редких предметов
        if (item.tier === 'tier4' || item.tier === 'tier5') {
            itemElement.style.animation = 'itemGlowItems 2s infinite';
        }

        // Обработчик наведения
        itemElement.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
        });

        itemElement.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });

        // Обработчик продажи
        const sellBtn = itemElement.querySelector('.sell-item-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                sellInventoryItem(item.id);
            });
        }

        return itemElement;
    }

    // Функция продажи предмета из инвентаря
    function sellInventoryItem(itemId) {
        // Гарантируем, что inventory - массив
        if (!Array.isArray(window.inventory)) {
            console.error('window.inventory не является массивом в sellInventoryItem');
            window.inventory = [];
        }

        const item = window.inventory.find(item => item.id === itemId);
        if (!item) return;

        if (confirm(`Продать "${item.name}" за ${item.price.toLocaleString('ru-RU')} ₽?`)) {
            // Добавляем деньги на баланс
            window.globalBalance += item.price;
            updateBalanceDisplay();

            // Удаляем предмет из инвентаря
            removeItemFromInventory(itemId);

            // Показываем сообщение
            showCustomAlert(`Предмет продан за ${item.price.toLocaleString('ru-RU')} ₽!`, 'success');
        }
    }

    // Функция удаления предмета из инвентаря
    function removeItemFromInventory(itemId) {
        // Гарантируем, что inventory - массив
        if (!Array.isArray(window.inventory)) {
            console.error('window.inventory не является массивом в removeItemFromInventory');
            window.inventory = [];
        }

        const index = window.inventory.findIndex(item => item.id === itemId);
        if (index !== -1) {
            window.inventory.splice(index, 1);
            updateInventoryDisplay();
            updateInventoryTotalValue();
            saveInventoryToStorage();
            return true;
        }
        return false;
    }

    // Функция обновления общей стоимости инвентаря
    function updateInventoryTotalValue() {
        const rubElement = document.getElementById('rub');
        if (!rubElement) return;

        // Гарантируем, что inventory - массив
        if (!Array.isArray(window.inventory)) {
            console.error('window.inventory не является массивом в updateInventoryTotalValue, сбрасываем');
            window.inventory = [];
            rubElement.textContent = '0';
            return;
        }

        let totalValue = 0;
        window.inventory.forEach(item => {
            totalValue += item.price;
        });

        rubElement.textContent = totalValue.toLocaleString('ru-RU');
    }

    // Функция обновления баланса
    function updateBalanceDisplay() {
        const balanceSpan = document.getElementById('bal-header');
        if (balanceSpan) {
            balanceSpan.textContent = window.globalBalance.toFixed(2);
        }
    }

    // Функция отображения кастомного алерта
    function showCustomAlert(message, type = 'info') {
        // Удаляем старые алерты
        const oldAlerts = document.querySelectorAll('.custom-alert');
        oldAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = 'custom-alert';
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(76, 175, 80, 0.95)' : 'rgba(33, 150, 243, 0.95)'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-family: 'Noto Sans', sans-serif;
            max-width: 400px;
            word-wrap: break-word;
        `;

        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    document.body.removeChild(alertDiv);
                }
            }, 300);
        }, 3000);
    }

    // Вспомогательные функции для получения цветов
    function getBorderColorByTier(tier) {
        const colors = {
            'tier1': '#3880ec',
            'tier2': '#7e1a7e',
            'tier3': '#f14df1',
            'tier4': '#dd3131',
            'tier5': '#f7f723'
        };
        return colors[tier] || '#888';
    }

    function getTextColorByTier(tier) {
        const colors = {
            'tier1': '#64b5f6',
            'tier2': '#ab47bc',
            'tier3': '#f48fb1',
            'tier4': '#ef5350',
            'tier5': '#fff176'
        };
        return colors[tier] || '#fff';
    }

    // Экспортируем функции для использования в других скриптах
    window.InventoryManager = {
        addItem: function (name, image, tier, price) {
            // Гарантируем, что inventory - массив
            if (!Array.isArray(window.inventory)) {
                console.warn('window.inventory не массив в addItem, исправляем');
                window.inventory = [];
            }

            const newItem = {
                id: Date.now() + Math.random(),
                name: name,
                image: image,
                tier: tier,
                price: price || 1000,
                date: new Date().toLocaleDateString('ru-RU'),
                time: new Date().toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };

            window.inventory.push(newItem);
            updateInventoryDisplay();
            updateInventoryTotalValue();
            saveInventoryToStorage();

            console.log('Предмет добавлен в инвентарь:', newItem);
            return newItem;
        },

        removeItem: function (itemId) {
            return removeItemFromInventory(itemId);
        },

        getInventory: function () {
            // Гарантируем, что возвращаем массив
            if (!Array.isArray(window.inventory)) {
                window.inventory = [];
            }
            return [...window.inventory];
        },

        getTotalValue: function () {
            if (!Array.isArray(window.inventory)) {
                return 0;
            }

            let total = 0;
            window.inventory.forEach(item => {
                total += item.price;
            });
            return total;
        },

        updateDisplay: function () {
            updateInventoryDisplay();
            updateInventoryTotalValue();
        },

        // Гарантировать что inventory - массив
        ensureArray: function () {
            if (!Array.isArray(window.inventory)) {
                console.warn('Исправляем window.inventory на массив');
                window.inventory = [];
                saveInventoryToStorage();
            }
            return window.inventory;
        }
    };

    // Обновляем отображение при переключении на инвентарь
    const inventoryBtn = document.getElementById('inventory');
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', function () {
            // Гарантируем, что inventory - массив перед обновлением
            window.InventoryManager.ensureArray();

            // Обновляем отображение с задержкой для уверенности
            setTimeout(() => {
                updateInventoryDisplay();
                updateInventoryTotalValue();
            }, 100);
        });
    }
});