#!/bin/bash

# 虚机网络诊断脚本
# 完整的 10 层网络问题诊断

set -e

TARGET_IP=${1:-"10.0.1.20"}
REPORT_FILE="/tmp/network_diagnosis_$(date +%Y%m%d_%H%M%S).txt"

# ============================================
# 日志和报告
# ============================================

echo "==== 网络诊断报告 ($(date '+%Y-%m-%d %H:%M:%S')) ====" > "$REPORT_FILE"

report() {
    echo "$@" | tee -a "$REPORT_FILE"
}

# ============================================
# 第 1 层：物理网卡
# ============================================

report ""
report "【第 1 层】物理网卡诊断"
report "========================================"

report "网卡列表："
ip link show | grep -E "^[0-9]" | tee -a "$REPORT_FILE"

report ""
report "网卡状态 (eth0)："
ethtool eth0 2>/dev/null | grep -E "Speed|Link detected" | tee -a "$REPORT_FILE" || report "⚠️ ethtool 不可用"

# ============================================
# 第 2 层：虚拟网卡
# ============================================

report ""
report "【第 2 层】虚拟网卡诊断"
report "========================================"

report "虚拟网卡信息："
ip addr show | grep -E "vnet|tap|br" | tee -a "$REPORT_FILE"

# ============================================
# 第 3 层：虚拟交换机
# ============================================

report ""
report "【第 3 层】虚拟交换机诊断 (OVS)"
report "========================================"

if command -v ovs-vsctl &> /dev/null; then
    report "OVS Bridge 列表："
    ovs-vsctl list-br | tee -a "$REPORT_FILE"
    
    report ""
    report "OVS 端口信息："
    ovs-vsctl list-ports br0 2>/dev/null | tee -a "$REPORT_FILE" || report "⚠️ 未找到 br0"
    
    report ""
    report "OVS 流表统计："
    ovs-ofctl dump-flows br0 2>/dev/null | head -20 | tee -a "$REPORT_FILE" || report "⚠️ 无法获取流表"
else
    report "Linux Bridge 信息："
    brctl show 2>/dev/null | tee -a "$REPORT_FILE" || report "⚠️ 未安装 brctl"
fi

# ============================================
# 第 4 层：网卡队列和驱动
# ============================================

report ""
report "【第 4 层】网卡队列诊断"
report "========================================"

report "RX 队列大小："
ethtool -g eth0 2>/dev/null | grep RX || report "⚠️ 无法获取队列信息"

report ""
report "丢包统计："
ip -s link show eth0 | tail -1 | tee -a "$REPORT_FILE"

# ============================================
# 第 5 层：IP 层和路由
# ============================================

report ""
report "【第 5 层】IP 层诊断"
report "========================================"

report "本机 IP 地址："
ip addr show | grep "inet " | tee -a "$REPORT_FILE"

report ""
report "路���表："
ip route show | tee -a "$REPORT_FILE"

report ""
report "默认网关："
ip route show default | tee -a "$REPORT_FILE"

# ============================================
# 第 6 层：ARP 层
# ============================================

report ""
report "【第 6 层】ARP 层诊断"
report "========================================"

report "ARP 表："
arp -n | tee -a "$REPORT_FILE"

report ""
report "网关 ARP 测试："
if ping -c 1 -W 1 10.0.1.1 &>/dev/null; then
    report "✓ 网关 10.0.1.1 可达"
else
    report "✗ 网关 10.0.1.1 不可达"
fi | tee -a "$REPORT_FILE"

# ============================================
# 第 7 层：iptables 规则
# ============================================

report ""
report "【第 7 层】防火墙规则诊断"
report "========================================"

report "FORWARD 链规则数："
iptables -L FORWARD -n | wc -l | tee -a "$REPORT_FILE"

report ""
report "安全组规则 (样本)："
iptables -L FORWARD -n -v | head -10 | tee -a "$REPORT_FILE"

report ""
report "ipset 集合："
ipset list -n 2>/dev/null | tee -a "$REPORT_FILE" || report "⚠️ ipset 不可用"

# ============================================
# 第 8 层：conntrack 连接表
# ============================================

report ""
report "【第 8 层】连接跟踪诊断"
report "========================================"

report "conntrack 连接数："
cat /proc/net/nf_conntrack 2>/dev/null | wc -l | tee -a "$REPORT_FILE" || report "⚠️ conntrack 不可用"

report ""
report "conntrack 表大小："
cat /proc/sys/net/nf_conntrack_max 2>/dev/null | tee -a "$REPORT_FILE"

report ""
report "使用率："
local count=$(cat /proc/net/nf_conntrack 2>/dev/null | wc -l)
local max=$(cat /proc/sys/net/nf_conntrack_max 2>/dev/null)
if [ $max -gt 0 ]; then
    local usage=$((count * 100 / max))
    report "conntrack 使用率: ${usage}%"
    if [ $usage -gt 80 ]; then
        report "⚠️ 警告：conntrack 使用率过高！"
    fi
fi | tee -a "$REPORT_FILE"

# ============================================
# 第 9 层：NAT 和转换
# ============================================

report ""
report "【第 9 层】NAT 诊断"
report "========================================"

report "NAT 规则："
iptables -L -n -t nat | grep SNAT | tee -a "$REPORT_FILE" || report "无 SNAT 规则"

# ============================================
# 第 10 层：DNS 和应用层
# ============================================

report ""
report "【第 10 层】DNS 诊断"
report "========================================"

report "DNS 服务器："
cat /etc/resolv.conf 2>/dev/null | grep nameserver | tee -a "$REPORT_FILE"

report ""
report "DNS 查询测试 (google.com)："
nslookup google.com 8.8.8.8 2>&1 | head -10 | tee -a "$REPORT_FILE" || report "⚠️ DNS 查询失败"

# ============================================
# 综合诊断结果
# ============================================

report ""
report "【诊断总结】"
report "========================================"

# 检查关键路径
local issues=0

# 检查网关可达性
if ! ping -c 1 -W 1 10.0.1.1 &>/dev/null; then
    report "❌ 问题 1: 网关不可达"
    issues=$((issues + 1))
else
    report "✓ 网关可达"
fi

# 检查外网可达性
if ! ping -c 1 -W 1 8.8.8.8 &>/dev/null; then
    report "❌ 问题 2: 外网不可达"
    issues=$((issues + 1))
else
    report "✓ 外网可达"
fi

# 检查 conntrack 使用率
local count=$(cat /proc/net/nf_conntrack 2>/dev/null | wc -l)
local max=$(cat /proc/sys/net/nf_conntrack_max 2>/dev/null)
if [ $max -gt 0 ] && [ $((count * 100 / max)) -gt 90 ]; then
    report "❌ 问题 3: conntrack 使用率过高"
    issues=$((issues + 1))
else
    report "✓ conntrack 使用率正常"
fi

# 检查丢包
local drops=$(ip -s link show eth0 | tail -1 | awk '{print $4}')
if [ "$drops" -gt 100 ]; then
    report "❌ 问题 4: 网卡丢包过多 ($drops)"
    issues=$((issues + 1))
else
    report "✓ 网卡丢包正常"
fi

report ""
if [ $issues -eq 0 ]; then
    report "✓✓✓ 网络诊断完成，未发现问题！"
else
    report "❌ 发现 $issues 个问题，请参考上述详细诊断信息"
fi

report ""
report "诊断报告已保存到: $REPORT_FILE"

# 显示报告
cat "$REPORT_FILE"