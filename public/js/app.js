document.addEventListener('DOMContentLoaded', function() {
    // Определяем, мобильное ли устройство
    const isMobile = window.innerWidth < 768;
    
    // Настройка темной темы
    setupThemeToggle();
    
    // Настройка поиска
    setupSearch();
    
    // Анимация элементов логов
    animateLogEntries();
    
    // Дополнительные настройки для мобильных устройств
    if (isMobile) {
        setupMobileEnhancements();
    }
    
    // Настройка серверного события для обновления данных
    setupServerSentEvents();
});

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeBtn = document.getElementById('mobile-theme-btn');
    const body = document.body;
    
    // Загружаем тему из localStorage
    const currentTheme = localStorage.getItem('theme') || 'light';
    body.classList.toggle('dark-mode', currentTheme === 'dark');
    
    // Обновляем иконки темы
    updateThemeIcon(currentTheme === 'dark');
    
    // Добавляем обработчик события на основную кнопку темы
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const isDark = body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }
    
    // Добавляем обработчик события на мобильную кнопку темы
    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', function() {
            const isDark = body.classList.contains('dark-mode');
            // Обновляем иконку на мобильной кнопке
            mobileThemeBtn.querySelector('i').className = isDark
                ? 'fas fa-moon text-xl'
                : 'fas fa-sun text-xl text-yellow-500';
        });
    }
}

function updateThemeIcon(isDark) {
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeBtn = document.getElementById('mobile-theme-btn');
    
    if (themeToggle) {
        themeToggle.innerHTML = isDark
            ? '<i class="fas fa-sun text-yellow-500"></i>'
            : '<i class="fas fa-moon text-gray-600"></i>';
    }
    
    if (mobileThemeBtn) {
        const icon = mobileThemeBtn.querySelector('i');
        if (icon) {
            icon.className = isDark 
                ? 'fas fa-sun text-xl text-yellow-500' 
                : 'fas fa-moon text-xl';
        }
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchInputMobile = document.getElementById('searchInputMobile');
    
    // Настройка функции поиска
    function filterLogEntries(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        document.querySelectorAll('.log-entry').forEach(entry => {
            const text = entry.textContent.toLowerCase();
            const isMatch = text.includes(searchTerm);
            entry.style.display = isMatch ? '' : 'none';
        });
    }
    
    // Обработчики для полей поиска
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (searchInputMobile) {
                searchInputMobile.value = this.value;
            }
            filterLogEntries(this.value);
        });
    }
    
    if (searchInputMobile) {
        searchInputMobile.addEventListener('input', function() {
            if (searchInput) {
                searchInput.value = this.value;
            }
            filterLogEntries(this.value);
        });
    }
}

function animateLogEntries() {
    const entries = document.querySelectorAll('.log-entry');
    const isMobile = window.innerWidth < 768;
    
    entries.forEach((entry, index) => {
        // Уменьшаем задержку на мобильных устройствах для более быстрой анимации
        const delay = isMobile ? index * 0.02 : index * 0.05;
        entry.style.animationDelay = `${delay}s`;
    });
}

function setupMobileEnhancements() {
    // Улучшение взаимодействия для сенсорных устройств
    document.querySelectorAll('a, button').forEach(elem => {
        if (!elem.classList.contains('log-entry') && elem.clientHeight < 40) {
            elem.style.minHeight = '40px';
            elem.style.display = 'inline-flex';
            elem.style.alignItems = 'center';
            elem.style.justifyContent = 'center';
        }
    });
    
    // Поддержка свайпа для навигации
    setupSwipeNavigation();
}

function setupSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const threshold = 100;
        const swipeDistance = touchEndX - touchStartX;
        
        // Свайп вправо для возврата назад
        if (swipeDistance > threshold) {
            const backButton = document.querySelector('a[href="/logs"]');
            if (backButton && window.location.pathname.includes('view')) {
                backButton.click();
            }
        }
    }
}

function setupServerSentEvents() {
    if (window.location.pathname === '/logs') {
        const eventSource = new EventSource('/logs/stream');
        
        eventSource.onmessage = function(event) {
            try {
                const filesData = JSON.parse(event.data);
                console.log('Received update:', filesData.length + ' files');
                updateLogsList(filesData);
            } catch (e) {
                console.error('Error processing SSE update:', e);
            }
        };
        
        eventSource.onerror = function() {
            console.error('SSE connection error');
            eventSource.close();
            
            // Пробуем переподключиться через 5 секунд
            setTimeout(setupServerSentEvents, 5000);
        };
        
        window.addEventListener('beforeunload', function() {
            eventSource.close();
        });
    }
}

function updateLogsList(logs) {
    const logContainer = document.querySelector('.log-list') || document.querySelector('.space-y-2');
    if (!logContainer || !logs || !logs.length) return;

    if (logContainer.tagName === 'TBODY') {
        const isMobile = window.innerWidth < 768;
        
        // Адаптивный шаблон в зависимости от устройства
        logContainer.innerHTML = logs.map(file => {
            if (isMobile) {
                // Компактный формат для мобильных
                return `
                    <tr class="log-entry">
                        <td class="px-2 py-3 whitespace-nowrap">
                            <i class="fas fa-file-code text-blue-500 mr-1"></i>
                            ${file.name}
                        </td>
                        <td class="px-2 py-3 whitespace-nowrap">
                            <a href="/logs/view?file=${encodeURIComponent(file.path)}" 
                               class="text-blue-500 hover:text-blue-700 mr-2 p-2">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="/logs/download?file=${encodeURIComponent(file.path)}" 
                               class="text-green-500 hover:text-green-700 p-2">
                                <i class="fas fa-download"></i>
                            </a>
                        </td>
                    </tr>
                `;
            } else {
                // Полный формат для десктопов
                return `
                    <tr class="log-entry">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <i class="fas fa-file-code text-blue-500 mr-2"></i>
                            ${file.name}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            ${file.size.toFixed(2)} KB
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            ${new Date(file.modified).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <a href="/logs/view?file=${encodeURIComponent(file.path)}" 
                               class="text-blue-500 hover:text-blue-700 mr-4">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="/logs/download?file=${encodeURIComponent(file.path)}" 
                               class="text-green-500 hover:text-green-700">
                                <i class="fas fa-download"></i>
                            </a>
                        </td>
                    </tr>
                `;
            }
        }).join('');
    }

    animateLogEntries();
}