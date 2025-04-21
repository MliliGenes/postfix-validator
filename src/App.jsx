import { useState } from 'react';

const operators = {
  '||': { precedence: 1, description: 'OR (command separator)' },
  '&&': { precedence: 2, description: 'AND (conditional execution)' },
  '|': { precedence: 3, description: 'Pipe (stdout to stdin)' },
  ';': { precedence: 4, description: 'Command terminator' },
  '(': { precedence: 0, description: 'Start subshell group' },
  ')': { precedence: 0, description: 'End subshell group' },
  '>': { precedence: 5, description: 'Output redirection' },
  '>>': { precedence: 5, description: 'Append output' },
  '<': { precedence: 5, description: 'Input redirection' },
  '2>': { precedence: 5, description: 'Error redirection' },
};

function isOperator(token) {
  return Object.keys(operators).includes(token);
}

function getPrecedence(op) {
  return operators[op]?.precedence ?? -1;
}

function shuntingYard(tokens) {
  const output = [];
  const stack = [];

  for (const token of tokens) {
    if (!isOperator(token) && token !== '(' && token !== ')') {
      output.push(token);
    } else if (token === '(') {
      stack.push(token);
    } else if (token === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') {
        output.push(stack.pop());
      }
      stack.pop(); // remove '('
    } else {
      while (
        stack.length &&
        getPrecedence(stack[stack.length - 1]) >= getPrecedence(token)
      ) {
        output.push(stack.pop());
      }
      stack.push(token);
    }
  }

  while (stack.length) {
    output.push(stack.pop());
  }

  return output;
}

function tokenize(input) {
  if (!input.trim()) return [];
  const regex = /"[^"]*"|'[^']*'|>>|2>|>|<|\|\||&&|;|\||\(|\)|\S+/g;
  return input.trim().match(regex) || [];
}

