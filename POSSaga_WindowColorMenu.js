var Imported = Imported || {};
Imported.POSSaga_WindowColorMenu = true;

var POSSaga = POSSaga || {};
POSSaga.WindowColorMenu = POSSaga.WindowColorMenu || {};

//=============================================================================
 /*:
 * @plugindesc An options menu to change the window color
 * @author Soaprman
 *
 * @help
 * Help? What do you think this is, a professional script?
 *
 *
 */
//=============================================================================

// TODO someday? Param these
POSSaga.WindowColorMenu.Consts = POSSaga.WindowColorMenu.Consts || {};
POSSaga.WindowColorMenu.Consts.DefaultRed = 40;
POSSaga.WindowColorMenu.Consts.DefaultGreen = 40;
POSSaga.WindowColorMenu.Consts.DefaultBlue = 80;
POSSaga.WindowColorMenu.Consts.DefaultAlpha = 160;

POSSaga.WindowColorMenu.Consts.Strings = POSSaga.WindowColorMenu.Consts.Strings || {};
POSSaga.WindowColorMenu.Consts.Strings.MenuName = 'Window Color';
POSSaga.WindowColorMenu.Consts.Strings.Red = 'Background Red';
POSSaga.WindowColorMenu.Consts.Strings.Green = 'Background Green';
POSSaga.WindowColorMenu.Consts.Strings.Blue = 'Background Blue';
POSSaga.WindowColorMenu.Consts.Strings.Alpha = 'Background Alpha';
POSSaga.WindowColorMenu.Consts.Strings.RedHelp = 'Higher number = more red';
POSSaga.WindowColorMenu.Consts.Strings.GreenHelp = 'Higher number = more green';
POSSaga.WindowColorMenu.Consts.Strings.BlueHelp = 'Higher number = more blue';
POSSaga.WindowColorMenu.Consts.Strings.AlphaHelp = 'Higher number = more opaque';
POSSaga.WindowColorMenu.Consts.Strings.Finish = 'Finished!';

//=============================================================================
// ConfigManager
//=============================================================================

ConfigManager.windowColor = ConfigManager.windowColor || {
    red: POSSaga.WindowColorMenu.Consts.DefaultRed,
    green: POSSaga.WindowColorMenu.Consts.DefaultGreen,
    blue: POSSaga.WindowColorMenu.Consts.DefaultBlue,
    alpha: POSSaga.WindowColorMenu.Consts.DefaultAlpha
};

POSSaga.WindowColorMenu.ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function () {
    var config = POSSaga.WindowColorMenu.ConfigManager_makeData.call(this);
    config.windowColor = this.windowColor;
    return config;
};

POSSaga.WindowColorMenu.ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function (config) {
    POSSaga.WindowColorMenu.ConfigManager_applyData.call(this, config);
    this.windowColor = config.windowColor;
};

//=============================================================================
// Window_Base
//=============================================================================

// Overwrites the one in rpg_windows.js
Window_Base.prototype.updateTone = function () {
    this.setTone(ConfigManager.windowColor.red, ConfigManager.windowColor.green, ConfigManager.windowColor.blue);
};

// Overwrites the one in rpg_windows.js
Window_Base.prototype.standardBackOpacity = function () {
    // Overwrites Yanfly.Param.WindowOpacity if using that plugin
    return ConfigManager.windowColor.alpha;
};

POSSaga.WindowColorMenu.Window_Base_update = Window_Base.prototype.update;
Window_Base.prototype.update = function () {
    POSSaga.WindowColorMenu.Window_Base_update.call(this);
    this.updateBackOpacity();
};

//=============================================================================
// Window_Options
//=============================================================================

POSSaga.WindowColorMenu.Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
Window_Options.prototype.addGeneralOptions = function () {
    POSSaga.WindowColorMenu.Window_Options_addGeneralOptions.call(this);
    this.addCommand(POSSaga.WindowColorMenu.Consts.Strings.MenuName, 'windowColor', true);
};

POSSaga.WindowColorMenu.Window_Options_statusText = Window_Options.prototype.statusText;
Window_Options.prototype.statusText = function (index) {
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (symbol === 'windowColor') {
        return value.red + ', ' + value.green + ', ' + value.blue + ', ' + value.alpha;
    } else {
        return POSSaga.WindowColorMenu.Window_Options_statusText.call(this, index);
    }
};

POSSaga.WindowColorMenu.Window_Options_processOk = Window_Options.prototype.processOk;
Window_Options.prototype.processOk = function () {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (symbol === 'windowColor') {
        Window_Command.prototype.processOk.call(this);
    } else {
        POSSaga.WindowColorMenu.Window_Options_processOk.call(this);
    }
};

//=============================================================================
// Window_WindowColor
//=============================================================================

function Window_WindowColor() {
    this.initialize.apply(this, arguments);
}

Window_WindowColor.prototype = Object.create(Window_Command.prototype);
Window_WindowColor.prototype.constructor = Window_WindowColor;

Window_WindowColor.prototype.initialize = function (helpWindow) {
    var wy = helpWindow.height;
    Window_Command.prototype.initialize.call(this, 0, wy);

    this.setHelpWindow(helpWindow);
    this.refresh();
    this.activate();
    this.select(0);
    this.height = Graphics.boxHeight - wy;
};

