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
var selectedWeapons = [];
var target = {
    cover: 'n',
    damageValue: 4,
    down: false
};
var attackHistory = [];
function toHitProbability(shots, modifier) {
    var probability = modifier < -3 ?
        1 / 6 * 1 / 6 :
        (4 + modifier) / 6;
    return shots * probability;
}
function toDamageProbability(toHit, pen, damageValue) {
    return toHit * (7 - damageValue - pen) / 6;
}
function getProbabilities(weapons, target) {
    var hits = weapons.reduce(function (acc, weapon) {
        return acc + toHitProbability(weapon.shots, toHitModifier(weapon, target));
    }, 0);
    var casualties = weapons.reduce(function (acc, weapon) {
        return acc + toDamageProbability(toHitProbability(weapon.shots, toHitModifier(weapon, target)), weapon.pen, target.damageValue);
    }, 0);
    return {
        hits: hits.toFixed(2),
        casualties: casualties.toFixed(2)
    };
}
function toHitModifier(weapon, target) {
    var coverLookup = {
        n: 0,
        s: -1,
        h: -2
    };
    var rangeLookup = {
        c: +1,
        s: 0,
        l: -1
    };
    return coverLookup[target.cover]
        + rangeLookup[weapon.modifiers.range]
        + (weapon.modifiers.moved ? -1 : 0)
        + (target.down ? -2 : 0);
}
function updateStats(history) {
    var cols = history.length;
    var row = 0;
    var hitsTotal = 0;
    for (var i = 0; i < cols; i++) {
        var hits_1 = history[i][row].shotsResult.filter(function (shot) { return shot.hit.success; }).length;
        hitsTotal = hitsTotal + hits_1;
    }
}
document.querySelector('#addWeapon select').innerHTML =
    weapons.map(function (weapon, index) {
        return "<option value=\"" + index + "\">" + weapon.name + "</option>";
    }).join('');
