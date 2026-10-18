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
    const caseGamesBlock = document.getElementById('case-games');

    // Показываем каталог по умолчанию при загрузке
    showCatalog();

    // Обработчик для кнопки "Инвентарь"
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showInventory();
        });
    }

    // Обработчик для кнопки "Каталог"
    if (catalogBtn) {
        catalogBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showCatalog();
        });
    }

    // Обработчик для кликов по кейсам в каталоге
    const caseLinks = document.querySelectorAll('#case-choose .block-choose');
    caseLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const caseIdDiv = this.querySelector('div');
            if (!caseIdDiv) return;
            
            const caseId = caseIdDiv.id.replace('block-', '');

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
        if (inventoryBlock) {
            inventoryBlock.style.display = 'block';
            animateBlock(inventoryBlock);
        }
        updateActiveButton('inventory');
        document.dispatchEvent(new Event('inventory:shown'));
    }

    // Функция показа каталога
    function showCatalog() {
        hideAllBlocks();
        if (catalogBlock) {
            catalogBlock.style.display = 'block';
            animateBlock(catalogBlock);
        }
        updateActiveButton('catalog');
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
            animateBlock(caseBlock);
            addBackButtonToCase(caseBlock, caseTitle);
        } else {
            showCatalog();
        }
        updateActiveButton(null);
    }

    // Функция скрытия всех блоков
    function hideAllBlocks() {
        const blocks = [
            catalogBlock,
            inventoryBlock,
            caseMoneyBlock,
            caseItemsBlock,
            caseCs2Block,
            caseGamesBlock
        ];

        blocks.forEach(block => {
            if (block) {
                block.style.display = 'none';
            }
        });
    }

    // Функция обновления активной кнопки навигации
    function updateActiveButton(activeButton) {
        const inventoryLink = inventoryBtn ? inventoryBtn.querySelector('a') : null;
        const catalogLink = catalogBtn ? catalogBtn.querySelector('a') : null;

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

    // Функция добавления кнопки "Назад в каталог" (БЕЗ ИНЛАЙН-СТИЛЕЙ)
    function addBackButtonToCase(caseBlock, caseTitle) {
        const existingButton = caseBlock.querySelector('.back-to-catalog');
        if (existingButton) {
            existingButton.remove();
        }

        const backButton = document.createElement('button');
        backButton.className = 'back-to-catalog';
        backButton.innerHTML = '← Назад в каталог';
        // Стили задаются в CSS файле

        backButton.addEventListener('click', function (e) {
            e.preventDefault();
            showCatalog();
        });

        caseBlock.insertBefore(backButton, caseBlock.firstChild);
    }
});