/**
 * 搜索功能脚本
 */

let searchIndex = {};
let articleData = [];

// 页面加载时初始化搜索
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    loadArticleData();
});

/**
 * 初始化搜索功能
 */
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    // 实时搜索
    searchInput.addEventListener('input', debounce(performSearch, 300));
    
    // 搜索历史
    searchInput.addEventListener('focus', showSearchHistory);
}

/**
 * 加载文章数据
 */
function loadArticleData() {
    // 从 JSON 加载或本地构建
    articleData = [
        {
            id: 1,
            title: 'VPC 网络架构深度解析',
            url: '../blog/pages/vpc_design.html',
            category: 'network',
            keywords: ['VPC', '虚拟路由', '数据包', '架构', '网络层', 'OVS', 'Linux Bridge'],
            description: '从虚机到外部网络的完整数据包路径'
        },
        {
            id: 2,
            title: 'Keepalived+VRRP 工作原理与脑裂防护',
            url: '../blog/pages/keepalived_vrrp.html',
            category: 'ha',
            keywords: ['Keepalived', 'VRRP', '脑裂', '高可用', 'HA', '主备', '故障转移'],
            description: '高可用主备机制和脑裂解决方案'
        },
        {
            id: 3,
            title: 'iptables 五链四表与 ipset 性能优化',
            url: '../blog/pages/iptables_ipset.html',
            category: 'network',
            keywords: ['iptables', 'ipset', '防火墙', '安全组', '性能优化', '规则匹配'],
            description: '防火墙原理和性能优化方案'
        },
        {
            id: 4,
            title: '虚机网络故障完整排查指南',
            url: '../blog/pages/network_troubleshooting.html',
            category: 'troubleshooting',
            keywords: ['故障排查', '网络诊断', 'tcpdump', 'ping', 'traceroute', '工具'],
            description: '网络故障诊断和排查工具详解'
        },
        {
            id: 5,
            title: '云平台高可用架构设计',
            url: '../blog/pages/ha_architecture.html',
            category: 'ha',
            keywords: ['高可用', '架构设计', '容错', '单点故障', '设计模式'],
            description: '云平台高可用架构设计和实现'
        },
        {
            id: 6,
            title: 'conntrack 连接跟踪与优化',
            url: '../blog/pages/conntrack_optimization.html',
            category: 'network',
            keywords: ['conntrack', 'NAT', '连接跟踪', '优化', '性能调优'],
            description: '连接跟踪表管理和优化'
        },
        {
            id: 7,
            title: '灰度发布、流量排空与自动回滚',
            url: '../blog/pages/canary_deployment.html',
            category: 'deployment',
            keywords: ['灰度发布', '流量切换', '自动回滚', '发布策略', '零停机'],
            description: '灰度发布和自动回滚方案'
        },
        {
            id: 8,
            title: 'ARM/欧拉/麒麟兼容实战',
            url: '../blog/pages/arm_compatibility.html',
            category: 'arm',
            keywords: ['ARM', '欧拉', '麒麟', '国产化', '兼容', '适配'],
            description: '国产化系统兼容和适配'
        },
        {
            id: 9,
            title: 'x86 迁移 ARM 常见问题',
            url: '../blog/pages/arm_migration.html',
            category: 'arm',
            keywords: ['x86', 'ARM', '迁移', 'GCC', '二进制', '兼容'],
            description: 'x86 到 ARM 的迁移方案'
        },
        {
            id: 10,
            title: '统一构建+多架构发布 CI/CD',
            url: '../blog/pages/multiarch_cicd.html',
            category: 'arm',
            keywords: ['CI/CD', '构建', '多架构', '自动化', '流水线'],
            description: '多架构的 CI/CD 流水线设计'
        },
        {
            id: 11,
            title: '欧拉/麒麟/CentOS 系统差异',
            url: '../blog/pages/os_comparison.html',
            category: 'arm',
            keywords: ['欧拉', '麒麟', 'CentOS', '系统对比', '差异'],
            description: '国产 OS 与开源 OS 的差异'
        },
        {
            id: 12,
            title: '零停机升级、可回滚、数据安全',
            url: '../blog/pages/zero_downtime_upgrade.html',
            category: 'deployment',
            keywords: ['零停机', '升级', '回滚', '数据一致性', '安全'],
            description: '零停机升级和数据安全保障'
        },
        {
            id: 13,
            title: '编译构建优化：2h → 1h',
            url: '../blog/pages/build_optimization.html',
            category: 'optimization',
            keywords: ['编译', '构建优化', '性能', '效率', '并发'],
            description: '编译构建时间优化案例'
        },
        {
            id: 14,
            title: '灾难恢复与快速回滚方案',
            url: '../blog/pages/disaster_recovery.html',
            category: 'deployment',
            keywords: ['灾难恢复', '回滚', 'DR', '自动化', '应急'],
            description: '灾难恢复和快速恢复方案'
        },
        {
            id: 15,
            title: '等保二��安全改造与落地',
            url: '../blog/pages/compliance_security.html',
            category: 'security',
            keywords: ['等保二级', '安全', '合规', '权限', '审计'],
            description: '等保二级合规改造方案'
        },
        {
            id: 16,
            title: '故障案例 1：VIP 脑裂导致瘫痪',
            url: '../blog/pages/fault_case_vip_split.html',
            category: 'case',
            keywords: ['故障案例', '脑裂', 'VIP', '复盘', '定位'],
            description: 'VIP 脑裂故障详细复盘'
        },
        {
            id: 17,
            title: '故障案例 2：Python3 升级编码错误',
            url: '../blog/pages/fault_case_python3.html',
            category: 'case',
            keywords: ['故障案例', 'Python3', '编码', '升级', '修复'],
            description: 'Python3 升级故障复盘'
        },
        {
            id: 18,
            title: '故障案例 3：编译卡死与优化',
            url: '../blog/pages/fault_case_compile.html',
            category: 'case',
            keywords: ['故障案例', '编译', '卡死', '性能', '优化'],
            description: '编译卡死故障和优化方案'
        }
    ];
    
    buildSearchIndex();
}

