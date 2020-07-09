import {Score, Shot, Target, Weapon, WeaponResult, WeaponShooting} from './models';

const rifle = {
  name: "Rifle",
  range: 24,
  shots: 1,
  pen: 0,
  assault: false
}
const smg = {
  name: "SMG",
  range: 12,
  shots: 2,
  pen: 0,
  assault: true
}
const atr = {
  name: "Anti-tank Rifle",
  range: 36,
  shots: 1,
  pen: 2,
  assault: false
}
const assaultRifle = {
  name: "Assault Rifle",
  range: 18,
  shots: 2,
  pen: 0,
  assault: true
}
const autoRifle = {
  name: "Automatic Rifle",
  range: 30,
  shots: 2,
  pen: 0,
  assault: false
}
const lmg = {
  name: "LMG",
  range: 36,
  shots: 4,
  pen: 0,
  assault: false
}
const panzerfaust = {
  name: "Panzerfaust",
  range: 12,
  shots: 1,
  pen: 6,
  assault: false
}
const unarmed = {
  name: "Unarmed",
  range: 0,
  shots: 0,
  pen: 0,
  assault: false
}

const weapons: Weapon[] = [
  rifle, smg, assaultRifle, autoRifle, lmg, atr, panzerfaust, unarmed, 
]

// Dynamic state:
const selectedWeapons: WeaponShooting[] = [];
let moved: boolean = false;
let pins: number = 0;
let inexperienced: boolean = false;

const target: Target = {
  cover: 'n',
  damageValue: 4,
  down: false,
  building: false,
  shield: false,
  small: false
}

const attackHistory: WeaponResult[][] = [];

// Probability methods:
function toHitProbability(modifier: number) {
  const factor = 4 + modifier;

  const probability =
    // If to hit penalty is more severe than -3,
    modifier < -3 ?
    // then a 'nigh imposible' shot (requires a 6 followed by a 6 to succeed). 
    1/6 * 1/6 :
    // else base chance + modifier
    // A roll of 1 always fails:
    (factor > 5 ? 5 : factor) / 6;
  
  return probability;
}

function toMissProbability(toHitProb: number) {
  return 1 - toHitProb;
}

function toDamageProbability(modifier: number) {
  const factor = 3 + modifier;
  
  // a roll of 1 always fails:
  const probability = (factor > 5 ? 5 : factor) / 6; 

  return probability;
}

function hitsProbability(shots: number, toHitProb: number) {
  return shots * toHitProb;
}

function killsProbability(shots: number, toHitProb: number, toDamageProb: number) {
  return shots * toHitProb * toDamageProb;
}

function missProbability(weapon: WeaponShooting, target: Target) {
  const toHitProb = toHitProbability(toHitModifier(weapon, moved, pins, target));
  
  let toMissProb = 1;
  for (let index = 0; index < weapon.shots; index++) {
    toMissProb = toMissProb * toMissProbability(toHitProb);
  };

  return toMissProb;
}

function getProbabilities(weapons: WeaponShooting[], target: Target) {
  // shooting weapons' accumulated probability of missing:
  // (chance to pin = 100% - chance to miss)  
  const missProb = weapons.reduce((acc, weapon) => {
    return cannotHarmTarget(weapon, target) ?
    // if weapon cannot harm target, skip:
    acc :
    // else add probability:
    acc * missProbability(weapon, target)
  }, 1);

  // shooting weapons' accumulated probability of hitting:
  const hits = weapons.reduce((acc, weapon) => {
    return cannotHarmTarget(weapon, target) ?
      // if weapon cannot harm target, skip:
      acc :
      // else add probability:
      acc + hitsProbability(weapon.shots, toHitProbability(toHitModifier(weapon, moved, pins, target)))
  }, 0);

  // shooting weapons' accumulated probability of afflicting casualties:
  const casualties = weapons.reduce((acc, weapon) => {
    return cannotHarmTarget(weapon, target) ?
      // if weapon cannot harm target, skip:
      acc :
      // else add probability:
      acc + killsProbability(
        weapon.shots,
        toHitProbability(toHitModifier(weapon, moved, pins, target)),
        toDamageProbability(toDamageModifier(weapon.pen, target))
      );
  }, 0);
  
  return {
    pin: 1 - missProb,
    hits: hits,
    casualties: casualties
  }
}

function toHitModifier(weapon: WeaponShooting, moved: Boolean, pins: number, target: Target): number {

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

  // if in building: cover = -2, else use regular cover modifier.
  return (target.building ? -2 : coverLookup[target.cover])
    + (moved && !weapon.assault ? -1 : 0)
    + (-pins)
    + (inexperienced ? -1 : 0)
    + rangeLookup[weapon.modifiers.range]
    + (weapon.modifiers.loader ? 0 : -1)
    + (target.down ? -2 : 0);
}

function toDamageModifier(pen: number, target: Target) {
  const dvModLookup: any = {
    3: +1,
    4: 0,
    5: -1,
    6: -2,
    7: -3
  }

  return dvModLookup[target.damageValue]
    + (target.building ? -1 : 0) // except for flamethrowers and HE
    + (target.shield ? -1 : 0)
    + pen;
}

