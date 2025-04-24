document.addEventListener('DOMContentLoaded', function() {
    loadFontAwesome();
    
    initThemeToggle();
    initSearch();
    initMobileLayout();
    
    filterGzFiles();
    
    document.querySelectorAll('.log-entry').forEach((entry, index) => {
        entry.style.animationDelay = `${index * 0.03}s`;
    });
    
    if (window.location.href.includes('/logs/view')) {
        highlightJson();
    }
});

function loadFontAwesome() {
    setTimeout(function() {
        const testIcon = document.createElement('i');
        testIcon.className = 'fas fa-check';
        testIcon.style.visibility = 'hidden';
        document.body.appendChild(testIcon);
        
        const computed = window.getComputedStyle(testIcon);
        const isFontAwesomeLoaded = computed.fontFamily.indexOf('Font Awesome') !== -1 || 
                                   computed.fontFamily.indexOf('FontAwesome') !== -1;
        
        document.body.removeChild(testIcon);
        
        if (!isFontAwesomeLoaded) {
            console.log('FontAwesome not loaded, loading from CDN...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(link);
        }
    }, 300);
}

function filterGzFiles() {
    document.querySelectorAll('.log-entry').forEach(entry => {
        const nameElement = entry.querySelector('span');
        if (nameElement && nameElement.textContent.endsWith('.gz')) {
            entry.style.display = 'none';
        }
    });
}

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
            const nameElement = entry.querySelector('span');
            const isGzFile = nameElement && nameElement.textContent.endsWith('.gz');
            
            const isMatch = entry.textContent.toLowerCase().includes(text);
            
            if (isMatch && !isGzFile) {
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

const copyBtn = document.getElementById('copyBtn');
if (copyBtn) {
    copyBtn.addEventListener('click', function() {
        const logContent = document.getElementById('logContent');
        if (logContent) {
            navigator.clipboard.writeText(logContent.textContent || '')
                .then(() => {
                    const btn = this;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
                    btn.classList.add('bg-green-100', 'text-green-700');
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.classList.remove('bg-green-100', 'text-green-700');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Error copying text:', err);
                });
        }
    });
}