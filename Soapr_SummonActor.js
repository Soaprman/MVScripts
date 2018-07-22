var Imported = Imported || {};
Imported.Soapr_SummonActor = true;

var Soapr = Soapr || {};
Soapr.SummonActor = Soapr.SummonActor || {};

//=============================================================================
/*:
* @plugindesc Adds ability to summon temp actors in battle
* @author Soaprman
*
* @help
* Help? What do you think this is, a professional script?
*
* ============================================================================
* Actor note tags
* ============================================================================
* <Leave After Battle>
* This actor leaves the party after each battle before rewards are given.
*
*
* ============================================================================
* Skill note tags
* ============================================================================
* <Summon Actor: x>
* Summon the actor with ID x for the length of this battle.
* Makes the move unselectable if that actor is already in the party.
* 
*/
//=============================================================================

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
	Object.defineProperty(Array.prototype, 'find', {
		value: function (predicate) {
			// 1. Let O be ? ToObject(this value).
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, � kValue, k, O �)).
				// d. If testResult is true, return kValue.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o)) {
					return kValue;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return undefined.
			return undefined;
		}
	});
}

Soapr.SummonActor.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
	if (!Soapr.SummonActor.DataManager_isDatabaseLoaded.call(this)) return false;
	if (!Soapr.SummonActor._databaseIsLoaded) {
		this.processSummonActorActorNotetags($dataActors);
		this.processSummonActorSkillNotetags($dataSkills);
		Soapr.SummonActor._databaseIsLoaded = true;
	}
	return true;
};

DataManager.processSummonActorActorNotetags = function (group) {
	for (var s = 1; s < group.length; s++) {
		var item = group[s];
		var noteData = item.note.split(/[\r\n]+/);

		item.leaveAfterBattle = false;

		for (var i = 0; i < noteData.length; i++) {
			var line = noteData[i];
			if (line.match(/<(?:Leave After Battle)>/i)) {
				item.leaveAfterBattle = true;
			}
		}
	}
};

DataManager.processSummonActorSkillNotetags = function (group) {
	for (var s = 1; s < group.length; s++) {
		var item = group[s];
		var noteData = item.note.split(/[\r\n]+/);

		item.summonActor = 0;

		for (var i = 0; i < noteData.length; i++) {
			var line = noteData[i];
			if (line.match(/<(?:Summon Actor):[ ](\d+)>/i)) {
				item.summonActor = parseInt(RegExp.$1);
			}
		}
	}
};

//=============================================================================
// BattleManager
//=============================================================================

// TODO: What happens if summoned members are alone at end of battle?

Soapr.SummonActor.BattleManager_processVictory = BattleManager.processVictory;
BattleManager.processVictory = function (result) {
	this.unsummonActors();
	Soapr.SummonActor.BattleManager_processVictory.call(this, result);
};

Soapr.SummonActor.BattleManager_processEscape = BattleManager.processEscape;
BattleManager.processEscape = function (result) {
	this.unsummonActors();
	Soapr.SummonActor.BattleManager_processEscape.call(this, result);
};

Soapr.SummonActor.BattleManager_processAbort = BattleManager.processAbort;
BattleManager.processAbort = function (result) {
	this.unsummonActors();
	Soapr.SummonActor.BattleManager_processAbort.call(this, result);
};

Soapr.SummonActor.BattleManager_processDefeat = BattleManager.processDefeat;
BattleManager.processDefeat = function (result) {
	this.unsummonActors();
	Soapr.SummonActor.BattleManager_processDefeat.call(this, result);
};

BattleManager.unsummonActors = function () {
	$gameParty.allMembers().forEach(function (actor) {
		if (actor.summoner()) {
			$gameParty.unsummonActor(actor.actorId());
		}
	});
};

//=============================================================================
// Game_Action
//=============================================================================

// applyGlobal - apply for moves with no Scope defined
Soapr.SummonActor.Game_Action_applyGlobal = Game_Action.prototype.applyGlobal;
Game_Action.prototype.applyGlobal = function (target) {
	Soapr.SummonActor.Game_Action_applyGlobal.call(this, target);
	if (this.item().summonActor && this.item().summonActor !== 0) {
		$gameParty.summonActor(this.subject().actorId(), this.item().summonActor);
	}
};


//=============================================================================
// Game_BattlerBase
//=============================================================================

