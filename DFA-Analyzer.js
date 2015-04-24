/**
 * Michael Lane, CS311, Project 1, 24 Apr 2015
 * DFA Analyzer v1.0
 *
 * This program first prompts the user for a filename which should be something like:
 *
 * Machines/machine4.json
 *
 * (A few machines are stored in the Machines subfolder. However, feel free to input a full directory structure for the
 * machine if you want.)
 *
 * Then the user is prompted to enter a string which will be run through the associated machine to test for acceptance.
 * The user can simply hit <enter> if they want to test the empty string. Strings with characters not in the language
 * specified by the JSON file will always be rejected.
 *
 */

//Included modules.
var fs = require('fs');                   //For reading in from a file
var prompt = require('prompt-sync');      //for sync reading in from stdin
var array = require('lodash/array');      //for determining if and where a string is in an array
var prettyjson = require('prettyjson');   //for outputting nicely formatted json

//variables in use in the function
var verbose,
    again = false,
    errorState = false,
    obj,
    currentState = undefined,
    str;

//Detect if verbose flag (-v or --verbose) was passed into the command line. If so, set verbose flag to true
if(array.findIndex(process.argv, function(chr) {return (chr == "-v" || chr == "--verbose")}) >= 2) {
  verbose = true;
}

//Options for the prettyjson
var options = {
  inlineArrays: true
};

