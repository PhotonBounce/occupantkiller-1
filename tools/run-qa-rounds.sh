#!/bin/bash
cd /home/user/occupantkiller-1
P=4340
for spec in "915 412 wide" "760 360 short"; do
  set -- $spec; W=$1; H=$2; TAG=$3
  echo "=== ROUND $TAG ($W x $H) ==="
  pkill -9 -f chromium 2>/dev/null; sleep 2
  P=$((P+1))
  node tools/qa-device.js $P 0 tools/qa-fix-$TAG.png $W $H
  echo "exit=$? for $TAG"
done
echo "ALL_ROUNDS_DONE"
