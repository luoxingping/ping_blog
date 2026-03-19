/**
 * 目录导航脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.blog-toc')) {
        initializeTableOfContents();
        setupScrollSpying();
    }
});

/**
 * 初始化目录
 */
function initializeTableOfContents() {
    const tocContainer = document.querySelector('.blog-toc ul');
    const headings = document.querySelectorAll('.blog-content h2, .blog-content h3');
    
    if (!tocContainer || headings.length === 0) return;
    
    const toc = buildTOCStructure(headings);
    renderTOC(tocContainer, toc);
}

/**
 * 构建目录结构
 */
function buildTOCStructure(headings) {
    const structure = [];
    let currentSection = null;
    
    headings.forEach((heading, index) => {
        // 为每个标题添加 ID（如果没有的话）
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }
        
        const level = parseInt(heading.tagName[1]);
        const item = {
            id: heading.id,
            text: heading.textContent,
            level: level,
            children: []
        };
        
        if (level === 2) {
            structure.push(item);
            currentSection = item;
        } else if (level === 3 && currentSection) {
            currentSection.children.push(item);
        }
    });
    
    return structure;
}

/**
 * 渲染目录
 */
function renderTOC(container, items) {
    container.innerHTML = '';
    
    items.forEach(item => {
        const li = document.createElement('li');
        
        // 主标题
        const link = document.createElement('a');
        link.href = `#${item.id}`;
        link.textContent = item.text;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToHeading(item.id);
        });
        li.appendChild(link);
        
        // 子标题
        if (item.children.length > 0) {
            const ul = document.createElement('ul');
            item.children.forEach(child => {
                const childLi = document.createElement('li');
                const childLink = document.createElement('a');
                childLink.href = `#${child.id}`;
                childLink.textContent = child.text;
                childLink.style.paddingLeft = '12px';
                childLink.style.fontSize = '12px';
                childLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    scrollToHeading(child.id);
                });
                childLi.appendChild(childLink);
                ul.appendChild(childLi);
            });
            li.appendChild(ul);
        }
        
        container.appendChild(li);
    });
}

/**
 * 设置滚动间谍
 */
function setupScrollSpying() {
    const headings = document.querySelectorAll('[id^="heading-"]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const tocLinks = document.querySelectorAll('.blog-toc a');
            tocLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            // 标记当前可见的标题
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const correspondingLink = document.querySelector(`.blog-toc a[href="#${e.target.id}"]`);
                    if (correspondingLink) {
                        correspondingLink.classList.add('active');
                    }
                }
            });
        });
    }, {
        threshold: [0.1, 0.5, 0.9]
    });
    
    headings.forEach(heading => {
        observer.observe(heading);
    });
}

/**
 * 平滑滚动到标题
 */
function scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (heading) {
        heading.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // 更新 URL
        window.history.replaceState(null, null, `#${headingId}`);
    }
}

/**
 * 处理页面加载时的锚点
 */
window.addEventListener('load', function() {
    const hash = window.location.hash;
    if (hash) {
        setTimeout(() => {
            scrollToHeading(hash.slice(1));
        }, 100);
    }
});