/**
 * 构建搜索索引
 */
function buildSearchIndex() {
    searchIndex = {};
    articleData.forEach(article => {
        const searchableContent = [
            article.title,
            article.description,
            ...article.keywords
        ].join(' ').toLowerCase();
        
        searchIndex[article.id] = {
            ...article,
            searchableContent: searchableContent
        };
    });
}

/**
 * 执行搜索
 */
function performSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (!query) {
        clearSearchResults();
        return;
    }
    
    const results = searchArticles(query);
    displaySearchResults(results, query);
    saveSearchHistory(query);
}

/**
 * 搜索文章
 */
function searchArticles(query) {
    const results = [];
    
    Object.values(searchIndex).forEach(article => {
        // 计算相关性分数
        let score = 0;
        
        // 标题精确匹配得分最高
        if (article.title.toLowerCase().includes(query)) {
            score += 100;
        }
        
        // 关键词匹配
        article.keywords.forEach(keyword => {
            if (keyword.toLowerCase().includes(query)) {
                score += 50;
            }
        });
        
        // 描述匹配
        if (article.description.toLowerCase().includes(query)) {
            score += 25;
        }
        
        if (score > 0) {
            results.push({
                ...article,
                score: score
            });
        }
    });
    
    // 按分数排序
    return results.sort((a, b) => b.score - a.score);
}

/**
 * 显示搜索结果
 */
function displaySearchResults(results, query) {
    const articlesContainer = document.querySelector('.category-content');
    if (!articlesContainer) return;
    
    // 清空当前内容
    articlesContainer.innerHTML = '';
    
    if (results.length === 0) {
        articlesContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                未找到相关文章：${query}
            </div>
        `;
        return;
    }
    
    // 显示搜索结果
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'article-item';
        item.innerHTML = `
            <div class="article-title">${highlightQuery(result.title, query)}</div>
            <div style="font-size: 12px; color: #999; margin-top: 5px;">${result.description}</div>
            <div class="tags" style="margin-top: 8px;">
                ${result.keywords.slice(0, 3).map(k => `<span class="tag">${k}</span>`).join('')}
            </div>
        `;
        item.addEventListener('click', () => {
            window.location.href = result.url;
        });
        articlesContainer.appendChild(item);
    });
}

/**
 * 高亮查询关键词
 */
function highlightQuery(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background: #fff3cd;">$1</mark>');
}

/**
 * 清除搜索结果
 */
function clearSearchResults() {
    const articlesContainer = document.querySelector('.category-content');
    if (articlesContainer) {
        // 恢复原始内容或重新加载
        location.reload();
    }
}

/**
 * 搜索历史管理
 */
function saveSearchHistory(query) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(h => h !== query);
    history.unshift(query);
    history = history.slice(0, 10); // 只保留最近 10 条
    localStorage.setItem('searchHistory', JSON.stringify(history));
}

/**
 * 显示搜索历史
 */
function showSearchHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (history.length === 0) return;
    
    // 可以在这里显示搜索历史的 UI
    console.log('搜索历史:', history);
}

/**
 * 防抖函数
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