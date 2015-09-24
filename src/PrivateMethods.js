/* PRIVATE METHODS */
CB.toJSON = function(thisObj) {

    if(thisObj.constructor === Array){
        for(var i=0;i<thisObj.length;i++){
            thisObj[i] = CB.toJSON(thisObj[i]);
        }
        return thisObj;
    }

    var url = null;
    var columnName = null;
    var tableName = null;
    var latitude = null;
    var longitude = null;

    if(thisObj instanceof CB.CloudGeoPoint){
        latitude = thisObj.document.latitude;
        longitude = thisObj.document.longitude;
    }

    if(thisObj instanceof CB.CloudFile)
        url=thisObj.document.url;

    if(thisObj instanceof CB.Column)
        columnName=thisObj.document.name;

    if(thisObj instanceof CB.CloudTable)
        tableName=thisObj.document.name;

    var obj= CB._clone(thisObj,url,latitude,longitude,tableName,columnName);

    if (!obj instanceof CB.CloudObject || !obj instanceof CB.CloudFile || !obj instanceof CB.CloudGeoPoint
        || !obj instanceof CB.CloudTable || !obj instanceof CB.Column) {
        throw "Data passed is not an instance of CloudObject or CloudFile or CloudGeoPoint";
    }

    if(obj instanceof CB.Column)
        return obj.document;

    if(obj instanceof CB.CloudFile)
        return obj.document;

    if(obj instanceof CB.CloudGeoPoint)
        return obj.document;

    var doc = obj.document;

    for (var key in doc) {
        if (doc[key] instanceof CB.CloudObject || doc[key] instanceof CB.CloudFile
            || doc[key] instanceof CB.CloudGeoPoint  || doc[key] instanceof CB.Column) {
            //if something is a relation.
            doc[key] = CB.toJSON(doc[key]); //serialize this object.
        } else if (key === 'ACL') {
            //if this is an ACL, then. Convert this from CB.ACL object to JSON - to strip all the ACL Methods.
            var acl = {
                write: doc[key].write,
                read: doc[key].read
            };
            doc[key] = acl;
        } else if (doc[key] instanceof Array) {
            //if this is an array.
            //then check if this is an array of CloudObjects, if yes, then serialize every CloudObject.
            if (doc[key][0] && (doc[key][0] instanceof CB.CloudObject || doc[key][0] instanceof CB.CloudFile
                || doc[key][0] instanceof CB.CloudGeoPoint || doc[key][0] instanceof CB.Column )) {
                var arr = [];
                for (var i = 0; i < doc[key].length; i++) {
                    arr.push(CB.toJSON(doc[key][i]));
                }
                doc[key] = arr;
            }
        }
    }

    return doc;
};

CB.fromJSON = function(data, thisObj) {

    //prevObj : is a copy of object before update.
    //this is to deserialize JSON to a document which can be shoved into CloudObject. :)
    //if data is a list it will return a list of Cl oudObjects.
    if (!data)
        return null;

    if (data instanceof Array) {

        if (data[0] && data[0] instanceof Object) {

            var arr = [];

            for (var i = 0; i < data.length; i++) {
                obj = CB.fromJSON(data[i]);
                arr.push(obj);
            }

            return arr;

        } else {
            //this is just a normal array, not an array of CloudObjects.
            return data;
        }
    } else if (data instanceof Object && data._type) {

        //if this is a CloudObject.
        var document = {};
        //different types of classes.

        for (var key in data) {
            if(data[key] instanceof Array) {
                document[key]=CB.fromJSON(data[key]);
            }else if (data[key] instanceof Object) {
                if (key === 'ACL') {
                    //this is an ACL.
                    document[key] = new CB.ACL();
                    document[key].write = data[key].write;
                    document[key].read = data[key].read;

                } else if(data[key]._type) {
                    if(thisObj)
                        document[key] = CB.fromJSON(data[key], thisObj.get(key));
                    else
                        document[key] = CB.fromJSON(data[key]);
                }else{
                    document[key] = data[key];
                }
            }else {
                document[key] = data[key];
            }
        }

        if(!thisObj){
            var url=null;
            var latitude = null;
            var longitude = null;
            var tableName = null;
            var columnName = null;
            if(document._type === "file")
                url=document.url;
            if(document._type === "point"){
                latitude = document.latitude;
                longitude = document.longitude;
            }
            if(document._type === "table"){
                tableName = document.name;
            }
            if(document._type === "column"){
                columnName = document.name;
            }
            var obj = CB._getObjectByType(document._type,url,latitude,longitude,tableName,columnName);
            obj.document = document;
            return obj;
        }else{
            thisObj.document = document;
            return thisObj;
        }

    }else {
        //if this is plain json.
        return data;
    }
};

