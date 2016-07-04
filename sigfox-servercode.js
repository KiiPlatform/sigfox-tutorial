// receive endpoint handles callbacks from SIGFOX
function receive(params, context, done) {
    var erorHandler = function(err) {
        console.log("error:" + err);
        throw JSON.stringify({
            "error": err
        });
    };

    //1. Verify secret token.
    var secretToken = "this.is.secret.token";
    if (secretToken !== params.secret) {
        erorHandler("Invalid secret token. secret:" + params.secret);
    }

    // vendorThingID of thing is id of sigFox device ID
    var vendorThingID = params.id;
    if (vendorThingID == null || vendorThingID == undefined) {
        erorHandler("no id provided");
    }

    //2. Use Kii Cloud SDK to load thing with vendorThingID
    context.getAppAdminContext().loadThingWithVendorThingID(vendorThingID, {
        success: function(thing) {
            //3. After succeeded to load thing, create an object in a bucket
            var bucket = thing.bucketWithName("data");
            var object = bucket.createObject();
            // store fields other than secret and id
            for (var key in params) {
                if (key == "secret" || key == "id") {
                    continue;
                }
                object.set(key, params[key]);
            }

            object.save({
                success: function(theObj) {
                    done({"Success": theObj});
                },
                failure: function(theObj, msg) {
                    erorHandler(msg);
                }
            });
        },
        failure: function(err) {
            erorHandler(err);
        }
    });
}

// handleError endpoint retrieve error event of last hour with SIGFOX API
function handleError(params, context, done) {

    // SIGFOX API to retrieve error events
    var sigfoxTargetUrl =
        "https://backend.sigfox.com/api/callbacks/messages/error";

    // please modified with your id and password. These authentication credentials are associated to a group
    var sigfoxId = "******";
    var sigfoxPassword = "*******";

    // please replace with the sigfox device type id you want to retrieve
    var sigfoxDeviceTypeId = "********";

    // time internal of last hour
    var sinceLastHour = (new Date()).getTime() - 60 * 60 * 1000;
    $.ajax({
        url: sigfoxTargetUrl,
        type: "GET",
        headers: {
            'Authorization': 'Basic ' + new Buffer(sigfoxId + ':' +
                sigfoxPassword).toString('base64')
        },
        data: {
            "deviceTypeId": sigfoxDeviceTypeId,
            "since": sinceLastHour
        }
    }).then(function(body) {
        var data = body.data;
        if (data.length > 0) {
            // handling errors in last hour
            // ...
            for (var i in data) {
                console.log("handling error:" + JSON.stringify(data[i]));
            }
        } else {
            console.log("no error to hanle");
        }

    }).done(function(body) {
        done({
            "Success": body
        });
    }).fail(function(msg) {
        done({
            "Fail": msg
        });
    });
}
