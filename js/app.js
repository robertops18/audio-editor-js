var song = 'http://ia902606.us.archive.org/35/items/shortpoetry_047_librivox/song_cjrg_teasdale_64kb.mp3'
var wavesurfer = createWavesurfer(song)

// Query Selectors
initQuerySelectors();

// Wavesurfer events
initWavesurferEvents();

// Knobs
var lowpass_knob = createKnob("lowpass_knob", 0, 500);
var highpass_knob = createKnob("highpass_knob", 0, 500);
var bandpass_knob = createKnob("bandpass_knob", 0, 500);
var lowshelf_knob = createKnob("lowshelf_knob", 0, 500);
var highshelf_knob = createKnob("highshelf_knob", 0, 500);
var peaking_knob = createKnob("peaking_knob", 0, 500);
var notch_knob = createKnob("notch_knob", 0, 500);
var allpass_knob = createKnob("allpass_knob", 0, 500);    

// Initialization functions 
function initQuerySelectors() {
    document.querySelector('#slider').oninput = function () {
		wavesurfer.zoom(Number(this.value));
	};
	document.querySelector('#get_selection_btn').onclick = function () {
		getSelectedRegion();
	}
	document.querySelector('#undo_get_selection_btn').onclick = function () {
		undoGetSelectedRegion(song);
	}
	document.querySelector('#reset_filters').onclick = function () {
		resetFilters();
	}
	document.querySelector('#delete_region').onclick = function () {
		deleteRegion();
    }
    document.querySelector('#select_all_btn').onclick = function () {
		selectAllSample();
	}
	
	document.querySelector('#lowpass_filter_btn').onclick = function () {
		applyFilter('lowpass', lowpass_knob.getValue());
	}
	document.querySelector('#highpass_filter_btn').onclick = function () {
		applyFilter('highpass', highpass_knob.getValue());
	}
	document.querySelector('#bandpass_filter_btn').onclick = function () {
		applyFilter('bandpass', bandpass_knob.getValue());
	}
	document.querySelector('#lowshelf_filter_btn').onclick = function () {
		applyFilter('lowshelf', lowshelf_knob.getValue());
	}
	document.querySelector('#highshelf_filter_btn').onclick = function () {
		applyFilter('highshelf', highshelf_knob.getValue());
	}
	document.querySelector('#peaking_filter_btn').onclick = function () {
		applyFilter('peaking', peaking_knob.getValue());
	}
	document.querySelector('#notch_filter_btn').onclick = function () {
		applyFilter('notch', notch_knob.getValue());
	}
	document.querySelector('#allpass_filter_btn').onclick = function () {
		applyFilter('allpass', allpass_knob.getValue());
	}
	
}

function initWavesurferEvents() {
    // Reset region when clicking the waveform
	wavesurfer.on('seek', function(region) {
		wavesurfer.clearRegions();
	});

	// Delete previous region when creating a new one
	wavesurfer.on('region-created', function() {
		deletePreviousRegion();
	});
}

function createWavesurfer(song) {
    var wavesurfer = WaveSurfer.create({
		container: '#waveform',
		waveColor: '#D9DCFF',
		progressColor: '#4353FF',
		cursorColor: '#4353FF',
		barWidth: 3,
		barRadius: 3,
		cursorWidth: 1,
		height: 200,
		plugins: [
			WaveSurfer.cursor.create({
				showTime: true,
				opacity: 1,
				customShowTimeStyle: {
					'background-color': '#000',
					color: '#fff',
					padding: '2px',
					'font-size': '10px'
				}
			}),
			WaveSurfer.regions.create({drag:false})
    	]
	});
	wavesurfer.enableDragSelection({});
    wavesurfer.load(song);
	
    return wavesurfer;
}

// Print aux function
function print(s) {
    console.log(s);
}

// Buffer related functions
function createBuffer(originalBuffer, duration) {
    var sampleRate = originalBuffer.sampleRate
    var frameCount = duration * sampleRate
    var channels = originalBuffer.numberOfChannels 
    return new AudioContext().createBuffer(channels, frameCount, sampleRate)
  }
  
function copyBuffer(fromBuffer, fromStart, fromEnd, toBuffer, toStart) {
    var sampleRate = fromBuffer.sampleRate
    var frameCount = (fromEnd - fromStart) * sampleRate
    for (var i = 0; i < fromBuffer.numberOfChannels; i++) {
        var fromChanData = fromBuffer.getChannelData(i)
        var toChanData = toBuffer.getChannelData(i)
        for (var j = 0, f = Math.round(fromStart*sampleRate), t = Math.round(toStart*sampleRate); j < frameCount; j++, f++, t++) {
            toChanData[t] = fromChanData[f]
        }
    }
}