Soapr.SummonActor.Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
Game_BattlerBase.prototype.meetsSkillConditions = function (skill) {
	var meets = Soapr.SummonActor.Game_BattlerBase_meetsSkillConditions.call(this, skill);
	if (skill.summonActor !== 0) {
		// TODO? Create public exposure for _actors and use that here
		if ($gameParty._actors.contains(skill.summonActor)) {
			var actor = $gameParty.allMembers().find(function (actor) { return actor.actorId() === skill.summonActor; });
			if (actor && actor.isAppeared()) {
				return false;
			}
		}
	}
	return meets;
};

//=============================================================================
// Game_Battler
//=============================================================================

Soapr.SummonActor.Game_Battler_initMembers = Game_Battler.prototype.initMembers;
Game_Battler.prototype.initMembers = function () {
	Soapr.SummonActor.Game_Battler_initMembers.call(this);
	this._summoner = null;
	this._unsummonWhenDead = false;
};

Game_Battler.prototype.summoner = function () {
	return this._summoner;
};

Game_Battler.prototype.setSummoner = function (id) {
	this._summoner = id;
};

Game_Battler.prototype.unsummonWhenDead = function () {
	return this._unsummonWhenDead;
};

Game_Battler.prototype.setUnsummonWhenDead = function (unsummonWhenDead) {
	this._unsummonWhenDead = unsummonWhenDead;
};

// Replace rpg_objects.js
// Replace Yanfly.BPC.Game_Battler_refresh from YEP_BaseParamControl
Game_Battler.prototype.refresh = function () {
	this._baseParamCache = undefined; // YEP

	Game_BattlerBase.prototype.refresh.call(this);
	if (this.hp === 0) {
		this.addState(this.deathStateId());

		if (this._summoner && this._unsummonWhenDead) {
			if (this.isActor()) {
				this.hide();
				this.recoverAll(); // Prevents HP from being 0 on resummon
				$gameParty.unsummonActor(this.actorId());
			} else {
				$gameTroop.removeEnemy(this);
			}
		}
	} else {
		this.removeState(this.deathStateId());
	}
};

//=============================================================================
// Game_Party
//=============================================================================

Game_Party.prototype.summonActor = function (summonerId, actorId) {
	if (!this._actors.contains(actorId)) {
		this.setSummonedMemberCount(this.summonedMemberCount() + 1); // Fix party size
		this.addActor(actorId);
		var actor = this.allMembers().find(function (actor) { return actor.actorId() === actorId; });
		var summoner = this.allMembers().find(function (actor) { return actor.actorId() === summonerId; });
		actor.changeLevel(summoner.level, false);
		actor.recoverAll();
		actor.clearTp();
		actor.setSummoner(summonerId);
		actor.setUnsummonWhenDead(true);
		actor.appear();
		this.refreshActorHomes();
	}
};

Game_Party.prototype.unsummonActor = function (actorId) {
	if (this._actors.contains(actorId)) {
		this.removeActor(actorId);
		this.setSummonedMemberCount(this.summonedMemberCount() - 1); // Fix party size
		this.refreshActorHomes();
	}
};

Game_Party.prototype.setSummonedMemberCount = function (count) {
	this._summonedMemberCount = count;
};

Game_Party.prototype.summonedMemberCount = function () {
	return this._summonedMemberCount || 0;
};

Soapr.SummonActor.Game_Party_maxBattleMembers = Game_Party.prototype.maxBattleMembers;
Game_Party.prototype.maxBattleMembers = function () {
	var count = Soapr.SummonActor.Game_Party_maxBattleMembers.call(this);
	return count + this.summonedMemberCount();
};

// Mainly used to fix offsets for animations and damage numbers
Game_Party.prototype.refreshActorHomes = function () {
	if (this.inBattle()) {
		BattleManager.refreshStatus(); // Not strictly necessary but fixes a bit of jankiness
		var sprites = SceneManager._scene._spriteset._actorSprites;
		for (var i = 0; i < sprites.length; i++) {
			sprites[i].setActorHome(i);
		}
	}
};

//=============================================================================
// Game_Troop
//=============================================================================

Game_Troop.prototype.addEnemy = function (enemyId) {
	// TODO: position
	var x = 0;
	var y = 0;
	var enemy = new Game_Enemy(enemyId, x, y);
	this._enemies.push(enemy);
};

Game_Troop.prototype.removeEnemy = function (enemy) {
	if (this._enemies.contains(enemy))
		this._enemies.remove(enemy);
};