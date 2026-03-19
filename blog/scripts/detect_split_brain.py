#!/usr/bin/env python3

"""
Keepalived 脑裂检测脚本
用于多路径检测对端是否真的故障，避免误判导致脑裂
"""

import socket
import subprocess
import sys
import time
from datetime import datetime

class SplitBrainDetector:
    def __init__(self, peer_ip="172.16.0.2", local_ip="172.16.0.1"):
        self.peer_ip = peer_ip
        self.local_ip = local_ip
        self.vip = "10.0.1.1"
        self.paths = [
            ("ICMP", self.check_icmp),
            ("TCP", self.check_tcp),
            ("UDP", self.check_udp),
            ("Interface", self.check_interface),
        ]
        self.log_file = "/var/log/keepalived_split_brain.log"
    
    def log(self, message):
        """记录日志"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        
        # 输出到标准输出
        print(log_message)
        
        # 写入日志文件
        try:
            with open(self.log_file, 'a') as f:
                f.write(log_message + '\n')
        except:
            pass
    
    def check_icmp(self):
        """路径 1：Ping 对端"""
        try:
            result = subprocess.run(
                f"ping -c 1 -W 1 {self.peer_ip}",
                shell=True,
                capture_output=True,
                timeout=2
            )
            return result.returncode == 0
        except:
            return False
    
    def check_tcp(self):
        """路径 2：TCP 连接检测（SSH 端口）"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((self.peer_ip, 22))
            sock.close()
            return result == 0
        except:
            return False
    
    def check_udp(self):
        """路径 3：UDP 探测"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(1)
            sock.sendto(b"PROBE", (self.peer_ip, 5000))
            sock.recvfrom(1024)
            sock.close()
            return True
        except:
            return False
    
    def check_interface(self):
        """路径 4：本地网卡状态"""
        try:
            result = subprocess.run(
                "ip link show eth0 | grep -q UP",
                shell=True,
                capture_output=True
            )
            return result.returncode == 0
        except:
            return False
    
    def detect_split_brain(self):
        """综合检测逻辑"""
        reachable_paths = 0
        results = {}
        
        self.log("=== 开始脑裂检测 ===")
        
        for path_name, check_func in self.paths:
            try:
                is_ok = check_func()
                results[path_name] = is_ok
                if is_ok:
                    reachable_paths += 1
                    self.log(f"✓ {path_name} 路径: 正常")
                else:
                    self.log(f"✗ {path_name} 路径: 无法连接")
            except Exception as e:
                results[path_name] = False
                self.log(f"✗ {path_name} 路径: 错误 - {e}")
        
        # 脑裂判断逻辑
        if reachable_paths == 0:
            self.log(f"⚠️ 所有路径均无法到达对端 {self.peer_ip}")
            
            # 检查本地网络是否正常
            if results.get("Interface"):
                self.log("❌ 【脑裂检测】本地网络正常，但无法连接对端")
                self.log("❌ 风险：可能是网络分割，需要降低优先级")
                self.log("❌ 采取行动：禁用 VIP，等待管理员介入")
                return 1  # Keepalived 将应用 weight -50 降低优先级
            else:
                self.log("ℹ️ 本地网络故障，合理的故障转移")
                return 0
        else:
            self.log(f"✓ {reachable_paths}/4 路径可达，网络正常")
            self.log("✓ 无脑裂风险，保持当前优先级")
            return 0

def main():
    # 可以从命令行参数读取 IP 地址
    peer_ip = sys.argv[1] if len(sys.argv) > 1 else "172.16.0.2"
    local_ip = sys.argv[2] if len(sys.argv) > 2 else "172.16.0.1"
    
    detector = SplitBrainDetector(peer_ip=peer_ip, local_ip=local_ip)
    exit_code = detector.detect_split_brain()
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()