CB._getObjectByType = function(type,url,latitude,longitude,tableName,columnName){

    var obj = null;

    if (type === 'custom') {
        obj = new CB.CloudObject();
    }

    if (type === 'role') {
        obj = new CB.CloudRole();
    }

    if (type === 'user') {
        obj = new CB.CloudUser();
    }

    if (type === 'file') {
        obj = new CB.CloudFile(url);
    }

    if(type === 'point'){
        obj = new CB.CloudGeoPoint(latitude,longitude);
    }

    if(type === 'table'){
        obj = new CB.CloudTable(tableName);
    }

    if(type === 'column'){
        obj = new CB.Column(columnName);
    }
    return obj;
};


CB._validate = function() {
    if (!CB.appId) {
        throw "AppID is null. Please use CB.CLoudApp.init to initialize your app.";
    }

    if(!CB.appKey){
        throw "AppKey is null. Please use CB.CLoudApp.init to initialize your app.";
    }
};


//to check if its running under node, If yes - then export CB.
(function () {
    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;
    // Create a reference to this
    var _ = new Object();
})();

function _all(arrayOfPromises) {
    //this is simplilar to Q.all for jQuery promises.
    return jQuery.when.apply(jQuery, arrayOfPromises).then(function() {
        return Array.prototype.slice.call(arguments, 0);
    });
};

if(CB._isNode){
    module.exports = {};
    module.exports = CB;
}


CB._clone=function(obj,url,latitude,longitude,tableName,columnName){
    var n_obj = null;
    if(obj.document._type && obj.document._type != 'point') {
        n_obj = CB._getObjectByType(obj.document._type,url,latitude,longitude,tableName,columnName);
        var doc=obj.document;
        var doc2={};
        for (var key in doc) {
            if(doc[key] instanceof CB.CloudObject)
                doc2[key]=CB._clone(doc[key],null);
            else if(doc[key] instanceof CB.CloudFile){
                doc2[key]=CB._clone(doc[key],doc[key].document.url);
            }else if(doc[key] instanceof CB.CloudGeoPoint){
                doc2[key]=CB._clone(doc[key], null);
            }
            else
                doc2[key]=doc[key];
        }
    }else if(obj instanceof CB.CloudGeoPoint){
        n_obj = new CB.CloudGeoPoint(obj.get('longitude'),obj.get('latitude'));
        return n_obj;
    }
    n_obj.document=doc2;
    return n_obj;
};

CB._request=function(method,url,params,isServiceUrl)
{

    CB._validate();

    if(!CB.CloudApp._isConnected)
        throw "Your CloudApp is disconnected. Please use CB.CloudApp.connect() and try again.";

    var def = new CB.Promise();
    var xmlhttp= CB._loadXml();
    if (CB._isNode) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
    }
    xmlhttp.open(method,url,true);
    xmlhttp.setRequestHeader('Content-Type','text/plain');

    if(!isServiceUrl){
        var ssid = CB._getSessionId();
        if(ssid != null)
            xmlhttp.setRequestHeader('sessionID', ssid);
    }
    if(CB._isNode)
        xmlhttp.setRequestHeader("User-Agent",
            "CB/" + CB.version +
            " (NodeJS " + process.versions.node + ")");
    if(params)
        xmlhttp.send(params);
    else
        xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == xmlhttp.DONE) {
            if (xmlhttp.status == 200) {
                if(!isServiceUrl){
                    var sessionID = xmlhttp.getResponseHeader('sessionID');
                    if(sessionID)
                        localStorage.setItem('sessionID', sessionID);
                    else
                        localStorage.removeItem('sessionID');
                }
                def.resolve(xmlhttp.responseText);
            } else {
                console.log(xmlhttp.status);
                def.reject(xmlhttp.responseText);
            }
        }
    };
    return def;
};

CB._getSessionId = function() {
    return localStorage.getItem('sessionID');
}

CB._columnValidation = function(column, cloudtable){
  var defaultColumn = ['id', 'createdAt', 'updatedAt', 'ACL'];
  if(cloudtable.document.type == 'user'){
    defaultColumn.concat(['username', 'email', 'password', 'roles']);
  }else if(cloudtable.document.type == 'role'){
    defaultColumn.push('name');
  }

  var index = defaultColumn.indexOf(column.name.toLowerCase());
  if(index === -1)
    return true;
  else
    return false;
};

CB._tableValidation = function(tableName){

  if(!tableName) //if table name is empty
    throw "table name cannot be empty";

  if(!isNaN(tableName[0]))
    throw "table name should not start with a number";

  if(!tableName.match(/^\S+$/))
    throw "table name should not contain spaces";

  var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
  if(pattern.test(tableName))
    throw "table not shoul not contain special characters";

};

CB._modified = function(thisObj,columnName){
    thisObj.document._isModified = true;
    if(thisObj.document._modifiedColumns) {
        if (thisObj.document._modifiedColumns.indexOf(columnName) === -1) {
            thisObj.document._modifiedColumns.push(columnName);
        }
    }else{
        thisObj.document._modifiedColumns = [];
        thisObj.document._modifiedColumns.push(columnName);
    }
};


function trimStart(character, string) {
    var startIndex = 0;

    while (string[startIndex] === character) {
        startIndex++;
    }

    return string.substr(startIndex);
}

