let steps = 0, rows = 0, written = 0;
let start, end;
let parser;
let fileClosed = false;
let fileStream, writer;
let delimiter;
const re = new RegExp('.+@.+\..+')
const encoder = new TextEncoder
Papa.LocalChunkSize = 1024 * 1024 * 1
$(function()
{
	$('#submit-parse').click(function()
	{
    fileClosed = false;
    steps = 0;
    written = 0;
		rows = 0;

		var files = $('#files')[0].files;
    let fileName = "hashed-" + files[0].name;
    var config = buildConfig();
    fileStream = streamSaver.createWriteStream(fileName);
    writer = fileStream.getWriter();

		start = performance.now();

		$('#files').parse({
			config: config,
			before: function(file, inputElem)
			{
				console.log("Parsing file:", file);
			},
			complete: function()
			{
				console.log("Done with all files.");
			}
		});
	});
});


function buildConfig()
{
  delimiter = $('#delimiter').val() ? $('#delimiter').val() : ',';
	return {
		delimiter: $('#delimiter').val(),
		newline: getLineEnding(),
		header: false,
		dynamicTyping: false,
		preview: 0,
		step: undefined,
		encoding: $('#encoding').val(),
		worker: false,
		comments: false,
		complete: completeFn,
		error: errorFn,
		download: false,
		skipEmptyLines: true,
		chunk:  chunkFn,
		beforeFirstChunk: undefined,
    withCredentials: undefined,
	  transform: undefined
	};

function getLineEnding()
	{
		if ($('#newline-n').is(':checked'))
			return "\n";
		else if ($('#newline-r').is(':checked'))
			return "\r";
		else if ($('#newline-rn').is(':checked'))
			return "\r\n";
		else
			return "";
	}
}
function transformFn(str, col) {
/*  return re.test(str) ?
    sha256(str).then(function(digest) {
      return digest;
    }) : str;*/
    return str;
}

function stepFn(results, parserHandle)
{
  steps++;
  writeLine(results.data[0], parserHandle);
  parser=parserHandle;
  parserHandle.pause();
}

function chunkFn(results, parserHandle)
{
  steps++;
  writeLines(results.data, parserHandle);
  parserHandle.pause();
}

function errorFn(error, file)
{
	console.log("ERROR:", error, file);
}

function completeFn()
{
  fileClosed = true;
  if (steps === written && written > 0) {
    writer.close();
    end = performance.now();
  }

}

async function writeLines(arr, parserHandle) {
  cleanedRows = [];
  for (let row of arr) {
    let clean = [];
    for (let r of row) {
      let hashed = await hasher(r);
      clean.push(hashed);
    };
    cleanedRows.push(clean.join(delimiter));
  };

  writer.write(encoder.encode(cleanedRows.join('\n') + '\n'));
  written++;
  if (fileClosed) {
    writer.close();
    end = performance.now();
  };
  parserHandle.resume();
}

async function writeLine(arr, parserHandle) {
  let clean = [];
  for (let r of arr) {
    let hashed = await hasher(r);
    clean.push(hashed);
  };
  writer.write(encoder.encode(clean.join(delimiter)+'\n'));
  written++;
  if (steps === written && fileClosed) {
    writer.close();
  };
  parserHandle.resume();
}

async function hasher(str) {
  str = str.toLowerCase().trim();
  return re.test(str) ? sha256(str): str;
}

async function sha256(message) {

    // encode as UTF-8
    const msgBuffer = new TextEncoder('utf-8').encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
}
