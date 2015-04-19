var fs = require('fs');
var prompt = require('prompt');

var obj = JSON.parse(fs.readFileSync('machine1.json', 'utf8'));


prompt.message = "<DFA Analyzer>";
prompt.delimiter = ":".green;

prompt.start();

prompt.get({properties: {string: {description: ":Enter string to analyze".green}}}, storeAnswer);

function storeAnswer(err, result) {
  if(err) throw err;
  tmp = result;
})

fs.readFile('machine1.json', analyzeDFA);

function analyzeDFA(err, data) {
  if(err) throw err;
  obj = JSON.parse(data);
}

/*
 *console.log('You said: "' + tmp.string + '"');
 */
console.log(obj.Q);
console.log(obj.Σ);
console.log(obj.δ);
console.log(obj.q0);
console.log(obj.F);
