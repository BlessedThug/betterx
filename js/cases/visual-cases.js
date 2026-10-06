// Скрипт для управления отображением блоков каталога, инвентаря и кейсов

document.addEventListener('DOMContentLoaded', function () {
    // Получаем элементы навигации
    const inventoryBtn = document.getElementById('inventory');
    const catalogBtn = document.getElementById('catalog');

    // Получаем блоки контента
    const catalogBlock = document.getElementById('m-catalog');
    const inventoryBlock = document.getElementById('m-inventory');
    const caseMoneyBlock = document.getElementById('case-money');
    const caseItemsBlock = document.getElementById('case-items');
    const caseCs2Block = document.getElementById('case-cs2');
    const caseGamesBlock = document.getElementById('case-games'); // NEW

    // Показываем каталог по умолчанию при загрузке
    showCatalog();

    // Обработчик для кнопки "Инвентарь"
    inventoryBtn.addEventListener('click', function (e) {
        e.preventDefault();
        showInventory();
    });

    // Обработчик для кнопки "Каталог"
    catalogBtn.addEventListener('click', function (e) {
        e.preventDefault();
        showCatalog();
    });

    // Обработчик для кликов по кейсам в каталоге
    const caseLinks = document.querySelectorAll('#case-choose .block-choose');
    caseLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const caseId = this.querySelector('div').id.replace('block-', '');

            if (caseId === 'money') {
                showCase('money');
            } else if (caseId === 'items') {
                showCase('items');
            } else if (caseId === 'games') {
                showCase('games');
            } else if (caseId === 'cs2') {
                showCase('cs2');
            }
        });
    });

    // Функция показа инвентаря
    function showInventory() {
        hideAllBlocks();
        inventoryBlock.style.display = 'block';
        updateActiveButton('inventory');
        animateBlock(inventoryBlock);

        // Обновляем отображение инвентаря после показа
        // (какой-то из кейсов должен предоставить функцию, либо используем событие)
        document.dispatchEvent(new Event('inventory:shown'));
    }

    // Функция показа каталога
    function showCatalog() {
        hideAllBlocks();
        catalogBlock.style.display = 'block';
        updateActiveButton('catalog');
        animateBlock(catalogBlock);
    }

    // Функция показа конкретного кейса
    function showCase(caseType) {
        hideAllBlocks();

        let caseBlock;
        let caseTitle;

        switch (caseType) {
            case 'money':
                caseBlock = caseMoneyBlock;
                caseTitle = 'Денежный кейс';
                break;
            case 'items':
                caseBlock = caseItemsBlock;
                caseTitle = 'Предметный кейс';
                break;
            case 'games':
                caseBlock = caseGamesBlock;
                caseTitle = 'Игровой кейс';
                break;
            case 'cs2':
                caseBlock = caseCs2Block;
                caseTitle = 'Кейс COUNTER STRIKE 2';
                break;
            default:
                caseBlock = caseMoneyBlock;
                caseTitle = 'Денежный кейс';
        }

        if (caseBlock) {
            caseBlock.style.display = 'block';
            updateActiveButton(null);
            animateBlock(caseBlock);
            addBackButtonToCase(caseBlock, caseTitle);
        } else {
            showCatalog();
        }
    }

    // Функция скрытия всех блоков
    function hideAllBlocks() {
        const blocks = [
            catalogBlock,
            inventoryBlock,
            caseMoneyBlock,
            caseItemsBlock,
            caseCs2Block,
            caseGamesBlock // NEW
        ];

        blocks.forEach(block => {
            if (block) {
                block.style.display = 'none';
            }
        });
    }

    // Функция обновления активной кнопки навигации
    function updateActiveButton(activeButton) {
        const inventoryLink = inventoryBtn.querySelector('a');
        const catalogLink = catalogBtn.querySelector('a');

        if (inventoryLink) inventoryLink.classList.remove('active');
        if (catalogLink) catalogLink.classList.remove('active');

        if (activeButton === 'inventory' && inventoryLink) {
            inventoryLink.classList.add('active');
        } else if (activeButton === 'catalog' && catalogLink) {
            catalogLink.classList.add('active');
        }
    }

    // Функция анимации появления блока
    function animateBlock(block) {
        if (!block) return;

        block.style.opacity = '0';
        block.style.transform = 'translateY(10px)';

        setTimeout(() => {
            block.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            block.style.opacity = '1';
            block.style.transform = 'translateY(0)';
        }, 10);
    }

    // Функция добавления кнопки "Назад в каталог"
    function addBackButtonToCase(caseBlock, caseTitle) {
        const existingButton = caseBlock.querySelector('.back-to-catalog');
        if (existingButton) {
            existingButton.remove();
        }

        const backButton = document.createElement('button');
        backButton.className = 'back-to-catalog';
        backButton.innerHTML = '← Назад в каталог';
        backButton.style.cssText = `
            position: absolute;
            top: 30px;
            left: 30px;
            background: rgba(255, 165, 0, 0.2);
            color: orange;
            border: 2px solid rgba(255, 165, 0, 0.4);
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            z-index: 10;
        `;

        backButton.addEventListener('mouseenter', function () {
            this.style.background = 'rgba(255, 165, 0, 0.3)';
            this.style.transform = 'translateX(-5px)';
        });

        backButton.addEventListener('mouseleave', function () {
            this.style.background = 'rgba(255, 165, 0, 0.2)';
            this.style.transform = 'translateX(0)';
        });

        backButton.addEventListener('click', function (e) {
            e.preventDefault();
            showCatalog();
        });

        caseBlock.insertBefore(backButton, caseBlock.firstChild);
    }
});