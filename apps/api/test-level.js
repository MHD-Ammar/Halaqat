const XP_LEVEL_CURVE = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000,
];

function calculateLevelFromXp(totalXp) {
  if (totalXp <= 0) return 1;

  for (let i = XP_LEVEL_CURVE.length - 1; i >= 0; i--) {
    if (totalXp >= XP_LEVEL_CURVE[i]) {
      return i + 1;
    }
  }
  return 1;
}

console.log("0 XP -> Level", calculateLevelFromXp(0), "(Expected: 1)");
console.log("50 XP -> Level", calculateLevelFromXp(50), "(Expected: 1)");
console.log("100 XP -> Level", calculateLevelFromXp(100), "(Expected: 2)");
console.log("150 XP -> Level", calculateLevelFromXp(150), "(Expected: 2)");
console.log("999 XP -> Level", calculateLevelFromXp(999), "(Expected: 4)");
console.log("1000 XP -> Level", calculateLevelFromXp(1000), "(Expected: 5)");
console.log("2200 XP -> Level", calculateLevelFromXp(2200), "(Expected: 7)");
console.log("20000 XP -> Level", calculateLevelFromXp(20000), "(Expected: 20)");