function concatBuffer(buffer1, buffer2) {
	var context = new AudioContext();
    var numberOfChannels = Math.min( buffer1.numberOfChannels, buffer2.numberOfChannels );
    var tmp = context.createBuffer( numberOfChannels, (buffer1.length + buffer2.length), buffer1.sampleRate );
    for (var i=0; i<numberOfChannels; i++) {
      var channel = tmp.getChannelData(i);
      channel.set( buffer1.getChannelData(i), 0);
      channel.set( buffer2.getChannelData(i), buffer1.length);
    }
    return tmp;
}

function exportBufferToFile() {
	
}

// Region related functions
function getSelectedRegion() {
    var regionsList = wavesurfer.regions.list;
    for (var r in regionsList) {
        var region = regionsList[r];
        var start = region.start;
        var end = region.end;
        var duration = end - start;
        var buffer = createBuffer(wavesurfer.backend.buffer, duration)
        // copy
        copyBuffer(wavesurfer.backend.buffer, start, end, buffer, 0)

        // load the new buffer
        wavesurfer.empty()
        wavesurfer.loadDecodedBuffer(buffer)
    }
    wavesurfer.clearRegions();
}

function undoGetSelectedRegion(song) {
    wavesurfer.empty()
	wavesurfer.load(song);
}

function selectAllSample() {
    wavesurfer.addRegion({
        start: 0,
        end: wavesurfer.getDuration()
    });
}

function deletePreviousRegion() {
    var regionList = wavesurfer.regions.list;
    if (Object.keys(regionList).length > 0) {
        var firstRegionID = Object.keys(regionList)[0];
        regionList[firstRegionID].remove();
    }
}

function deleteRegion() {
	var regionList = wavesurfer.regions.list;
	var region = regionList[Object.keys(regionList)[0]]
	
	var startTime = region.start;
    var endTime = region.end;

    var totalDuration = wavesurfer.getDuration();
    var firstBuffer;
    var secondBuffer;
    var finalBuffer;

    // Case 1: All the sample is selected
    if (startTime == 0 && endTime == totalDuration) {
        resetAndLoadNewBuffer();
    }
    // Case 2: Region is at the start of the sample
    else if (startTime == 0) {
        finalBuffer = createBuffer(wavesurfer.backend.buffer, totalDuration - endTime);
        copyBuffer(wavesurfer.backend.buffer, endTime, totalDuration, finalBuffer, 0);

        resetAndLoadNewBuffer(finalBuffer);
    }
    // Case 3: Region is at the end of the sample 
    else if (endTime == totalDuration) {
        finalBuffer = createBuffer(wavesurfer.backend.buffer, startTime);
        copyBuffer(wavesurfer.backend.buffer, 0, startTime, finalBuffer, 0);

        resetAndLoadNewBuffer(finalBuffer);
    }     
    // Case 4: Region is in the middle
    else {
        firstBuffer = createBuffer(wavesurfer.backend.buffer, startTime);
        copyBuffer(wavesurfer.backend.buffer, 0, startTime, firstBuffer, 0);
    
        secondBuffer = createBuffer(wavesurfer.backend.buffer, totalDuration - endTime);
        copyBuffer(wavesurfer.backend.buffer, endTime, totalDuration, secondBuffer, 0);
    
        finalBuffer = concatBuffer(firstBuffer, secondBuffer);

        resetAndLoadNewBuffer(finalBuffer);
    }
}

function resetAndLoadNewBuffer(finalBuffer = null) {
    wavesurfer.clearRegions();
    wavesurfer.empty();
    if (finalBuffer) {
        wavesurfer.loadDecodedBuffer(finalBuffer);
    } else {
        var emptyBuffer = createBuffer(wavesurfer.backend.buffer, wavesurfer.getDuration());
        wavesurfer.loadDecodedBuffer(emptyBuffer);
    }
}

// Filter related functions
function applyFilter(filterType, frequency) {
	var filter = wavesurfer.backend.ac.createBiquadFilter();
	filter.type = filterType;
	filter.frequency.value = frequency;
	wavesurfer.backend.setFilter(filter);
}

function createKnob(divID, valMin, valMax) {
	var myKnob = pureknob.createKnob(134, 134);
	myKnob.setProperty('valMin', valMin);
	myKnob.setProperty('valMax', valMax);
	myKnob.setProperty('colorFG', '#4353FF');
	var node = myKnob.node();
	var elem = document.getElementById(divID);
	elem.appendChild(node);
	return myKnob;
}

function resetFilters() {
	lowpass_knob.setValue(0);
	highpass_knob.setValue(0);
	bandpass_knob.setValue(0);
	lowshelf_knob.setValue(0);
	highshelf_knob.setValue(0);
	peaking_knob.setValue(0);
	notch_knob.setValue(0);
    allpass_knob.setValue(0);
    
    applyFilter('allpass', 0);
}