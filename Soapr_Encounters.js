var Imported = Imported || {};
Imported.Soapr_Encounters = true;

var Soapr = Soapr || {};
Soapr.Encounters = Soapr.Encounters || {};

//=============================================================================
 /*:
 * @plugindesc Just additional options for random encounters.
 * Also adds a random encounter rate slider.
 * @author Soaprman
 *
 * @help
 * Help? What do you think this is, a professional script?
 *
 * @param TroopId Variable
 * @desc The variable to store the event's troop ID in before calling the "Before Battle Common Event".
 * Leave 0 to not use this functionality.
 * @default 0
 * 
 * @param Before Battle Common Event
 * @desc The common event to call right before the battle.
 * Leave 0 to not call a common event.
 * @default 0
 * 
 * @param After Battle Common Event
 * @desc The common event to call after the battle is over.
 * Leave 0 to not call a common event.
 * @default 0
 * 
 */
//=============================================================================

Soapr.Encounters.RawParam = PluginManager.parameters('Soapr_Encounters');
Soapr.Encounters.Param = Soapr.Encounters.Param || {};

Soapr.Encounters.Param.TroopIdVariable = Number(Soapr.Encounters.RawParam['TroopId Variable']);
Soapr.Encounters.Param.BeforeBattleCommonEvent = Number(Soapr.Encounters.RawParam['Before Battle Common Event']);
Soapr.Encounters.Param.AfterBattleCommonEvent = Number(Soapr.Encounters.RawParam['After Battle Common Event']);

//=============================================================================
// ConfigManager
//=============================================================================

ConfigManager.encounterRate = 100; // Percentage

Object.defineProperty(ConfigManager, 'bgmVolume', {
    get: function() {
        return AudioManager._bgmVolume;
    },
    set: function(value) {
        AudioManager.bgmVolume = value;
    },
    configurable: true
});

Soapr.Encounters.ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function () {
    var config = Soapr.Encounters.ConfigManager_makeData.call(this);
    config.encounterRate = this.encounterRate;
    return config;
};

Soapr.Encounters.ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function (config) {
    Soapr.Encounters.ConfigManager_applyData.call(this, config);
    this.encounterRate = config.encounterRate || 100;
};

ConfigManager.readEncounterRate = function(config) {
    var value = config[encounterRate];
    if (value !== undefined) {
        return Number(value).clamp(0, 200);
    } else {
        return 100;
    }
};

//=============================================================================
// Game_Player
//=============================================================================

// Replace the one in rpg_objects.js
// Game_Player.prototype.makeEncounterCount = function() {
//     var n = $gameMap.encounterStep();
//     this._encounterCount = Math.randomInt(n) + Math.randomInt(n) + 1;
// };

// Replace the one in rpg_objects.js
Game_Player.prototype.encounterProgressValue = function() {
    // Not sure if I want this in the game! Might parameterize it
    // var value = $gameMap.isBush(this.x, this.y) ? 2 : 1;
    var value = 1;
    if ($gameParty.hasEncounterHalf()) {
        value *= 0.5;
    }
    if (this.isInShip()) {
        value *= 0.5;
    }
    value *= ConfigManager.encounterRate / 100.0;
    return value;
};

Soapr.Encounters.Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function () {
    Soapr.Encounters.Game_Player_initMembers.call(this);
    this.setBattleStarting(false);
};

Game_Player.prototype.isBattleStarting = function () {
    return this._battleStarting;
}

Game_Player.prototype.setBattleStarting = function (value) {
    this._battleStarting = value;
}

//=============================================================================
// Scene_Map
//=============================================================================

Scene_Map.prototype.updateEncounter = function() {
    // This "battleStarting" flag gets around the common event being unset in the scene transition before it can execute
    if ($gamePlayer.executeEncounter()) {
        if (Soapr.Encounters.Param.TroopIdVariable > 0) {
            $gameVariables.setValue(Soapr.Encounters.Param.TroopIdVariable, $gameTroop._troopId);
        }
        if (Soapr.Encounters.Param.BeforeBattleCommonEvent > 0) {
            $gameTemp.reserveCommonEvent(Soapr.Encounters.Param.BeforeBattleCommonEvent);
        }

        $gameMap.setupStartingEvent();
        $gamePlayer.setBattleStarting(true);

    } else if ($gamePlayer.isBattleStarting()) {
        SceneManager.push(Scene_Battle);
    }
};

Soapr.Encounters.Scene_Map_start = Scene_Map.prototype.start;
Scene_Map.prototype.start = function () {
    Soapr.Encounters.Scene_Map_start.call(this);

    if ($gamePlayer.isBattleStarting()) {
        if (Soapr.Encounters.Param.AfterBattleCommonEvent > 0) {
            $gameTemp.reserveCommonEvent(Soapr.Encounters.Param.AfterBattleCommonEvent);
        }
        $gamePlayer.setBattleStarting(false);
    }
};

//=============================================================================
// Window_Options
//=============================================================================

Soapr.Encounters.Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
Window_Options.prototype.makeCommandList = function() {
    Soapr.Encounters.Window_Options_makeCommandList.call(this);
    this.addCommand('Encounter Rate', 'encounterRate');
};

Window_Options.prototype.encounterRateText = function(value) {
    return value + '%';
};

Soapr.Encounters.Window_Options_statusText = Window_Options.prototype.statusText;
Window_Options.prototype.statusText = function (index) {
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (symbol === 'encounterRate') {
        return this.encounterRateText(value);
    } else {
        return Soapr.Encounters.Window_Options_statusText.call(this, index);
    }
};

Window_Options.prototype.isEncounterRateSymbol = function (symbol) {
    return symbol === 'encounterRate';
}

Soapr.Encounters.Window_Options_processOk = Window_Options.prototype.processOk;
Window_Options.prototype.processOk = function () {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (this.isEncounterRateSymbol(symbol)) {
        value += this.encounterRateOffset();
        if (value > 200) {
            value = 0;
        }
        value = value.clamp(0, 200);
        this.changeValue(symbol, value);
    } else {
        Soapr.Encounters.Window_Options_processOk.call(this);
    }
};

Soapr.Encounters.Window_Options_cursorRight = Window_Options.prototype.cursorRight;
Window_Options.prototype.cursorRight = function(wrap) {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (this.isEncounterRateSymbol(symbol)) {
        value += this.encounterRateOffset();
        value = value.clamp(0, 200);
        this.changeValue(symbol, value);
    } else {
        Soapr.Encounters.Window_Options_cursorRight.call(this, wrap);
    }
};

Soapr.Encounters.Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
Window_Options.prototype.cursorLeft = function(wrap) {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (this.isEncounterRateSymbol(symbol)) {
        value -= this.encounterRateOffset();
        value = value.clamp(0, 200);
        this.changeValue(symbol, value);
    } else {
        Soapr.Encounters.Window_Options_cursorLeft.call(this, wrap);
    }
};

Window_Options.prototype.encounterRateOffset = function() {
    return 25;
};