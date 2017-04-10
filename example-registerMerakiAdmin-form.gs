/* #####################################################
Cisco Meraki API Workshop Registration Google Script

- This script collects a single response from a Google Form
  * Email
  * Name
- Creates an admin account with Meraki API

There are additional test functions which are useful to run API calls and view the output in the log without using the form.

Please update your environment variables below for proper operation.

Written by:
Cory Guynn
2017
Cisco Meraki


InternetOfLEGO.com
/  ##################################################### */



/* #####################################################
  Enter Your Environment Variables
/ ##################################################### */

// Update your API Key. This is in your Meraki Dashboard profile. Your Org must have APIs enabled.
var API_KEY = 'YourAPIKey';

// Update your Org ID (use testGetMerakiOrgs(); to learn the org IDs)
var ORG_ID = 'YourOrgID';

// Update Shard Number (you can see this when looking at the URL when you login to Meraki Dashboard or by pulling the SNMP settings via API call)
// https://nXXX.meraki.com/api/v0/organizations/{{organizationId}}/admins
var SHARD = 'nXXX'; // if you are confused, you can try 'dashboard', but sometimes redirects are problematic.

// Update the orgAccess. By default, the new account has FULL ADMIN ACCESS to the Organization!!!
// Nice for hackathons, bad for production. The API call can also include network paramters and tags.
var PERMISSIONS = 'full';


// *************
// API CALLS TO MERAKI
// *************


// Add Meraki Admin
function addMerakiAdmin(apiKey, orgId, shard, payload){
  var headers = {
    "x-cisco-meraki-api-key": apiKey
  };
  var options =
      {
        "method" : "post",
        "payload": payload,
        "headers": headers,
        "content-type": "application/json",
        "contentLength": payload.length,
        "followRedirects": true,
        "muteHttpExceptions":true
      };
  response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/organizations/'+orgId+'/admins', options);
  var result = JSON.parse(response.getContentText());
  Logger.log(result);
  Logger.log(response.getResponseCode());
}

// Test function (use this to test the API call without using the form)
function testAddMerakiAdmin(){
  var data = {
    "name":"Google Scripts Demo",
    "email":"GoogleScriptsDemo@meraki.com", // change this to an email you have access to!
    "orgAccess":"full"
  };
  addMerakiAdmin(API_KEY,ORG_ID,SHARD,data);
}


// Get Meraki Admins -- Not used in the form, but really helpful to see if admins are getting created
function getMerakiAdmins(apiKey,orgId){
  var payload;
  var headers = {
    "x-cisco-meraki-api-key": apiKey
  };
  var url = 'https://dashboard.meraki.com/api/v0/organizations/'+orgId+'/admins';
  var options = {
    'method': 'get',
    'headers': headers,
    'payload': payload
  };
  var response = UrlFetchApp.fetch(url, options);
  var json = response.getContentText();
  var data = JSON.parse(json);

  Logger.log("URL JSON: "+ JSON.stringify(data));
}

// Test function (Use this to test the API call since it includes the environment variables)
function testGetMerakiAdmins(){
  getMerakiAdmins(API_KEY,ORG_ID);
}

// Get the Meraki Organizations and IDs this API key hass access to.
function getMerakiOrgs(apiKey){
  var headers = {
    "x-cisco-meraki-api-key": apiKey
  };
  var url = 'https://dashboard.meraki.com/api/v0/organizations';
  var options = {
    'method': 'get',
    'headers': headers
  };
  var response = UrlFetchApp.fetch(url, options);
  var json = response.getContentText();
  var data = JSON.parse(json);

  Logger.log("Meraki Orgs: "+ JSON.stringify(data));
}

// Test function
function testGetMerakiOrgs(){
  getMerakiOrgs(API_KEY);
}


// *************
// Form Handler
// *************

// Collects input from form submition
// (must run this via form or an error will occur)

function onFormSubmit(e) {
  var form = FormApp.getActiveForm();
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();

  var admin = {};
  admin.name = itemResponses[0].getResponse();
  admin.email = formResponse.getRespondentEmail();

  Logger.log("onFormSubmit - name: "+admin.name);
  Logger.log("onFormSubmit - email: "+admin.email);

  // Create admin account
  var payload = {
    "name":admin.name,
    "email":admin.email,
    "orgAccess":PERMISSIONS
  };
  addMerakiAdmin(API_KEY, ORG_ID, SHARD, payload);
}
