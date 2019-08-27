var recorderStream = null;
var recorder = null;

export default class AudioManager {
    constructor() {
        this.cancelRecording();
    }

    static _getContext() {
        window.AudioContext =
          window.AudioContext ||
          window.webkitAudioContext ||
          window.mozAudioContext;
        return new AudioContext();
    }

    static _getOfflineContext(bufferLength, sampleRate = 48000) {
        var offlineAudioContext = OfflineAudioContext || window["OfflineAudioContext"];
        return new offlineAudioContext(1, bufferLength, sampleRate);
    }

    static getAudioUrl(audioArrayBuffer, clapAmount, laughAmount, booAmount) {
        return new Promise(function (resolve, reject) {
            if (clapAmount === 0 && laughAmount === 0 && booAmount === 0) {
                resolve(window.URL.createObjectURL(new Blob([new Uint8Array(audioArrayBuffer)],{type: "audio/wav"})))
            } else {
                var promises = [];
                promises.push(AudioManager._getOfflineContext(audioArrayBuffer.byteLength).decodeAudioData(audioArrayBuffer));
                promises.push(AudioManager._getReactionAudioBuffer(clapAmount, laughAmount, booAmount));
                Promise.all(promises).then((audioBuffers) =>
                {
                    var sampleRate = Math.min(audioBuffers[0].sampleRate, audioBuffers[1].sampleRate);
                    var ctx = AudioManager._getOfflineContext((audioBuffers[0].length + audioBuffers[1].length), sampleRate); 
                    var newBuffer = ctx.createBuffer(1, (audioBuffers[0].length + audioBuffers[1].length), sampleRate);
                    var channel = newBuffer.getChannelData(0);
                    channel.set(audioBuffers[0].getChannelData(0), 0);
                    channel.set(audioBuffers[1].getChannelData(0), audioBuffers[0].length);
                    var source = ctx.createBufferSource();
                    source.buffer = newBuffer;
                    source.connect(ctx.destination);
                    source.start(0);
                    ctx.startRendering().then((outputAudioBuffer) => 
                    {
                        AudioManager._audioBufferToWaveUrl(outputAudioBuffer).then((audioUrl) => resolve(audioUrl)).catch((err) => reject(err));
                    }).catch((err) => reject(err));
                }).catch((err) => reject(err))
            }
        })
    }

    static _getReactionAudioBuffer(clapAmount, laughAmount, booAmount) {
        return new Promise(function (resolve, reject) {
            var max = Math.max(clapAmount, laughAmount, booAmount);
            if (max === 0) {
                resolve(null)
            } else {
                var promises = [];
                var gains = [];
                if (clapAmount > 0) {
                    gains.push(clapAmount / max);
                    promises.push(AudioManager._getAudioBuffer("clap"));
                }
                if (laughAmount > 0) {
                    gains.push(laughAmount / max);
                    promises.push(AudioManager._getAudioBuffer("laugh"));
                }
                if (booAmount > 0) {
                    gains.push(booAmount / max);
                    promises.push(AudioManager._getAudioBuffer("boo"));
                }
                Promise.all(promises).then((audioBuffers) =>
                {
                    if (audioBuffers.length === 1) {
                        resolve(audioBuffers[0])
                    } else {
                        var byteLength = Math.max.apply(Math, audioBuffers.map(buffer => buffer.length));
                        var ctx = AudioManager._getOfflineContext(byteLength);
                        var merger = ctx.createChannelMerger(1);
                        var splitter = ctx.createChannelSplitter(1);
                        var sources = [];
                        for (var i = 0; i < audioBuffers.length; ++i) {
                            var gainNode = ctx.createGain();
                            gainNode.gain.setValueAtTime(gains[i], 0);
                            gainNode.connect(splitter);
                            var source = ctx.createBufferSource();
                            source.buffer = audioBuffers[i];
                            source.connect(gainNode);
                            sources.push(source);
                        }
                        splitter.connect(merger);
                        merger.connect(ctx.destination);
                        for (var i = 0; i < sources.length; ++i) {
                            sources[i].start(0);
                        }
                        ctx.startRendering().then((outputAudioBuffer) => resolve(outputAudioBuffer)).catch((err) => reject(err));
                    }
                }).catch((err) => reject(err));
            }
        });
    }

