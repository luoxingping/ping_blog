#!/bin/bash

# Keepalived 通知脚本
# 在 Keepalived 角色变化时执行
# 用法：keepalived_notify.sh [MASTER|BACKUP|FAULT|STOP]

set -e

VIP="10.0.1.1"
PEER_IP="172.16.0.2"
ALERT_URL="http://monitor:8080/alert"
LOG_FILE="/var/log/keepalived_notify.log"

# ============================================
# 日志记录
# ============================================

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] $@" | tee -a "$LOG_FILE"
}

# ============================================
# 成为 Master
# ============================================

on_master() {
    log "=== 成为 MASTER ==="
    
    # 1. 确保 VIP 在本机
    ip addr show | grep -q "$VIP" 2>/dev/null
    if [ $? -eq 0 ]; then
        log "✓ VIP $VIP 已存在"
    else
        log "⚠️ VIP $VIP 不存在，添加中..."
        ip addr add $VIP/24 dev eth0 label eth0:vip 2>/dev/null || true
        log "✓ VIP 已添加"
    fi
    
    # 2. 启用路由转发
    echo 1 > /proc/sys/net/ipv4/ip_forward
    log "✓ IP 转发已启用"
    
    # 3. 启用 NAT
    if [ -n "$(which iptables)" ]; then
        # SNAT 规则应该已经通过配置文件加载，这里可以验证
        iptables -L -n -t nat | grep -q "SNAT"
        if [ $? -eq 0 ]; then
            log "✓ NAT 规则已加载"
        else
            log "⚠️ NAT 规则未加载"
        fi
    fi
    
    # 4. 检查关键服务
    local services=("vyos-services" "keepalived" "nginx")
    for service in "${services[@]}"; do
        systemctl is-active "$service" > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            log "⚠️ 服务 $service 未运行，尝试启动..."
            systemctl start "$service" 2>/dev/null || true
        else
            log "✓ 服务 $service 正常"
        fi
    done
    
    # 5. 发送告警（Slack / 钉钉 / 企业微信）
    send_alert "keepalived_master" "已成为 MASTER，VIP: $VIP"
    
    log "✓ MASTER 角色激活完成"
    return 0
}

# ============================================
# 成为 Backup
# ============================================

on_backup() {
    log "=== 成为 BACKUP ==="
    
    # 1. 验证 VIP 是否由 Master 持有
    # （这里不主动删除 VIP，让 Keepalived 处理）
    
    log "✓ BACKUP 角色激活完成，等待心跳..."
    return 0
}

# ============================================
# 故障状态
# ============================================

on_fault() {
    log "=== 进入故障状态 ==="
    
    # 1. 移除 VIP（防止脑裂）
    ip addr del $VIP/24 dev eth0 label eth0:vip 2>/dev/null || true
    log "✓ VIP 已从本机移除"
    
    # 2. 禁用转发
    echo 0 > /proc/sys/net/ipv4/ip_forward 2>/dev/null || true
    log "✓ IP 转发已禁用"
    
    # 3. 发送紧急告警
    send_alert "keepalived_fault" "进入故障状态！可能发生了脑裂或其他严重问题"
    
    log "❌ 故障状态 - 需要人工介入"
    return 1
}

# ============================================
# 停止
# ============================================

on_stop() {
    log "=== Keepalived 停止 ==="
    
    # 清理环境
    ip addr del $VIP/24 dev eth0 label eth0:vip 2>/dev/null || true
    echo 0 > /proc/sys/net/ipv4/ip_forward 2>/dev/null || true
    
    send_alert "keepalived_stop" "Keepalived 已停止"
    
    log "✓ Keepalived 已安全停止"
    return 0
}

# ============================================
# 发送告警
# ============================================

send_alert() {
    local event=$1
    local message=$2
    local host=$(hostname)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 发送到监控系统
    if [ -n "$ALERT_URL" ]; then
        curl -s -X POST "$ALERT_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"event\": \"$event\",
                \"message\": \"$message\",
                \"host\": \"$host\",
                \"timestamp\": \"$timestamp\"
            }" > /dev/null 2>&1 || true
    fi
    
    # 记录到系统日志
    logger -t keepalived "$event: $message"
}

# ============================================
# 主函数
# ============================================

main() {
    local action=${1:-"UNKNOWN"}
    
    case "$action" in
        MASTER)
            on_master
            ;;
        BACKUP)
            on_backup
            ;;
        FAULT)
            on_fault
            ;;
        STOP)
            on_stop
            ;;
        *)
            log "❌ 未知的操作: $action"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"