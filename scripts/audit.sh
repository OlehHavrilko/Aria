#!/bin/bash

# OmniShell OS - Initialization Script
# This script demonstrates the system's ability to audit the environment.

echo -e "\x1b[1;32m[SYSTEM] Starting OmniShell Audit...\x1b[0m"
sleep 0.5

echo -e "\x1b[1;34m[OS]\x1b[0m Kernel: $(uname -srm)"
echo -e "\x1b[1;34m[USER]\x1b[0m Current: $(whoami)"
echo -e "\x1b[1;34m[DIR]\x1b[0m Working: $(pwd)"

echo -e "\n\x1b[1;33m[RESOURCES]\x1b[0m"
df -h | head -n 2

echo -e "\n\x1b[1;35m[AI CAPABILITIES]\x1b[0m"
echo " - Terminal Integration: ONLINE"
echo " - Script Orchestration: READY"
echo " - YOLO Mode Status: $([ "$1" == "--yolo" ] && echo -e "\x1b[31mACOUSTIC [DANGEROUS]\x1b[0m" || echo "Passive")"

echo -e "\n\x1b[1;32m[AUDIT COMPLETE] OmniShell is ready for instructions.\x1b[0m"
