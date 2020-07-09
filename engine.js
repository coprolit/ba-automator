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
    pen: 0,
    assault: false
};
var smg = {
    name: "SMG",
    range: 12,
    shots: 2,
    pen: 0,
    assault: true
};
var atr = {
    name: "Anti-tank Rifle",
    range: 36,
    shots: 1,
    pen: 2,
    assault: false
};
var assaultRifle = {
    name: "Assault Rifle",
    range: 18,
    shots: 2,
    pen: 0,
    assault: true
};
var autoRifle = {
    name: "Automatic Rifle",
    range: 30,
    shots: 2,
    pen: 0,
    assault: false
};
var lmg = {
    name: "LMG",
    range: 36,
    shots: 4,
    pen: 0,
    assault: false
};
var panzerfaust = {
    name: "Panzerfaust",
    range: 12,
    shots: 1,
    pen: 6,
    assault: false
};
var unarmed = {
    name: "Unarmed",
    range: 0,
    shots: 0,
    pen: 0,
    assault: false
};
var weapons = [
    rifle, smg, assaultRifle, autoRifle, lmg, atr, panzerfaust, unarmed,
];
var selectedWeapons = [];
var moved = false;
var pins = 0;
var inexperienced = false;
var target = {
    cover: 'n',
    damageValue: 4,
    down: false,
    building: false,
    shield: false
};
var attackHistory = [];
function toHitProbability(modifier) {
    var factor = modifier < -3 ?
        1 / 6 * 1 / 6 :
        4 + modifier;
    var probability = (factor > 5 ? 5 : factor) / 6;
    return probability;
}
function toMissProbability(toHitProb) {
    return 1 - toHitProb;
}
function toDamageProbability(modifier) {
    var factor = 3 + modifier;
    var probability = (factor > 5 ? 5 : factor) / 6;
    return probability;
}
function hitsProbability(shots, toHitProb) {
    return shots * toHitProb;
}
function killsProbability(shots, toHit, toDamage) {
    return shots * toHit * toDamage;
}
function missProbability(weapon, target) {
    var toHitProb = toHitProbability(toHitModifier(weapon, moved, pins, target));
    var toMissProb = 1;
    for (var index = 0; index < weapon.shots; index++) {
        toMissProb = toMissProb * toMissProbability(toHitProb);
    }
    ;
    return toMissProb;
}
function getProbabilities(weapons, target) {
    var missProb = weapons.reduce(function (acc, weapon) {
        (1 - missProbability(weapon, target));
        return acc * missProbability(weapon, target);
    }, 1);
    var hits = weapons.reduce(function (acc, weapon) {
        return acc + toHitProbability(toHitModifier(weapon, moved, pins, target));
    }, 0);
    var casualties = weapons.reduce(function (acc, weapon) {
        return acc + killsProbability(weapon.shots, toHitProbability(toHitModifier(weapon, moved, pins, target)), toDamageProbability(toDamageModifier(weapon.pen, target)));
    }, 0);
    return {
        pin: 1 - missProb,
        hits: hits,
        casualties: casualties
    };
}
function toHitModifier(weapon, moved, pins, target) {
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
    return (target.building ? -2 : coverLookup[target.cover])
        + (moved && !weapon.assault ? -1 : 0)
        + (-pins)
        + (inexperienced ? -1 : 0)
        + rangeLookup[weapon.modifiers.range]
        + (weapon.modifiers.loader ? 0 : -1)
        + (target.down ? -2 : 0);
}
function toDamageModifier(pen, target) {
    var dvModLookup = {
        3: +1,
        4: 0,
        5: -1,
        6: -2,
        7: -3
    };
    return dvModLookup[target.damageValue]
        + (target.building ? -1 : 0)
        + (target.shield ? -1 : 0)
        + pen;
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
        var toHitProb = toHitProbability(toHitModifier(weapon, moved, pins, target));
        var toDamageProb = toDamageProbability(toDamageModifier(weapon.pen, target));
        var hitsProb = hitsProbability(weapon.shots, toHitProb);
        var killsProb = killsProbability(weapon.shots, toHitProb, toDamageProb);
        var toPinProb = (1 - missProbability(weapon, target));
        return "<div class=\"weapon\" data-index=\"" + index + "\">\n        " + weapon.name + " :\n        <span class=\"radio-group\">\n        \n          <input type=\"radio\" id=\"close\" value=\"c\" name=\"" + index + "\" " + (weapon.modifiers.range === 'c' ? 'checked' : '') + ">\n          <label for=\"close\">point blank</label>\n      \n          <input type=\"radio\" id=\"short\" value=\"s\" name=\"" + index + "\" " + (weapon.modifiers.range === 's' ? 'checked' : '') + ">\n          <label for=\"short\">short</label>\n      \n          <input type=\"radio\" id=\"long\" value=\"l\" name=\"" + index + "\" " + (weapon.modifiers.range === 'l' ? 'checked' : '') + ">\n          <label for=\"long\">long</label>\n        </span>\n        " + (weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
            "&nbsp;\n          <span>\n            <input type=\"checkbox\" id=\"loader\" name=\"" + index + "\" value=\"nl\" " + (weapon.modifiers.loader === true ? 'checked' : '') + ">\n            <label for=\"loader\">loader</label>\n          </span>" : '') + "\n\n        <div class=\"space\"></div>\n        \n        <span class=\"small\">\n          <div class=\"box\">\n            <div class=\"row highlight light\">\n              <span class=\"multiplier\">" + weapon.shots + " *</span>\n              <span class=\"column\">\n                <span>To hit " + (toHitProb * 100).toFixed(1) + "%</span>\n                <span>To damage " + (toDamageProb * 100).toFixed(1) + "%</span>\n              </span>\n            </div>\n          </div>\n          <span class=\"highlight light\">To pin " + (toPinProb * 100).toFixed(2) + "%</span>\n          :\n          <span class=\"highlight\">Hits " + hitsProb.toFixed(2) + "</span>\n          &rarr;\n          <span class=\"highlight\">Casualties " + killsProb.toFixed(2) + "</span>\n        </span>\n\n        <input type=\"button\" value=\"x\" onclick=\"removeWeapon(this)\">\n        \n      </div>";
    }).join('') + "\n  ";
    var totalProb = getProbabilities(weapons, target);
    document.querySelector('.probabilities .pinning').innerHTML = (totalProb.pin * 100).toFixed(4) + "%";
    document.querySelector('.probabilities .hits').innerHTML = totalProb.hits.toFixed(2);
    document.querySelector('.probabilities .casualties').innerHTML = totalProb.casualties.toFixed(2);
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
            selectedWeapons[parseInt(targetEl.name)].modifiers.loader = targetEl.checked
            : void 0;
    populateModifiersPanel(selectedWeapons);
});
var checkboxAdvancing = document.querySelector('input[id="advancing"]');
checkboxAdvancing.addEventListener('change', function () {
    moved = checkboxAdvancing.checked ? true : false;
    populateModifiersPanel(selectedWeapons);
});
var checkboxInexp = document.querySelector('input[id="inexperienced"]');
checkboxInexp.addEventListener('change', function () {
    inexperienced = checkboxInexp.checked ? true : false;
    populateModifiersPanel(selectedWeapons);
});
document
    .querySelector('#pins')
    .addEventListener('change', function (event) {
    pins = Number(event.target.value);
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
var checkboxInBuilding = document.querySelector('input[id="building"]');
checkboxInBuilding.addEventListener('change', function () {
    target.building = checkboxInBuilding.checked ? true : false;
    populateModifiersPanel(selectedWeapons);
});
var checkboxShield = document.querySelector('input[id="shield"]');
checkboxShield.addEventListener('change', function () {
    target.shield = checkboxShield.checked ? true : false;
    populateModifiersPanel(selectedWeapons);
});
function shoot(weapons, target) {
    return weapons
        .map(function (weapon) {
        var shots = getShots(weapon);
        var modifier = toHitModifier(weapon, moved, pins, target);
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
            return "<div class=\"roll\">\n                <span class=\"" + (shot.hit.success ? 'success' : 'failure') + "\">" + (shot.hit.crit ? '∞' : shot.hit.roll) + "</span>\n                <span class=\"panel-dark\">" + toHitModifier(weapon, moved, pins, target) + "</span>\n                " + (shot.hit.success ?
                "&rarr; <span class=\"" + (shot.damage.success ? 'success' : 'failure') + "\">" + (shot.damage.crit ? 'E' : shot.damage.roll) + " </span>\n                  <span class=\"panel-dark\">" + shot.damage.modifier + "</span>" : '') + "\n              </div>";
        }).join('') + "\n          </div>\n          <div class=\"delimiter\"></div>";
    }).join('') + "\n\n        <span class=\"title\">Result</span>\n        <span class=\"highlight\">Hits <span class=\"hits\">" + hits(weapons) + "</span></span> &rarr; \n        <span class=\"highlight\">Casualties <span class=\"casualties\">" + casualties(weapons) + "</span></span>\n        <span class=\"highlight\">Exceptional damage <span class=\"casualties\">" + crits(weapons) + "</span></span>\n      \n      </fieldset>");
}
//# sourceMappingURL=engine.js.map