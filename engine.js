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
var selections = {
    unit: null,
    range: 0,
    cover: 0,
    target: 4,
    down: 0
};
function shoot(models, modifier, damageValue) {
    var shots = getShots(models)
        .map(function (shot) {
        return __assign(__assign({}, shot), { hit: rollToHit(modifier) });
    })
        .map(function (shot) {
        return __assign(__assign({}, shot), { damage: shot.hit.success ? rollToDamage(shot.weapon.pen, damageValue) : null });
    });
    return shots;
}
function getShots(models) {
    return models.flatMap(function (model) {
        var shots = [];
        for (var i = 0; i < model.weapon.shots; i++) {
            shots.push({
                weapon: model.weapon
            });
        }
        return shots;
    });
}
function rollToHit(modifier) {
    var dice = roll();
    var imposSuccess = modifier < -3 && dice === 6 && roll() === 6;
    var result = dice === 1 ? 'F' : (imposSuccess ? '∞' : dice);
    return {
        roll: result,
        modifier: modifier,
        success: dice !== 1 && (imposSuccess || dice + modifier > 2)
    };
}
function rollToDamage(pen, damageValue) {
    var result = roll();
    var total = result === 1 ? 'F' : result + pen;
    return {
        roll: total,
        modifier: pen,
        success: result !== 1 && result + pen >= damageValue,
        crit: result === 6 && roll() === 6
    };
}
function roll() {
    return Math.floor(Math.random() * 6) + 1;
}
function getToHitModifiers() {
    return selections.unit.toHit + selections.cover + selections.range + selections.down;
}
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
function toHitProbability(shots, modifier) {
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
    var toHitProb = Number(toHitProbability(getShots(unit.models).length, modifiersTotal).toFixed(2));
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
    document.querySelector('.hits').innerHTML = probabilities.toHit.toString();
    document.querySelector('.casualties').innerHTML = probabilities.toDamage;
    document.querySelector('.modifiers .result').innerHTML = "\n       To hit modifier: " + (modifiersTotal < -3 ? '∞' : modifiersTotal) + " | Target damage value: " + damageValue + "\n  ";
}
document.querySelector('.units form').innerHTML =
    armies[0]
        .units
        .map(function (unit, index) {
        return "<input type=\"radio\" id=\"" + unit.name + "\" name=\"unit\" value=\"" + index + "\">\n       <label for=\"" + unit.name + "\">\n        " + unit.name + " \n        (" + getShots(unit.models).length + " shots\n        / " + unit.models.length + " bodies\n        / range " + unit.models[0].weapon.range + "\n        / cost " + unit.cost + " pts)\n       </label>\n       <br>";
    }).join('');
var formUnits = document.querySelector('.units form');
formUnits.addEventListener('change', function (event) {
    var index = Number(event.target.value);
    selections.unit = armies[0].units[index];
    updateProbabilities();
});
var formRange = document.querySelector('form.range');
formRange.addEventListener('change', function (event) {
    selections.range = parseInt(event.target.value);
    updateProbabilities();
});
var formCover = document.querySelector('form.cover');
formCover.addEventListener('change', function (event) {
    selections.cover = Number(event.target.value);
    updateProbabilities();
});
var formDamageValue = document.querySelector('form.damageValue');
formDamageValue.addEventListener('change', function (event) {
    selections.target = parseInt(event.target.value);
    updateProbabilities();
});
var checkboxDown = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', function () {
    selections.down = checkboxDown.checked ? -2 : 0;
    updateProbabilities();
});
//# sourceMappingURL=engine.js.map