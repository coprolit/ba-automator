// Probability methods:
/* function toHitProbability(shots: number, modifier: number) {
  // to hit penalty is more than -3 = nigh imposible shot = requires a 6 followed by a 6.
  const factor = modifier < -3 ? 1/6 * 1/6 : (4 + modifier) / 6;
  return shots * factor;
}

function toDamageProbability(toHit: number, pen: number, damageValue: number) {
  return toHit * (7 - damageValue - pen) / 6;
}

function getProbabilities(weapons: Weapon[]) {
  const unit = selections.unit;
  const damageValue = selections.target;
  const modifiersTotal = selections.cover + selections.range + selections.down + selections.unit.toHit;
  const toHitProb = Number(toHitProbability(getShots(unit.models).length, modifiersTotal).toFixed(2));
  const toDamageProb = toDamageProbability(toHitProb, 0, damageValue).toFixed(2);
  
  return {
    toHit: toHitProb,
    toDamage: toDamageProb
  }
}

function updateProbabilities() {
  const damageValue = selections.target;
  const modifiersTotal = getToHitModifiers(0);
  const probabilities = getProbabilities(selectedWeapons);
  
  document.querySelector('.hits').innerHTML = probabilities.toHit.toString();
  document.querySelector('.casualties').innerHTML = probabilities.toDamage;
  document.querySelector('.modifiers .result').innerHTML = `
       To hit modifier: ${modifiersTotal < -3 ? '∞' : modifiersTotal } | Target damage value: ${damageValue}
  `
} */