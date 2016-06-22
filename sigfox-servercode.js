// receive endpoint handles callbacks from SIGFOX
function receive(params, context, done){
  var erorHandler = function(err) {
    console.log("error:"+err);
    throw JSON.stringify({"error": err});
  }

//1. Verify secret token.
  var secretToken = "this.is.secret.token";
  if (secretToken !== params.secret) {
    erorHandler("Invalid secret token. secret:" + params.secret);
  }

//2. Construct thing-if APIs base url
  var baseURL = Kii.getBaseURL();
  var rootURL = baseURL.substring(0, baseURL.length-3);
  var thingIfBaseURL = rootURL + "thing-if/apps/";
  var thingIFURL = function(path) {
    return thingIfBaseURL + "/" + context.getAppID() + path;
  }

  // Need admin token to access thing-if APIs
  var token = context.getAppAdminContext()._getToken();

//3. ONBOARD Thing first
  // vendorThingID of thing is id of sigFox device ID
  var vendorThingID = params.id;
  if (vendorThingID == null || vendorThingID == undefined) {
    erorHandler("no id provided");
  }
  var onboardURL = thingIFURL("/onboardings");
  $.ajax({
    url: onboardURL,
    type: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/vnd.kii.OnboardingWithVendorThingIDByThing+json"
    },
    data: JSON.stringify({
      "vendorThingID": vendorThingID,
      "thingPassword": "pass", // please modify it with appropriate value
      "thingType": "sigFox" // please modify it with appropriate value
    })
  }).then(function (body) {

//4. After ONBOARD succeeded, Register thing state, constructed by params of SigFox callbacks
    var thingID = body.thingID;
    var registerThingStateURL = thingIFURL("/targets/THING:"+ thingID + "/states")

    // construct thing state,
    var states = {};
    // please modify the logic here depending on the params of your callbacks
    states.time = params.time;
    states.data = params.data;
    states.duplicate = params.duplicate;
    states.snr = params.snr;
    states.station = params.station;
    states.avgSnr = params.avgSnr;
    states.lat = params.lat;
    states.lng = params.lng;
    states.rssi = params.rssi;
    states.seqNumber = params.seqNumber;
    states.updatedAt = new Date();

    return $.ajax({
      url: registerThingStateURL,
      type: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      data: JSON.stringify(states)
    })
  }).done(function (body) {
    done({"Success":body});
  }).fail(function(msg) {
    erorHandler(msg);
  });
}

// handlingError endpoint retrieve error event of last hour with SIGFOX API
function handlingError(params, context, done) {

  // link of this API: https://backend-demo.sigfox.com/apidocs/user/57272598e0102e36337b1b10
  var sigfoxTargetUrl =
    "https://backend-demo.sigfox.com/api/callbacks/messages/error";

  // please modified with your id and password. These authentication credentials are associated to a group
  var sigfoxId = "******";
  var sigfoxPassword = "*******";

  // please replace with the sigfox device type id you want to retrieve
  var sigfoxDeviceTypeId = "********";

  // time internal of last hour
  var sinceLastHour = (new Date()).getTime() - 60*60*1000;
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
  }).then(function (body) {
    var data = body.data;
    if (data.length > 0) {
      // handling errors in last hour
      // ...
      for (var i in data){
        console.log("handling error:"+ JSON.stringify(data[i]));
      }
    }else{
      console.log("no error to hanle");
    }

  }).done(function (body) {
    done({"Success":body});
  }).fail(function(msg) {
    done({"Fail": msg});
  });
}
