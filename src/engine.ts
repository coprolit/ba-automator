import {Army, Model, Selections, Shot, Hit, Damage, Weapon} from './models';

const rifle = {
  name: "Rifle",
  range: 24,
  shots: 1,
  pen: 0
}
const smg = {
  name: "SMG",
  range: 12,
  shots: 2,
  pen: 0
}
const atr = {
  name: "Anti-tank Rifle",
  range: 36,
  shots: 1,
  pen: 2
}
const assaultRifle = {
  name: "Assault Rifle",
  range: 18,
  shots: 2,
  pen: 0
}
const autoRifle = {
  name: "Automatic Rifle",
  range: 30,
  shots: 2,
  pen: 0
}
const lmg = {
  name: "LMG",
  range: 36,
  shots: 4,
  pen: 0
}
const panzerfaust = {
  name: "Panzerfaust",
  range: 12,
  shots: 1,
  pen: 6
}
const unarmed = {
  name: "Unarmed",
  range: 0,
  shots: 0,
  pen: 0
}

const weapons: Weapon[] = [
  rifle, smg, assaultRifle, autoRifle, lmg, atr, panzerfaust, unarmed, 
]

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
const selections: Selections = {
  unit: null,
  range: 0,
  cover: 0,
  target: 4,
  down: 0
}

const selectedWeapons: Weapon[] = [];

// Combat utility methods:
function shoot(models: Array<Model>, modifier: number, damageValue: number): Shot[] {
  
  // Resolve each shot:
  const shots: Shot[] = getShots(models)
    // resolve hit rolls:
    .map((shot: Shot) => {
      return {
       ...shot,
       hit: rollToHit(modifier)
      } 
    })
    // resolve damage rolls:
    .map((shot: Shot) => {
      return {
        ...shot,
        damage: shot.hit.success ? rollToDamage(shot.weapon.pen, damageValue) : null
      }
    });
  
  return shots;
}

function getShots(models: Model[]) {
  // from models, map over to shots:
  return models.flatMap(model => {
    // 1-element array to keep the item,
    // a multiple-element array to add items,
    // or a 0-element array to remove the item.
    const shots = [];
    for(let i = 0; i < model.weapon.shots; i++) {
      shots.push({
        weapon: model.weapon
      });
    }
    return shots;
  })
}

function rollToHit(modifier: number): Hit {
  // Roll 1d6 + to hit modifiers per shot.
  
  // Roll of a 1 is always a failure.
  
  // If modifier is more than -3 (nigh impossible shot),
  // need to roll a 6 followed by a 6.

  // Result > 2 = successful hit.

  const dice: number = roll();
  
  // If modifier is more severe than -3 = nigh impossible shot.
  // Need to roll a 6 followed by a 6 to succeed:
  const imposSuccess = modifier < -3 && dice === 6 && roll() === 6;

  // Result is either a failure, the dice roll (2-6), or a nigh impossible success
  let result = dice === 1 ? 'F' : (imposSuccess ? '∞' : dice);
  
  return {
    roll: result,
    modifier: modifier,
    success: dice !== 1 && (imposSuccess || dice + modifier > 2)
  };
}

function rollToDamage(pen: number, damageValue: number): Damage {
  // Roll 1d6 + Pen value for each hit.
  // Result >= Damage value  = damage
  // An unmodified roll of 1 always fails to damage.
  const result = roll();
  let total = result === 1 ? 'F' : result + pen;
  
  return {
    roll: total,
    modifier: pen,
    success: result !== 1 && result + pen >= damageValue,
    crit: result === 6 && roll() === 6
  };
}

function roll(): number {
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
  const result: Shot[] = shoot(unit.models, toHitModifiers, damageValue);
  
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
function toHitProbability(shots: number, modifier: number) {
  // to hit penalty is more than -3 = nigh imposible shot = requires a 6 followed by a 6.
  const factor = modifier < -3 ? 1/6 * 1/6 : (4 + modifier) / 6;
  return shots * factor;
}

function toDamageProbability(toHit: number, pen: number, damageValue: number) {
  return toHit * (7 - damageValue - pen) / 6;
}

function getProbabilities() {
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
  const unit = selections.unit;
  const damageValue = selections.target;
  const modifiersTotal = getToHitModifiers();
  const probabilities = getProbabilities();
  
  document.querySelector('.hits').innerHTML = probabilities.toHit.toString();
  document.querySelector('.casualties').innerHTML = probabilities.toDamage;
  document.querySelector('.modifiers .result').innerHTML = `
       To hit modifier: ${modifiersTotal < -3 ? '∞' : modifiersTotal } | Target damage value: ${damageValue}
  `
}

// UI:

// populate weapons selector:
document.querySelector('#addWeapon select').innerHTML =
  weapons
    .map((weapon, index) =>
      `<option value="${index}">${weapon.name}</option>`
     ).join('');

// populate unit selector:
/* document.querySelector('.units form').innerHTML =
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
     ).join(''); */

// form handlers:

const formWeapons: HTMLFormElement = document.querySelector('#addWeapon');
formWeapons.addEventListener('submit', (event: Event) => {
  event.preventDefault();

  const formdata = new FormData(formWeapons);
  const amount = Number(formdata.get('amount'));
  const selectedWeaponType = weapons[Number(formdata.get('type'))];
  
  for (let i = 0; i < amount; i++) {
    selectedWeapons.push(selectedWeaponType)
  }

  document.querySelector('.selection').insertAdjacentHTML('afterbegin', `
    <div>${formdata.get('amount')} ${weapons[Number(formdata.get('type'))].name}</div>
  `)
});

const weaponsSubmit: HTMLHtmlElement = document.querySelector('.selection input');
weaponsSubmit.addEventListener('click', () => {
  // sort weapon types:
  selectedWeapons.sort((a, b) => {
    let comparison = 0;
    if (a.name > b.name) {
      comparison = 1;
    } else if (a.name < b.name) {
      comparison = -1;
    }
    return comparison;
  });

  
  document.querySelector('.modifiers .weapons').innerHTML = `
    ${selectedWeapons.map((weapon, index) => 
      `<div>
        ${weapon.name} :
        <input type="radio" id="close" value="1" name="${weapon.name}${index}">
        <label for="close">close</label>
    
        <input type="radio" id="short" value="0" name="${weapon.name}${index}" checked>
        <label for="short">short</label>
    
        <input type="radio" id="long" value="-1" name="${weapon.name}${index}">
        <label for="long">long</label>
        
        ${weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
          '<input type="checkbox" id="missing" name="loader" value="-1">' +
          '<label for="loader">no loader</label>' : ''
        }
      </div>`
    ).join('')}
  `;
  console.log(selectedWeapons)
})

const formUnits = document.querySelector('.units form');
formUnits.addEventListener('change', (event: Event) => {
  // set selected unit:
  const index: number = Number((<HTMLInputElement>event.target).value);
  selections.unit = armies[0].units[index];
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