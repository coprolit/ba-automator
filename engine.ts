import {Army} from './models';

// TODO
// long range pen penalty

const rifle = {
  range: 24,
  shots: 1,
  pen: 0
}
const smg = {
  range: 12,
  shots: 2,
  pen: 0
}
const atr = {
  range: 36,
  shots: 1,
  pen: 2
}
const unarmed = {
  range: 0,
  shots: 0,
  pen: 0
}

// Stored army lists:
const armies: Army[] = [
  {
    name: "Red Army",
    units: [
      {
        name: "Inexperienced Rifle squad", 
        models: [
          {
            weapon: rifle,
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          }
        ],
        toHit: -1,
        damageValue: 3,
        cost: 84
      },
      {
        name: "Rifle squad", 
        models: [
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
          {
            weapon: rifle
          },
        ],
        toHit: 0,
        damageValue: 4,
        cost: 80
      },
      {
        name: "SMG squad", 
        models: [
          {
            weapon: smg
          },
          {
            weapon: smg
          },
          {
            weapon: smg
          },
          {
            weapon: smg
          },
          {
            weapon: smg
          },
          {
            weapon: smg
          },
          {
            weapon: smg
          }
        ],
        toHit: 0,
        damageValue: 4,
        cost: 91
      },
      {
        name: "Anti-tank Rifle team", 
        models: [
          {
            weapon: atr
          },
          {
            weapon: unarmed
          }
        ],
        toHit: 0,
        damageValue: 4,
        cost: 30
      }
    ],
  }
];

// Dynamic state:
const selections = {
  unit: null,
  range: 0,
  cover: 0,
  target: 4,
  down: 0
}

// Combat utility methods:
function shoot(models, modifier, damageValue) {
  
  // Resolve each shot:
  const shots = models
    // from models, map over to shots:
    .flatMap(model => {
      // 1-element array to keep the item, a multiple-element array to add items, or a 0-element array to remove the item.
      const weaponShots = [];
      
      for(let i = 0; i < model.weapon.shots; i++) {
        weaponShots.push({
          weapon: model.weapon
        });
      }
      
      return weaponShots;
    })
    // resolve hit rolls:
    .map(shot => {
      return {
       ...shot,
       hit: rollToHit(modifier)
      } 
    })
    // resolve damage rolls:
    .map(shot => {
      const damage = rollToDamage(shot.weapon.pen, damageValue);
      
      return {
        ...shot,
        damage: shot.hit.success ? damage : null
      }
    });
  
  return shots;
}

function getShots(models) {
  return models.flatMap(model => {
    // 1-element array to keep the item,
    // a multiple-element array to add items,
    // or a 0-element array to remove the item.
    const shots = [];
    for(let i = 0; i < model.weapon.shots; i++) {
      shots.push({
        pen: model.weapon.pen
      });
    }
    return shots;
  })
}

function rollToHit(modifier) {
  // Roll 1d6 + to hit modifiers per shot.
  // Roll of a 1 is always a failure.
  // Result >= 3 = hit
  // modifier is more than -3 = NIGH IMPOSSIBLE SHOT
  const result = roll();
  let total = result === 1 ? 'F' : result + modifier;
  
  // If necessary, roll for nigh impossible shot:
  let imposShot;
  if (modifier < -3 && result === 6) {
    imposShot = roll() === 6;
  }
  
  return {
    roll: imposShot ? '∞' : total,
    success: result !== 1 && (imposShot || total > 2)
  };
}

function rollToDamage(pen, damageValue) {
  // Roll 1d6 + Pen value for each hit.
  // Result >= Damage value = damage
  // An unmodified roll of 1 always fails to damage.
  const result = roll();
  let total = result === 1 ? 'F' : result + pen;
  
  return {
    roll: total,
    success: result !== 1 && result + pen >= damageValue,
    crit: result === 6 && roll() === 6
  };
}

function roll() {
  // returns a random integer from 1 to 6
  return Math.floor(Math.random() * 6) + 1;
}

function getToHitModifiers() {
  return selections.unit.toHit + selections.cover + selections.range + selections.down;
}