    static _getAudioBuffer(reaction) {
        return new Promise(function (resolve, reject) {
            var storedSoundBuffer = window && window["userBlockstackData"] && window["userBlockstackData"].getReaction ? window["userBlockstackData"].getReaction(reaction) : null;
            if (storedSoundBuffer) {
                AudioManager._getOfflineContext(storedSoundBuffer.byteLength).decodeAudioData(storedSoundBuffer).then((audioBuffer) => resolve(audioBuffer)).catch((err) => reject(err));
            } else {
                fetch(process.env.PUBLIC_URL + "/" + reaction + ".wav").then((response) =>
                {
                    response.arrayBuffer().then((buffer) =>
                    {
                        if (window && window["userBlockstackData"] && window["userBlockstackData"].setReaction) {
                            window["userBlockstackData"].setReaction(buffer);
                        }
                        AudioManager._getOfflineContext(buffer.byteLength).decodeAudioData(buffer).then((audioBuffer) => resolve(audioBuffer)).catch((err) => reject(err));
                    }).catch((err) => reject(err))
                }).catch((err) => reject(err))
            }
        })
    }

    static transformAudio(soundUrl, effectName) {
        return new Promise(function (resolve, reject) {
            fetch(soundUrl).then(res => 
            {
                res.arrayBuffer().then((buffer) =>
                {
                    AudioManager._getOfflineContext(buffer.byteLength).decodeAudioData(buffer).then((audioBuffer) =>
                    {
                        AudioManager["_"+ effectName + "Effect"](audioBuffer).then((outputBuffer) =>
                        {
                            AudioManager._audioBufferToWaveUrl(outputBuffer).then((audioUrl) => resolve(audioUrl));
                        }).catch((err) => reject(err))
                    }).catch((err) => reject(err))
                }).catch((err) => reject(err))
            }).catch((res) => reject(res))
        })
    }

    static _monsterEffect(audioBuffer) {
        return AudioManager._pitchEffect(audioBuffer, -1);
    }

    static _pitchEffect(audioBuffer, pitchMod) {
        return new Promise(function (resolve, reject) {
            var ctx = AudioManager._getOfflineContext(audioBuffer.length, audioBuffer.sampleRate); 
            var source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            var pitchChangeEffect = new window["Jungle"]( ctx );
            var compressor = ctx.createDynamicsCompressor();
            source.connect(pitchChangeEffect.input);
            pitchChangeEffect.output.connect(compressor);
            pitchChangeEffect.setPitchOffset(pitchMod);
            compressor.connect(ctx.destination);
            source.start(0);
            ctx.startRendering().then((outputAudioBuffer) => resolve(outputAudioBuffer)).catch((err) => reject(err));
        })
    }

    static _baneEffect(audioBuffer) {
        return new Promise(function (resolve, reject) {
            var ctx = AudioManager._getOfflineContext(audioBuffer.length, audioBuffer.sampleRate);
            var source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            var waveShaper = ctx.createWaveShaper();
            waveShaper.curve = AudioManager._makeDistortionCurve(7, audioBuffer.sampleRate);
            var deeper = new window["Jungle"]( ctx );
            deeper.setPitchOffset(-0.25);
            var lpf1 = ctx.createBiquadFilter();
            lpf1.type = "lowpass";
            lpf1.frequency.value = 5000.0;
            var lpf2 = ctx.createBiquadFilter();
            lpf2.type = "lowpass";
            lpf2.frequency.value = 5000.0;
            var hpf1 = ctx.createBiquadFilter();
            hpf1.type = "highpass";
            hpf1.frequency.value = 100.0;
            var hpf2 = ctx.createBiquadFilter();
            hpf2.type = "highpass";
            hpf2.frequency.value = 100.0;
            var compressor = ctx.createDynamicsCompressor();
            lpf1.connect( lpf2 );
            lpf2.connect( hpf1 );
            hpf1.connect( hpf2 );
            hpf2.connect( waveShaper );
            source.connect(deeper.input);
            deeper.output.connect(lpf1);
            waveShaper.connect( compressor );
            compressor.connect( ctx.destination );
            source.start(0);
            ctx.startRendering().then((outputAudioBuffer) => resolve(outputAudioBuffer)).catch((err) => reject(err));
        })
    }

