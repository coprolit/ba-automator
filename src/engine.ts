import {Score, Shot, Target, Weapon, WeaponResult, WeaponShooting} from './models';

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

const attackHistory: WeaponResult[][] = [];

// Probability methods:
function toHitProbability(shots: number, modifier: number) {
  const probability =
    // If to hit penalty is more severe than -3,
    modifier < -3 ?
    // then a 'nigh imposible' shot (requires a 6 followed by a 6 to succeed). 
    1/6 * 1/6 :
    // else base chance + modifier.
    (4 + modifier) / 6;
  
  return shots * probability;
}

function toDamageProbability(toHit: number, pen: number, damageValue: number) {
  return toHit * (7 - damageValue - pen) / 6;
}

function getProbabilities(weapons: WeaponShooting[], target: Target) {
  const hits = weapons.reduce((acc, weapon) => {
    return acc + toHitProbability(weapon.shots, toHitModifier(weapon, target))
  }, 0);

  const casualties = weapons.reduce((acc, weapon) => {
    return acc + toDamageProbability(
      toHitProbability(weapon.shots, toHitModifier(weapon, target)),
      weapon.pen,
      target.damageValue
    );
  }, 0);
  
  return {
    hits: hits.toFixed(2),
    casualties: casualties.toFixed(2)
  }
}

function toHitModifier(weapon: WeaponShooting, target: Target): number {

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

// UI:

function updateStats(history: WeaponResult[][]) {
  const cols = history.length;
  let row = 0;
  let hitsTotal = 0;

  for (let i = 0; i < cols; i++) {
    const hits = history[i][row].shotsResult.filter(shot => shot.hit.success).length;

    hitsTotal = hitsTotal + hits;
  }
}

// populate weapons selector:
document.querySelector('#addWeapon select').innerHTML =
  weapons.map((weapon, index) =>
    `<option value="${index}">${weapon.name}</option>`
  ).join('');

function populateModifiersPanel(weapons: WeaponShooting[]) {
  // display selected weapons for modifier adjustments:
  document.querySelector('.modifiers .weapons').innerHTML = `
    ${weapons.map((weapon, index) => {
      const toHitProb = toHitProbability(weapon.shots, toHitModifier(weapon, target));
      const toDamageProb = toDamageProbability(toHitProb, weapon.pen, target.damageValue);

      return `<div data-index="${index}">
        ${weapon.name} :
        <input type="radio" id="close" value="c" name="${index}" ${weapon.modifiers.range === 'c' ? 'checked' : ''}>
        <label for="close">close</label>
    
        <input type="radio" id="short" value="s" name="${index}" ${weapon.modifiers.range === 's' ? 'checked' : ''}>
        <label for="short">short</label>
    
        <input type="radio" id="long" value="l" name="${index}" ${weapon.modifiers.range === 'l' ? 'checked' : ''}>
        <label for="long">long</label>
        
        ${weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
          `<input type="checkbox" id="missing" name="${index}" value="nl">
          <label for="loader">no loader</label>` : ''
        }

        <span class="highlight">To hit ${(toHitProb * 100).toFixed(1)}%</span>  &rarr; 
        <span class="highlight">To damage ${(toDamageProb * 100).toFixed(1)}%</span>

        <input type="button" value="x" onclick="removeWeapon(this)">
      </div>`
      }).join('')}
  `;

  const totalProb = getProbabilities(selectedWeapons, target);
  document.querySelector('.probabilities .hits').innerHTML = totalProb.hits;
  document.querySelector('.probabilities .casualties').innerHTML = totalProb.casualties;
}

// FORM HANDLERS:

// Add weapon(s) to selection:
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

  // sort stored weapon types by name:
  selectedWeapons.sort((a, b) => {
    let comparison = 0;
    if (a.name > b.name) {
      comparison = 1;
    } else if (a.name < b.name) {
      comparison = -1;
    }
    return comparison;
  });

  // display in panel:
  populateModifiersPanel(selectedWeapons);
});

function removeWeapon(element: HTMLInputElement) {
  // remove from store:
  selectedWeapons.splice(Number(element.parentElement.dataset.index), 1);
  
  populateModifiersPanel(selectedWeapons);
}

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

    populateModifiersPanel(selectedWeapons);
  })

// store target cover modifier:
document
  .querySelector('form.cover')
  .addEventListener('change', (event: Event) => {
    target.cover = (<HTMLInputElement>event.target).value as Target['cover'];

    populateModifiersPanel(selectedWeapons);
  });

