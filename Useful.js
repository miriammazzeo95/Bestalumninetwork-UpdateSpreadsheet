/**The following function retrives the index of a column with a given name */
function getColumnByName(colName) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var colIdx = data[0].indexOf(colName);
  if (colIdx != -1) {
    return colIdx +1;
  }
  return null
}



/**
 * The following function retrives the new member's payment info from the 'payments' spreadsheet to be updated in the 'members' spreadsheet
 * @param user: object, obtained with Admindirectory.Users.get('BAN email')
 * return false if the payment info are not found
 */
function getPaymentInfo(user){

  var LOGGING_PREFIX = '[getPaymentInfo] \t';
  const PAYMENTS_SPREADSHEET_ID = "1ZXW1VVfuDFviyQh4jR1qaHwbt1t3ZxUOU56N4o7i4-4";
  const userID = user.id;

  //FIND LINE INDEX CORRESPONDING TO THE USER'S PAYMENT IN THE 'PAYMENTS' SPREADSHEET BY MATCHING THE USER'S 'GOOGLE' ID 
  //retrieve all line in the H column (ID) of the payment sheet
  var payments = Sheets.Spreadsheets.Values.get(PAYMENTS_SPREADSHEET_ID , "'Payments'!H2:H").values;
  //concatenate all the searched column values into one array
  var arrayOfIDs = payments.reduce(function (a, b) {
    return a.concat(b);
  });
  //Logger.log(LOGGING_PREFIX+arrayOfIDs) //TODO: remove after testing
  //find the index of the matching cell, add 1 since the index start from 0
  var indexOfRow = arrayOfIDs.lastIndexOf(userID);
  Logger.log(LOGGING_PREFIX+"Found index: "+indexOfRow+" in 'payments' spreadsheet corresponding to ID: "+userID);

  if (indexOfRow == -1){
    //if the row is not fiound the index is set to -1 and execution stops
    sendErrorMessagetoSubmitter( ADMIN_ML, user.primaryEmail);
    throw new Error("No payment found corresponding to ID: "+userID);
    return false;

  } else {
    //user's payment is found and the values returned in the order they needs to be updated
    indexOfRow = indexOfRow+3; //reset index to the right one
    //we need only values in columns: E,F,I
    var row =Sheets.Spreadsheets.Values.get(PAYMENTS_SPREADSHEET_ID , "'Payments'!E"+indexOfRow+":I"+indexOfRow).values;  
    var paymentInfo = [row[0][0],  row[0][4], row[0][1], 'Active'] //reorder payment's data
    Logger.log(LOGGING_PREFIX+"Found payment info: "+paymentInfo)
    return  paymentInfo
  }
  
}

/**
* sending an errror message to the user filling the form when the member BAN email is mispelled 
* or when the member cannot be found in duirectory (member din't fill the 'welcome to BAN' form?)
*/
function sendErrorMessagetoSubmitter(formSubmitterEmail, userBANEmail) {
  MailApp.sendEmail({
    to: formSubmitterEmail,
    subject: 'Error while submitting payment to the database',
    htmlBody: 'Please recheck the payments of the user ' + userBANEmail + '. It could not be found in payments spreadsheet. Entry has not been taken into account in the members spreadsheet',
  });
}




/**
 * Creates a readable random string. 
 * @param:lentgh specifies the lenth or # of characters of the string. default set at 6
 * @return: generated string of type i.e. "Kisezi-Seragi".
 */
function createPassword(length=6){
  let generateWord = () =>{
    const consonants = "bcdfghjklmnpqrstvwxyz".split("");
    const vowels = "aeiou".split("");
  
    let rand = function(limit){
      return Math.floor(Math.random()*limit);
    }
  
    let word = "";
  
    length = parseInt(length,10);
  
    for(let i=0; i<length/2; i++ ){
      let randConsonants = consonants[rand(consonants.length)];
      let randVowels = vowels[rand(vowels.length)];
      word += i === 0 ? randConsonants.toUpperCase() : randConsonants;
      word += i * 2 < length-1 ? randVowels: "";
    }
    return word;
  }

  let word1 = generateWord();
  let word2 = generateWord();

  return `${word1}-${word2}`;
}







