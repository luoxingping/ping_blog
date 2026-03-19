#!/bin/bash

# ipset 批量同步脚本
# 用于高效更新安全组规则，支持原子操作
# 用法：bash ipset_sync.sh <ipset_file> [--atomic]

set -e

IPSET_FILE=${1:-/tmp/ipset.rules}
ATOMIC=${2:-"--atomic"}
BACKUP_DIR="/var/backups/ipset"
LOG_FILE="/var/log/ipset_sync.log"

# ============================================
# 日志记录
# ============================================

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] $@" | tee -a "$LOG_FILE"
}

# ============================================
# 备份当前 ipset
# ============================================

backup_current_ipset() {
    log "✓ 备份当前 ipset..."
    
    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/ipset-backup-$(date +%Y%m%d-%H%M%S)"
    
    ipset save > "$backup_file"
    log "✓ 备份完成: $backup_file"
}

# ============================================
# 验证 ipset 文件格式
# ============================================

validate_ipset_file() {
    log "✓ 验证 ipset 文件格式..."
    
    if [ ! -f "$IPSET_FILE" ]; then
        log "❌ 文件不存在: $IPSET_FILE"
        return 1
    fi
    
    # 检查是否包含基本的 ipset 命令
    if ! grep -q "^create\|^add\|^commit" "$IPSET_FILE"; then
        log "❌ 文件格式无效"
        return 1
    fi
    
    log "✓ 文件格式验证通过"
    return 0
}

# ============================================
# 执行 ipset 同步（原子模式）
# ============================================

sync_ipset_atomic() {
    log "✓ 执行原子 ipset 同步..."
    
    if ipset restore < "$IPSET_FILE" 2>/dev/null; then
        log "✓ ipset 同步成功（原子操作）"
        return 0
    else
        log "❌ ipset 同步失败"
        log "🔄 尝试恢复备份..."
        restore_from_backup
        return 1
    fi
}

# ============================================
# 执行 ipset 同步（非原子模式）
# ============================================

sync_ipset_normal() {
    log "✓ 执行普通 ipset 同步..."
    
    local errors=0
    
    while IFS= read -r line; do
        # 跳过注释和空行
        [[ "$line" =~ ^# ]] && continue
        [[ -z "$line" ]] && continue
        
        # 执行命令
        if ! eval "$line" 2>/dev/null; then
            log "⚠️ 命令执行失败: $line"
            errors=$((errors + 1))
        fi
    done < "$IPSET_FILE"
    
    if [ $errors -eq 0 ]; then
        log "✓ ipset 同步成功"
        return 0
    else
        log "❌ 共有 $errors 个命令执行失败"
        return 1
    fi
}

# ============================================
# 验证同步结果
# ============================================

verify_sync() {
    log "✓ 验证同步结果..."
    
    # 检查 ipset 是否正常加载
    local ipset_count=$(ipset list -n | wc -l)
    if [ "$ipset_count" -gt 0 ]; then
        log "✓ 已加载 $ipset_count 个 ipset 集合"
        
        # 列出所有集合
        log "已加载的 ipset 集合:"
        ipset list -n | while read set_name; do
            local entry_count=$(ipset list "$set_name" | grep -c "^[0-9]" || echo 0)
            log "  - $set_name: $entry_count 条规则"
        done
        
        return 0
    else
        log "❌ 未检测到 ipset 集合"
        return 1
    fi
}

# ============================================
# 从备份恢复
# ============================================

restore_from_backup() {
    log "🔄 尝试从备份恢复..."
    
    local latest_backup=$(ls -t "$BACKUP_DIR"/ipset-backup-* 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        log "恢复备份: $latest_backup"
        if ipset restore < "$latest_backup"; then
            log "✓ 从备份恢复成功"
            return 0
        fi
    fi
    
    log "❌ 恢复失败，需要人工修复"
    return 1
}

# ============================================
# 性能测试
# ============================================

performance_test() {
    log "✓ 执行性能测试..."
    
    local test_set="test_perf_$(date +%s)"
    
    # 创建测试集合
    ipset create "$test_set" hash:net 2>/dev/null
    
    # 测试添加速度
    local start_time=$(date +%s%N)
    for i in {1..1000}; do
        ipset add "$test_set" "192.168.$((i/256)).$((i%256))" 2>/dev/null
    done
    local end_time=$(date +%s%N)
    
    local duration=$((($end_time - $start_time) / 1000000))  # 转换为毫秒
    log "✓ 添加 1000 条规则耗时: ${duration}ms"
    
    # 测试查询速度
    start_time=$(date +%s%N)
    for i in {1..1000}; do
        ipset test "$test_set" "192.168.$((i/256)).$((i%256))" 2>/dev/null
    done
    end_time=$(date +%s%N)
    
    duration=$((($end_time - $start_time) / 1000000))
    log "✓ 查询 1000 次耗时: ${duration}ms"
    
    # 清理测试集合
    ipset destroy "$test_set" 2>/dev/null
}

# ============================================
# 主函数
# ============================================

main() {
    log "==== ipset 批量同步开始 ===="
    
    # 检查权限
    if [ "$EUID" -ne 0 ]; then
        log "❌ 需要 root 权限"
        exit 1
    fi
    
    # 执行步骤
    validate_ipset_file || exit 1
    backup_current_ipset
    
    if [ "$ATOMIC" = "--atomic" ]; then
        sync_ipset_atomic || exit 1
    else
        sync_ipset_normal || exit 1
    fi
    
    verify_sync || exit 1
    performance_test
    
    log "==== ipset 批量同步完成 ===="
    return 0
}

# 执行主函数
main