export default function CommandLineValidator() {
  const [command, setCommand] = useState('struggle -status && grep "fate" destiny.log || echo "Free from destiny... for now."');
  const [postfix, setPostfix] = useState('struggle -status grep "fate" destiny.log && echo "Free from destiny... for now." ||');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHelp, setShowHelp] = useState(false);

  const validate = () => {
    const commandTokens = tokenize(command);
    const postfixTokens = tokenize(postfix);

    // Skip validation if either input is empty
    if (commandTokens.length === 0 || postfixTokens.length === 0) {
      setResult({
        isValid: false,
        error: 'Both command and postfix inputs must contain valid expressions',
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    const expected = shuntingYard(commandTokens);

    const isValid =
      expected.length === postfixTokens.length &&
      expected.every((val, i) => val === postfixTokens[i]);

    const newResult = {
      command,
      postfix,
      isValid,
      expected: expected.join(' '),
      provided: postfixTokens.join(' '),
      timestamp: new Date().toLocaleTimeString(),
    };

    setResult(newResult);
    setHistory([newResult, ...history].slice(0, 5)); // Keep last 5 results
  };

  const clearAll = () => {
    setCommand('');
    setPostfix('');
    setResult(null);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const loadExample = () => {
    setCommand('cat file.txt | grep "important" > results.txt && echo "Done"');
    setPostfix('cat file.txt grep "important" | results.txt > echo "Done" &&');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono p-4 sm:p-6 md:p-8 font-fira-code">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');
          .font-fira-code {
            font-family: 'Fira Code', monospace;
          }
        `}
      </style>
      <div className="max-w-4xl mx-auto border border-green-500 rounded-lg overflow-hidden shadow-lg">
        {/* Terminal Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-green-500">
          <div className="flex items-center">
            <div className="flex space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <h1 className="text-lg font-bold sm:text-xl">Command Line Postfix Validator</h1>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded sm:text-sm"
          >
            {showHelp ? 'Hide' : 'Help'}
          </button>
        </div>

        {/* Help Section */}
        {showHelp && (
          <div className="bg-gray-800 p-4 border-b border-green-500">
            <h2 className="font-bold mb-2 text-white sm:text-lg">Command Line Operators</h2>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {Object.entries(operators).map(([op, {description}]) => (
                <div key={op} className="flex items-center">
                  <span className="text-yellow-300 w-12">{op}</span>
                  <span className="text-gray-300">{description}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm">
              <h3 className="font-bold text-white sm:text-md">Examples:</h3>
              <p className="text-gray-300">Infix: <span className="text-green-300">cmd1 && cmd2 || cmd3</span></p>
              <p className="text-gray-300">Postfix: <span className="text-green-300">cmd1 cmd2 && cmd3 ||</span></p>
            </div>
          </div>
        )}

        {/* Terminal Body */}
        <div className="p-4 bg-gray-900 space-y-4 sm:space-y-6">
          {/* Current Command */}
          <div>
            <div className="flex items-baseline">
              <span className="text-gray-500 mr-2">$</span>
              <span className="text-white">Command:</span>
            </div>
            <input
              type="text"
              className="w-full bg-gray-800 border border-green-500 rounded px-3 py-2 text-white mt-1 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm sm:text-md font-fira-code"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command line expression"
            />
          </div>

          {/* Postfix Input */}
          <div>
            <div className="flex items-baseline">
              <span className="text-gray-500 mr-2">$</span>
              <span className="text-white">Postfix to validate:</span>
            </div>
            <input
              type="text"
              className="w-full bg-gray-800 border border-green-500 rounded px-3 py-2 text-white mt-1 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm sm:text-md font-fira-code"
              value={postfix}
              onChange={(e) => setPostfix(e.target.value)}
              placeholder="Enter expected postfix notation"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={validate}
              className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
            >
              Validate
            </button>
            <button
              onClick={clearAll}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 text-xs sm:text-sm"
            >
              Clear
            </button>
            <button
              onClick={clearHistory}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 text-xs sm:text-sm"
            >
              Clear History
            </button>
            <button
              onClick={loadExample}
              className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
            >
              Example
            </button>
          </div>

          {/* Current Result */}
          {result && (
            <div className={`mt-4 p-3 rounded text-sm sm:text-md font-fira-code ${
              result.isValid ? 'bg-green-900 bg-opacity-30' :
              result.error ? 'bg-yellow-900 bg-opacity-30' : 'bg-red-900 bg-opacity-30'
            }`}>
              <div className="flex items-baseline">
                <span className="text-gray-500 mr-2">$</span>
                <span className={
                  result.isValid ? 'text-green-400' :
                  result.error ? 'text-yellow-400' : 'text-red-400'
                }>
                  {result.isValid ? '✓ Valid postfix notation' :
                   result.error ? '⚠ ' + result.error : '✗ Invalid postfix notation'}
                </span>
              </div>
              {!result.isValid && !result.error && (
                <div className="ml-4 mt-2 space-y-1">
                  <div>
                    <span className="text-gray-500">Command:</span>
                    <span className="text-white ml-2">{result.command}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Expected:</span>
                    <span className="text-green-300 ml-2">{result.expected}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Provided:</span>
                    <span className="text-red-300 ml-2">{result.provided}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation History */}
          {history.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <div className="text-gray-500 text-sm sm:text-md">History:</div>
                <button
                  onClick={clearHistory}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded sm:text-sm"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border text-xs sm:text-sm font-fira-code ${
                      item.isValid ? 'border-green-800' : 'border-red-800'
                    }`}
                  >
                    <div className="flex justify-between text-gray-500">
                      <span>{item.timestamp}</span>
                      <span>{item.isValid ? 'VALID' : 'INVALID'}</span>
                    </div>
                    <div className="mt-1">
                      <div className="truncate">
                        <span className="text-gray-400">Cmd:</span> {item.command}
                      </div>
                      {!item.isValid && (
                        <div className="truncate">
                          <span className="text-gray-400">Exp:</span> {item.expected}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="bg-gray-800 px-2 sm:px-4 py-1 sm:py-2 text-[10px] xs:text-xs text-gray-500 border-t border-green-500 flex items-center justify-between">
          <div className="mb-0.5">Tip: Use spaces between operators. Quotes preserve spaces. Ex: <span className="text-green-300">cmd1 && cmd2</span></div>
          <div className="text-right text-xs">
            Made with <span className="text-red-500">❤️</span> by <a href="https://github.com/MliliGenes" target="_blank" rel="noopener noreferrer" className="hover:underline">le saad</a> (<a href="https://profile.intra.42.fr/users/sel-mlil" target="_blank" rel="noopener noreferrer" className="hover:underline">sel-mlil</a>)
          </div>
        </div>
      </div>
    </div>
  );
}