do {
  console.log('\n');
  errorState = false;
  again = false;

  //Gather input from the user
  process.stdout.write('Enter filename of the machine: ');
  var fileName = prompt();

  if(verbose)
    console.log('\nFetching DFA in file %s', fileName);

  //Try reading the file that the user specified. Fail gracefully by setting the errorState flag and alerting the user
  try {
    obj = fs.readFileSync(fileName, 'utf8');
  } catch(e) {
    errorState = true;
    console.error("That file doesn't exist!");
  }

  //Try parsing the JSON file using Node's built in JSON parser. Fail gracefully.
  if(!errorState) {
    try {
      obj = JSON.parse(obj);
    } catch(e) {
      errorState = true;
      console.error("Malformed JSON file.");
    }
  }

  //If we've read the file and parsed it correctly, then go about the rest of our business.
  if(!errorState) {

    //Verbose printing of the DFA in JSON format and in a human-readable format
    if(verbose) {
      console.log('The JSON object is as follows:\n');
      console.log(prettyjson.render(obj, options) + '\n\n');

      //Output a human-readable DFA
      process.stdout.write('The DFA is as follows\n');
      process.stdout.write('=======================================\n');
      process.stdout.write(' Q: {');

      for(var i=0; i < obj.Q.length; ++i) {
        process.stdout.write(obj.Q[i]);
        if(i < obj.Q.length - 1) process.stdout.write(", ");
      }

      process.stdout.write('}\n');

      process.stdout.write(' Σ: {');
      for(var i=0; i < obj.Σ.length; ++i) {
        process.stdout.write(obj.Σ[i]);
        if(i < obj.Σ.length - 1) process.stdout.write(", ");
      }

      process.stdout.write('}\n');

      process.stdout.write('q0: ' + obj.q0 + '\n');

      process.stdout.write(' F: {');
      for(var i=0; i < obj.F.length; ++i) {
        process.stdout.write(obj.F[i]);
        if(i < obj.F.length - 1) process.stdout.write(", ");
      }
      process.stdout.write('}\n');

      process.stdout.write('\n  δ|');
      for(var i=0; i < obj.Q.length; ++i) {
        process.stdout.write(obj.Q[i] + ' ');
      }
      process.stdout.write('\n  ');
      for(var i=0; i < 4 * obj.Q.length; ++i) {
        process.stdout.write('-');
      }
      process.stdout.write('\n');
      for(var i=0; i < obj.Σ.length; ++i) {
        process.stdout.write('  ' + obj.Σ[i] + '|');
        for(var j=0; j < obj.Q.length; ++j) {
          process.stdout.write(obj.δ[i][j] + ' ');
        }
        process.stdout.write('\n');
      }

      process.stdout.write('=======================================\n\n');

      console.log("Start state: %s", currentState);

    } //End of the verbose output

    //Time to get the string from the user
    do {
      console.log('\n');
      currentState = obj.q0;
      again = false;

      //Gather the string. Simply hitting <enter> sets string to "". That is the empty string.
      process.stdout.write("Enter string to analyze: ");
      str = prompt();

      if(verbose) {
        process.stdout.write("\nString to check: " + str);
        if(str.length == 0) process.stdout.write('ε');
        process.stdout.write('\n');
      }

      //initialize a few variables.
      var c = undefined,
          col = 0,
          row = 0;

      //Walk through each element of the string and update currentState as required.
      for(var i=0; i < str.length && row >= 0 && col >= 0; ++i) {
        //Set c to the current character under consideration
        c = str.charAt(i);

        //verbose output of current character and state
        if(verbose) {
          console.log("\n-----\nCurrent character: " + c);
          console.log("    Current State: " + currentState);
        }

        //Use lodash module's findIndex on Σ. Returns index value of match or -1 if not found.
        row = array.findIndex(obj.Σ, function(chr) {return chr == c});
        //Use lodash module's findIndex on Q. Returns index value of match or -1 if not found.
        col = array.findIndex(obj.Q, function(chr) {return chr == currentState});

        //Note, since we set up δ as a table with columns that correspond to the states in the Q array in the same order
        //and since the rows in δ correspond to the elements of Σ in the same order as they were defined, we can use the
        //the return values of the previous functions as the row and column in the δ table to find the next state.

        //However, first, we need to make sure we actually have a valid index in both the row and col values. If we do
        //not, then it must be the case that the string that was input contained characters that are not in Σ or that
        //there was some undefined state in the δ table. So set the currentState as UNDEFINED.
        if(row < 0) {
          currentState = "UNDEFINED ROW";
        }

        if(col < 0) {
          currentState = "UNDEFINED COL";
        }

        //Now if we are in a state other than UNDEFINED, get the next state from the δ table.
        if(currentState != "UNDEFINED ROW" && currentState != "UNDEFINED COL") {
          currentState = obj.δ[row][col];

          //verbose output to inform the user where in the δ table the function will look to find the next state and
          //what that state will be.
          if(verbose) {
            console.log("Next state in δ table at row: " + row + " col: " + col);
            console.log("Next state will be: " + currentState);
          }
        }
      }

      //Verbose output to inform the user of what the final state is after the string has been output.
      if(verbose)
        console.log("\n-----\nFinish state: " + currentState);

      //Now, if the user simply hit enter when they were asked to input a string, that will represent the empty string.
      //So set that string to 'ε' for beauty's sake.
      if(str.length == 0)
        str = 'ε';

      //If the current state is UNDEFINED ROW, inform the user that the string was not accepted because it contained
      //characters not located in Σ
      if(currentState == "UNDEFINED ROW")
        console.log(str + ": Not accepted. String contains characters that are not in Σ.");

      //if the current state is UNDEFINED COL, inform the user that the DFA is invalid
      else if(currentState == "UNDEFINED COL")
        console.log("The DFA is invalid.");

      //Use lodash findIndex to determine if the currentState is an element of F (returns index if so and -1 otherwise)
      else if(array.findIndex(obj.F, function(chr) {return chr == currentState}) >= 0)
        console.log(str + ": Accepted.");

      //Otherwise, the string was not accepted.
      else
        console.log(str + ": Not accepted.");


      if(!again) {
        process.stdout.write('Try another string? (y/n): ');
        var response = prompt();
        again = (response == 'y' || response == 'Y');
      }
    } while(again);
  }


  if(!again) {
    if(errorState)
      process.stdout.write("Try again? (y/n): ");
    else
      process.stdout.write('Try another machine? (y/n): ');
    var response = prompt();
    again = (response == 'y' || response == 'Y');
  }

} while(again);
