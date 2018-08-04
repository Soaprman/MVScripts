var Imported = Imported || {};
Imported.Soapr_VisualEncounters = true;

var Soapr = Soapr || {};
Soapr.VisualEncounters = Soapr.VisualEncounters || {};

//=============================================================================
 /*:
 * @plugindesc Spawns visual encounter events using the random encounter table for a map.
 * @author Soaprman
 *
 * @help
 * Help? What do you think this is, a professional script?
 *
 * @param TroopId Variable
 * @desc The variable to store the event's troop ID in when you touch it before battle.
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
 * @param Remove Event After Flee
 * @desc Whether to remove the event after you flee.
 * ON - true     OFF - false
 * @default true
 * 
 * @param Despawn Time
 * @desc The time (in frames) after which the event will despawn if it has not been touched.
 * @default 300
 * 
 * @param Monster Event Name
 * @desc The name for monster events
 * @default monster
 * 
 */
//=============================================================================

Soapr.VisualEncounters.RawParam = PluginManager.parameters('Soapr_VisualEncounters');
Soapr.VisualEncounters.Param = Soapr.VisualEncounters.Param || {};

Soapr.VisualEncounters.Param.TroopIdVariable = Number(Soapr.VisualEncounters.RawParam['TroopId Variable']);
Soapr.VisualEncounters.Param.BeforeBattleCommonEvent = Number(Soapr.VisualEncounters.RawParam['Before Battle Common Event']);
Soapr.VisualEncounters.Param.AfterBattleCommonEvent = Number(Soapr.VisualEncounters.RawParam['After Battle Common Event']);
Soapr.VisualEncounters.Param.RemoveEventAfterFlee = eval(String(Soapr.VisualEncounters.RawParam['Remove Event After Flee']));
Soapr.VisualEncounters.Param.DespawnTime = Number(Soapr.VisualEncounters.RawParam['Despawn Time']);
Soapr.VisualEncounters.Param.MonsterEventName = String(Soapr.VisualEncounters.RawParam['Monster Event Name']);

Soapr.VisualEncounters.Random = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max + 1 - min)) + min; // The +1 makes it inclusive on both ends
};

//=============================================================================
// Game_Player
//=============================================================================

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
    return value;
};

