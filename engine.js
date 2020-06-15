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
    name: "Rifle",
    range: 24,
    shots: 1,
    pen: 0
};
var smg = {
    name: "SMG",
    range: 12,
    shots: 2,
    pen: 0
};
var atr = {
    name: "Anti-tank Rifle",
    range: 36,
    shots: 1,
    pen: 2
};
var assaultRifle = {
    name: "Assault Rifle",
    range: 18,
    shots: 2,
    pen: 0
};
var autoRifle = {
    name: "Automatic Rifle",
    range: 30,
    shots: 2,
    pen: 0
};
var lmg = {
    name: "LMG",
    range: 36,
    shots: 4,
    pen: 0
};
var panzerfaust = {
    name: "Panzerfaust",
    range: 12,
    shots: 1,
    pen: 6
};
var unarmed = {
    name: "Unarmed",
    range: 0,
    shots: 0,
    pen: 0
};
var weapons = [
    rifle, smg, assaultRifle, autoRifle, lmg, atr, panzerfaust, unarmed,
];
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
var selectedWeapons = [];
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
        success: dice !== 1 && (imposSuccess || dice + modifier > 2),
        crit: imposSuccess
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
function getToHitModifiers(rangeModifier) {
    return rangeModifier + selections.cover + selections.range + selections.down;
}
function attack() {
    var unit = selections.unit;
    var toHitModifiers = getToHitModifiers(0);
    var damageValue = selections.target;
    var result = shoot(unit.models, toHitModifiers, damageValue);
    document
        .querySelector('.results')
        .insertAdjacentHTML("beforeend", "<p>\n        <div class=\"title\">\n          " + unit.name + " shoots!\n        </div>\n        <div class=\"rolls\">\n        " + result
        .map(function (shot) {
        return "<span class=\"" + (shot.hit.success ? 'success' : 'failure') + "\">" + shot.hit.roll + "</span>";
    }).join('') + " (hit rolls + hit modifiers)<br>\n\n        " + result
        .map(function (shot) {
        return "<span class=\"" + ((shot.damage && shot.damage.success) ? 'success' : 'failure') + "\">\n                " + (shot.damage ? (shot.damage.crit ? 'E' : shot.damage.roll) : '') + "\n              </span>";
    }).join('') + " (damage rolls + pen modifiers)\n        </div>\n        <div>\n          Hits: <b>" + result.filter(function (shot) { return shot.hit.success; }).length + "</b>  |  Casualties: <b>" + result.filter(function (shot) { return shot.damage && shot.damage.success; }).length + "</b>\n        </div>\n      </p>");
}
document.querySelector('#addWeapon select').innerHTML =
    weapons
        .map(function (weapon, index) {
        return "<option value=\"" + index + "\">" + weapon.name + "</option>";
    }).join('');
var formWeapons = document.querySelector('#addWeapon');
formWeapons.addEventListener('submit', function (event) {
    event.preventDefault();
    var formdata = new FormData(formWeapons);
    var amount = Number(formdata.get('amount'));
    var selectedWeaponType = weapons[Number(formdata.get('type'))];
    for (var i = 0; i < amount; i++) {
        selectedWeapons.push(__assign(__assign({}, selectedWeaponType), { modifiers: {
                range: 's',
                moved: false,
                loader: true
            } }));
    }
    document.querySelector('.selection').insertAdjacentHTML('afterbegin', "\n    <div>" + formdata.get('amount') + " " + weapons[Number(formdata.get('type'))].name + "</div>\n  ");
});
var weaponsSubmit = document.querySelector('.selection input');
weaponsSubmit.addEventListener('click', function () {
    selectedWeapons.sort(function (a, b) {
        var comparison = 0;
        if (a.name > b.name) {
            comparison = 1;
        }
        else if (a.name < b.name) {
            comparison = -1;
        }
        return comparison;
    });
    document.querySelector('.modifiers .weapons').innerHTML = "\n    " + selectedWeapons.map(function (weapon, index) {
        return "<div data-index=\"" + index + "\">\n        " + weapon.name + " :\n        <input type=\"radio\" id=\"close\" value=\"c\" name=\"" + index + "\">\n        <label for=\"close\">close</label>\n    \n        <input type=\"radio\" id=\"short\" value=\"s\" name=\"" + index + "\" checked>\n        <label for=\"short\">short</label>\n    \n        <input type=\"radio\" id=\"long\" value=\"l\" name=\"" + index + "\">\n        <label for=\"long\">long</label>\n        \n        " + (weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
            '<input type="checkbox" id="missing" name="loader" value="-1">' +
                '<label for="loader">no loader</label>' : '') + "\n      </div>";
    }).join('') + "\n  ";
});
document.querySelector('.modifiers .weapons').addEventListener('change', function (event) {
    console.log(event.target);
    var targetEl = event.target;
    selectedWeapons[parseInt(targetEl.name)].modifiers.range = targetEl.value;
    console.log(selectedWeapons);
});
var formUnits = document.querySelector('.units form');
formUnits.addEventListener('change', function (event) {
    var index = Number(event.target.value);
    selections.unit = armies[0].units[index];
});
var formRange = document.querySelector('form.range');
formRange.addEventListener('change', function (event) {
    selections.range = parseInt(event.target.value);
});
var formCover = document.querySelector('form.cover');
formCover.addEventListener('change', function (event) {
    selections.cover = Number(event.target.value);
});
var formDamageValue = document.querySelector('form.damageValue');
formDamageValue.addEventListener('change', function (event) {
    selections.target = parseInt(event.target.value);
});
var checkboxDown = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', function () {
    selections.down = checkboxDown.checked ? -2 : 0;
});
//# sourceMappingURL=engine.js.map