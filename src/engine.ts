import {Score, Shot, Target, Weapon, WeaponResult, WeaponShooting} from './models';

const units = {} 

const weapons: Weapon[] = [
  {
    name: "Rifle",
    range: 24,
    shots: 1,
    pen: 0,
    assault: false
  }, {
    name: "SMG",
    range: 12,
    shots: 2,
    pen: 0,
    assault: true
  }, {
    name: "Assault Rifle",
    range: 18,
    shots: 2,
    pen: 0,
    assault: true
  }, {
    name: "Automatic Rifle",
    range: 30,
    shots: 2,
    pen: 0,
    assault: false
  }, {
    name: "LMG",
    range: 36,
    shots: 4,
    pen: 0,
    assault: false
  }, {
    name: "MMG",
    range: 36,
    shots: 5,
    pen: 0,
    assault: false
  }, {
    name: "HMG",
    range: 36,
    shots: 3,
    pen: 1,
    assault: false
  }, {
    name: "Anti-tank Rifle",
    range: 36,
    shots: 1,
    pen: 2,
    assault: false
  }, {
    name: "Panzerfaust",
    range: 12,
    shots: 1,
    pen: 6,
    assault: false
  }, {
    name: "Light AT gun",
    range: 48,
    shots: 1,
    pen: 4,
    assault: false
  }, {
    name: "Medium AT gun",
    range: 60,
    shots: 1,
    pen: 5,
    assault: false
  }, {
    name: "Heavy AT gun",
    range: 72,
    shots: 1,
    pen: 6,
    assault: false
  }, {
    name: "Unarmed",
    range: 0,
    shots: 0,
    pen: 0,
    assault: false
  }, 
]

const targets: {name: string, value: number}[] = [
  {
    name: 'Inexperienced infantry',
    value: 3
  },
  {
    name: 'Regular infantry',
    value: 4
  },
  {
    name: 'Veteran infantry',
    value: 5
  },
  {
    name: 'Soft-skinned vehicle',
    value: 6
  },
  {
    name: 'Armoured car/carrier',
    value: 7
  },
  {
    name: 'Light tank',
    value: 8
  },
  {
    name: 'Medium tank',
    value: 9
  },
  {
    name: 'Heavy tank',
    value: 10
  },
  {
    name: 'Super-heavy tank',
    value: 11
  },
]

// Dynamic state:
const selectedWeapons: WeaponShooting[] = [];
let moved: boolean = false;
let pins: number = 0;
let inexperienced: boolean = false;

