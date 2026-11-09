set -e
for round in 1 2 3; do
 case "$round" in 1) versions='m05 initial optimized';; 2) versions='optimized m05 initial';; 3) versions='initial optimized m05';; esac
 for version in $versions; do
  case "$version" in m05) port=5174;; initial) port=5175;; optimized) port=5173;; esac
  ROUNDS=1 TEST_PORT=$port taskset -c 0,1 node scripts/browser-nature-profile.mjs "$version-r$round" > "work/061-$version-r$round.log" 2>&1
 done
done
