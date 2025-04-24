document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
    initSearch();
    initMobileLayout();
    
    document.querySelectorAll('.log-entry').forEach((entry, index) => {
        entry.style.animationDelay = `${index * 0.03}s`;
    });
});

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const navThemeBtn = document.getElementById('navThemeBtn');
    
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateThemeIcons(true);
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    if (navThemeBtn) {
        navThemeBtn.addEventListener('click', toggleTheme);
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        updateThemeIcons(isDark);
    }
    
    function updateThemeIcons(isDark) {
        if (themeToggle) {
            themeToggle.innerHTML = isDark 
                ? '<i class="fas fa-sun" style="color: #f59e0b;"></i>' 
                : '<i class="fas fa-moon"></i>';
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

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileSearchContainer = document.getElementById('mobileSearchContainer');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const navSearchBtn = document.getElementById('navSearchBtn');
    
    function filterLogs(searchText) {
        const text = searchText.toLowerCase();
        document.querySelectorAll('.log-entry').forEach(entry => {
            if (entry.textContent.toLowerCase().includes(text)) {
                entry.style.display = '';
            } else {
                entry.style.display = 'none';
            }
        });
    }
    
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

function initMobileLayout() {
    const mobileNavBar = document.getElementById('mobileNavBar');
    const mainContent = document.querySelector('main');
    
    if (mobileNavBar && mainContent && window.innerWidth < 768) {
        mainContent.style.paddingBottom = '60px';
    }
    
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

function highlightJson() {
    const logContent = document.querySelector('#logContent pre');
    if (!logContent) return;

    try {
        const content = logContent.textContent;
        
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

if (window.location.href.includes('/logs/view')) {
    document.addEventListener('DOMContentLoaded', highlightJson);
}