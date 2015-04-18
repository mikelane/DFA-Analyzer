var fs = require('fs');
var util = require('util');
var prompt = require('prompt');
var prettyjson = require('prettyjson');
var obj,
    currentState = undefined,
    currentString = undefined;

prompt.message = "test";
prompt.delimiter = ":";

prompt.start();

var options = {
  inlineArrays: true
};

prompt.get({properties: {name: {description: "Filename of DFA"}}}, function (err, response) {
  if(err) throw err;

  console.log('\nParsing DFA in file ' + response.name + '\n');

  fs.readFile(response.name, function(err, data) {
    if(err) throw err;
    obj = JSON.parse(data);
    currentState = obj.q0;

    //Output a pretty version of the JSON file...
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

    process.stdout.write('\n  δ|')
    for(var i=0; i < obj.Q.length; ++i) {
      process.stdout.write(obj.Q[i] + ' ');;
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

    //Once we have the object loaded into memory, we need to set the current state to the starting state
    currentState = obj.q0;

    prompt.get({properties: {str: {description: "String to check"}}}, function(err, input) {
      console.log("\nChecking string " + input.str);
    });
  });
});
