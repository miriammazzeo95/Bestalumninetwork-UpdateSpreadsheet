let numOfItemsInMemberList = 0;
  
/** This function updates cells with new values in a different sheet from 'active sheet' 
https://developers.google.com/sheets/api/guides/values 
cellRange = 'A1'
valueToUpdate = anything
spreadSheetId ='213jhfnn..'
inputOption = or 'USER_ENTERED' or 'RAW'
*/
function updateValue(cellRange, valueToUpdate, spreadSheetId, inputOption='USER_ENTERED'){
  var values = [
  [
  valueToUpdate
  ]
  // Additional rows ...
  ];
  var valueRange = Sheets.newValueRange();
  valueRange.values = values;
  
  return Sheets.Spreadsheets.Values.update(valueRange, spreadSheetId, cellRange, {
  valueInputOption: inputOption
  });
}

function writeToMemberSheet(data, rowIdx, startCol, endCol){
  const spreadsheetId = "1oc3GR89Mw5E78re_er_BXK7KWncrJX9oo4VxYVRCB6M";
  let request = {
    majorDimension: "ROWS",
    values: [data]
  };
  //ERRORS HERE FIXED (remeber 'windows'+'.')
  
  let range = `List of members!${startCol}${rowIdx}:${endCol}${rowIdx}`;
  
  Sheets.Spreadsheets.Values.update(
    request,
    spreadsheetId,
    range,
    {valueInputOption: "USER_ENTERED"}
  );
}


/**
 * Runs when the Status of the applicant is changed from "New" to "Approved"
 * Handled By trigger(Installable onEdit).
 * Collects the applicants info and sends it to Members spreedsheed with the "Active" status.
 * check "https://developers.google.com/apps-script/guides/triggers/events" for reference.
*/
function onApplicationStatusChange(e){

  var LOGGING_PREFIX = '[onApplicationStatusChange] \t';
  const sheet = e.source.getActiveSheet();
  const applicationSheetName = "Become a Member";

  //Limit the edit event to execute only when column of "Application" status changes.
  const colOfStatus = getColumnByName("Application status");
  const colEdited = e.range.getColumn();
  //get the row that was modified
  const row = e.range.getRow();
  //console.log(LOGGING_PREFIX+ "Modified row in 'applications' spreadsheet is: ", row); 

  if(colEdited === colOfStatus && row >0 && sheet.getName() == applicationSheetName){

    let memberStatus = sheet.getRange(row,colEdited).getValue();
    if(memberStatus == "Approved"){

      //GET NEW MEMBERS' PERSONAL DATA
      let rowValues = sheet.getDataRange().getValues()[row-1]; 

      //STORE EACH USER DATA IN A NAMED FUNCTION FOR LATER USE AND GET THE USER BAN EMAIL
      let [
        timestamp, emailAddress, firstName, surname, nationality, addressStreet, addressZIPCode, addressCity, 
        addressCountry, phoneNumber, closestBESTCity, LBGgroup, isBESTAlumna, BESTProfileLink, privateAreaVerification,
        additionalNotes, verificationAllowed,BanReferalEmails, paymentMethod,	comments, nationality2, nationality3, BANemail,isVerified
      ] = rowValues;
      //var memberBANemail = sheet.getValue('W'+row)
      //Logger.log(LOGGING_PREFIX + 'User survey values: '+rowValues);

      Logger.log(LOGGING_PREFIX +'User email: '+ BANemail)
      var user = AdminDirectory.Users.get(BANemail);

      var paymentValuesToUpdate =  getPaymentInfo(user); //TODO: check that is set to user after testing  
      
      //GENERATE 'MANUALLY' A NEW ID FOR THE NEW MEMBER
      //get the last manually generated ID in the 'membership list spreadsheet' and generate a new ID adding 1
      const membersSpreadSheetId = '1oc3GR89Mw5E78re_er_BXK7KWncrJX9oo4VxYVRCB6M'; // members spreadsheet
      var dataRange = "'List of members'!A2:A"; // <SHEET_NAME>!<RANGE_START>:<RANGE_END>
      var generatedIds = Sheets.Spreadsheets.Values.get(membersSpreadSheetId, dataRange).values;
      //Logger.log(LOGGING_PREFIX+ "All generated users' IDs: "+generatedIds);//FOR TESTING
      let userID = String([Number(generatedIds[generatedIds.length-1])+1][0]);
      Logger.log(LOGGING_PREFIX+"Generated ID for user is: "+userID);

      //ADD GENERATED ID TO DIRECTORY (USER ATTRIBIUTE)
      //user.externalIds = userID;
      // If user has no 'externalIds' field add a 'externalIds' empty list to the user resource
      user.externalIds = [];
      user.externalIds.push({
        value: userID,
        type : "organization"
      })

      //FIND FIST EMPTY ROW INDEX WHERE TO WRITE NEW MEMBER INFO IN 'MEMBERS' SPREADSHEET
      let rowIdx = Sheets.Spreadsheets.Values.get(membersSpreadSheetId, "'List of members'!A1:A").values.length+1;

      //UPDATE NEW MEMBER INFO IN THE 'MEMBERS' LIST
      let data = [
        userID,BANemail, emailAddress, surname, firstName, nationality, nationality2, nationality3, addressStreet, 
        addressZIPCode, addressCity, addressCountry, phoneNumber
      ];
      Logger.log(LOGGING_PREFIX+ "SENDING DATA: "+data);
      //UPDATE PERSONAL INFO FROM 'APPLICATIONS' SPREADSHEET
      writeToMemberSheet(data, rowIdx, 'A', 'M');
      //UPDATE PAYMENT INFO FROM 'PAYMENTS' SPREADSHEET- in future retrieve from directory
      writeToMemberSheet(paymentValuesToUpdate, rowIdx, 'N', 'Q');


      //NOT WORKING
      //updateValue('N'+row+':'+'P'+row, valuesToUpdate, MEMBERS_SPREADSHEET_ID )
      
    }
  }
 
}


