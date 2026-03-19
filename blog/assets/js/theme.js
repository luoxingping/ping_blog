/**
 * 主题切换功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 获取 HTML 元素
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    // 初始化主题
    function initTheme() {
        // 优先读取 localStorage，否则根据系统偏好设置
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            // 检查系统是否偏好暗色模式
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        }
    }
    
    // 设置主题
    function setTheme(theme) {
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeText) themeText.textContent = '亮色模式';
            localStorage.setItem('theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeText) themeText.textContent = '暗色模式';
            localStorage.setItem('theme', 'light');
        }
    }
    
    // 获取当前主题
    function getCurrentTheme() {
        return html.getAttribute('data-theme') || 'light';
    }
    
    // 切换主题
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }
    
    // 绑定按钮点击事件
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // 监听系统主题变化
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }
    
    // 页面加载时初始化主题
    initTheme();
});