    static _astronautEffect(audioBuffer) {
        return new Promise(function (resolve, reject) {
            var ctx = AudioManager._getOfflineContext(audioBuffer.length, audioBuffer.sampleRate);
            var source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            var waveShaper = ctx.createWaveShaper();
            waveShaper.curve = AudioManager._makeDistortionCurve(50, audioBuffer.sampleRate);
            var filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = 1300;
            source.connect(filter);
            filter.connect(waveShaper);
            var lpf1 = ctx.createBiquadFilter();
            lpf1.type = "lowpass";
            lpf1.frequency.value = 2000.0;
            var lpf2 = ctx.createBiquadFilter();
            lpf2.type = "lowpass";
            lpf2.frequency.value = 2000.0;
            var hpf1 = ctx.createBiquadFilter();
            hpf1.type = "highpass";
            hpf1.frequency.value = 500.0;
            var hpf2 = ctx.createBiquadFilter();
            hpf2.type = "highpass";
            hpf2.frequency.value = 500.0;
            var compressor = ctx.createDynamicsCompressor();
            lpf1.connect( lpf2 );
            lpf2.connect( hpf1 );
            hpf1.connect( hpf2 );
            hpf2.connect( compressor );
            compressor.connect( ctx.destination );
            waveShaper.connect(lpf1);
            source.start();
            ctx.startRendering().then((outputAudioBuffer) => resolve(outputAudioBuffer)).catch((err) => reject(err));
        })
    }

    static _fastEffect(audioBuffer) {
        return AudioManager._speedEffect(audioBuffer, 2);
    }

    static _slowEffect(audioBuffer) {
        return AudioManager._speedEffect(audioBuffer, 0.6);
    }

    static _speedEffect(audioBuffer, speed) {
        return new Promise(function (resolve, reject) {
            var channels = [];
            for (var i = 0; i < audioBuffer.numberOfChannels; i++) { 
                channels[i] = new Float32Array(audioBuffer.getChannelData(i)); 
            }
            window["doWorkerTask"](function() {
                this.onmessage = function(e) {
                    var inputChannels = e.data.channels;
                    var speed = e.data.speed;
                    var outputChannels = [];
                    for (var i = 0; i < inputChannels.length; i++) {
                        outputChannels[i] = new Float32Array( Math.floor(inputChannels[i].length / speed) );
                        for (var j = 0; j < outputChannels[i].length; j++) {
                            outputChannels[i][j] = inputChannels[i][Math.floor(j * speed)];
                        }
                    }
                    this.postMessage(outputChannels, [...outputChannels.map(c => c.buffer), ...inputChannels.map(c => c.buffer)]);
                    this.close();
                }
            }, {channels, speed}, channels.map(c => c.buffer)).then((outputChannels) =>
            {
                resolve(AudioManager._handleOutputChannelEffect(outputChannels, audioBuffer.sampleRate));
            }).catch((err) => reject(err));
        })
    }

    static _robotEffect(audioBuffer) {
        return new Promise(function (resolve, reject) {
            var channels = [];
            for (var i = 0; i < audioBuffer.numberOfChannels; i++) { 
                channels[i] = new Float32Array(audioBuffer.getChannelData(i)); 
            }
            window["doWorkerTask"](function() {
                this.onmessage = function(e) {
            
                    var inputChannels = e.data.channels;
                    var chunkSize = 0.03 * e.data.sampleRate;
                    var outputChannels = [];
                    for (var i = 0; i < inputChannels.length; i++) {
                        var input = inputChannels[i];
                        var chunks = [];
                        var currentChunk = [];
                        for (var j = 0; j < input.length; j++) {
                            if (currentChunk.length >= chunkSize) {
                            chunks.push(currentChunk);
                            currentChunk = [];
                            }
                            currentChunk.push(input[j]);
                        }
                        
                        for (var j = 0; j < chunks.length; j++) {
                            var dup = [...chunks[j]];
                            chunks[j] = [...chunks[j], ...dup];
                        }
                
                        var output = new Float32Array(chunks.reduce((a,v)=>{ return a + v.length; }, 0));
                        var m = 0;
                        for (var j = 0; j < chunks.length; j++) {
                            for (var k = 0; k < chunks[j].length; k++) {
                            output[m] = chunks[j][k];
                            m++;
                            }
                        }
                
                        var resampledOutput = [];
                        var desiredSamplesPerPoint = input.length / output.length;
                        var numSamplesSoFar = 0;
                        for (var j = 0; j < output.length; j++) {
                            var numPointsSoFar = j+1;
                            if (numSamplesSoFar / numPointsSoFar < desiredSamplesPerPoint) {
                            resampledOutput.push(output[j]);
                            numSamplesSoFar++;
                            }
                        }
                
                        outputChannels.push(Float32Array.from(resampledOutput));
                    }
            
                    this.postMessage(outputChannels, [...outputChannels.map(c => c.buffer), ...inputChannels.map(c => c.buffer)]);
                    this.close();
                }
            }, {channels, sampleRate: audioBuffer.sampleRate}, channels.map(c => c.buffer)).then((outputChannels) =>
            {
                resolve(AudioManager._handleOutputChannelEffect(outputChannels, audioBuffer.sampleRate));
            }).catch((err) => reject(err));
        })
    }