CB._columnNameValidation = function(columnName){

///  var defaultColumn = ['id','createdAt', 'updatedAt', 'ACL'];

  if(!columnName) //if table name is empty
    throw "table name cannot be empty";

  /*var index = defaultColumn.indexOf(columnName.toLowerCase());
  if(index >= 0)
    throw "this column name is already in use";
*/
  if(!isNaN(columnName[0]))
    throw "column name should not start with a number";

  if(!columnName.match(/^\S+$/))
    throw "column name should not contain spaces";

  var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
  if(pattern.test(columnName))
    throw "column name not should not contain special characters";
};

CB._columnDataTypeValidation = function(dataType){

  if(!dataType)
    throw "data type cannot be empty";

  var dataTypeList = ['Text', 'Email', 'URL', 'Number', 'Boolean', 'DateTime', 'GeoPoint', 'File', 'List', 'Relation', 'Object','Password'];
  var index = dataTypeList.indexOf(dataType);
  if(index < 0)
    throw "invalid data type";

};

CB._defaultColumns = function(type) {
    var id = new CB.Column('id');
    id.dataType = 'Id';
    id.required = true;
    id.unique = true;
    id.document.isDeletable = false;
    id.document.isEditable = false;
    var expires = new CB.Column('expires');
    expires.dataType = 'Number';
    expires.document.isDeletable = false;
    expires.document.isEditable = false;
    var createdAt = new CB.Column('createdAt');
    createdAt.dataType = 'DateTime';
    createdAt.required = true;
    createdAt.document.isDeletable = false;
    createdAt.document.isEditable = false;
    var updatedAt = new CB.Column('updatedAt');
    updatedAt.dataType = 'DateTime';
    updatedAt.required = true;
    updatedAt.document.isDeletable = false;
    updatedAt.document.isEditable = false;
    var ACL = new CB.Column('ACL');
    ACL.dataType = 'ACL';
    ACL.required = true;
    ACL.document.isDeletable = false;
    ACL.document.isEditable = false;
    var col = [id,expires,updatedAt,createdAt,ACL];
    if (type === "custom") {
        return col;
    }else if (type === "user"){
        var username = new CB.Column('username');
        username.dataType = 'Text';
        username.required = true;
        username.unique = true;
        username.document.isDeletable = false;
        username.document.isEditable = false;
        var email = new CB.Column('email');
        email.dataType = 'Email';
        email.unique = true;
        email.document.isDeletable = false;
        email.document.isEditable = false;
        var password = new CB.Column('password');
        password.dataType = 'Password';
        password.required = true;
        password.document.isDeletable = false;
        password.document.isEditable = false;
        var roles = new CB.Column('roles');
        roles.dataType = 'List';
        roles.relatedTo = 'Role';
        roles.relatedToType = 'role';
        roles.document.relationType = 'table';
        roles.document.isDeletable = false;
        roles.document.isEditable = false;
        col.push(username);
        col.push(roles);
        col.push(password);
        col.push(email);
        return col;
    }else if(type === "role") {
        var name = new CB.Column('name');
        name.dataType = 'Text';
        name.unique = true;
        name.required = true;
        name.document.isDeletable = false;
        name.document.isEditable = false;
        col.push(name);
        return col;
   }
};

CB._fileCheck = function(obj){

    var deferred = new CB.Promise();
    var promises = [];
    for(var key in obj.document){
        if(obj.document[key] instanceof Array && obj.document[key][0] instanceof CB.CloudFile){
            for(var i=0;i<obj.document[key].length;i++){
                promises.push(obj.document[key][i].save());
            }
        }else if(obj.document[key] instanceof Object && obj.document[key] instanceof CB.CloudFile){
            promises.push(obj.document[key].save());
        }
    }
    if(promises.length >0) {
        CB.Promise.all(promises).then(function () {
            var res = arguments;
            var j = 0;
            for (var key in obj.document) {
                if (obj.document[key] instanceof Array && obj.document[key][0] instanceof CB.CloudFile) {
                    for (var i = 0; i < obj.document[key].length; i++) {
                        obj.document[key][i] = res[j];
                        j = j + 1;
                    }
                } else if (obj.document[key] instanceof Object && obj.document[key] instanceof CB.CloudFile) {
                    obj.document[key] = res[j];
                    j = j + 1;
                }
            }
            deferred.resolve(obj);
        }, function (err) {
            deferred.reject(err);
        });
    }else{
        deferred.resolve(obj);
    }
    return deferred;
};

CB._bulkObjFileCheck = function(array){
    var deferred = new CB.Promise();
    var promises = [];
    for(var i=0;i<array.length;i++){
        promises.push(CB._fileCheck(array[i]));
    }
    CB.Promise.all(promises).then(function(){
        deferred.resolve(arguments);
    },function(err){
        deferred.reject(err);
    });
    return deferred;
};

CB._generateHash = function(){
    var hash="";
    var possible="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(i=0;i<8;i++)
    {
        hash=hash+possible.charAt(Math.floor(Math.random()*possible.length));
    }
    return hash;
};