// store target damage value modifier:
document
  .querySelector('form.damageValue')
  .addEventListener('change', (event: Event) => {
    target.damageValue = parseInt((<HTMLInputElement>event.target).value);

    populateModifiersPanel(selectedWeapons);
  });

// store target down state:
const checkboxDown: HTMLInputElement = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', () => {
  // set selected unit:
  target.down = checkboxDown.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// Combat Simulator:
function shoot(weapons: WeaponShooting[], target: Target): WeaponResult[] {
  // Resolve the result of each shot of every firering weapon:
  return weapons
    // make hit rolls for each shot of each weapon:
    .map((weapon: WeaponShooting) => {
      const shots: Shot[] = getShots(weapon);
      const modifier = toHitModifier(weapon, target);

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
  // Roll 1d6 + to hit modifiers per shot.
  
  // Result > 2 = successful hit.
  // Roll of a 1 is always a failure.
  
  // If modifier is more than -3 (nigh impossible shot),
  // need to roll a 6 followed by a 6.

  const dice: number = roll();
  
  // If to hit modifier is more severe than -3 = nigh impossible shot.
  // Need to roll a 6 followed by a 6 to succeed:
  const imposSuccess = modifier < -3 && dice === 6 && roll() === 6;
  
  return {
    roll: dice,
    modifier: modifier,
    success: dice !== 1 && (imposSuccess || dice + modifier > 2),
    crit: imposSuccess
  };
}

function rollToDamage(pen: number, damageValue: number): Score {
  // Roll 1d6 + Pen value for each hit.

  // Result >= Damage value  = damage
  // An unmodified roll of 1 always fails to damage.

  // An unmodified roll of 6, followed by a 6 = the shot scores exceptional damage.

  const dice = roll();
  
  return {
    roll: dice,
    modifier: pen,
    success: dice !== 1 && dice + pen >= damageValue,
    crit: dice === 6 && roll() === 6
  };
}

function roll(): number {
  // returns a random integer from 1 to 6
  return Math.floor(Math.random() * 6) + 1;
}

function hits(weaponsResult: WeaponResult[]): number {
  // From total shots, reduce to successes and count.
  return weaponsResult
    // Reduce/flatten to hitting shots:
    .flatMap((weaponResult: WeaponResult) => 
      // filter out non-successes:
      weaponResult.shotsResult.filter(result => result.hit?.success)
    )
    // get count:
    .length;
}

function casualties(weaponsResult: WeaponResult[]): number {
  // From total shots, reduce to successes and count.
  return weaponsResult
    // Reduce/flatten to damaging shots:
    .flatMap((weaponResult: WeaponResult) => 
      // filter out non-successes:
      weaponResult.shotsResult.filter(result => result.damage?.success)
    )
    // get count:
    .length;
}

function crits(weaponsResult: WeaponResult[]): number {
  // From total shots, reduce to successes and count.
  return weaponsResult
    // Reduce/flatten to damaging shots:
    .flatMap((weaponResult: WeaponResult) => 
      // filter out non-successes:
      weaponResult.shotsResult.filter(result => result.damage?.crit)
    )
    // get count:
    .length;
}

function attack() {
  const results: WeaponResult[] = shoot(selectedWeapons, target);
  
  attackHistory.push(results);
  
  displayShootingResult(results, this.target);
  updateStats(attackHistory);
}

// display shooting result:
function displayShootingResult(weapons: WeaponResult[], target: Target) {
  document
    .querySelector('.results')
    .insertAdjacentHTML("beforeend",
      `<fieldset>
        <legend>
          Unit shoots!
        </legend>
        ${weapons.map(weapon => {
          return `<div>
            ${weapon.name}
            ${weapon.shotsResult.map((shot: Shot) => {
              return `<div class="shot">
                <span class="${shot.hit.success ? 'success' : 'failure'}">${shot.hit.crit ? '∞' : shot.hit.roll}</span>
                <span class="panel-dark">${toHitModifier(weapon, target)}</span>
                ${shot.hit.success ?
                  `&rarr; <span class="${shot.damage.success ? 'success' : 'failure'}">${shot.damage.crit ? 'E' : shot.damage.roll} </span>
                  <span class="panel-dark">${shot.damage.modifier}</span>` : ''}
              </div>`;
            }).join('')}
          </div>
          <div class="delimiter"></div>`;
        }).join('')}

        <span class="title">Result</span>
        <span class="highlight">Hits <span class="hits">${hits(weapons)}</span></span> &rarr; 
        <span class="highlight">Casualties <span class="casualties">${casualties(weapons)}</span></span>
        <span class="highlight">Exceptional damage <span class="casualties">${crits(weapons)}</span></span>
      
      </fieldset>`
    );
}