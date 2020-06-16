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
function shoot(weapons, target) {
    return weapons
        .map(function (weapon) {
        var shots = getShots(weapon);
        var modifier = getToHitModifiers(weapon, target);
        console.log(weapon);
    });
}
function getShots(weapon) {
    var shots = [];
    for (var i = 0; i < weapon.shots; i++) {
        shots.push({
            weapon: weapon
        });
    }
    return shots;
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
function getToHitModifiers(weapon, target) {
    var coverLookup = {
        n: 0,
        s: -1,
        h: -2
    };
    var rangeLookup = {
        c: 0,
        s: -1,
        l: -2
    };
    return coverLookup[target.cover]
        + rangeLookup[weapon.modifiers.range]
        + (weapon.modifiers.moved ? -1 : 0)
        + (target.down ? -2 : 0);
}
function attack() {
    var result = shoot(selectedWeapons, target);
}
document.querySelector('#addWeapon select').innerHTML =
    weapons
        .map(function (weapon, index) {
        return "<option value=\"" + index + "\">" + weapon.name + "</option>";
    }).join('');
function populateModifiersPanel(weapons) {
    document.querySelector('.modifiers .weapons').innerHTML = "\n    " + weapons.map(function (weapon, index) {
        return "<div data-index=\"" + index + "\">\n        " + weapon.name + " :\n        <input type=\"radio\" id=\"close\" value=\"c\" name=\"" + index + "\">\n        <label for=\"close\">close</label>\n    \n        <input type=\"radio\" id=\"short\" value=\"s\" name=\"" + index + "\" checked>\n        <label for=\"short\">short</label>\n    \n        <input type=\"radio\" id=\"long\" value=\"l\" name=\"" + index + "\">\n        <label for=\"long\">long</label>\n        \n        " + (weapon.name === 'Anti-tank Rifle' || weapon.name === 'LMG' ?
            "<input type=\"checkbox\" id=\"missing\" name=\"" + index + "\" value=\"nl\">\n          <label for=\"loader\">no loader</label>" : '') + "\n      </div>";
    }).join('') + "\n  ";
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
    document.querySelector('.selection').insertAdjacentHTML('afterbegin', "\n    <div>" + formdata.get('amount') + " " + weapons[Number(formdata.get('type'))].name + "</div>\n  ");
});
document
    .querySelector('.selection input')
    .addEventListener('click', function () {
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
document
    .querySelector('.modifiers .weapons')
    .addEventListener('change', function (event) {
    var targetEl = event.target;
    var value = targetEl.value;
    value === 's' || value === 'l' || value === 'c' ?
        selectedWeapons[parseInt(targetEl.name)].modifiers.range = targetEl.value :
        value === 'nl' ?
            selectedWeapons[parseInt(targetEl.name)].modifiers.loader = true : void 0;
});
document
    .querySelector('form.cover')
    .addEventListener('change', function (event) {
    target.cover = event.target.value;
});
document
    .querySelector('form.damageValue')
    .addEventListener('change', function (event) {
    target.damageValue = parseInt(event.target.value);
});
var checkboxDown = document.querySelector('input[id="down"]');
checkboxDown.addEventListener('change', function () {
    target.down = checkboxDown.checked ? true : false;
});
//# sourceMappingURL=engine.js.map