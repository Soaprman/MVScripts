var Imported = Imported || {};
Imported.Soapr_FilterBattleback = true;

var Soapr = Soapr || {};
Soapr.FilterBB = Soapr.FilterBB || {};

//=============================================================================
/*:
* @plugindesc Adds filter battleback to RPG Maker MV (like in RPG Maker VX)
* @author Soaprman
*
* @help
* Help? What do you think this is, a professional script?
*
* This is only tested in RPG Maker MV 1.6.1.
* For older versions, use the non-v2 of this script.
*
* 
*/
//=============================================================================

Soapr.FilterBB.Spriteset_Battle_initialize = Spriteset_Battle.prototype.initialize;
Spriteset_Battle.prototype.initialize = function() {
    Soapr.FilterBB.Spriteset_Battle_initialize.call(this);
    this._animationTick = 0;
    this.initializeFilters();
};

Spriteset_Battle.prototype.initializeFilters = function () {
    this._filters = {};

    this._filters.reflection0 = new PIXI.filters.ReflectionFilter();
    this._filters.reflection0.mirror = false;
    this._filters.reflection0.boundary = 0;
    this._filters.reflection0.amplitude = [20, 20];
    this._filters.reflection0.waveLength = [150, 150];

    this._filters.radial0 = new PIXI.filters.RadialBlurFilter();
    this._filters.radial0.radius = -1; // infinite
    this._filters.radial0.angle = 60;
    this._filters.radial0.kernelSize = 13;
    this._filters.radial0.center = [Graphics.boxWidth / 2, Graphics.boxHeight / 2];

    this._filters.glitch0 = new PIXI.filters.GlitchFilter();
    this._filters.glitch0.fillMode = 2; // loop
    this._filters.glitch0.slices = 10;

    this._filtersInitialized = true;
};

Soapr.FilterBB.Spriteset_Battle_update = Spriteset_Battle.prototype.update;
Spriteset_Battle.prototype.update = function () {
    Soapr.FilterBB.Spriteset_Battle_update.call(this);
    this.updateBattlebackWaviness();
};

Spriteset_Battle.prototype.updateBattlebackWaviness = function () {
	this._animationTick += 1;

    this._filters.reflection0.time = this._animationTick / 15;
    this._backgroundSprite.filters = [this._filters.reflection0, this._filters.radial0];
};

Soapr.FilterBB.Spriteset_Battle_createBattleback = Spriteset_Battle.prototype.createBattleback;
Spriteset_Battle.prototype.createBattleback = function() {
    Soapr.FilterBB.Spriteset_Battle_createBattleback.call(this);

    if (!this._filtersInitialized) this.initializeFilters();
}