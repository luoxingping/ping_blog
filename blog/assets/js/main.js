/**
 * 主页面交互脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeAnchorLinks();
    checkScrollPosition();
});

/**
 * 初始化事件监听
 */
function initializeEventListeners() {
    // 文章卡片点击
    const articleItems = document.querySelectorAll('.article-item');
    articleItems.forEach(item => {
        item.addEventListener('click', function() {
            const titleEl = this.querySelector('.article-title');
            if (titleEl) {
                navigateToArticle(titleEl.textContent);
            }
        });
    });
    
    // 特色文章点击
    const featuredTitles = document.querySelectorAll('.featured-title');
    featuredTitles.forEach(title => {
        title.addEventListener('click', function() {
            navigateToArticle(this.textContent);
        });
    });
    
    // 返回顶部
    window.addEventListener('scroll', handleScrollToTop);
}

/**
 * 初始化锚点链接
 */
function initializeAnchorLinks() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * 文章导航
 */
function navigateToArticle(articleTitle) {
    // 文章标题到 URL 的映射
    const articleMap = {
        'VPC 网络架构深度解析': '../blog/pages/vpc_design.html',
        'Keepalived+VRRP 原理与脑裂防护': '../blog/pages/keepalived_vrrp.html',
        'iptables 五链四表与 ipset 优化': '../blog/pages/iptables_ipset.html',
        '虚机网络故障完整排查指南': '../blog/pages/network_troubleshooting.html',
        '云平台高可用架构设计': '../blog/pages/ha_architecture.html',
        'conntrack 连接跟踪与优化': '../blog/pages/conntrack_optimization.html',
        '灰度发布、流量排空与自动回滚': '../blog/pages/canary_deployment.html',
        'ARM/欧拉/麒麟兼容实战': '../blog/pages/arm_compatibility.html',
        'x86 迁移 ARM 常见问题': '../blog/pages/arm_migration.html',
        '统一构建+多架构发布 CI/CD': '../blog/pages/multiarch_cicd.html',
        '欧拉/麒麟/CentOS 系统差异': '../blog/pages/os_comparison.html',
        '零停机升级、可回滚、数据安全': '../blog/pages/zero_downtime_upgrade.html',
        '编译构建优化：2h → 1h': '../blog/pages/build_optimization.html',
        '灾难恢复与快速回滚方案': '../blog/pages/disaster_recovery.html',
        '等保二级安全改造与落地': '../blog/pages/compliance_security.html',
        '故障案例 1：VIP 脑裂导致瘫痪': '../blog/pages/fault_case_vip_split.html',
        '故障案例 2：Python3 升级编码错误': '../blog/pages/fault_case_python3.html',
        '故障案例 3：编译卡死与优化': '../blog/pages/fault_case_compile.html',
    };
    
    const url = articleMap[articleTitle.trim()];
    if (url) {
        window.location.href = url;
    } else {
        console.warn('Article not found:', articleTitle);
    }
}

/**
 * 滚动到顶部按钮处理
 */
function handleScrollToTop() {
    const scrollPos = window.scrollY;
    const threshold = 300;
    
    // 可以在这里添加返回顶部按钮的逻辑
    if (scrollPos > threshold) {
        // 显示返回顶部按钮
    } else {
        // 隐藏返回顶部按钮
    }
}

/**
 * 检查滚动位置
 */
function checkScrollPosition() {
    const elements = document.querySelectorAll('[data-animate-on-scroll]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => observer.observe(el));
}

/**
 * 工具函数：获取 URL 参数
 */
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * 工具函数：防抖
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 工具函数：节流
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}