const selectedTarget: Target = {
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

function toDamageProbability(modifier: number, damageValue: number) {
  const factor = 3 + -1 * (damageValue - 4) + modifier;
  
  // negative factor == cannot harm / no chance
  // a roll of 1 always fails
  const probability = factor < 1 ? 0 : (factor > 5 ? 5 : factor) / 6;

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
    const toDamageMod = toDamageModifier(weapon, target);

    return canHarmTarget(toDamageMod, target.damageValue) ?
    // add probability:
    acc * missProbability(weapon, target) :
    // if weapon cannot harm target, skip:
    acc;
  }, 1);

  // shooting weapons' accumulated probability of hitting:
  const hits = weapons.reduce((acc, weapon) => {
    const toDamageMod = toDamageModifier(weapon, target);

    return canHarmTarget(toDamageMod, target.damageValue) ?
      // add probability:
      acc + hitsProbability(weapon.shots, toHitProbability(toHitModifier(weapon, moved, pins, target))) :
      // if weapon cannot harm target, skip:
      acc;
  }, 0);

  // shooting weapons' accumulated probability of afflicting casualties:
  const casualties = weapons.reduce((acc, weapon) => {
    const toDamageMod = toDamageModifier(weapon, target);

    return canHarmTarget(toDamageMod, target.damageValue) ?
      // add probability:
      acc + killsProbability(
        weapon.shots,
        toHitProbability(toHitModifier(weapon, moved, pins, target)),
        toDamageProbability(toDamageModifier(weapon, target), target.damageValue)
      ) :
      // if weapon cannot harm target, skip:
      acc;
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
    + rangeLookup[weapon.modifiers.hit.range]
    + (weapon.modifiers.hit.loader ? 0 : -1)
    + (target.down ? -2 : 0)
    + (target.small ? -1 : 0);
}

function toDamageModifier(weapon: WeaponShooting, target: Target) {
  const arcLookup = {
    f: 0, // front, none
    s: +1, // side/top
    r: +2, // rear
  }

  return (target.building ? -1 : 0) // except for flamethrowers and HE
    + (target.shield ? -1 : 0)
    // long range for Heavy Weapon Against Armoured Targets:
    + (weapon.modifiers.hit.range === 'l' && target.damageValue > 6 && weapon.pen > 0 ? -1 : 0)
    // shooting arc against Armoured Targets:
    + (weapon.pen > 0 ? arcLookup[weapon.modifiers.damage.arc] : 0)
    + weapon.pen;
}

function canHarmTarget(toDamageModifiers: number, damageValue: number) {
  return 6 + toDamageModifiers >= damageValue
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

// populate target type selector:
document.querySelector('#selectTarget select').innerHTML =
  `<option value="">Select target type...</option>
  ${targets.map(target =>
    `<option value="${target.value}">${target.name}</option>`
  ).join('')}`;

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
        
        <form>
          <label class="small">Range</label>
          <select name="${index}">
            <option value="c" ${weapon.modifiers.hit.range === 'c' ? 'selected' : ''}>Point blank</option>
            <option value="s" ${weapon.modifiers.hit.range === 's' ? 'selected' : ''}>Short</option>
            <option value="l" ${weapon.modifiers.hit.range === 'l' ? 'selected' : ''}>Long</option>
          </select>
        </form>
        
        ${weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
          `&nbsp;
          <span>
            <input type="checkbox" id="loader" name="${index}" value="nl" ${weapon.modifiers.hit.loader === true ? 'checked' : ''}>
            <label for="loader">Loader</label>
          </span>` : ''
        }
        ${weapon.pen && selectedTarget.damageValue > 6?
          `<form class="side">
            <label class="small">Arc</label>
            <select name="${index}">
              <option value="af" ${weapon.modifiers.damage.arc === 'f' ? 'selected' : ''}>Front</option>
              <option value="as" ${weapon.modifiers.damage.arc === 's' ? 'selected' : ''}>Side/top</option>
              <option value="ar" ${weapon.modifiers.damage.arc === 'r' ? 'selected' : ''}>Rear</option>
            </select>
          </form>` : ''
        }

        <div class="space"></div>

        ${canHarmTarget(toDamageModifier(weapon, selectedTarget), selectedTarget.damageValue) ?
          weaponProbabilitiesElement(weapon, selectedTarget) :
          '<span class="failure small">cannot damage</span>'
        }

        <input type="button" value="x" onclick="removeWeapon(this)">
        
      </div>`
      }).join('')}
  `;

  const totalProb = getProbabilities(weapons, selectedTarget);
  document.querySelector('.probabilities .pinning').innerHTML = `${(totalProb.pin * 100).toFixed(4)}%`;
  document.querySelector('.probabilities .hits').innerHTML = totalProb.hits.toFixed(2);
  document.querySelector('.probabilities .casualties').innerHTML = totalProb.casualties.toFixed(2);
}

function weaponProbabilitiesElement(weapon: WeaponShooting, target: Target) {
  const toHitProb = toHitProbability(toHitModifier(weapon, moved, pins, target));
  const toDamageProb = toDamageProbability(toDamageModifier(weapon, target), target.damageValue);
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
    <span class="highlight">${target.damageValue > 5 ? 'Penetrations' : 'Casualties'} ${killsProb.toFixed(2)}</span>
  </span>`;
}

// FORM HANDLERS:

// Target type selection:
const formTargets: HTMLFormElement = document.querySelector('#selectTarget');
formTargets.addEventListener('change', (event: Event) => {
  event.preventDefault();

  selectedTarget.damageValue = parseInt((<HTMLInputElement>event.target).value);
    
    if(selectedTarget.damageValue < 6) {
      document.querySelector('.inf').removeAttribute('hidden');
    } else {
      document.querySelector('.inf').setAttribute('hidden', '');
    }
  
  // display in panel:
  populateModifiersPanel(selectedWeapons);
});

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
        hit: { loader: true, range: 's' },
        damage: { arc: 'f' }
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
// - Range, missing loader, arc:
document
  .querySelector('.modifiers .weapons')
  .addEventListener('change', (event: Event) => {
    const targetEl = (<HTMLInputElement>event.target); // the weapon being interacted with
    const value: string = targetEl.value;
    console.log(targetEl.value.slice(1))

    value === 's' || value === 'l' || value === 'c' ? 
      // update range modifier:
      selectedWeapons[parseInt(targetEl.name)].modifiers.hit.range = targetEl.value as 's'|'l'|'c' :
    value === 'nl' ?
      // update missing loader modifier:
      selectedWeapons[parseInt(targetEl.name)].modifiers.hit.loader = targetEl.checked :
    value === 'af' || value === 'as' || value === 'ar'?
      // update targeted Armoured vehicle arc:
      selectedWeapons[parseInt(targetEl.name)].modifiers.damage.arc = targetEl.value.slice(1) as 'f'|'s'|'r':
    void 0;

    populateModifiersPanel(selectedWeapons);
  })

// - Advancing:
const checkboxAdvancing: HTMLInputElement = document.querySelector('input[id="advancing"]');
checkboxAdvancing.addEventListener('change', () => {
  // set selected unit:
  moved = checkboxAdvancing.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - Inexperienced:
const checkboxInexp: HTMLInputElement = document.querySelector('input[id="inexperienced"]');
checkboxInexp.addEventListener('change', () => {
  // set selected unit:
  inexperienced = checkboxInexp.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - Pins:
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
    selectedTarget.cover = (<HTMLInputElement>event.target).value as Target['cover'];

    populateModifiersPanel(selectedWeapons);
  });

// - Down:
const checkboxDown: HTMLInputElement = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', () => {
  // set selected unit:
  selectedTarget.down = checkboxDown.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - In building (grants extra protection, except from HE and flamethrowers):
const checkboxInBuilding: HTMLInputElement = document.querySelector('input[id="building"]');
checkboxInBuilding.addEventListener('change', () => {
  // set selected unit:
  selectedTarget.building = checkboxInBuilding.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - Gun shield (grants extra protection, except from HE and flamethrowers):
const checkboxShield: HTMLInputElement = document.querySelector('input[id="shield"]');
checkboxShield.addEventListener('change', () => {
  // set selected unit:
  selectedTarget.shield = checkboxShield.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - Small unit:
const checkboxSmall: HTMLInputElement = document.querySelector('input[id="small"]');
checkboxSmall.addEventListener('change', () => {
  // set selected unit:
  selectedTarget.small = checkboxSmall.checked ? true : false;

  populateModifiersPanel(selectedWeapons);
});

// - Armour side:
/* document
  .querySelector('form.side')
  .addEventListener('change', (event: Event) => {
    selectedTarget.arc = (<HTMLInputElement>event.target).value as Target['arc'];

    populateModifiersPanel(selectedWeapons);
  }); */

// Combat Simulator:
function shoot(weapons: WeaponShooting[], target: Target): WeaponResult[] {
  // Resolve the result of each shot of every firering weapon:
  return weapons
    // make hit rolls for each shot of each weapon:
    .map((weapon: WeaponShooting) => {
      const shots: Shot[] = getShots(weapon);
      const modifier = toHitModifier(weapon, moved, pins, target);
      const damageModifier = toDamageModifier(weapon, target);

      return {
        ...weapon,
        // resolve and add hit results for each shot:
        shotsResult: canHarmTarget(damageModifier, target.damageValue) ?
          shots.map(() => { return { hit: rollToHit(modifier)} }) :
          []
      };
    })
    .map((weapon: WeaponResult) => {
      weapon.shotsResult = weapon.shotsResult.map((shot: Shot) => {
        // for each hit
        if (shot.hit?.success) {
          const modifier = toDamageModifier(weapon, target);

          return {
            ...shot,
            // resolve and add damage results:
            damage: rollToDamage(modifier, target.damageValue)
          }
        } else {
          return shot;
        }
      })

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

function rollToDamage(modifier: number, damageValue: number): Score {
  // Roll 1d6 + Pen value for each hit.

  // Result >= Damage value  = damage
  // An unmodified roll of 1 always fails to damage.

  // An unmodified roll of 6, followed by a 6 = the shot scores exceptional damage.

  const dice : number = roll();
  
  return {
    roll: dice,
    modifier: modifier,
    success: dice !== 1 && dice + modifier >= damageValue,
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
  const results: WeaponResult[] = shoot(selectedWeapons, selectedTarget);
  
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
            ${weapon.shotsResult.length ? weapon.shotsResult.map((shot: Shot) => {
              return `<div class="roll">
                <span class="${shot.hit.success ? 'success' : 'failure'}">${shot.hit.crit ? '∞' : shot.hit.roll}</span>
                <span class="panel-dark">${toHitModifier(weapon, moved, pins, target)}</span>
                ${shot.hit.success ?
                  `&rarr; <span class="${shot.damage.success ? 'success' : 'failure'}">${shot.damage.crit ? 'E' : shot.damage.roll} </span>
                  <span class="panel-dark">${shot.damage.modifier}</span>` : ''}
              </div>`;
            }).join('') : '<div class="roll failure">N/A</div>'}
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