/*
 *CloudGeoPoint
 */

CB.CloudGeoPoint = CB.CloudGeoPoint || function(latitude , longitude) {
    if(!latitude || !longitude)
        throw "Latitude or Longitude is empty.";

    if(isNaN(latitude))
        throw "Latitude "+ latitude +" is not a number type.";

    if(isNaN(longitude))
        throw "Longitude "+ longitude+" is not a number type.";

    this.document = {};
    this.document.type = "Point";
    //The default datum for an earth-like sphere is WGS84. Coordinate-axis order is longitude, latitude.
    if((Number(latitude)>= -90 && Number(latitude)<=90)&&(Number(longitude)>= -180 && Number(longitude)<=180)) {
        this.document.coordinates = [Number(longitude), Number(latitude)];
        this.document.latitude = Number(longitude);
        this.document.longitude = Number(latitude);
    }
    else
        throw "latitude and longitudes are not in range";
};

Object.defineProperty(CB.CloudGeoPoint.prototype, 'latitude', {
    get: function() {
        return this.document.coordinates[1];
    },
    set: function(latitude) {
        if(Number(latitude)>= -90 && Number(latitude)<=90) {
            this.document.longitude = Number(latitude);
            this.document.coordinates[1] = Number(latitude);
        }
        else
            throw "Latitude is not in Range";
    }
});

Object.defineProperty(CB.CloudGeoPoint.prototype, 'longitude', {
    get: function() {
        return this.document.coordinates[0];
    },
    set: function(longitude) {
        if(Number(longitude)>= -180 && Number(longitude)<=180) {
            this.document.latitude = Number(longitude);
            this.document.coordinates[0] = Number(longitude);
        }
        else
            throw "Longitude is not in Range";
    }
});

CB.CloudGeoPoint.prototype.get = function(name) { //for getting data of a particular column

    if(name === 'latitude')
        return this.document.longitude;
    else
        return this.document.latitude;

};

CB.CloudGeoPoint.prototype.set = function(name,value) { //for getting data of a particular column

    if(name === 'latitude') {
        if(Number(value)>= -90 && Number(value)<=90) {
            this.document.longitude = Number(value);
            this.document.coordinates[1] = Number(value);
        }
        else
            throw "Latitude is not in Range";
    }
    else {
        if(Number(value)>= -180 && Number(value)<=180) {
            this.document.latitude = Number(value);
            this.document.coordinates[0] = Number(value);
        }
        else
            throw "Latitude is not in Range";
    }
};
CB.CloudGeoPoint.prototype.distanceInKMs = function(point) {

    var earthRedius = 6371; //in Kilometer
    return earthRedius * greatCircleFormula(this, point);
};

CB.CloudGeoPoint.prototype.distanceInMiles = function(point){

    var earthRedius = 3959 // in Miles
    return earthRedius * greatCircleFormula(this, point);

};

CB.CloudGeoPoint.prototype.distanceInRadians = function(point){

    return greatCircleFormula(this, point);
};

function greatCircleFormula(thisObj, point){

    var dLat =(thisObj.document.coordinates[1] - point.document.coordinates[1]).toRad();
    var dLon = (thisObj.document.coordinates[0] - point.document.coordinates[0]).toRad();
    var lat1 = (point.document.coordinates[1]).toRad();
    var lat2 = (thisObj.document.coordinates[1]).toRad();
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return c;
}

if (typeof(Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function() {
        return this * Math.PI / 180;
    }
}
