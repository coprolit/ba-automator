"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
// TODO
// long range pen penalty
var rifle = {
    range: 24,
    shots: 1,
    pen: 0
};
var smg = {
    range: 12,
    shots: 2,
    pen: 0
};
var atr = {
    range: 36,
    shots: 1,
    pen: 2
};
var unarmed = {
    range: 0,
    shots: 0,
    pen: 0
};
// Stored army lists:
var armies = [
    {
        name: "Red Army",
        units: [
            {
                name: "Inexperienced Rifle squad",
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
        ]
    }
];
// Dynamic state:
var selections = {
    unit: null,
    range: 0,
    cover: 0,
    target: 4,
    down: 0
};
// Combat utility methods:
function shoot(models, modifier, damageValue) {
    // Resolve each shot:
    var shots = models
        // from models, map over to shots:
        .flatMap(function (model) {
        // 1-element array to keep the item, a multiple-element array to add items, or a 0-element array to remove the item.
        var weaponShots = [];
        for (var i = 0; i < model.weapon.shots; i++) {
            weaponShots.push({
                weapon: model.weapon
            });
        }
        return weaponShots;
    })
        // resolve hit rolls:
        .map(function (shot) {
        return __assign(__assign({}, shot), { hit: rollToHit(modifier) });
    })
        // resolve damage rolls:
        .map(function (shot) {
        var damage = rollToDamage(shot.weapon.pen, damageValue);
        return __assign(__assign({}, shot), { damage: shot.hit.success ? damage : null });
    });
    return shots;
}
function getShots(models) {
    return models.flatMap(function (model) {
        // 1-element array to keep the item,
        // a multiple-element array to add items,
        // or a 0-element array to remove the item.
        var shots = [];
        for (var i = 0; i < model.weapon.shots; i++) {
            shots.push({
                pen: model.weapon.pen
            });
        }
        return shots;
    });
}
function rollToHit(modifier) {
    // Roll 1d6 + to hit modifiers per shot.
    // Roll of a 1 is always a failure.
    // Result >= 3 = hit
    // modifier is more than -3 = NIGH IMPOSSIBLE SHOT
    var result = roll();
    var total = result === 1 ? 'F' : result + modifier;
    // If necessary, roll for nigh impossible shot:
    var imposShot;
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
    var result = roll();
    var total = result === 1 ? 'F' : result + pen;
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
    var unit = selections.unit;
    var toHitModifiers = getToHitModifiers();
    var damageValue = selections.target;
    var result = shoot(unit.models, toHitModifiers, damageValue);
    var probabilities = getProbabilities();
    document
        .querySelector('.results')
        .insertAdjacentHTML("beforeend", "<p>\n        <div class=\"title\">\n          " + unit.name + " shoots!\n        </div>\n        <div class=\"rolls\">\n        " + result
        .map(function (shot) {
        return "<span class=\"" + (shot.hit.success ? 'success' : 'failure') + "\">" + shot.hit.roll + "</span>";
    }).join('') + " (hit rolls + hit modifiers)<br>\n\n        " + result
        .map(function (shot) {
        return "<span class=\"" + ((shot.damage && shot.damage.success) ? 'success' : 'failure') + "\">\n                " + (shot.damage ? (shot.damage.crit ? 'E' : shot.damage.roll) : '') + "\n              </span>";
    }).join('') + " (damage rolls + pen modifiers)\n        </div>\n        <div>\n          Hits: <b>" + result.filter(function (shot) { return shot.hit.success; }).length + "</b> (" + probabilities.toHit + ") |  Casualties: <b>" + result.filter(function (shot) { return shot.damage && shot.damage.success; }).length + "</b> (" + probabilities.toDamage + ")\n        </div>\n      </p>");
}
// UI utility methods:
function toHitProbability(shots, modifier) {
    // to hit penalty is more than -3 = nigh imposible shot = requires a 6 followed by a 6.
    var factor = modifier < -3 ? 1 / 6 * 1 / 6 : (4 + modifier) / 6;
    return shots * factor;
}
function toDamageProbability(toHit, pen, damageValue) {
    return toHit * (7 - damageValue - pen) / 6;
}
function getProbabilities() {
    var unit = selections.unit;
    var damageValue = selections.target;
    var modifiersTotal = selections.cover + selections.range + selections.down + selections.unit.toHit;
    var toHitProb = toHitProbability(getShots(unit.models).length, modifiersTotal).toFixed(2);
    var toDamageProb = toDamageProbability(toHitProb, 0, damageValue).toFixed(2);
    return {
        toHit: toHitProb,
        toDamage: toDamageProb
    };
}
function updateProbabilities() {
    var unit = selections.unit;
    var damageValue = selections.target;
    var modifiersTotal = getToHitModifiers();
    var probabilities = getProbabilities();
    document.querySelector('.hits').innerHTML = probabilities.toHit;
    document.querySelector('.casualties').innerHTML = probabilities.toDamage;
    document.querySelector('.modifiers .result').innerHTML = "\n       To hit modifier: " + (modifiersTotal < -3 ? '∞' : modifiersTotal) + " | Target damage value: " + damageValue + "\n  ";
}
// UI:
// populate unit selector:
document.querySelector('.units form').innerHTML =
    armies[0]
        .units
        .map(function (unit, index) {
        return "<input type=\"radio\" id=\"" + unit.name + "\" name=\"unit\" value=\"" + index + "\">\n       <label for=\"" + unit.name + "\">\n        " + unit.name + " \n        (" + getShots(unit.models).length + " shots\n        / " + unit.models.length + " bodies\n        / range " + unit.models[0].weapon.range + "\n        / cost " + unit.cost + " pts)\n       </label>\n       <br>";
    }).join('');
var formUnits = document.querySelector('.units form');
formUnits.addEventListener('change', function (event) {
    // set selected unit:
    selections.unit = armies[0].units[event.target.value];
    updateProbabilities();
});
var formRange = document.querySelector('form.range');
formRange.addEventListener('change', function (event) {
    // set selected unit:
    selections.range = parseInt(event.target.value);
    updateProbabilities();
});
var formCover = document.querySelector('form.cover');
formCover.addEventListener('change', function (event) {
    // set selected unit:
    selections.cover = Number(event.target.value);
    updateProbabilities();
});
var formDamageValue = document.querySelector('form.damageValue');
formDamageValue.addEventListener('change', function (event) {
    // set selected unit:
    selections.target = parseInt(event.target.value);
    updateProbabilities();
});
var checkboxDown = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', function () {
    // set selected unit:
    selections.down = checkboxDown.checked ? -2 : 0;
    updateProbabilities();
});
