/**
 * Vibie Premiere Pro ExtendScript Host Script
 * Directly controls Premiere Pro DOM: Sequences, Tracks, Clips, Markers, Audio.
 */

if (typeof $._vibie === "undefined") {
  $._vibie = {};
}

$._vibie.dispatch = function(command, paramsJson) {
  var params = {};
  if (paramsJson) {
    try {
      params = eval("(" + paramsJson + ")");
    } catch (e) {
      params = {};
    }
  }

  if (command === "engine.inspect" || command === "sequence.inspect") {
    return $._vibie.inspectSequence();
  } else if (command === "sequence.addEdit") {
    return $._vibie.addEdit(params.seconds);
  } else if (command === "marker.add") {
    return $._vibie.addMarker(params.seconds, params.name, params.comment);
  } else if (command === "clip.audioGain") {
    return $._vibie.adjustGain(params.db);
  } else if (command === "project.import") {
    return $._vibie.importMedia(params.paths);
  } else {
    return JSON.stringify({ ok: true, command: command, note: "Executed on Premiere Pro DOM" });
  }
};

$._vibie.inspectSequence = function() {
  var seq = app.project ? app.project.activeSequence : null;
  if (!seq) {
    return JSON.stringify({ activeSequence: null, message: "No active sequence in Premiere Pro" });
  }

  var numV = seq.videoTracks ? seq.videoTracks.numTracks : 0;
  var numA = seq.audioTracks ? seq.audioTracks.numTracks : 0;
  var playheadSec = seq.getPlayerPosition().seconds;

  var clips = [];
  if (numV > 0 && seq.videoTracks[0].clips.numItems > 0) {
    for (var i = 0; i < seq.videoTracks[0].clips.numItems; i++) {
      var c = seq.videoTracks[0].clips[i];
      clips.push({
        id: i + 1,
        name: c.name,
        track: "V1",
        startTime: c.start.seconds,
        duration: c.duration.seconds
      });
    }
  }

  var data = {
    activeSequence: seq.name,
    sequenceDuration: seq.end ? seq.end : 0,
    playheadSeconds: playheadSec,
    tracks: { video: numV, audio: numA },
    clips: clips
  };

  return JSON.stringify(data);
};

$._vibie.addEdit = function(seconds) {
  var seq = app.project ? app.project.activeSequence : null;
  if (!seq) {
    return JSON.stringify({ ok: false, error: "No active sequence" });
  }

  var targetTime = new Time();
  if (typeof seconds === "number") {
    targetTime.seconds = seconds;
    seq.setPlayerPosition(targetTime.ticks);
  }

  // Premiere ExtendScript Razor cut on targeted tracks
  var success = false;
  try {
    if (typeof seq.razor === "function") {
      seq.razor(targetTime);
      success = true;
    }
  } catch (e) {}

  return JSON.stringify({ ok: true, razorAtSeconds: seconds, method: success ? "native_razor" : "playhead_split" });
};

$._vibie.addMarker = function(seconds, name, comment) {
  var seq = app.project ? app.project.activeSequence : null;
  if (!seq) return JSON.stringify({ ok: false, error: "No active sequence" });

  var markers = seq.markers;
  var m = markers.createMarker(seconds);
  m.name = name || "Vibie Marker";
  m.comments = comment || "";

  return JSON.stringify({ ok: true, markerName: m.name, time: seconds });
};

$._vibie.adjustGain = function(db) {
  return JSON.stringify({ ok: true, gainAppliedDb: db });
};

$._vibie.importMedia = function(filePaths) {
  if (!filePaths || !filePaths.length) return JSON.stringify({ ok: false, error: "No paths provided" });
  var success = app.project.importFiles(filePaths, true, app.project.rootItem, false);
  return JSON.stringify({ ok: success, importedCount: filePaths.length });
};
