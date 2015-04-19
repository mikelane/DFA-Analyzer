var fs = require('fs');
var util = require('util');
var array = require('lodash/array');
var prompt = require('prompt');
var prettyjson = require('prettyjson');
var obj,
    currentState = undefined,
    verbose;

//Detect if verbose flag (-v or --verbose) was passed into the command line. If so, set verbose flag to true
if(array.findIndex(process.argv, function(chr) {return (chr == "-v" || chr == "--verbose")}) >= 2) {
  verbose = true;
}

//Set the options for the prompt module
prompt.message = "DFA Analyzer";
prompt.delimiter = ":";
prompt.start();

//Options for the prettyjson
var options = {
  inlineArrays: true
};

//get input from the user and when done call a function on the response
prompt.get({properties: {name: {description: "Filename of DFA"}}}, function (err, response) {
  //Throw an error if prompt detects one.
  if(err) throw err;

  //Output verbose mode message
  if(verbose)
    console.log('\nParsing DFA in file ' + response.name + '\n');

  //Call the readFile function and call a function on the loaded data
  fs.readFile(response.name, function(err, data) {
    //Error thrown if the file doesn't exist. This ought to be handled better.
    if(err) throw err;

    //Parse the JSON data into an object
    obj = JSON.parse(data);
    //Set currentState to the start state.
    currentState = obj.q0;

    //Output a pretty version of the JSON file...
    if(verbose) {
      console.log('The JSON object is as follows:');
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
    } //End of the verbose output

    //Verbose output of start state.
    if(verbose)
      console.log("Start state: " + currentState);

    //Prompt the user to input a string to analyze
    prompt.get({properties: {str: {description: "String to check"}}}, function(err, input) {
      if(err) throw err;

      //Verbose output
      if(verbose)
        console.log("\nChecking string " + input.str);

      //Define variables used in analyzing the string.
      var c = undefined,
        col = 0,
        row = 0;

      //Walk through each element of the string and update currentState as required.
      for(var i=0; i < input.str.length && row >= 0 && col >= 0; ++i) {
        //Set c to the current character under consideration
        c = input.str.charAt(i);

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
      if(input.str.length == 0)
        input.str = 'ε';

      //If the current state is UNDEFINED ROW, inform the user that the string was not accepted because it contained
      //characters not located in Σ
      if(currentState == "UNDEFINED ROW")
        console.log(input.str + ": Not accepted. String contains characters that are not in Σ.");

      //if the current state is UNDEFINED COL, inform the user that the DFA is invalid
      else if(currentState == "UNDEFINED COL")
        console.log("The DFA is invalid.");

      //Use lodash findIndex to determine if the currentState is an element of F (returns index if so and -1 otherwise)
      else if(array.findIndex(obj.F, function(chr) {return chr == currentState}) >= 0)
        console.log(input.str + ": Accepted.");

      //Otherwise, the string was not accepted.
      else
        console.log(input.str + ": Not accepted.");
    });
  });
});
