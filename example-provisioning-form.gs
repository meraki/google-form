/* #####################################################
Provisioning Form (using Dashboard API) Google Script
- This script collects a single response from a Google Form
  * Store number
  * Serial number
  * Template drop-down menu
  
- Creates a new network, binds the new network to a template, and claims a serial number with the Meraki API
There are additional test functions which are useful to run API calls and view the output in the log without using the form.
Please update your environment variables below for proper operation.

Original Written by:
Cory Guynn
2017
Cisco Meraki
InternetOfLEGO.com

Provisioning form example
Kaz Nakashima
03/2017
Cisco Meraki
/  ##################################################### */


/* #####################################################
  Enter Your Environment Variables
/ ##################################################### */

// Update your API Key. This is in your Meraki Dashboard profile. Your Org must have APIs enabled.
var API_KEY = '<meraki dashboard api key>';

// Update your Org ID (use testGetMerakiOrgs(); to learn the org IDs)
var ORG_ID = '<meraki dashboard org id>';

// Update Shard Number (you can see this when looking at the URL when you login to Meraki Dashboard or by pulling the SNMP settings via API call)
// https://nXXX.meraki.com/api/v0/organizations/{{organizationId}}/admins
var SHARD = 'n???'; // if you are confused, you can try 'dashboard', but sometimes redirects are problematic.

// Test serial number
var TEST_SN = '<optional - for use with test functions>';

// Test network ID
var TEST_NET_ID = '<optional - for use with test functions>';

// Test template ID
var TEST_TEMPLATE_ID = '<optional - for use with test functions>';

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
        "method" : "post",
        "payload": payload,
        "headers": headers,
        "content-type": "application/json",
        "contentLength": payload.length,
        "followRedirects": true,
        "muteHttpExceptions":true
      };  
  var cache = CacheService.getScriptCache();
  var response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/organizations/'+orgId+'/networks', options);
  var result = JSON.parse(response.getContentText());
  var new_network_id = result.id;
  cache.put("net_id", new_network_id);
  Logger.log("Create network result: " +JSON.stringify(result));
  Logger.log("Create network HTTP response: " +response.getResponseCode());
}

// Test function (use this to test the API call without using the form)
function testCreateMerakiNetwork(){
  var data = {
    "name": "Created by test function",
    "type": "wireless appliance switch",
    "tags": " new_tag "
  };
  createMerakiNetwork(API_KEY,ORG_ID,SHARD,data);
}

// Delete Meraki Network
function DeleteTestMerakiNetwork(apiKey, netId, shard){
  var headers = {
    "x-cisco-meraki-api-key": apiKey,
  };
  var options =
      {
        "method" : "delete",
        "headers": headers,
        "muteHttpExceptions":true
      };
  var response = UrlFetchApp.fetch('https://dashboard.meraki.com/api/v0/networks/'+netId, options);
  Logger.log("Delete network HTTP response: " +response.getResponseCode());
}

// Test function (use this to test the API call without using the form)
function testDeleteMerakiNetwork(){
  // Using a static test network id to avoid an accidental delete of the wrong network
  DeleteTestMerakiNetwork(API_KEY,TEST_NET_ID,SHARD);
}

// Bind to template
function bindToTemplate(apiKey, netId, shard, payload){
  var headers = {
    "x-cisco-meraki-api-key": apiKey,
  };
  var options =
      {
        "method" : "post",
        "payload": payload,
        "headers": headers,
        "contentLength": payload.length,
        "muteHttpExceptions":true
      };
  var response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/networks/'+netId+'/bind', options);
  Logger.log("Template bind HTTP response: " +response.getResponseCode());
  Logger.log(netId);
}

// Test function (use this to test the API call without using the form)
function testBindMerakiTemplate(){
  var data = {
    "configTemplateId": TEST_TEMPLATE_ID,
    "autoBind": false
  };
  bindToTemplate(API_KEY,TEST_NET_ID,SHARD,data);
}


// Unbind from template
function unbindFromTemplate(apiKey, netId, shard){
  var headers = {
    "x-cisco-meraki-api-key": apiKey
  };
  var options =
      {
        "method" : "post",
        "headers": headers,
        "muteHttpExceptions":true
      };
  var response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/networks/'+netId+'/unbind', options);
  Logger.log("Template unbind HTTP response: " +response.getResponseCode());
}

// Test function (use this to test the API call without using the form)
function testUnbindMerakiTemplate(){
  unbindFromTemplate(API_KEY,TEST_NET_ID,SHARD);
}

