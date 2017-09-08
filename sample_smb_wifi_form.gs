/* #####################################################
Business WiFi provisioning form - Google Script
- This script collects input from a Google Form
  * Email
  * Name
  * Network name
  * AP serial number
  
- Creates an admin account with ssid-only permissions using the Meraki Dashboard API
  There are additional test functions which are useful to run API calls and view the output in the log without using the form.
  Please update your environment variables below for proper operation.

September 2017
Kaz Nakashima, Cory Guynn
/  ##################################################### */


/* #####################################################
  Enter Your Environment Variables
/ ##################################################### */

// Update your API Key. This is in your Meraki Dashboard profile. Your Org must have APIs enabled.
var API_KEY = 'insert api key';

// Update your Org ID (use testGetMerakiOrgs(); to learn the org IDs)
var ORG_ID = 'insert org id';

// Update Shard Number (you can see this when looking at the URL when you login to Meraki Dashboard or by pulling the SNMP settings via API call)
// https://nXXX.meraki.com/api/v0/organizations/{{organizationId}}/admins
var SHARD = 'insert shard n##'; // if you are confused, you can try 'dashboard', but sometimes redirects are problematic.

// *************
// API CALLS TO MERAKI
// *************

// Create Meraki Network
function createMerakiNetwork(apiKey, orgId, shard, payload){
  var headers = {
    "x-cisco-meraki-api-key": apiKey
  };
  var options =
      {
        method : 'post',
        payload: JSON.stringify(payload),
        headers: headers,
        contentType: 'application/json',
        contentLength: payload.length,
        muteHttpExceptions:true
      };  
  var cache = CacheService.getScriptCache();
  var response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/organizations/'+orgId+'/networks', options);
  var result = JSON.parse(response.getContentText());
  var new_network_id = result.id;
  cache.put("net_id", new_network_id);
  Logger.log("Create network result: " +JSON.stringify(result));
  Logger.log("Create network HTTP response code: " +response.getResponseCode());
}

// Test function (use this to test the API call without using the form)
function testCreateMerakiNetwork(){
  var data = {
    name: 'Created by test function',
    type: 'wireless',
    tags: ' new_tag '
  };
  createMerakiNetwork(API_KEY, ORG_ID, SHARD, data);
}

// Add Meraki Admin
function addMerakiAdmin(apiKey, orgId, shard, payload){
  var headers = {
    "x-cisco-meraki-api-key": apiKey
  };
  var options =
      {
        method : 'post',
        headers: headers,
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
//  Logger.log("payload: "+JSON.stringify(options));
//  Logger.log(UrlFetchApp.getRequest('https://'+shard+'.meraki.com/api/v0/organizations/'+orgId+'/admins', options).toSource());
  response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/organizations/'+orgId+'/admins', options);
  var result = JSON.parse(response.getContentText());
  Logger.log("Create admin result: " +JSON.stringify(result));
  Logger.log("Create admin HTTP response code: " +response.getResponseCode());
}

// Test function (use this to test the API call without using the form)
function testAddMerakiAdmin(){
  var nets = [
    {
      id: 'N_12345678',
      access: 'ssid-admin'
    }
  ];
  var tags = [{ tag: 'west', access: 'read-only' }];
  var data = {
    name: 'Google Scripts Demo',
    email: 'your email @domain.com',
    orgAccess: 'none',
    tags: tags,
    networks: nets
  }
  addMerakiAdmin(API_KEY,ORG_ID,SHARD,data);
}

// Claim Meraki Device
function claimMerakiDevice(apiKey, netId, shard, payload){
  var headers = {
    "x-cisco-meraki-api-key": apiKey
  };
  var options =
      {
        method : 'post',
        payload: JSON.stringify(payload),
        headers: headers,
        contentType: 'application/json',
        muteHttpExceptions:true
      };
  response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/networks/'+netId+'/devices/claim', options);
  Logger.log("Claim device response code: " +response.getResponseCode());
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

  var smb = {};
  smb.smbName = itemResponses[1].getResponse();
  smb.serialNum = itemResponses[2].getResponse();
  
  Logger.log("onFormSubmit - smbName: "+smb.smbName);
  Logger.log("onFormSubmit - serialNum: "+smb.serialNum);
  
  // Create network
  var network_payload = {
    name:smb.smbName,
    type: 'wireless',
    tags: ' smb '
  }; 
  createMerakiNetwork(API_KEY, ORG_ID, SHARD, network_payload);
  
   // Create ssid-admin account
  var cache = CacheService.getScriptCache();
  var networkId = cache.get("net_id");
  var admin_payload = {
    name:admin.name,
    email:admin.email,
    orgAccess:'none',
    networks:[{"id":networkId,"access":"ssid-admin"}]
  };
  addMerakiAdmin(API_KEY, ORG_ID, SHARD, admin_payload);

  // Claim device
  var claim_payload = {
    serial:smb.serialNum
  };
  claimMerakiDevice(API_KEY, networkId, SHARD, claim_payload);
}