function populateModifiersPanel(weapons) {
    document.querySelector('.modifiers .weapons').innerHTML = "\n    " + weapons.map(function (weapon, index) {
        var toHitProb = toHitProbability(weapon.shots, toHitModifier(weapon, target));
        var toDamageProb = toDamageProbability(toHitProb, weapon.pen, target.damageValue);
        return "<div data-index=\"" + index + "\">\n        " + weapon.name + " :\n        <input type=\"radio\" id=\"close\" value=\"c\" name=\"" + index + "\" " + (weapon.modifiers.range === 'c' ? 'checked' : '') + ">\n        <label for=\"close\">close</label>\n    \n        <input type=\"radio\" id=\"short\" value=\"s\" name=\"" + index + "\" " + (weapon.modifiers.range === 's' ? 'checked' : '') + ">\n        <label for=\"short\">short</label>\n    \n        <input type=\"radio\" id=\"long\" value=\"l\" name=\"" + index + "\" " + (weapon.modifiers.range === 'l' ? 'checked' : '') + ">\n        <label for=\"long\">long</label>\n        \n        " + (weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
            "<input type=\"checkbox\" id=\"missing\" name=\"" + index + "\" value=\"nl\">\n          <label for=\"loader\">no loader</label>" : '') + "\n\n        <span class=\"highlight\">To hit " + (toHitProb * 100).toFixed(1) + "%</span>  &rarr; \n        <span class=\"highlight\">To damage " + (toDamageProb * 100).toFixed(1) + "%</span>\n\n        <input type=\"button\" value=\"x\" onclick=\"removeWeapon(this)\">\n      </div>";
    }).join('') + "\n  ";
    var totalProb = getProbabilities(selectedWeapons, target);
    document.querySelector('.probabilities .hits').innerHTML = totalProb.hits;
    document.querySelector('.probabilities .casualties').innerHTML = totalProb.casualties;
}
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
    populateModifiersPanel(selectedWeapons);
});
function removeWeapon(element) {
    selectedWeapons.splice(Number(element.parentElement.dataset.index), 1);
    populateModifiersPanel(selectedWeapons);
}
document
    .querySelector('.modifiers .weapons')
    .addEventListener('change', function (event) {
    var targetEl = event.target;
    var value = targetEl.value;
    value === 's' || value === 'l' || value === 'c' ?
        selectedWeapons[parseInt(targetEl.name)].modifiers.range = targetEl.value :
        value === 'nl' ?
            selectedWeapons[parseInt(targetEl.name)].modifiers.loader = true : void 0;
    populateModifiersPanel(selectedWeapons);
});
document
    .querySelector('form.cover')
    .addEventListener('change', function (event) {
    target.cover = event.target.value;
    populateModifiersPanel(selectedWeapons);
});
document
    .querySelector('form.damageValue')
    .addEventListener('change', function (event) {
    target.damageValue = parseInt(event.target.value);
    populateModifiersPanel(selectedWeapons);
});
var checkboxDown = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', function () {
    target.down = checkboxDown.checked ? true : false;
    populateModifiersPanel(selectedWeapons);
});
function shoot(weapons, target) {
    return weapons
        .map(function (weapon) {
        var shots = getShots(weapon);
        var modifier = toHitModifier(weapon, target);
        return __assign(__assign({}, weapon), { shotsResult: shots.map(function () {
                return {
                    hit: rollToHit(modifier)
                };
            }) });
    })
        .map(function (weapon) {
        weapon.shotsResult = weapon.shotsResult.map(function (shot) {
            if (shot.hit.success) {
                return __assign(__assign({}, shot), { damage: rollToDamage(weapon.pen, target.damageValue) });
            }
            else {
                return shot;
            }
        });
        return weapon;
    });
}
function getShots(weapon) {
    var shots = [];
    for (var i = 0; i < weapon.shots; i++) {
        shots.push({});
    }
    return shots;
}
function rollToHit(modifier) {
    var dice = roll();
    var imposSuccess = modifier < -3 && dice === 6 && roll() === 6;
    return {
        roll: dice,
        modifier: modifier,
        success: dice !== 1 && (imposSuccess || dice + modifier > 2),
        crit: imposSuccess
    };
}
function rollToDamage(pen, damageValue) {
    var dice = roll();
    return {
        roll: dice,
        modifier: pen,
        success: dice !== 1 && dice + pen >= damageValue,
        crit: dice === 6 && roll() === 6
    };
}
function roll() {
    return Math.floor(Math.random() * 6) + 1;
}
function hits(weaponsResult) {
    return weaponsResult
        .flatMap(function (weaponResult) {
        return weaponResult.shotsResult.filter(function (result) { var _a; return (_a = result.hit) === null || _a === void 0 ? void 0 : _a.success; });
    })
        .length;
}
function casualties(weaponsResult) {
    return weaponsResult
        .flatMap(function (weaponResult) {
        return weaponResult.shotsResult.filter(function (result) { var _a; return (_a = result.damage) === null || _a === void 0 ? void 0 : _a.success; });
    })
        .length;
}
function crits(weaponsResult) {
    return weaponsResult
        .flatMap(function (weaponResult) {
        return weaponResult.shotsResult.filter(function (result) { var _a; return (_a = result.damage) === null || _a === void 0 ? void 0 : _a.crit; });
    })
        .length;
}
function attack() {
    var results = shoot(selectedWeapons, target);
    attackHistory.push(results);
    displayShootingResult(results, this.target);
    updateStats(attackHistory);
}
function displayShootingResult(weapons, target) {
    document
        .querySelector('.results')
        .insertAdjacentHTML("beforeend", "<fieldset>\n        <legend>\n          Unit shoots!\n        </legend>\n        " + weapons.map(function (weapon) {
        return "<div>\n            " + weapon.name + "\n            " + weapon.shotsResult.map(function (shot) {
            return "<div class=\"shot\">\n                <span class=\"" + (shot.hit.success ? 'success' : 'failure') + "\">" + (shot.hit.crit ? '∞' : shot.hit.roll) + "</span>\n                <span class=\"panel-dark\">" + toHitModifier(weapon, target) + "</span>\n                " + (shot.hit.success ?
                "&rarr; <span class=\"" + (shot.damage.success ? 'success' : 'failure') + "\">" + (shot.damage.crit ? 'E' : shot.damage.roll) + " </span>\n                  <span class=\"panel-dark\">" + shot.damage.modifier + "</span>" : '') + "\n              </div>";
        }).join('') + "\n          </div>\n          <div class=\"delimiter\"></div>";
    }).join('') + "\n\n        <span class=\"title\">Result</span>\n        <span class=\"highlight\">Hits <span class=\"hits\">" + hits(weapons) + "</span></span> &rarr; \n        <span class=\"highlight\">Casualties <span class=\"casualties\">" + casualties(weapons) + "</span></span>\n        <span class=\"highlight\">Exceptional damage <span class=\"casualties\">" + crits(weapons) + "</span></span>\n      \n      </fieldset>");
}
//# sourceMappingURL=engine.js.map