// Replace the one in rpg_objects.js
Game_Player.prototype.executeEncounter = function() {
    if (!$gameMap.isEventRunning() && this._encounterCount <= 0) {
        this.makeEncounterCount();
        var troopId = this.makeEncounterTroopId();
        if ($dataTroops[troopId]) {
            $gameMap.spawnEncounter(troopId, this.x, this.y, this.direction());
            return false;
            // BattleManager.setup(troopId, true, false);
            // BattleManager.onEncounter();
            // return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

//=============================================================================
// Game_Map
//=============================================================================

Soapr.VisualEncounters.Game_Map_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function() {
    Soapr.VisualEncounters.Game_Map_initialize.call(this);
    this._despawnTimers = [];
};

Soapr.VisualEncounters.Game_Map_update = Game_Map.prototype.update;
Game_Map.prototype.update = function(sceneActive) {
    Soapr.VisualEncounters.Game_Map_update.call(this, sceneActive);
    this.updateDespawnTimers();
};

Game_Map.prototype.updateDespawnTimers = function () {
    this._despawnTimers = this._despawnTimers || [];
    
    for (var i = 0; i < this._despawnTimers.length; i++) {
        var timer = this._despawnTimers[i];

        // For YEP_EventChasePlayer - Don't run timer if enemy is chasing player
        if (this._events[timer.eventId]._chasePlayer) continue;
        
        if (timer.time > 0) {
            timer.time--;
        } else if (timer.time === 0) {
            this.despawnEvent(timer.eventId);
            this._despawnTimers.splice(i, 1);
        }
    }
};

Game_Map.prototype.setDespawnTimer = function (eventId) {
    this._despawnTimers.push({
        eventId: eventId,
        time: Soapr.VisualEncounters.Param.DespawnTime
    });
};

Game_Map.prototype.despawnEvent = function (eventId) {
    this._events[eventId].erase();
};

Game_Map.prototype.spawnEncounter = function (troopId, playerX, playerY, playerDirection) {
    var eventId = this._events.length + 1; // Generated ID
    var event = new Game_Event(this._mapId, eventId);

    // Make it more likely to spawn in front of the player
    var rangeUp, rangeDown, rangeLeft, rangeRight;
    if (playerDirection === 8) { // Up
        rangeUp = 15;
        rangeDown = 0;
        rangeLeft = 5;
        rangeRight = 5;
    } else if (playerDirection === 2) { // Down
        rangeUp = 0;
        rangeDown = 15;
        rangeLeft = 5;
        rangeRight = 5;
    } else if (playerDirection === 4) { // Left
        rangeUp = 5;
        rangeDown = 5;
        rangeLeft = 15;
        rangeRight = 0;
    } else if (playerDirection === 6) { // Right
        rangeUp = 5;
        rangeDown = 5;
        rangeLeft = 0;
        rangeRight = 15;
    }

    var passableTiles = [];
    for (var x = playerX - rangeLeft; x <= playerX + rangeRight; x++) {
        for (var y = playerY - rangeUp; y <= playerY + rangeDown; y++) {
            if (x === playerX && y === playerY) {
                continue;
            } else if (this.checkTileSpawnable(x, y)) {
                passableTiles.push([x, y]);
            }
        }
    }

    if (passableTiles.length === 0) return;

    var spawnTile = passableTiles[Soapr.VisualEncounters.Random(0, passableTiles.length - 1)];

    // TODO: Set event "home"
    var enemyX = spawnTile[0];
    var enemyY = spawnTile[1];
    event.locate(enemyX, enemyY);

    if (enemyX < playerX) {
        event.setDirection(6); // Face right
    } else if (enemyX > playerX) {
        event.setDirection(4); // Face left
    } else if (enemyY < playerY) {
        event.setDirection(8); // Face up
    } else {
        event.setDirection(2); // Face down
    }

    event._troopId = troopId;
    this.setDespawnTimer(eventId);

    this._events[eventId] = event;
    SceneManager._scene._spriteset.createCharacters();
    SceneManager._scene._spriteset.update();
    // SceneManager._scene._spriteset.hideCharacters();
};

// checkPassage variant
Game_Map.prototype.checkTileSpawnable = function (x, y) {
    var flags = this.tilesetFlags();
    var tiles = this.allTiles(x, y);
    var bit = 0x0f;
    for (var i = 0; i < tiles.length; i++) {
        var flag = flags[tiles[i]];
        if ((flag & 0x10) !== 0)  // [*] No effect on passage
            continue;
        if ((flag & bit) === 0 && (flag & 0x800) === 0) {
            // [o] Passable && Not a weird autotile that lets you walk through it
            return true;
        }
        if ((flag & bit) === bit) // [x] Impassable
            return false;
    }
    return false;
};

//=============================================================================
// Game_Event
//=============================================================================

Soapr.VisualEncounters.Game_Event_initMembers = Game_Event.prototype.initMembers;
Game_Event.prototype.initMembers = function() {
    Soapr.VisualEncounters.Game_Event_initMembers.call(this);
    this._troopId = null;
    this._spawnTime = null;
};

Soapr.VisualEncounters.Game_Event_stopCountThreshold = Game_Event.prototype.stopCountThreshold;
Game_Event.prototype.stopCountThreshold = function() {
    // A big ugly hack. RPG Maker supports values 1 through 5. So let's use additional numbers as special modes!
    if (this.moveFrequency() === 6) {
        // Basically a 4.6 on the 1-5 scale
        return 10;
    } else {
        Soapr.VisualEncounters.Game_Event_stopCountThreshold.call(this);
    }
};

Soapr.VisualEncounters.Game_Event_event = Game_Event.prototype.event;
Game_Event.prototype.event = function() {
    if ($dataMap.events[this._eventId]) {
        return Soapr.VisualEncounters.Game_Event_event.call(this);
    } else if (Soapr.VisualEncounters.Param.RemoveEventAfterFlee) {
        var templateEvent = {
            "id": this._eventId,
            "name": Soapr.VisualEncounters.Param.MonsterEventName,
            "note": "",
            "pages": [
                {
                    "conditions": {
                        "actorId": 1,
                        "actorValid": false,
                        "itemId": 1,
                        "itemValid": false,
                        "selfSwitchCh": "A",
                        "selfSwitchValid": false,
                        "switch1Id": 1,
                        "switch1Valid": false,
                        "switch2Id": 1,
                        "switch2Valid": false,
                        "variableId": 1,
                        "variableValid": false,
                        "variableValue": 0
                    },
                    "directionFix": false,
                    "image": {
                        "tileId": 0,
                        "characterName": "Monster",
                        "direction": 2,
                        "pattern": 1,
                        "characterIndex": 6
                    },
                    "list": [
                        {
                            "code": 205,
                            "indent": 0,
                            "parameters": [
                                0,
                                {
                                    "list": [
                                        {
                                            "code": 37,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 42,
                                            "indent": null,
                                            "parameters": [
                                                100
                                            ]
                                        },
                                        {
                                            "code": 17,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                3
                                            ]
                                        },
                                        {
                                            "code": 19,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                3
                                            ]
                                        },
                                        {
                                            "code": 18,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                3
                                            ]
                                        },
                                        {
                                            "code": 16,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                3
                                            ]
                                        },
                                        {
                                            "code": 42,
                                            "indent": null,
                                            "parameters": [
                                                255
                                            ]
                                        },
                                        {
                                            "code": 38,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 0,
                                            "indent": null,
                                            "parameters": []
                                        }
                                    ],
                                    "repeat": false,
                                    "skippable": false,
                                    "wait": true
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 37,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 42,
                                    "indent": null,
                                    "parameters": [
                                        100
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 17,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 19,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 18,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 16,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 42,
                                    "indent": null,
                                    "parameters": [
                                        255
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 38,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 123,
                            "indent": 0,
                            "parameters": [
                                "B",
                                0
                            ]
                        },
                        {
                            "code": 205,
                            "indent": 0,
                            "parameters": [
                                0,
                                {
                                    "list": [
                                        {
                                            "code": 25,
                                            "indent": null
                                        },
                                        {
                                            "code": 0
                                        }
                                    ],
                                    "repeat": false,
                                    "skippable": false,
                                    "wait": false
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 0,
                            "parameters": [
                                {
                                    "code": 25,
                                    "indent": null
                                }
                            ]
                        },
                        {
                            "code": 0,
                            "indent": 0,
                            "parameters": []
                        }
                    ],
                    "moveFrequency": 3,
                    "moveRoute": {
                        "list": [
                            {
                                "code": 0,
                                "parameters": []
                            }
                        ],
                        "repeat": true,
                        "skippable": false,
                        "wait": false
                    },
                    "moveSpeed": 3,
                    "moveType": 0,
                    "priorityType": 1,
                    "stepAnime": false,
                    "through": false,
                    "trigger": 4,
                    "walkAnime": false
                },
                {
                    "conditions": {
                        "actorId": 1,
                        "actorValid": false,
                        "itemId": 1,
                        "itemValid": false,
                        "selfSwitchCh": "B",
                        "selfSwitchValid": true,
                        "switch1Id": 1,
                        "switch1Valid": false,
                        "switch2Id": 1,
                        "switch2Valid": false,
                        "variableId": 1,
                        "variableValid": false,
                        "variableValue": 0
                    },
                    "directionFix": false,
                    "image": {
                        "tileId": 0,
                        "characterName": "Monster",
                        "direction": 6,
                        "pattern": 1,
                        "characterIndex": 6
                    },
                    "moveFrequency": 6,
                    "moveRoute": {
                        "list": [
                            {
                                "code": 0,
                                "indent": null,
                                "parameters": []
                            }
                        ],
                        "repeat": true,
                        "skippable": false,
                        "wait": false
                    },
                    "moveSpeed": 5,
                    "moveType": 2,
                    "priorityType": 1,
                    "stepAnime": true,
                    "through": false,
                    "trigger": 2,
                    "walkAnime": true,
                    "list": [
                        {
                            "code": 122,
                            "indent": 0,
                            "parameters": [
                                Soapr.VisualEncounters.Param.TroopIdVariable,
                                Soapr.VisualEncounters.Param.TroopIdVariable,
                                0,
                                0,
                                this._troopId || 0
                            ]
                        },
                        {
                            "code": 117,
                            "indent": 0,
                            "parameters": [
                                Soapr.VisualEncounters.Param.BeforeBattleCommonEvent
                            ]
                        },
                        {
                            "code": 301,
                            "indent": 0,
                            "parameters": [
                                0,
                                this._troopId || 0,
                                true,
                                false
                            ]
                        },
                        {
                            "code": 601,
                            "indent": 0,
                            "parameters": []
                        },
                        {
                            "code": 0,
                            "indent": 1,
                            "parameters": []
                        },
                        {
                            "code": 602,
                            "indent": 0,
                            "parameters": []
                        },
                        {
                            "code": 0,
                            "indent": 1,
                            "parameters": []
                        },
                        {
                            "code": 604,
                            "indent": 0,
                            "parameters": []
                        },
                        {
                            "code": 117,
                            "indent": 0,
                            "parameters": [
                                Soapr.VisualEncounters.Param.AfterBattleCommonEvent
                            ]
                        },
                        {
                            "code": 123,
                            "indent": 0,
                            "parameters": [
                                "A",
                                0
                            ]
                        },
                        {
                            "code": 0,
                            "indent": 0,
                            "parameters": []
                        }
                    ]
                },
                {
                    "conditions": {
                        "actorId": 1,
                        "actorValid": false,
                        "itemId": 1,
                        "itemValid": false,
                        "selfSwitchCh": "A",
                        "selfSwitchValid": true,
                        "switch1Id": 1,
                        "switch1Valid": false,
                        "switch2Id": 1,
                        "switch2Valid": false,
                        "variableId": 1,
                        "variableValid": false,
                        "variableValue": 0
                    },
                    "directionFix": false,
                    "image": {
                        "tileId": 0,
                        "characterName": "",
                        "direction": 2,
                        "pattern": 0,
                        "characterIndex": 0
                    },
                    "moveFrequency": 3,
                    "moveRoute": {
                        "list": [
                            {
                                "code": 45,
                                "indent": null,
                                "parameters": [
                                    "@alert_balloon = 0"
                                ]
                            },
                            {
                                "code": 0,
                                "indent": null,
                                "parameters": []
                            }
                        ],
                        "repeat": true,
                        "skippable": false,
                        "wait": false
                    },
                    "moveSpeed": 3,
                    "moveType": 0,
                    "priorityType": 0,
                    "stepAnime": false,
                    "through": false,
                    "trigger": 0,
                    "walkAnime": true,
                    "list": [
                        {
                            "code": 0,
                            "indent": 0,
                            "parameters": []
                        }
                    ]
                }
            ],
            "x": 1,
            "y": 1
        };
        return templateEvent;
    } else { // No remove after flee
        var templateEvent = {
            "id": this._eventId,
            "name": Soapr.VisualEncounters.Param.MonsterEventName,
            "note": "",
            "pages": [
                {
                    "conditions": {
                        "actorId": 1,
                        "actorValid": false,
                        "itemId": 1,
                        "itemValid": false,
                        "selfSwitchCh": "A",
                        "selfSwitchValid": false,
                        "switch1Id": 1,
                        "switch1Valid": false,
                        "switch2Id": 1,
                        "switch2Valid": false,
                        "variableId": 1,
                        "variableValid": false,
                        "variableValue": 0
                    },
                    "directionFix": false,
                    "image": {
                        "tileId": 0,
                        "characterName": "Monster",
                        "direction": 6,
                        "pattern": 1,
                        "characterIndex": 6
                    },
                    "moveFrequency": 4,
                    "moveRoute": {
                        "list": [
                            {
                                "code": 45,
                                "indent": null,
                                "parameters": [
                                    "this._alertBalloon = 1"
                                ]
                            },
                            {
                                "code": 45,
                                "indent": null,
                                "parameters": [
                                    "this._chaseRange = 10"
                                ]
                            },
                            {
                                "code": 45,
                                "parameters": [
                                    "this._chaseSpeed = 4.5"
                                ],
                                "indent": null
                            },
                            {
                                "code": 45,
                                "indent": null,
                                "parameters": [
                                    "this._seePlayer = true"
                                ]
                            },
                            {
                                "code": 0,
                                "indent": null,
                                "parameters": []
                            }
                        ],
                        "repeat": true,
                        "skippable": false,
                        "wait": false
                    },
                    "moveSpeed": 4,
                    "moveType": 3,
                    "priorityType": 1,
                    "stepAnime": true,
                    "through": false,
                    "trigger": 2,
                    "walkAnime": true,
                    "list": [
                        {
                            "code": 122,
                            "indent": 0,
                            "parameters": [
                                Soapr.VisualEncounters.Param.TroopIdVariable,
                                Soapr.VisualEncounters.Param.TroopIdVariable,
                                0,
                                0,
                                this._troopId || 0
                            ]
                        },
                        {
                            "code": 117,
                            "indent": 0,
                            "parameters": [
                                Soapr.VisualEncounters.Param.BeforeBattleCommonEvent
                            ]
                        },
                        {
                            "code": 301,
                            "indent": 0,
                            "parameters": [
                                0,
                                this._troopId || 0,
                                true,
                                false
                            ]
                        },
                        {
                            "code": 601,
                            "indent": 0,
                            "parameters": []
                        },
                        {
                            "code": 123,
                            "indent": 1,
                            "parameters": [
                                "A",
                                0
                            ]
                        },
                        {
                            "code": 0,
                            "indent": 1,
                            "parameters": []
                        },
                        {
                            "code": 602,
                            "indent": 0,
                            "parameters": []
                        },
                        {
                            "code": 205,
                            "indent": 1,
                            "parameters": [
                                0,
                                {
                                    "list": [
                                        {
                                            "code": 37,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 42,
                                            "indent": null,
                                            "parameters": [
                                                100
                                            ]
                                        },
                                        {
                                            "code": 16,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                7
                                            ]
                                        },
                                        {
                                            "code": 17,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                7
                                            ]
                                        },
                                        {
                                            "code": 19,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                7
                                            ]
                                        },
                                        {
                                            "code": 18,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                7
                                            ]
                                        },
                                        {
                                            "code": 16,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                7
                                            ]
                                        },
                                        {
                                            "code": 17,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                7
                                            ]
                                        },
                                        {
                                            "code": 19,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                7
                                            ]
                                        },
                                        {
                                            "code": 18,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 15,
                                            "indent": null,
                                            "parameters": [
                                                7
                                            ]
                                        },
                                        {
                                            "code": 42,
                                            "indent": null,
                                            "parameters": [
                                                255
                                            ]
                                        },
                                        {
                                            "code": 38,
                                            "indent": null,
                                            "parameters": []
                                        },
                                        {
                                            "code": 0,
                                            "indent": null,
                                            "parameters": []
                                        }
                                    ],
                                    "repeat": false,
                                    "skippable": false,
                                    "wait": false
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 37,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 42,
                                    "indent": null,
                                    "parameters": [
                                        100
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 16,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 17,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 19,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 18,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 16,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 17,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 19,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 18,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 15,
                                    "indent": null,
                                    "parameters": [
                                        7
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 42,
                                    "indent": null,
                                    "parameters": [
                                        255
                                    ]
                                }
                            ]
                        },
                        {
                            "code": 505,
                            "indent": 1,
                            "parameters": [
                                {
                                    "code": 38,
                                    "indent": null,
                                    "parameters": []
                                }
                            ]
                        },
                        {
                            "code": 0,
                            "indent": 1,
                            "parameters": []
                        },
                        {
                            "code": 604,
                            "indent": 0,
                            "parameters": []
                        },
                        {
                            "code": 117,
                            "indent": 0,
                            "parameters": [
                                Soapr.VisualEncounters.Param.AfterBattleCommonEvent
                            ]
                        },
                        {
                            "code": 0,
                            "indent": 0,
                            "parameters": []
                        }
                    ]
                },
                {
                    "conditions": {
                        "actorId": 1,
                        "actorValid": false,
                        "itemId": 1,
                        "itemValid": false,
                        "selfSwitchCh": "A",
                        "selfSwitchValid": true,
                        "switch1Id": 1,
                        "switch1Valid": false,
                        "switch2Id": 1,
                        "switch2Valid": false,
                        "variableId": 1,
                        "variableValid": false,
                        "variableValue": 0
                    },
                    "directionFix": false,
                    "image": {
                        "tileId": 0,
                        "characterName": "",
                        "direction": 2,
                        "pattern": 0,
                        "characterIndex": 0
                    },
                    "moveFrequency": 3,
                    "moveRoute": {
                        "list": [
                            {
                                "code": 45,
                                "indent": null,
                                "parameters": [
                                    "@alert_balloon = 0"
                                ]
                            },
                            {
                                "code": 0,
                                "indent": null,
                                "parameters": []
                            }
                        ],
                        "repeat": true,
                        "skippable": false,
                        "wait": false
                    },
                    "moveSpeed": 3,
                    "moveType": 0,
                    "priorityType": 0,
                    "stepAnime": false,
                    "through": false,
                    "trigger": 0,
                    "walkAnime": true,
                    "list": [
                        {
                            "code": 0,
                            "indent": 0,
                            "parameters": []
                        }
                    ]
                }
            ],
            "x": 1,
            "y": 1
        };
        return templateEvent;
    }
};