Window_WindowColor.prototype.makeCommandList = function (index) {
    this.addCommand(POSSaga.WindowColorMenu.Consts.Strings.Red, 'red', true);
    this.addCommand(POSSaga.WindowColorMenu.Consts.Strings.Green, 'green', true);
    this.addCommand(POSSaga.WindowColorMenu.Consts.Strings.Blue, 'blue', true);
    this.addCommand(POSSaga.WindowColorMenu.Consts.Strings.Alpha, 'alpha', true);
    this.addCommand(POSSaga.WindowColorMenu.Consts.Strings.Finish, 'finish', true);
};

Window_WindowColor.prototype.windowWidth = function () {
    return Graphics.boxWidth;
};

Window_WindowColor.prototype.drawItem = function (index) {
    var rect = this.itemRectForText(index);
    var itemNameWidth = this.itemNameWidth();
    var itemValueWidth = rect.width - itemNameWidth;
    this.resetTextColor();
    this.changePaintOpacity(this.isCommandEnabled(index));
    this.drawText(this.commandName(index), rect.x, rect.y, itemNameWidth, 'left');
    this.drawText(this.itemValueText(index), itemNameWidth, rect.y, itemValueWidth, 'right');
};

Window_WindowColor.prototype.itemNameWidth = function () {
    return 200;
};

Window_WindowColor.prototype.itemValueText = function (index) {
    switch (index) {
        case 0: return ConfigManager.windowColor.red;
        case 1: return ConfigManager.windowColor.green;
        case 2: return ConfigManager.windowColor.blue;
        case 3: return ConfigManager.windowColor.alpha;
        default: return '';
    }
};

Window_WindowColor.prototype.cursorLeft = function (wrap) {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    switch (symbol) {
        case 'red':
            ConfigManager.windowColor.red = this.decreaseColorValue(ConfigManager.windowColor.red); break;
        case 'green':
            ConfigManager.windowColor.green = this.decreaseColorValue(ConfigManager.windowColor.green); break;
        case 'blue':
            ConfigManager.windowColor.blue = this.decreaseColorValue(ConfigManager.windowColor.blue); break;
        case 'alpha':
            ConfigManager.windowColor.alpha = this.decreaseColorValue(ConfigManager.windowColor.alpha); break;
    }
    this.redrawItem(this.findSymbol(symbol));
};

Window_WindowColor.prototype.cursorRight = function (wrap) {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    switch (symbol) {
        case 'red':
            ConfigManager.windowColor.red = this.increaseColorValue(ConfigManager.windowColor.red); break;
        case 'green':
            ConfigManager.windowColor.green = this.increaseColorValue(ConfigManager.windowColor.green); break;
        case 'blue':
            ConfigManager.windowColor.blue = this.increaseColorValue(ConfigManager.windowColor.blue); break;
        case 'alpha':
            ConfigManager.windowColor.alpha = this.increaseColorValue(ConfigManager.windowColor.alpha); break;
    }
    this.redrawItem(this.findSymbol(symbol));
};

Window_WindowColor.prototype.increaseColorValue = function (value) {
    if (value === 255) return 255;
    else if (value === 248) return 255;
    else return value + 8;
}

Window_WindowColor.prototype.decreaseColorValue = function (value) {
    if (value === 255) return 248;
    else if (value === 0) return 0;
    else return value - 8;
}

Window_WindowColor.prototype.updateHelp = function () {
    if (!this._helpWindow) return;
    switch (this.index()) {
        case 0:
            this._helpWindow.setText(POSSaga.WindowColorMenu.Consts.Strings.RedHelp);
            break;
        case 1:
            this._helpWindow.setText(POSSaga.WindowColorMenu.Consts.Strings.GreenHelp);
            break;
        case 2:
            this._helpWindow.setText(POSSaga.WindowColorMenu.Consts.Strings.BlueHelp);
            break;
        case 3:
            this._helpWindow.setText(POSSaga.WindowColorMenu.Consts.Strings.AlphaHelp);
            break;
        default:
            this._helpWindow.clear();
            break;
    }
};

//=============================================================================
// Scene_Options
//=============================================================================

POSSaga.WindowColorMenu.Scene_Options_createOptionsWindow = Scene_Options.prototype.createOptionsWindow;
Scene_Options.prototype.createOptionsWindow = function () {
    POSSaga.WindowColorMenu.Scene_Options_createOptionsWindow.call(this);
    this._optionsWindow.setHandler('windowColor', this.commandWindowColor.bind(this));
};

Scene_Options.prototype.commandWindowColor = function () {
    SceneManager.push(Scene_WindowColor);
};

//=============================================================================
// Scene_WindowColor
//=============================================================================

function Scene_WindowColor() {
    this.initialize.apply(this, arguments);
}

Scene_WindowColor.prototype = Object.create(Scene_MenuBase.prototype);
Scene_WindowColor.prototype.constructor = Scene_WindowColor;

Scene_WindowColor.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_WindowColor.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);
    this.createHelpWindow();
    this.createWindowColorWindow();
};

Scene_WindowColor.prototype.update = function () {
    Scene_MenuBase.prototype.update.call(this);
    ConfigManager.save();
};

Scene_WindowColor.prototype.createWindowColorWindow = function () {
    this._windowColorWindow = new Window_WindowColor(this._helpWindow);
    this._windowColorWindow.setHandler('finish', this.popScene.bind(this));
    this.addWindow(this._windowColorWindow);
};

Scene_WindowColor.prototype.terminate = function () {
    Scene_MenuBase.prototype.terminate.call(this);
    ConfigManager.save();
};