function cannotHarmTarget(weapon: WeaponShooting, target: Target) {
  return weapon.pen === 0 && target.damageValue > 6
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
      return `<div class="weapon" data-index="${index}">
        ${weapon.name} :
        <span class="radio-group">
        
          <input type="radio" id="close" value="c" name="${index}" ${weapon.modifiers.range === 'c' ? 'checked' : ''}>
          <label for="close">point blank</label>
      
          <input type="radio" id="short" value="s" name="${index}" ${weapon.modifiers.range === 's' ? 'checked' : ''}>
          <label for="short">short</label>
      
          <input type="radio" id="long" value="l" name="${index}" ${weapon.modifiers.range === 'l' ? 'checked' : ''}>
          <label for="long">long</label>
        </span>
        ${weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
          `&nbsp;
          <span>
            <input type="checkbox" id="loader" name="${index}" value="nl" ${weapon.modifiers.loader === true ? 'checked' : ''}>
            <label for="loader">loader</label>
          </span>` : ''
        }

        <div class="space"></div>

        ${cannotHarmTarget(weapon, target) ? '<span class="failure small">cannot damage</span>' :
          weaponProbabilitiesElement(weapon, target)
        }

        <input type="button" value="x" onclick="removeWeapon(this)">
        
      </div>`
      }).join('')}
  `;

  const totalProb = getProbabilities(weapons, target);
  document.querySelector('.probabilities .pinning').innerHTML = `${(totalProb.pin * 100).toFixed(4)}%`;
  document.querySelector('.probabilities .hits').innerHTML = totalProb.hits.toFixed(2);
  document.querySelector('.probabilities .casualties').innerHTML = totalProb.casualties.toFixed(2);
}

function weaponProbabilitiesElement(weapon: WeaponShooting, target: Target) {
  const toHitProb = toHitProbability(toHitModifier(weapon, moved, pins, target));
  const toDamageProb = toDamageProbability(toDamageModifier(weapon.pen, target));
  const hitsProb = hitsProbability(weapon.shots, toHitProb);
  const killsProb = killsProbability(weapon.shots, toHitProb, toDamageProb);
  const toPinProb = (1 - missProbability(weapon, target));

  return `<span class="small">
    <div class="box">
      <div class="row highlight light">
        <span class="multiplier">${weapon.shots} *</span>
        <span class="column">
          <span>To hit ${(toHitProb * 100).toFixed(1)}%</span>
          <span>To damage ${(toDamageProb * 100).toFixed(1)}%</span>
        </span>
      </div>
    </div>
    <span class="highlight light">To pin ${(toPinProb * 100).toFixed(2)}%</span>
    :
    <span class="highlight">Hits ${hitsProb.toFixed(2)}</span>
    &rarr;
    <span class="highlight">Casualties ${killsProb.toFixed(2)}</span>
  </span>`;
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
      selectedWeapons[parseInt(targetEl.name)].modifiers.loader = targetEl.checked
    : void 0;

    populateModifiersPanel(selectedWeapons);
  })

const checkboxAdvancing: HTMLInputElement = document.querySelector('input[id="advancing"]');
checkboxAdvancing.addEventListener('change', () => {
  // set selected unit:
  moved = checkboxAdvancing.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

const checkboxInexp: HTMLInputElement = document.querySelector('input[id="inexperienced"]');
checkboxInexp.addEventListener('change', () => {
  // set selected unit:
  inexperienced = checkboxInexp.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

document
  .querySelector('#pins')
  .addEventListener('change', (event: Event) => {
    pins = Number((<HTMLInputElement>event.target).value);

    populateModifiersPanel(selectedWeapons);
  });

// Store target modifiers:
// - Cover:
document
  .querySelector('form.cover')
  .addEventListener('change', (event: Event) => {
    target.cover = (<HTMLInputElement>event.target).value as Target['cover'];

    populateModifiersPanel(selectedWeapons);
  });

// - Damage value:
document
  .querySelector('form.damageValue')
  .addEventListener('change', (event: Event) => {
    target.damageValue = parseInt((<HTMLInputElement>event.target).value);
    
    populateModifiersPanel(selectedWeapons);
  });

// - Down:
const checkboxDown: HTMLInputElement = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', () => {
  // set selected unit:
  target.down = checkboxDown.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - In building (grants extra protection, expect from HE and flamethrowers):
const checkboxInBuilding: HTMLInputElement = document.querySelector('input[id="building"]');
checkboxInBuilding.addEventListener('change', () => {
  // set selected unit:
  target.building = checkboxInBuilding.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - Gun shield (grants extra protection, expect from HE and flamethrowers):
const checkboxShield: HTMLInputElement = document.querySelector('input[id="shield"]');
checkboxShield.addEventListener('change', () => {
  // set selected unit:
  target.shield = checkboxShield.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - Small unit:
const checkboxSmall: HTMLInputElement = document.querySelector('input[id="small"]');
checkboxSmall.addEventListener('change', () => {
  // set selected unit:
  target.small = checkboxSmall.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// Combat Simulator:
function shoot(weapons: WeaponShooting[], target: Target): WeaponResult[] {
  // Resolve the result of each shot of every firering weapon:
  return weapons
    // make hit rolls for each shot of each weapon:
    .map((weapon: WeaponShooting) => {
      const shots: Shot[] = getShots(weapon);
      const modifier = toHitModifier(weapon, moved, pins, target);

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
              return `<div class="roll">
                <span class="${shot.hit.success ? 'success' : 'failure'}">${shot.hit.crit ? '∞' : shot.hit.roll}</span>
                <span class="panel-dark">${toHitModifier(weapon, moved, pins, target)}</span>
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