    static _handleOutputChannelEffect(outputChannels, sampleRate) {
        var ctx = AudioManager._getOfflineContext(outputChannels[0].length, sampleRate);
        var newBuffer = ctx.createBuffer(outputChannels.length, outputChannels[0].length, sampleRate);
        for (var i = 0; i < outputChannels.length; i++) { 
            newBuffer.copyToChannel(outputChannels[i], i); 
        }
        return newBuffer;
    }

    static _audioBufferToWaveUrl (audioBuffer) {
        return new Promise(function(resolve, reject) {
          var worker = new Worker(process.env.PUBLIC_URL + '/waveWorker.js');

          worker.onmessage = function( e ) {
            var blob = new Blob([e.data.buffer], {type:"audio/wav"});
            resolve(window.URL.createObjectURL(blob));
          };

          var pcmArrays = [];
          for (var i = 0; i < audioBuffer.numberOfChannels; i++) {
            pcmArrays.push(audioBuffer.getChannelData(i));
          }

          worker.postMessage({
            pcmArrays,
            config: {sampleRate: audioBuffer.sampleRate}
          });
        });
    }
   
    static _makeDistortionCurve(amount, sampleRate) {
        var curve = new Float32Array(sampleRate);
        var deg = Math.PI / 180;
        var x;
        for (var i = 0; i < sampleRate; ++i) {
            x = i * 2 / sampleRate - 1;
            curve[i] = ( 3 + amount ) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    static _getUserMedia() {
        const mediaArguments = { audio: true, video: false }
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) return navigator.mediaDevices.getUserMedia(mediaArguments);
        else if (navigator.getUserMedia) return navigator.getUserMedia(mediaArguments);
        else if (navigator.webkitGetUserMedia) return navigator.webkitGetUserMedia(mediaArguments);
        else if (navigator.mozGetUserMedia) return navigator.mozGetUserMedia(mediaArguments);
        else if (navigator.msGetUserMedia) return navigator.msGetUserMedia(mediaArguments);
        else {
            alert('Browser does not support get the user media');
            return null;
        }
    }

    _buildRecorder() {
        return new Promise(function (resolve, reject) {
            AudioManager._getUserMedia().then((stream) =>
            {
		        recorderStream = stream;
                var webAudioRecorder = window["WebAudioRecorder"];
                if (!webAudioRecorder) {
                    reject("WebAudioRecorder not found");
                } else {
                    recorder = new webAudioRecorder(AudioManager._getContext().createMediaStreamSource(stream), {
                        workerDir: process.env.PUBLIC_URL + "/", 
                        encoding: "wav",
                        numChannels: 1, 
                        onEncoderLoading: function(recorder, encoding) {
                            console.log("Loading encoder...");
                        },
                        onEncoderLoaded: function(recorder, encoding) {
                            console.log("Encoder loaded...");
                        }
                    });

                    recorder.setOptions({
                        timeLimit: 60,
                        encodeAfterRecord: true
                    });

                    resolve(recorder);
                }
            }).catch((err) => reject(err));
        });
    }

    _unattachAudio() {
        if (recorderStream != null) {
            try {
                recorderStream.getAudioTracks()[0].stop();
            } catch {}
            recorderStream = null;
        }
    }

    startRecorder(onComplete) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self._buildRecorder().then((recorder) =>
            {
                recorder.onComplete = function(recorder, blob) { 
                    if (onComplete) {
                        onComplete(URL.createObjectURL(blob))
                    }
                };
                recorder.startRecording();
                console.log("Start audio recorder.");

                resolve();
            }).catch((err) => reject(err));
        });
    }

    stopRecording() {
        this._unattachAudio();
        if (recorder != null) {
            try {
                recorder.finishRecording();
            } catch {}
            recorder = null;
        }
    }

    cancelRecording() {
        this._unattachAudio();
        if (recorder != null) {
            try {
                recorder.cancelRecording();
            } catch {}
            recorder = null;
        }
    }

    isRecording() {
        return recorder && recorder.isRecording();
    }

    recordingTime() {
        return recorder ? recorder.recordingTime() : null;
    }
}