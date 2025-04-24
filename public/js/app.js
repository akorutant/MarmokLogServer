document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
    initSearch();
    initMobileLayout();
    
    // Анимация элементов списка логов
    document.querySelectorAll('.log-entry').forEach((entry, index) => {
        entry.style.animationDelay = `${index * 0.03}s`;
    });
    
    // Подсветка JSON в режиме просмотра логов
    if (window.location.href.includes('/logs/view')) {
        highlightJson();
    }
    
    // Настройка кнопки копирования
    setupCopyButton();
    
    // Настройка SSE для обновления списка файлов в реальном времени
    setupServerSentEvents();
    
    // Фильтрация .gz файлов при загрузке страницы
    filterGzFiles();
});

// Функция переключения темы
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const navThemeBtn = document.getElementById('navThemeBtn');
    
    // Загружаем сохраненную тему
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateThemeIcons(true);
    }
    
    // Обработчики для кнопок переключения темы
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    if (navThemeBtn) {
        navThemeBtn.addEventListener('click', toggleTheme);
    }

    // Функция переключения темы
    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        updateThemeIcons(isDark);
    }
    
    // Обновление иконок темы
    function updateThemeIcons(isDark) {
        if (themeToggle) {
            themeToggle.innerHTML = isDark 
                ? '<i class="fas fa-sun text-yellow-500"></i>' 
                : '<i class="fas fa-moon text-gray-600"></i>';
        }
        
        if (navThemeBtn) {
            const icon = navThemeBtn.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                if (isDark) {
                    icon.style.color = '#f59e0b';
                } else {
                    icon.style.color = '';
                }
            }
        }
    }
}

// Функция для настройки поиска
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileSearchContainer = document.getElementById('mobileSearchContainer');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const navSearchBtn = document.getElementById('navSearchBtn');
    
    // Функция фильтрации логов
    function filterLogs(searchText) {
        const text = searchText.toLowerCase();
        document.querySelectorAll('.log-entry').forEach(entry => {
            // Получаем имя файла для проверки на .gz
            const fileName = entry.querySelector('span')?.textContent || '';
            const isGzFile = fileName.endsWith('.gz');
            
            // Показываем только подходящие и не .gz файлы
            if (entry.textContent.toLowerCase().includes(text) && !isGzFile) {
                entry.style.display = '';
            } else {
                entry.style.display = 'none';
            }
        });
    }
    
    // Обработчики для полей поиска
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterLogs(this.value);
            if (mobileSearchInput) {
                mobileSearchInput.value = this.value;
            }
        });
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', function() {
            filterLogs(this.value);
            if (searchInput) {
                searchInput.value = this.value;
            }
        });
    }
    
    // Обработчики для мобильных кнопок поиска
    if (mobileSearchBtn && mobileSearchContainer) {
        mobileSearchBtn.addEventListener('click', function() {
            mobileSearchContainer.classList.toggle('hidden');
            if (!mobileSearchContainer.classList.contains('hidden') && mobileSearchInput) {
                mobileSearchInput.focus();
            }
        });
    }
    
    if (navSearchBtn && mobileSearchContainer) {
        navSearchBtn.addEventListener('click', function() {
            mobileSearchContainer.classList.toggle('hidden');
            if (!mobileSearchContainer.classList.contains('hidden') && mobileSearchInput) {
                mobileSearchInput.focus();
                window.scrollTo(0, 0);
            } else {
                window.scrollTo(0, 0);
            }
        });
    }
}

// Функция для настройки мобильного интерфейса
function initMobileLayout() {
    const mobileNavBar = document.getElementById('mobileNavBar');
    const mainContent = document.querySelector('main');
    
    // Добавляем отступ для контента при наличии фиксированной навигации
    if (mobileNavBar && mainContent && window.innerWidth < 768) {
        mainContent.style.paddingBottom = '60px';
    }
    
    // Увеличиваем область тача для кнопок на мобильных
    if (window.innerWidth < 768) {
        document.querySelectorAll('a, button').forEach(el => {
            if (el.clientHeight < 32 && !el.closest('#logContent')) {
                el.style.minHeight = '32px';
                el.style.minWidth = '32px';
                el.style.display = 'inline-flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
            }
        });
    }
}

// Функция для подсветки JSON в логах
function highlightJson() {
    const logContent = document.querySelector('#logContent pre');
    if (!logContent) return;

    try {
        const content = logContent.textContent;
        
        // Ищем JSON объекты и подсвечиваем их в зависимости от уровня лога
        const highlighted = content.replace(/(\{.*?\})/g, function(match) {
            try {
                const json = JSON.parse(match);
                const className = json.level === 'error' ? 'text-red-600' :
                               json.level === 'warn' ? 'text-yellow-600' :
                               json.level === 'info' ? 'text-blue-600' : '';
                               
                return `<span class="${className}">${match}</span>`;
            } catch (e) {
                return match;
            }
        });
        
        if (highlighted !== content) {
            logContent.innerHTML = highlighted;
        }
    } catch (error) {
        console.error('Error highlighting JSON:', error);
    }
}

// Настройка кнопки копирования содержимого логов
function setupCopyButton() {
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            const logContent = document.getElementById('logContent');
            const content = logContent?.textContent || '';

            navigator.clipboard.writeText(content).then(() => {
                const btn = this;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
                btn.classList.add('bg-green-100', 'text-green-700');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('bg-green-100', 'text-green-700');
                }, 2000);
            });
        });
    }
}

// Настройка SSE для обновления списка файлов
function setupServerSentEvents() {
    if (window.location.pathname === '/logs') {
        const eventSource = new EventSource('/logs/stream');
        
        eventSource.onmessage = function(event) {
            try {
                const filesData = JSON.parse(event.data);
                console.log('Received update:', filesData.length + ' files');
                
                // Фильтруем только .log файлы (не .gz)
                const filteredData = filesData.filter(file => 
                    file.name.endsWith('.log') && !file.name.endsWith('.gz')
                );
                
                if (filteredData.length > 0) {
                    updateLogsList(filteredData);
                }
            } catch (error) {
                console.error('Error processing server update:', error);
            }
        };
        
        eventSource.onerror = function() {
            console.error('SSE connection error');
            eventSource.close();
            
            // Попытка переподключения через 5 секунд
            setTimeout(setupServerSentEvents, 5000);
        };
        
        window.addEventListener('beforeunload', function() {
            eventSource.close();
        });
    }
}

// Обновление списка логов из SSE
function updateLogsList(logs) {
    const logContainer = document.querySelector('.log-list') || document.querySelector('.space-y-2');
    if (!logContainer || !logs || !logs.length) return;

    if (logContainer.tagName === 'TBODY') {
        logContainer.innerHTML = logs.map(file => `
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
    `).join('');
    }

    // Анимируем новые элементы
    document.querySelectorAll('.log-entry').forEach((entry, index) => {
        entry.style.animationDelay = `${index * 0.03}s`;
    });
}

// Функция фильтрации .gz файлов при загрузке страницы
function filterGzFiles() {
    if (window.location.pathname === '/logs') {
        // Ждем небольшую задержку для гарантии загрузки DOM
        setTimeout(() => {
            document.querySelectorAll('.log-entry').forEach(entry => {
                const fileName = entry.querySelector('span')?.textContent || '';
                // Скрываем все .gz файлы
                if (fileName.endsWith('.gz')) {
                    entry.style.display = 'none';
                }
            });
        }, 100);
    }
}