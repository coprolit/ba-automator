import {Score, WeaponShooting, Shot, Target, Weapon, WeaponResult} from './models';

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

// Dynamic state:
const selectedWeapons: WeaponShooting[] = [];
const target: Target = {
  cover: 'n',
  damageValue: 4,
  down: false
}

// Combat utility methods:

function shoot(weapons: WeaponShooting[], target: Target): WeaponResult[] {
  // Resolve the result of each shot of every firering weapon:
  return weapons
    // make hit rolls for each shot of each weapon:
    .map((weapon: WeaponShooting) => {
      const shots: Shot[] = getShots(weapon);
      const modifier = getToHitModifiers(weapon, target);

      return {
        ...weapon,
        // resolve and add hit results for each shot:
        shotsResult: shots.map(() => {
          return {
            hit: rollToHit(modifier)
          }
        })
      };
    })
    .map((weapon: WeaponResult) => {
      weapon.shotsResult = weapon.shotsResult.map((shot: Shot) => {
        // for each hit
        if (shot.hit.success) {
          return {
            ...shot,
            // resolve and add damage results:
            damage: rollToDamage(weapon.pen, target.damageValue)
          }
        } else {
          return shot;
        }
      });

      return weapon;
    });
}

function getShots(weapon: WeaponShooting): Shot[] {
  const shots = [];
  for(let i = 0; i < weapon.shots; i++) {
    // create shot:
    shots.push({});
  }
  return shots;
}

function rollToHit(modifier: number): Score {
  // Roll 1d6 + summed to hit modifiers per shot.
  
  // Roll of a 1 is always a failure.
  
  // If modifier is more than -3 (nigh impossible shot),
  // need to roll a 6 followed by a 6.

  // Result > 2 = successful hit.

  const dice: number = roll();
  
  // If to hit modifier is more severe than -3 = nigh impossible shot.
  // Need to roll a 6 followed by a 6 to succeed:
  const imposSuccess = modifier < -3 && dice === 6 && roll() === 6;

  // Result is either a failure, the dice roll (2-6), or a nigh impossible success
  let result = dice === 1 ? 'F' : (imposSuccess ? '∞' : dice);
  
  return {
    roll: result,
    modifier: modifier,
    success: dice !== 1 && (imposSuccess || dice + modifier > 2),
    crit: imposSuccess
  };
}

function rollToDamage(pen: number, damageValue: number): Score {
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

function getToHitModifiers(weapon: WeaponShooting, target: Target) {

  const coverLookup = {
    n: 0, // none
    s: -1, // soft
    h: -2, // hard
  }
  const rangeLookup = {
    c: +1, // close
    s: 0, // short
    l: -1, // long
  }

  return coverLookup[target.cover]
    + rangeLookup[weapon.modifiers.range]
    + (weapon.modifiers.moved ? -1 : 0)
    + (target.down ? -2 : 0);
}

// Simulator
function attack() {
  // Collect shooting weapons, store selected to hit modifiers:
  /* const weaponsElements = [].slice.call(document.querySelector('.modifiers .weapons').children);
  weaponsElements.forEach((element: HTMLHtmlElement) => {
    const dataAttrMap = element.dataset;
    selectedWeapons[parseInt(dataAttrMap.index)].range = 
    console.log(dataAttrMap)
  }) */
  
  // const toHitModifiers = getToHitModifiers(selectedWeapons, target);
  const result: WeaponResult[] = shoot(selectedWeapons, target);
  console.log(result)
  // displayShootingResult(result);
}

// UI:

// display shooting result:
/* function displayShootingResult(result: WeaponResult[]) {
  document
    .querySelector('.results')
    .insertAdjacentHTML("beforeend",
      `<p>
        <div class="title">
          Unit shoots!
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
          Hits: <b>${result.filter(shot => shot.hit.success).length}</b>  |  Casualties: <b>${result.filter(shot => shot.damage && shot.damage.success).length}</b>
        </div>
      </p>`
     );
} */

// populate weapons selector:
document.querySelector('#addWeapon select').innerHTML =
  weapons
    .map((weapon, index) =>
      `<option value="${index}">${weapon.name}</option>`
     ).join('');

function populateModifiersPanel(weapons: Weapon[]) {
  // display selected weapons for modifier adjustments:
  document.querySelector('.modifiers .weapons').innerHTML = `
    ${weapons.map((weapon, index) => 
      `<div data-index="${index}">
        ${weapon.name} :
        <input type="radio" id="close" value="c" name="${index}">
        <label for="close">close</label>
    
        <input type="radio" id="short" value="s" name="${index}" checked>
        <label for="short">short</label>
    
        <input type="radio" id="long" value="l" name="${index}">
        <label for="long">long</label>
        
        ${weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
          `<input type="checkbox" id="missing" name="${index}" value="nl">
          <label for="loader">no loader</label>` : ''
        }
      </div>`
    ).join('')}
  `;
}

// FORM HANDLERS:

// Add weapon to selection:
const formWeapons: HTMLFormElement = document.querySelector('#addWeapon');
formWeapons.addEventListener('submit', (event: Event) => {
  event.preventDefault();

  const formdata = new FormData(formWeapons);
  const amount = Number(formdata.get('amount'));

  // store added weapon:
  const selectedWeaponType = weapons[Number(formdata.get('type'))];
  for (let i = 0; i < amount; i++) {
    selectedWeapons.push({
      ...selectedWeaponType,
      modifiers: {
        range: 's',
        moved: false,
        loader: true
      }
    })
  }

  // display in panel:
  document.querySelector('.selection').insertAdjacentHTML('afterbegin', `
    <div>${formdata.get('amount')} ${weapons[Number(formdata.get('type'))].name}</div>
  `)
});

// Save selected weapons:
document
  .querySelector('.selection input')
  .addEventListener('click', () => {
    // sequence weapon types by name:
    selectedWeapons.sort((a, b) => {
    let comparison = 0;
    if (a.name > b.name) {
      comparison = 1;
    } else if (a.name < b.name) {
      comparison = -1;
    }
    return comparison;
  });
  
    populateModifiersPanel(selectedWeapons);
  })

// Store shooting modifiers:
document
  .querySelector('.modifiers .weapons')
  .addEventListener('change', (event: Event) => {
    const targetEl = (<HTMLInputElement>event.target); // the weapon being interacted with
    const value: string = targetEl.value;

    value === 's' || value === 'l' || value === 'c' ? 
      // update range modifier:
      selectedWeapons[parseInt(targetEl.name)].modifiers.range = targetEl.value as 's'|'l'|'c' :
    value === 'nl' ?
      // update missing loader modifier:
      selectedWeapons[parseInt(targetEl.name)].modifiers.loader = true : void 0;
  })

// store target cover modifier:
document
  .querySelector('form.cover')
  .addEventListener('change', (event: Event) => {
    target.cover = (<HTMLInputElement>event.target).value as Target['cover'];
  });

// store target damage value modifier:
document
  .querySelector('form.damageValue')
  .addEventListener('change', (event: Event) => {
    target.damageValue = parseInt((<HTMLInputElement>event.target).value);
  });

// store target down state:
const checkboxDown: HTMLInputElement = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', () => {
  // set selected unit:
  target.down = checkboxDown.checked ? true : false;
});