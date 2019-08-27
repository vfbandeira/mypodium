async function doWorkerTask(workerFunction, input, buffers) {
  var fnString = '(' + workerFunction.toString().replace('"use strict";', '') + ')();';
  var workerBlob = new Blob([fnString]);
  var workerBlobURL = window.URL.createObjectURL(workerBlob, { type: 'application/javascript; charset=utf-8' });
  var worker = new Worker(workerBlobURL);

  return await new Promise(function(resolve, reject) {
    worker.onmessage = function(e) { resolve(e.data); };
    worker.postMessage(input, buffers);
  });
}