// Claim Meraki Device
function claimMerakiDevice(apiKey, netId, shard, payload){
  var headers = {
    "x-cisco-meraki-api-key": apiKey,
  };
  var options =
      {
        "method" : "post",
        "payload": payload,
        "headers": headers,
        "content-type": "application/json",
        "contentLength": payload.length,
        "muteHttpExceptions":true
      };
  var response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/networks/'+netId+'/devices/claim', options);
  Logger.log("Claim device response: " +response.getResponseCode() +" Response: " +response);
}

// Test function (use this to test the API call without using the form)
function testClaimMerakiDevice(){
  var data = {
    "serial": TEST_SN
  };
  claimMerakiDevice(API_KEY,TEST_NET_ID,SHARD,data);
}

// Unclaim Meraki Device
function removeMerakiDevice(apiKey, netId, shard, serial){
  var headers = {
    "x-cisco-meraki-api-key": apiKey,
  };
  var options =
      {
        "method" : "post",
        "headers": headers,
        "muteHttpExceptions":true
      };
  var response = UrlFetchApp.fetch('https://'+shard+'.meraki.com/api/v0/networks/'+netId+'/devices/'+serial+'/remove', options);
  Logger.log("Remove HTTP response: " +response.getResponseCode());
}

// Test function (use this to test the API call without using the form)
function testRemoveMerakiDevice(){
  removeMerakiDevice(API_KEY,TEST_NET_ID,SHARD, TEST_SN);
}

// Get the Meraki Organizations and IDs this API key has access to.
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

// Get Meraki Networks -- Not used in the form, but really helpful to see if networks are getting created
function getMerakiNetworks(apiKey,orgId){
  var payload;
  var headers = {
    "x-cisco-meraki-api-key": apiKey
  };
  var url = 'https://dashboard.meraki.com/api/v0/organizations/'+orgId+'/networks';
  var options = {
    'method': 'get',
    'headers': headers,
    'payload': payload
  };
  var response = UrlFetchApp.fetch(url, options);
  var json = response.getContentText();
  var data = JSON.parse(json);

  Logger.log("URL JSON: "+ JSON.stringify(data));
  Logger.log("Network ID: "+ JSON.stringify(data));
}

// Test function (Use this to test the API call since it includes the environment variables)
function testGetMerakiNetworks(){
  getMerakiNetworks(API_KEY,ORG_ID);
}

// *************
// Form Handler
// *************

// Collects input from form submition
// (must run this via form or an error will occur)

function onFormSubmit(e) {
  var form = FormApp.getActiveForm();
  var formResponse = e.response;
  
  // create a variable for the form responses
  var itemResponses = formResponse.getItemResponses();
  
  // 0,1,2 correspond to the form's input fields
  var store = {};
  store.storeNum = itemResponses[0].getResponse();
  store.serialNum = itemResponses[1].getResponse();
  store.templateOpt = itemResponses[2].getResponse();
  
  // Input the proper template ID's below
  if (store.templateOpt == "GUEST 10MB") {
    store.templateId = '<template ID>';
  }
  if (store.templateOpt == "GUEST 50MB") {
    store.templateId = '<template ID>';
  }
  if (store.templateOpt == "GUEST 100MB") {
    store.templateId = '<template ID>';
  }
  
  // write some logs to help with troubleshooting errors/failures
  Logger.log("onFormSubmit - storeNum: "+store.storeNum);
  Logger.log("onFormSubmit - serialNum: "+store.serialNum);
  Logger.log("onFormSubmit - templateOpt: "+store.templateOpt);
  Logger.log("onFormSubmit - templateId: "+store.templateId);
  
  // Create network JSON payload
  var network_payload = {
    "name":store.storeNum,
    "type": "wireless appliance switch",
    "tags": " new_tag "
  };

  // Bind to template JSON payload
  var bind_payload = {
    "configTemplateId":store.templateId
  };
  
  // Claim device JSON payload
  var claim_payload = {
    "serial":store.serialNum
  };
  
  // create the network and cache the newly created network id
  createMerakiNetwork(API_KEY, ORG_ID, SHARD, network_payload);
  var cache = CacheService.getScriptCache();
  var networkId = cache.get("net_id");
  
  // Placeholder in case this is needed
  // Utilities.sleep(1000);
  
  // bind to template and claim device serial number into network
  bindToTemplate(API_KEY, networkId, SHARD, bind_payload);
  claimMerakiDevice(API_KEY, networkId, SHARD, claim_payload);
}
