/**
 * 应用主脚本
 */

/**
 * 页面导航函数
 */
function navigateTo(articleTitle) {
    // 文章标题到 URL 的映射
    const articleMap = {
        'VPC 网络架构深度解析': './blog/pages/vpc_design.html',
        'Keepalived+VRRP 原理与脑裂防护': './blog/pages/keepalived_vrrp.html',
        'iptables 五链四表与 ipset 优化': './blog/pages/iptables_ipset.html',
        '虚机网络故障完整排查指南': './blog/pages/network_troubleshooting.html',
        '云平台高可用架构设计': './blog/pages/ha_architecture.html',
        'conntrack 连接跟踪与优化': './blog/pages/conntrack_optimization.html',
        '灰度发布、流量排空与自动回滚': './blog/pages/canary_deployment.html',
        'ARM/欧拉/麒麟兼容实战': './blog/pages/arm_compatibility.html',
        'x86 迁移 ARM 常见问题': './blog/pages/arm_migration.html',
        '统一构建+多架构发布 CI/CD': './blog/pages/multiarch_cicd.html',
        '欧拉/麒麟/CentOS 系统差异': './blog/pages/os_comparison.html',
        '零停机升级、可回滚、数据安全': './blog/pages/zero_downtime_upgrade.html',
        '编译构建优化：2h → 1h': './blog/pages/build_optimization.html',
        '灾难恢复与快速回滚方案': './blog/pages/disaster_recovery.html',
        '等保二级安全改造与落地': './blog/pages/compliance_security.html',
        '三权分立与最小权限实现': './blog/pages/three_separation.html',
        '操作审计与日志落地': './blog/pages/audit_logging.html',
        '多租户隔离与安全策略': './blog/pages/multi_tenant.html',
        'ARP 欺骗防护与配置深度讲解': './blog/pages/arp_security.html',
        'Ansible 自动化部署与配置': './blog/pages/ansible_deployment.html',
        '故障案例 1：VIP 脑裂导致瘫痪': './blog/pages/fault_case_vip_split.html',
        '故障案例 2：Python3 升级编码错误': './blog/pages/fault_case_python3.html',
        '故障案例 3：编译卡死与优化': './blog/pages/fault_case_compile.html',
        '万级虚机性能瓶颈诊断': './blog/pages/performance_bottleneck.html',
    };
    
    const url = articleMap[articleTitle.trim()];
    if (url) {
        window.location.href = url;
    } else {
        console.warn('Article not found:', articleTitle);
        alert('文章不存在：' + articleTitle);
    }
}

/**
 * 搜索功能
 */
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const keyword = e.target.value.toLowerCase();
            const articles = document.querySelectorAll('.article-item');
            
            articles.forEach(article => {
                const text = article.textContent.toLowerCase();
                if (text.includes(keyword)) {
                    article.style.display = 'block';
                } else {
                    article.style.display = 'none';
                }
            });
        });
    }
});