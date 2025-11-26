class BookReader {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentPage = 0;
        this.totalPages = 0;
        this.headings = [];
        this.isMenuOpen = false;
        this.isSettingsOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.currentBook = null;
        
        console.log('📖 BookReader initialized');
        this.loadLastBook();
        this.disableZoom();
        this.disableHorizontalScroll();
        this.loadPreferences();
        
        // Tự động tải từ repo khi khởi tạo
        this.autoLoadFromRepo();
    }

    initializeElements() {
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.menuToggleBtn = document.getElementById('menu-toggle-btn');
        this.closeMenuBtn = document.getElementById('close-menu-btn');
        this.sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
        
        // Settings elements
        this.settingsPanel = document.getElementById('settings-panel');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeSettingsBtn = document.getElementById('close-settings-btn');
        
        // File handling
        this.fileInput = document.getElementById('file-input');
        this.uploadBtn = document.getElementById('upload-btn');
        this.getStartedBtn = document.getElementById('get-started-btn');
        
        // Content elements
        this.mainWrapper = document.getElementById('main-wrapper');
        this.contentReader = document.getElementById('content-reader');
        this.fileContentDiv = document.getElementById('file-content-display');
        this.placeholderDiv = document.getElementById('placeholder-content');
        this.bookTitle = document.getElementById('book-title');
        
        // Table of contents
        this.tocList = document.getElementById('toc-list');
        this.tocSearch = document.getElementById('toc-search');
        this.tocSearchResults = document.getElementById('toc-search-results');
        
        // Page indicator
        this.currentPageEl = document.getElementById('current-page');
        this.totalPagesEl = document.getElementById('total-pages');
        this.pageIndicator = document.getElementById('page-indicator');
        
        // Progress
        this.progressFill = document.getElementById('progress-fill');
        
        // Settings
        this.fontSizeSelect = document.getElementById('font-size');
        this.themeSelect = document.getElementById('theme');
        
        // Loading
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Thêm nút tải từ repo
        this.repoLoadBtn = document.getElementById('repo-load-btn');
    }

    bindEvents() {
        // Menu controls
        this.menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        this.closeMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeMenu();
        });
        
        // Settings controls
        this.settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettings();
        });
        
        this.sidebarSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettings();
        });
        
        this.closeSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeSettings();
        });
        
        // File handling
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.getStartedBtn.addEventListener('click', () => {
            this.toggleSettings();
            setTimeout(() => this.fileInput.click(), 300);
        });
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        // Settings changes
        this.fontSizeSelect.addEventListener('change', (e) => {
            this.changeFontSize(e.target.value);
        });
        
        this.themeSelect.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });
        
        // Touch events for swipe navigation
        this.contentReader.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.contentReader.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !e.target.closest('.sidebar') && !e.target.closest('.menu-toggle-btn')) {
                this.closeMenu();
            }
            if (this.isSettingsOpen && !e.target.closest('.settings-panel') && !e.target.closest('.settings-btn') && !e.target.closest('.sidebar-settings-btn')) {
                this.closeSettings();
            }
        });

        // Prevent event propagation
        this.sidebar.addEventListener('click', (e) => e.stopPropagation());
        this.settingsPanel.addEventListener('click', (e) => e.stopPropagation());

        // Scroll event for page tracking
        this.contentReader.addEventListener('scroll', () => {
            this.updateCurrentPage();
            this.saveReadingProgress();
        });
        
        // Thêm sự kiện cho nút tải từ repo
        if (this.repoLoadBtn) {
            this.repoLoadBtn.addEventListener('click', () => {
                this.loadFromRepo();
            });
        }
    }

    // Thêm phương thức tự động tải từ repo
    async autoLoadFromRepo() {
        // Kiểm tra xem có nên tự động tải từ repo không
        const shouldAutoLoad = localStorage.getItem('bookreader-autoload-repo') !== 'false';
        const lastAutoLoad = localStorage.getItem('bookreader-last-autoload');
        const now = new Date().getTime();
        
        // Tự động tải nếu:
        // 1. Chưa từng tải trước đó, HOẶC
        // 2. Lần tải cuối cùng cách đây hơn 1 giờ, HOẶC  
        // 3. Không có sách nào đang mở
        if (shouldAutoLoad && (!lastAutoLoad || (now - parseInt(lastAutoLoad)) > 3600000 || !this.currentBook)) {
            console.log('🔄 Tự động tải từ repo...');
            await this.loadFromRepo();
        }
    }

    // Phương thức tải từ repo
    async loadFromRepo() {
        try {
            this.showLoading();
            
            const repoUrl = 'https://raw.githubusercontent.com/Datkep92/aquyet/main/docs/Quyet/book.txt';
            
            console.log('📥 Đang tải từ repo:', repoUrl);
            
            const response = await fetch(repoUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const content = await response.text();
            
            if (!content || content.trim() === '') {
                throw new Error('Nội dung trống');
            }
            
            // Tạo đối tượng sách từ repo
            this.currentBook = {
                name: 'Quyết - Từ repo',
                content: content,
                timestamp: new Date().getTime(),
                lastPosition: 0,
                fromRepo: true
            };
            
            this.fileContentDiv.innerHTML = content;
            this.optimizeContent();
            
            this.fileContentDiv.style.display = 'block';
            this.bookTitle.textContent = 'Quyết - Từ repo';
            
            this.generateTOC();
            this.calculatePages();
            
            // Lưu sách vào localStorage
            this.saveBookToStorage();
            
            // Lưu sách cuối cùng
            localStorage.setItem('bookreader_lastbook', 'Quyết - Từ repo');
            
            // Lưu thời điểm tải cuối cùng
            localStorage.setItem('bookreader-last-autoload', new Date().getTime());
            
            // Khôi phục tiến độ đọc nếu có
            this.restoreReadingProgress();
            
            // Áp dụng font size đã lưu
            const savedFontSize = localStorage.getItem('bookreader-fontsize');
            if (savedFontSize) {
                this.fileContentDiv.style.fontSize = `${savedFontSize}rem`;
            }
            
            this.hideLoading();
            this.closeSettings();
            
            console.log('✅ Đã tải thành công từ repo');
            
            // Hiển thị thông báo thành công
            this.showNotification('Đã cập nhật nội dung từ repo thành công!');
            
        } catch (error) {
            console.error('❌ Lỗi khi tải từ repo:', error);
            this.hideLoading();
            
            // Chỉ hiển thị lỗi nếu không có sách nào khác
            if (!this.currentBook) {
                this.showError(`Không thể tải từ repo: ${error.message}. Vui lòng thử tải file thủ công.`);
            } else {
                this.showNotification('Không thể cập nhật từ repo, vẫn giữ nội dung cũ.');
            }
        }
    }

    // Phương thức hiển thị thông báo
    showNotification(message, duration = 3000) {
        // Tạo thông báo tạm thời
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Tự động xóa sau thời gian chỉ định
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Thêm CSS animation nếu chưa có
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    disableZoom() {
        // Ngăn chặn zoom bằng gesture
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
        
        // Ngăn chặn double tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    disableHorizontalScroll() {
        // Ngăn chặn scroll ngang
        this.contentReader.addEventListener('scroll', (e) => {
            if (e.target.scrollLeft !== 0) {
                e.target.scrollLeft = 0;
            }
        });
    }

    loadPreferences() {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('bookreader-theme');
        if (savedTheme) {
            this.themeSelect.value = savedTheme;
            document.body.setAttribute('data-theme', savedTheme);
        }
        
        // Load saved font size preference
        const savedFontSize = localStorage.getItem('bookreader-fontsize');
        if (savedFontSize) {
            this.fontSizeSelect.value = savedFontSize;
            if (this.fileContentDiv && this.fileContentDiv.innerHTML.trim() !== '') {
                this.fileContentDiv.style.fontSize = `${savedFontSize}rem`;
            }
        }
        
        // Load auto-load preference
        const autoLoadRepo = localStorage.getItem('bookreader-autoload-repo');
        if (autoLoadRepo === null) {
            // Mặc định bật auto-load
            localStorage.setItem('bookreader-autoload-repo', 'true');
        }
    }

    loadLastBook() {
        const lastBookName = localStorage.getItem('bookreader_lastbook');
        if (lastBookName) {
            this.loadBookFromStorage(lastBookName);
        }
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.sidebar.classList.toggle('active', this.isMenuOpen);
        if (this.isMenuOpen) {
            this.closeSettings();
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.sidebar.classList.remove('active');
    }

    toggleSettings() {
        this.isSettingsOpen = !this.isSettingsOpen;
        this.settingsPanel.classList.toggle('active', this.isSettingsOpen);
        if (this.isSettingsOpen) {
            this.closeMenu();
        }
    }

    closeSettings() {
        this.isSettingsOpen = false;
        this.settingsPanel.classList.remove('active');
    }

    handleFileSelect(file) {
        if (!file) return;

        this.showLoading();
        this.placeholderDiv.style.display = 'none';
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const fileName = file.name.replace(/\.[^/.]+$/, "");
                
                // Tạo đối tượng sách
                this.currentBook = {
                    name: fileName,
                    content: content,
                    timestamp: new Date().getTime(),
                    lastPosition: 0,
                    fromRepo: false
                };
                
                this.fileContentDiv.innerHTML = content;
                this.optimizeContent();
                
                this.fileContentDiv.style.display = 'block';
                this.bookTitle.textContent = fileName;
                
                this.generateTOC();
                this.calculatePages();
                
                // Lưu sách vào localStorage
                this.saveBookToStorage();
                
                // Lưu sách cuối cùng
                localStorage.setItem('bookreader_lastbook', fileName);
                
                // Khôi phục tiến độ đọc nếu có
                this.restoreReadingProgress();
                
                // Áp dụng font size đã lưu
                const savedFontSize = localStorage.getItem('bookreader-fontsize');
                if (savedFontSize) {
                    this.fileContentDiv.style.fontSize = `${savedFontSize}rem`;
                }
                
                this.hideLoading();
                this.closeSettings();
                
                console.log('✅ File loaded successfully');
            } catch (error) {
                console.error('❌ Error processing file:', error);
                this.showError('Lỗi khi xử lý file. Vui lòng thử lại.');
            }
        };
        
        reader.onerror = () => {
            this.hideLoading();
            this.showError('Lỗi khi đọc file.');
        };
        
        reader.readAsText(file, 'windows-1252');
    }

    saveBookToStorage() {
        if (!this.currentBook) return;
        
        try {
            const savedBooks = this.getSavedBooks();
            const existingBookIndex = savedBooks.findIndex(book => book.name === this.currentBook.name);
            
            if (existingBookIndex !== -1) {
                savedBooks[existingBookIndex] = this.currentBook;
            } else {
                savedBooks.push(this.currentBook);
            }
            
            localStorage.setItem('bookreader_books', JSON.stringify(savedBooks));
            console.log('💾 Book saved to localStorage');
            
        } catch (error) {
            console.error('❌ Error saving book to storage:', error);
        }
    }

    getSavedBooks() {
        try {
            const savedBooks = localStorage.getItem('bookreader_books');
            return savedBooks ? JSON.parse(savedBooks) : [];
        } catch (error) {
            console.error('❌ Error reading saved books:', error);
            return [];
        }
    }

    saveReadingProgress() {
        if (!this.currentBook) return;
        
        const scrollTop = this.contentReader.scrollTop;
        this.currentBook.lastPosition = scrollTop;
        this.currentBook.lastRead = new Date().getTime();
        
        this.saveBookToStorage();
    }

    restoreReadingProgress() {
        if (!this.currentBook) return;
        
        const savedBooks = this.getSavedBooks();
        const savedBook = savedBooks.find(book => book.name === this.currentBook.name);
        
        if (savedBook && savedBook.lastPosition) {
            setTimeout(() => {
                this.contentReader.scrollTo({
                    top: savedBook.lastPosition,
                    behavior: 'smooth'
                });
                
                setTimeout(() => {
                    this.updateCurrentPage();
                }, 200);
                
                console.log('📖 Reading progress restored');
            }, 100);
        }
    }

    loadBookFromStorage(bookName) {
        const savedBooks = this.getSavedBooks();
        const book = savedBooks.find(b => b.name === bookName);
        
        if (book) {
            this.showLoading();
            this.placeholderDiv.style.display = 'none';
            
            this.currentBook = book;
            this.fileContentDiv.innerHTML = book.content;
            this.optimizeContent();
            
            this.fileContentDiv.style.display = 'block';
            this.bookTitle.textContent = book.name;
            
            this.generateTOC();
            this.calculatePages();
            this.restoreReadingProgress();
            
            // Áp dụng font size đã lưu
            const savedFontSize = localStorage.getItem('bookreader-fontsize');
            if (savedFontSize) {
                this.fileContentDiv.style.fontSize = `${savedFontSize}rem`;
            }
            
            this.hideLoading();
            console.log('✅ Book loaded from storage');
        }
    }

    deleteBookFromStorage(bookName) {
        const savedBooks = this.getSavedBooks();
        const filteredBooks = savedBooks.filter(book => book.name !== bookName);
        
        localStorage.setItem('bookreader_books', JSON.stringify(filteredBooks));
        
        // Nếu đang xem sách bị xóa, clear nội dung
        if (this.currentBook && this.currentBook.name === bookName) {
            this.currentBook = null;
            this.fileContentDiv.style.display = 'none';
            this.placeholderDiv.style.display = 'block';
            this.bookTitle.textContent = 'BookReader';
            localStorage.removeItem('bookreader_lastbook');
        }
        
        console.log('🗑️ Book deleted from storage');
    }

    optimizeContent() {
        const contentDiv = this.fileContentDiv;
        
        // Optimize images
        contentDiv.querySelectorAll('img').forEach(img => {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.loading = 'lazy';
        });
        
        // Optimize tables - đảm bảo không bị tràn ngang
        contentDiv.querySelectorAll('table').forEach(table => {
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.display = 'block';
            table.style.overflowX = 'auto';
            table.style.fontSize = '0.9em';
            table.style.maxWidth = '100%';
        });
        
        // Đảm bảo tất cả elements không vượt quá chiều rộng
        contentDiv.querySelectorAll('*').forEach(el => {
            el.style.maxWidth = '100%';
            el.style.boxSizing = 'border-box';
        });
        
        // Remove empty elements
        contentDiv.querySelectorAll('p, div').forEach(el => {
            if (!el.textContent.trim() && !el.querySelector('img, table')) {
                el.remove();
            }
        });
    }

    generateTOC() {
        this.tocList.innerHTML = '';
        this.headings = [];
        
        const allElements = this.fileContentDiv.querySelectorAll('*');
        const headingRegexes = [
            /^(\d{1,2})\.\s+(.+)/,
            /^(\d{1,2}\.\d{1,2})\.\s+(.+)/,
            /^(\d{1,2}\.\d{1,2}\.\d{1,2})\.\s+(.+)/
        ];
        
        const prioritySelectors = [
            'p.A10', 'h1', '.A10', 'p[class*="A10"]', 
            'p[class*="a1"]', 'h2', 'h3', '.MsoNormal'
        ];
        
        // Search in priority selectors first
        for (let selector of prioritySelectors) {
            const elements = this.fileContentDiv.querySelectorAll(selector);
            
            for (let element of elements) {
                if (this.headings.length >= 50) break;
                
                const text = element.textContent.trim();
                const match = this.findHeadingMatch(text, headingRegexes);
                
                if (match) {
                    this.addHeadingToTOC(element, match);
                }
            }
            
            if (this.headings.length >= 50) break;
        }
        
        // Fallback: search all elements
        if (this.headings.length < 10) {
            for (let element of allElements) {
                if (this.headings.length >= 50) break;
                if (element.id && element.id.startsWith('toc-heading-')) continue;
                
                const text = element.textContent.trim();
                const match = this.findHeadingMatch(text, headingRegexes);
                
                if (match) {
                    this.addHeadingToTOC(element, match);
                }
            }
        }
        
        // Sort headings by position in document
        this.headings.sort((a, b) => {
            const positionA = this.getElementPosition(a.element);
            const positionB = this.getElementPosition(b.element);
            return positionA - positionB;
        });
        
        this.displayTOCWithSearch();
    }

    displayTOCWithSearch() {
        if (this.headings.length === 0) {
            this.tocList.innerHTML = '<li class="toc-placeholder">Không tìm thấy mục lục trong file</li>';
            return;
        }

        const tocItemsHTML = this.headings.map((heading, index) => {
            return `
                <li class="toc-item">
                    <a href="#${heading.id}" class="toc-link level-${heading.level}" data-index="${index}">
                        <span class="toc-text">${heading.text}</span>
                    </a>
                </li>
            `;
        }).join('');

        this.tocList.innerHTML = tocItemsHTML;

        // Thêm sự kiện tìm kiếm
        this.tocSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                this.tocSearchResults.style.display = 'none';
                this.showAllTOCItems();
                return;
            }

            const filteredHeadings = this.headings.filter(heading => 
                heading.text.toLowerCase().includes(searchTerm)
            );

            this.filterTOCItems(searchTerm);
            this.showSearchResults(filteredHeadings, searchTerm);
        });

        // Thêm sự kiện click cho các link
        this.tocList.querySelectorAll('.toc-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(link.getAttribute('data-index'));
                this.scrollToHeading(this.headings[index].element);
                this.closeMenu();
            });
        });
    }

    filterTOCItems(searchTerm) {
        const tocItems = this.tocList.querySelectorAll('.toc-item');
        
        tocItems.forEach(item => {
            const text = item.querySelector('.toc-text').textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'flex';
                const originalText = item.querySelector('.toc-text').textContent;
                const highlightedText = this.highlightText(originalText, searchTerm);
                item.querySelector('.toc-text').innerHTML = highlightedText;
            } else {
                item.style.display = 'none';
            }
        });
    }

    showAllTOCItems() {
        const tocItems = this.tocList.querySelectorAll('.toc-item');
        tocItems.forEach(item => {
            item.style.display = 'flex';
            const text = item.querySelector('.toc-text').textContent;
            item.querySelector('.toc-text').textContent = text;
        });
    }

    showSearchResults(filteredHeadings, searchTerm) {
        if (filteredHeadings.length === 0) {
            this.tocSearchResults.innerHTML = '<div class="toc-no-results">Không tìm thấy kết quả</div>';
            this.tocSearchResults.style.display = 'block';
            return;
        }

        const resultsHTML = filteredHeadings.map(heading => {
            const highlightedText = this.highlightText(heading.text, searchTerm);
            return `
                <div class="toc-search-result" data-index="${this.headings.indexOf(heading)}">
                    <div class="toc-search-text">${highlightedText}</div>
                </div>
            `;
        }).join('');

        this.tocSearchResults.innerHTML = resultsHTML;
        this.tocSearchResults.style.display = 'block';

        this.tocSearchResults.querySelectorAll('.toc-search-result').forEach(result => {
            result.addEventListener('click', () => {
                const index = parseInt(result.getAttribute('data-index'));
                this.scrollToHeading(this.headings[index].element);
                this.closeMenu();
                this.tocSearchResults.style.display = 'none';
                this.tocSearch.value = '';
                this.showAllTOCItems();
            });
        });
    }

    highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    findHeadingMatch(text, regexes) {
        for (let regex of regexes) {
            const match = text.match(regex);
            if (match) return match;
        }
        return null;
    }

    addHeadingToTOC(element, match) {
        const id = `toc-heading-${this.headings.length}`;
        element.id = id;
        
        const level = match[1].split('.').length;
        
        this.headings.push({
            id: id,
            text: match[0],
            element: element,
            level: Math.min(level, 3)
        });
    }

    scrollToHeading(element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        setTimeout(() => this.updateCurrentPage(), 300);
    }

    getElementPosition(element) {
        let position = 0;
        let prevElement = element.previousElementSibling;
        while (prevElement) {
            position++;
            prevElement = prevElement.previousElementSibling;
        }
        return position;
    }

    calculatePages() {
        const contentHeight = this.contentReader.clientHeight;
        const totalHeight = this.fileContentDiv.scrollHeight;
        this.totalPages = Math.ceil(totalHeight / contentHeight);
        this.totalPagesEl.textContent = this.totalPages;
        this.updateCurrentPage();
    }

    updateCurrentPage() {
        const scrollTop = this.contentReader.scrollTop;
        const contentHeight = this.contentReader.clientHeight;
        const totalHeight = this.fileContentDiv.scrollHeight;
        
        if (totalHeight > 0) {
            this.currentPage = Math.floor((scrollTop / totalHeight) * this.totalPages);
            this.currentPageEl.textContent = this.currentPage + 1;
            
            const progress = ((this.currentPage + 1) / this.totalPages) * 100;
            this.progressFill.style.width = `${progress}%`;
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    handleTouchEnd(e) {
        if (!this.touchStartX) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchEndX - this.touchStartX;
        const diffY = touchEndY - this.touchStartY;
        
        // Chỉ xử lý vuốt ngang với độ lệch dọc nhỏ
        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
            if (diffX > 0) {
                // Vuốt phải - trang trước
                this.previousPage();
            } else {
                // Vuốt trái - trang sau
                this.nextPage();
            }
        }
        
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.goToPage(this.currentPage + 1);
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        }
    }

    goToPage(page) {
        if (page < 0 || page >= this.totalPages) return;
        
        this.currentPage = page;
        const scrollPosition = (page / this.totalPages) * this.fileContentDiv.scrollHeight;
        
        this.contentReader.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });
    }

    handleKeydown(e) {
        if (e.key === 'ArrowLeft') {
            this.previousPage();
        } else if (e.key === 'ArrowRight') {
            this.nextPage();
        } else if (e.key === 'Escape') {
            if (this.isMenuOpen) this.closeMenu();
            if (this.isSettingsOpen) this.closeSettings();
        }
    }

    changeFontSize(size) {
        this.fileContentDiv.style.fontSize = `${size}rem`;
        localStorage.setItem('bookreader-fontsize', size);
        setTimeout(() => this.calculatePages(), 100);
    }

    changeTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('bookreader-theme', theme);
    }

    showLoading() {
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    showError(message) {
        this.placeholderDiv.style.display = 'block';
        this.placeholderDiv.innerHTML = `
            <div style="font-size: 48px;">❌</div>
            <h3>Đã xảy ra lỗi</h3>
            <p>${message}</p>
            <button class="get-started-btn" onclick="location.reload()">Thử lại</button>
        `;
        this.hideLoading();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookReader();
});
