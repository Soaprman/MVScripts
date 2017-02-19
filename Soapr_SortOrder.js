var Imported = Imported || {};
Imported.Soapr_SortOrder = true;

var Soapr = Soapr || {};
Soapr.SortOrder = Soapr.SortOrder || {};

//=============================================================================
 /*:
 * @plugindesc Allows you to specify a sort order in the database notes
 * instead of reorganizing the database.
 * @author Soaprman
 *
 * @help
 * Help? What do you think this is, a professional script?
 *
 * ============================================================================
 * Item/Skill/Weapon/Armor Note Tags
 * ============================================================================
 * <Sort Order: x>
 * Change x to a number.
 * When item/skill/weapon/armor lists are drawn, this value will be used
 * instead of the item's database ID if specified.
 *
 * 
 */
//=============================================================================

//=============================================================================
// DataManager
//=============================================================================

Soapr.SortOrder.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!Soapr.SortOrder.DataManager_isDatabaseLoaded.call(this)) return false;
    if (!Soapr.SortOrder._databaseIsLoaded) {
        this.processSortOrderNotetags($dataItems);
        this.processSortOrderNotetags($dataSkills);
        this.processSortOrderNotetags($dataWeapons);
        this.processSortOrderNotetags($dataArmors);
        Soapr.SortOrder._databaseIsLoaded = true;
    }
    return true;
};

DataManager.processSortOrderNotetags = function (group) {
    for (var i = 1; i < group.length; i++) {
        var item = group[i];
        var noteData = item.note.split(/[\r\n]+/);

        item.sortOrder = item.id;

        for (var n = 0; n < noteData.length; n++) {
            var line = noteData[n];
            if (line.match(/<(?:Sort Order):[ ](\d+)>/i)) {
                item.sortOrder = parseInt(RegExp.$1);
            }
        }
    }
};

//=============================================================================
// Window makeItemList functions
//=============================================================================

Soapr.SortOrder.sort = function (a, b) {
    var aVal = a ? (a.sortOrder || a.id) : 0;
    var bVal = b ? (b.sortOrder || b.id) : 0;
    return aVal - bVal;
};

Soapr.SortOrder.Window_ItemList_makeItemList = Window_ItemList.prototype.makeItemList;
Window_ItemList.prototype.makeItemList = function () {
    Soapr.SortOrder.Window_ItemList_makeItemList.call(this);
    this._data.sort(Soapr.SortOrder.sort);
};

Soapr.SortOrder.Window_ShopBuy_makeItemList = Window_ShopBuy.prototype.makeItemList;
Window_ShopBuy.prototype.makeItemList = function () {
    Soapr.SortOrder.Window_ShopBuy_makeItemList.call(this);
    this._data.sort(Soapr.SortOrder.sort);
};

if (Imported.YEP_EquipBattleSkills) {
    Soapr.SortOrder.Window_SkillEquip_makeItemList = Window_SkillEquip.prototype.makeItemList;
    Window_SkillEquip.prototype.makeItemList = function () {
        Soapr.SortOrder.Window_SkillEquip_makeItemList.call(this);
        this._data.sort(Soapr.SortOrder.sort);
    };
} else {
    Soapr.SortOrder.Window_SkillList_makeItemList = Window_SkillList.prototype.makeItemList;
    Window_SkillList.prototype.makeItemList = function () {
        Soapr.SortOrder.Window_SkillList_makeItemList.call(this);
        this._data.sort(Soapr.SortOrder.sort);
    };
}

if (Window_SkillLearn) {
    Soapr.SortOrder.Window_SkillLearn_makeItemList = Window_SkillLearn.prototype.makeItemList;
    Window_SkillLearn.prototype.makeItemList = function () {
        Soapr.SortOrder.Window_SkillLearn_makeItemList.call(this);
        this._data.sort(Soapr.SortOrder.sort);
    };
}

if (Window_SkillLearnClass) {
    Soapr.SortOrder.Window_SkillLearnClass_makeItemList = Window_SkillLearnClass.prototype.makeItemList;
    Window_SkillLearnClass.prototype.makeItemList = function () {
        Soapr.SortOrder.Window_SkillLearnClass_makeItemList.call(this);
        this._data.sort(Soapr.SortOrder.sort);
    };
}

if (Window_SnatchItem) {
    Soapr.SortOrder.Window_SnatchItem_makeItemList = Window_SnatchItem.prototype.makeItemList;
    Window_SnatchItem.prototype.makeItemList = function () {
        Soapr.SortOrder.Window_SnatchItem_makeItemList.call(this);
        this._data.sort(Soapr.SortOrder.sort);
    };
}

if (Window_VictoryDrop) {
    Soapr.SortOrder.Window_VictoryDrop_makeItemList = Window_VictoryDrop.prototype.makeItemList;
    Window_VictoryDrop.prototype.makeItemList = function () {
        Soapr.SortOrder.Window_VictoryDrop_makeItemList.call(this);
        this._data.sort(Soapr.SortOrder.sort);
    };
}

if (Window_VictorySkills) {
    Soapr.SortOrder.Window_VictorySkills_makeItemList = Window_VictorySkills.prototype.makeItemList;
    Window_VictorySkills.prototype.makeItemList = function () {
        Soapr.SortOrder.Window_VictorySkills_makeItemList.call(this);
        this._data.sort(Soapr.SortOrder.sort);
    };
}