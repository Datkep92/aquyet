class BookReader {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentPage = 0;
        this.totalPages = 0;
        this.headings = [];
        this.isMenuOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        console.log('📖 BookReader initialized');
    }

    initializeElements() {
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.menuToggleBtn = document.getElementById('menu-toggle-btn');
        this.closeMenuBtn = document.getElementById('close-menu-btn');
        
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
        
        // Navigation
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.footerPrevBtn = document.getElementById('footer-prev-btn');
        this.footerNextBtn = document.getElementById('footer-next-btn');
        
        // Progress and pages
        this.progressFill = document.getElementById('progress-fill');
        this.currentPageEl = document.getElementById('current-page');
        this.totalPagesEl = document.getElementById('total-pages');
        
        // Settings
        this.fontSizeSelect = document.getElementById('font-size');
        this.themeSelect = document.getElementById('theme');
        
        // Loading
        this.loadingOverlay = document.getElementById('loading-overlay');
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
        
        // File handling
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.getStartedBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        // Navigation
        this.prevBtn.addEventListener('click', () => this.previousPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());
        this.footerPrevBtn.addEventListener('click', () => this.previousPage());
        this.footerNextBtn.addEventListener('click', () => this.nextPage());
        
        // Settings - SỬA LỖI: Thêm sự kiện change và đóng menu
        this.fontSizeSelect.addEventListener('change', (e) => {
            this.changeFontSize(e.target.value);
            this.closeMenu(); // Đóng menu sau khi chọn
        });
        
        this.themeSelect.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
            this.closeMenu(); // Đóng menu sau khi chọn
        });
        
        // Touch events for swipe navigation
        this.contentReader.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.contentReader.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Close menu when clicking on main content
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !e.target.closest('.sidebar') && !e.target.closest('.menu-toggle-btn')) {
                this.closeMenu();
            }
        });

        // Ngăn sự kiện click trên sidebar lan ra ngoài
        this.sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.sidebar.classList.toggle('active', this.isMenuOpen);
        this.menuToggleBtn.innerHTML = this.isMenuOpen ? 
            '<span class="menu-icon">✕</span><span class="menu-text">Đóng</span>' : 
            '<span class="menu-icon">☰</span><span class="menu-text">Menu</span>';
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.sidebar.classList.remove('active');
        this.menuToggleBtn.innerHTML = '<span class="menu-icon">☰</span><span class="menu-text">Menu</span>';
    }

    handleFileSelect(file) {
        if (!file) return;

        this.showLoading();
        this.placeholderDiv.style.display = 'none';
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                this.fileContentDiv.innerHTML = content;
                this.optimizeContent();
                
                this.fileContentDiv.style.display = 'block';
                this.bookTitle.textContent = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                
                this.generateTOC();
                this.calculatePages();
                this.goToPage(0);
                
                this.hideLoading();
                
                if (this.isMenuOpen) {
                    this.closeMenu();
                }
                
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
        
        // Use windows-1252 encoding for Word HTML files
        reader.readAsText(file, 'windows-1252');
    }

    optimizeContent() {
        const contentDiv = this.fileContentDiv;
        
        // Optimize images
        contentDiv.querySelectorAll('img').forEach(img => {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.loading = 'lazy';
        });
        
        // Optimize tables
        contentDiv.querySelectorAll('table').forEach(table => {
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.display = 'block';
            table.style.overflowX = 'auto';
            table.style.fontSize = '0.9em';
        });
        
        // Add responsive classes
        contentDiv.querySelectorAll('h1, h2, h3').forEach(heading => {
            heading.classList.add('content-heading');
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
            /^(\d{1,2})\.\s+(.+)/,           // "1. Tiêu đề"
            /^(\d{1,2}\.\d{1,2})\.\s+(.+)/,  // "1.1. Tiêu đề"
            /^(\d{1,2}\.\d{1,2}\.\d{1,2})\.\s+(.+)/ // "1.1.1. Tiêu đề"
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
        
        // Display TOC
        if (this.headings.length === 0) {
            this.tocList.innerHTML = '<li class="toc-placeholder">Không tìm thấy mục lục trong file</li>';
        } else {
            this.headings.forEach((heading, index) => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                
                link.href = `#${heading.id}`;
                link.textContent = heading.text;
                link.className = `toc-link level-${heading.level}`;
                
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToHeading(heading.element);
                    this.closeMenu(); // Đóng menu sau khi chọn mục lục
                });
                
                listItem.appendChild(link);
                this.tocList.appendChild(listItem);
            });
            
            console.log(`📑 Generated TOC with ${this.headings.length} headings`);
        }
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
        
        // Update current page based on scroll position
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
        this.updateNavigation();
    }

    goToPage(page) {
        if (page < 0 || page >= this.totalPages) return;
        
        this.currentPage = page;
        const scrollPosition = (page / this.totalPages) * this.fileContentDiv.scrollHeight;
        
        this.contentReader.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });
        
        this.updatePageInfo();
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

    updatePageInfo() {
        this.currentPageEl.textContent = this.currentPage + 1;
        const progress = ((this.currentPage + 1) / this.totalPages) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.updateNavigation();
    }

    updateNavigation() {
        const hasPrev = this.currentPage > 0;
        const hasNext = this.currentPage < this.totalPages - 1;
        
        [this.prevBtn, this.footerPrevBtn].forEach(btn => {
            btn.disabled = !hasPrev;
        });
        
        [this.nextBtn, this.footerNextBtn].forEach(btn => {
            btn.disabled = !hasNext;
        });
    }

    updateCurrentPage() {
        const scrollTop = this.contentReader.scrollTop;
        const contentHeight = this.contentReader.clientHeight;
        const totalHeight = this.fileContentDiv.scrollHeight;
        
        this.currentPage = Math.floor((scrollTop / totalHeight) * this.totalPages);
        this.updatePageInfo();
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
        
        // Only handle horizontal swipes with minimal vertical movement
        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
            if (diffX > 0) {
                // Swipe right - previous page
                this.previousPage();
            } else {
                // Swipe left - next page
                this.nextPage();
            }
        }
        
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    handleKeydown(e) {
        if (e.key === 'ArrowLeft') {
            this.previousPage();
        } else if (e.key === 'ArrowRight') {
            this.nextPage();
        } else if (e.key === 'Escape' && this.isMenuOpen) {
            this.closeMenu();
        }
    }

    changeFontSize(size) {
        // SỬA LỖI: Áp dụng cỡ chữ cho toàn bộ nội dung file
        this.fileContentDiv.style.fontSize = `${size}rem`;
        
        // Lưu cài đặt vào localStorage
        localStorage.setItem('bookreader-fontsize', size);
        
        // Recalculate pages after font size change
        setTimeout(() => this.calculatePages(), 100);
    }

    changeTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        // Save preference to localStorage
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
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new BookReader();
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('bookreader-theme');
    if (savedTheme) {
        document.getElementById('theme').value = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
    }
    
    // Load saved font size preference - THÊM TÍNH NĂNG NÀY
    const savedFontSize = localStorage.getItem('bookreader-fontsize');
    if (savedFontSize) {
        document.getElementById('font-size').value = savedFontSize;
        // Áp dụng cỡ chữ ngay lập tức nếu có nội dung
        const fileContentDiv = document.getElementById('file-content-display');
        if (fileContentDiv && fileContentDiv.innerHTML.trim() !== '') {
            fileContentDiv.style.fontSize = `${savedFontSize}rem`;
        }
    }
    
    // Add scroll event listener for page tracking
    document.getElementById('content-reader').addEventListener('scroll', () => {
        app.updateCurrentPage();
    });
});