// Simulator
function attack() {
  if (!selections.unit) {
    return;
  }
  
  const unit = selections.unit;
  const toHitModifiers = getToHitModifiers();
  const damageValue = selections.target;
  const result = shoot(unit.models, toHitModifiers, damageValue);
  
  const probabilities = getProbabilities();
  
  document
    .querySelector('.results')
    .insertAdjacentHTML("beforeend",
      `<p>
        <div class="title">
          ${unit.name} shoots!
        </div>
        <div class="rolls">
        ${result
          .map(shot => {
            return `<span class="${shot.hit.success ? 'success' : 'failure'}">${shot.hit.roll}</span>`
          }).join('')
        } (hit rolls + hit modifiers)<br>

        ${result
          .map(shot => {
            return `<span class="${(shot.damage && shot.damage.success) ? 'success' : 'failure'}">
                ${shot.damage ? (shot.damage.crit ? 'E' : shot.damage.roll) : ''}
              </span>`
          }).join('')
        } (damage rolls + pen modifiers)
        </div>
        <div>
          Hits: <b>${result.filter(shot => shot.hit.success).length}</b> (${probabilities.toHit}) |  Casualties: <b>${result.filter(shot => shot.damage && shot.damage.success).length}</b> (${probabilities.toDamage})
        </div>
      </p>`
     );
}

// UI utility methods:
function toHitProbability(shots, modifier) {
  // to hit penalty is more than -3 = nigh imposible shot = requires a 6 followed by a 6.
  const factor = modifier < -3 ? 1/6 * 1/6 : (4 + modifier) / 6;
  return shots * factor;
}

function toDamageProbability(toHit, pen, damageValue) {
  return toHit * (7 - damageValue - pen) / 6;
}

function getProbabilities() {
  const unit = selections.unit;
  const damageValue = selections.target;
  const modifiersTotal = selections.cover + selections.range + selections.down + selections.unit.toHit;
  const toHitProb = toHitProbability(getShots(unit.models).length, modifiersTotal).toFixed(2);
  const toDamageProb = toDamageProbability(toHitProb, 0, damageValue).toFixed(2);
  
  return {
    toHit: toHitProb,
    toDamage: toDamageProb
  }
}

function updateProbabilities() {
  const unit = selections.unit;
  const damageValue = selections.target;
  const modifiersTotal = getToHitModifiers();
  const probabilities = getProbabilities();
  
  document.querySelector('.hits').innerHTML = probabilities.toHit;
  document.querySelector('.casualties').innerHTML = probabilities.toDamage;
  document.querySelector('.modifiers .result').innerHTML = `
       To hit modifier: ${modifiersTotal < -3 ? '∞' : modifiersTotal } | Target damage value: ${damageValue}
  `
}

// UI:
// populate unit selector:
document.querySelector('.units form').innerHTML =
  armies[0]
    .units
    .map((unit, index) =>
      `<input type="radio" id="${unit.name}" name="unit" value="${index}">
       <label for="${unit.name}">
        ${unit.name} 
        (${getShots(unit.models).length} shots
        / ${unit.models.length} bodies
        / range ${unit.models[0].weapon.range}
        / cost ${unit.cost} pts)
       </label>
       <br>`
     ).join('');

// form handlers:
interface ChangeEvent {
  target: HTMLInputElement;
}

const formUnits = document.querySelector('.units form');
formUnits.addEventListener('change', (event: Event) => {
  // set selected unit:
  selections.unit = armies[0].units[(<HTMLInputElement>event.target).value];
  updateProbabilities();
});

const formRange = document.querySelector('form.range');
formRange.addEventListener('change', (event: Event) => {
  // set selected unit:
  selections.range = parseInt((<HTMLInputElement>event.target).value);
  updateProbabilities();
});

const formCover = document.querySelector('form.cover');
formCover.addEventListener('change', (event: Event) => {
  // set selected unit:
  selections.cover = Number((<HTMLInputElement>event.target).value);
  updateProbabilities();
});

const formDamageValue = document.querySelector('form.damageValue');
formDamageValue.addEventListener('change', (event: Event) => {
  // set selected unit:
  selections.target = parseInt((<HTMLInputElement>event.target).value);
  updateProbabilities();
});

const checkboxDown: HTMLInputElement = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', () => {
  // set selected unit:
  selections.down = checkboxDown.checked ? -2 : 0;
  updateProbabilities();
});