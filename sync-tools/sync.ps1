# ============================================
#   Git Sync — меню управления проектом (Windows 11)
# ============================================

# Скрипт лежит в подпапке — поднимаемся на уровень выше, в корень проекта
Set-Location -Path (Split-Path $PSScriptRoot -Parent)

# --- Проверка, что мы в git-репозитории ---
if (-not (Test-Path ".git")) {
    Write-Host "❌ Эта папка не является git-репозиторием." -ForegroundColor Red
    Write-Host "Сначала выполни: git init && git remote add origin <URL>"
    Read-Host "Нажми Enter для выхода"
    exit 1
}

$RepoRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$RepoRoot\.git")) {
    Write-Host "[X] Не найден .git в родительской папке." -ForegroundColor Red
    Write-Host "Ожидался репозиторий в: $RepoRoot"
    Read-Host "Нажми Enter для выхода"
    exit 1
}
Set-Location -Path $RepoRoot

# Определяем текущую ветку
$Branch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $Branch) {
    Write-Host "❌ Не удалось определить ветку." -ForegroundColor Red
    Read-Host "Нажми Enter для выхода"
    exit 1
}

# ============================================
#   Функция 1: Скачать (pull) с GitHub
# ============================================
function Pull-Changes {
    Write-Host ""
    Write-Host "⬇️  Скачиваю изменения с GitHub (ветка: $Branch)..." -ForegroundColor Cyan
    Write-Host ""

    $hasChanges = git status --porcelain
    $stashed = $false

    if ($hasChanges) {
        Write-Host "⚠️  Есть локальные изменения." -ForegroundColor Yellow
        $ans = Read-Host "Спрятать их (stash) и продолжить? [y/N]"
        if ($ans -match '^[Yy]') {
            git stash push -u -m "auto-stash $(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
            $stashed = $true
        } else {
            Write-Host "Отменено." -ForegroundColor Red
            return
        }
    }

    git pull origin $Branch

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Изменения успешно загружены." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Ошибка при git pull. Проверь конфликты." -ForegroundColor Red
    }

    if ($stashed) {
        Write-Host ""
        Write-Host "↩️  Возвращаю локальные изменения из stash..." -ForegroundColor Yellow
        git stash pop
    }
}

# ============================================
#   Функция 2: Загрузить (push) на GitHub
# ============================================
function Push-Changes {
    Write-Host ""
    Write-Host "📋 Что изменилось:" -ForegroundColor Cyan
    git status --short
    Write-Host ""

    $hasChanges = git status --porcelain

    if (-not $hasChanges) {
        # Может, есть незапушенные коммиты?
        $ahead = git rev-list --count "origin/$Branch..$Branch" 2>$null
        if ([int]$ahead -gt 0) {
            Write-Host "📤 Локальных изменений нет, но есть $ahead незапушенных коммитов." -ForegroundColor Yellow
            $ans = Read-Host "Отправить их на GitHub? [y/N]"
            if ($ans -match '^[Yy]') {
                git push origin $Branch
            }
        } else {
            Write-Host "✨ Нечего загружать — всё синхронизировано." -ForegroundColor Green
        }
        return
    }

    $msg = Read-Host "Сообщение коммита (Enter = авто 'update <дата>')"
    if ([string]::IsNullOrWhiteSpace($msg)) {
        $msg = "update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }

    git add .
    git commit -m $msg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Не удалось создать коммит." -ForegroundColor Red
        return
    }

    Write-Host ""
    Write-Host "⬆️  Отправляю на GitHub..." -ForegroundColor Cyan
    git push origin $Branch

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Успешно загружено на GitHub!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Ошибка при push. Возможно, сначала нужен pull." -ForegroundColor Red
    }
}

# ============================================
#   Функция 3: Статус
# ============================================
function Show-Status {
    Write-Host ""
    Write-Host "📊 Статус репозитория" -ForegroundColor Cyan
    Write-Host "Ветка: $Branch"
    Write-Host ""
    git status
    Write-Host ""
    Write-Host "Последние 5 коммитов:" -ForegroundColor Cyan
    git log --oneline -5
}

# ============================================
#   Главное меню
# ============================================
while ($true) {
    Clear-Host
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║         Git Sync — BetterX             ║" -ForegroundColor Magenta
    Write-Host "╠════════════════════════════════════════╣" -ForegroundColor Magenta
    Write-Host "║  1) ⬇️  Скачать обновления с GitHub     ║" -ForegroundColor White
    Write-Host "║  2) ⬆️  Загрузить изменения на GitHub   ║" -ForegroundColor White
    Write-Host "║  3) 📊 Показать статус                  ║" -ForegroundColor White
    Write-Host "║  4) 🚪 Выход                            ║" -ForegroundColor White
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""

    $choice = Read-Host "Выбери пункт [1-4]"

    switch ($choice) {
        "1" { Pull-Changes }
        "2" { Push-Changes }
        "3" { Show-Status }
        "4" { Write-Host "Пока! 👋"; exit 0 }
        default { Write-Host "Неверный выбор." -ForegroundColor Red }
    }

    Write-Host ""
    Read-Host "Нажми Enter, чтобы вернуться в меню"
}