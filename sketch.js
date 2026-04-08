let video;
let bodyPose;
let handPose;
let poses = [];
let hands = [];

let currentChord = null;
let chordName = "";
let fingerCount = 0;
let isPlaying = false;
let oscillators = [];
let audioStarted = false;

// Chord frequencies (3 notes each)
const chords = {
  Am: [220.0, 261.63, 329.63], // A3, C4, E4
  Em: [164.81, 196.0, 246.94], // E3, G3, B3
  C: [261.63, 329.63, 392.0], // C4, E4, G4
  G: [196.0, 246.94, 293.66], // G3, B3, D4
  F: [174.61, 220.0, 261.63], // F3, A3, C4
};

// Finger count to chord mapping
const chordMap = ["", "Am", "Em", "C", "G", "F"];

function preload() {
  bodyPose = ml5.bodyPose("BlazePose");
  handPose = ml5.handPose({ maxHands: 2, flipped: true });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  bodyPose.detectStart(video, gotPoses);
  handPose.detectStart(video, gotHands);

}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio();
    for (let i = 0; i < 3; i++) {
      let osc = new p5.Oscillator("triangle");
      osc.amp(0);
      osc.start();
      oscillators.push(osc);
    }
    audioStarted = true;
  }
}

function gotPoses(result) {
  poses = result;
}

function gotHands(result) {
  hands = result;
}

function countFingers(hand) {
  let kp = hand.keypoints;
  let count = 0;

  // Thumb: compare tip (4) x to ip (3) x
  let thumbTip = kp[4];
  let thumbIP = kp[3];
  if (hand.handedness === "Left") {
    if (thumbTip.x > thumbIP.x) count++;
  } else {
    if (thumbTip.x < thumbIP.x) count++;
  }

  // Index finger: tip (8) above pip (6)
  if (kp[8].y < kp[6].y) count++;
  // Middle finger: tip (12) above pip (10)
  if (kp[12].y < kp[10].y) count++;
  // Ring finger: tip (16) above pip (14)
  if (kp[16].y < kp[14].y) count++;
  // Pinky: tip (20) above pip (18)
  if (kp[20].y < kp[18].y) count++;

  return count;
}

function playChord(frequencies) {
  for (let i = 0; i < 3; i++) {
    oscillators[i].freq(frequencies[i]);
    oscillators[i].amp(0.15, 0.02); // fade in over 20ms
  }
}

function stopChord() {
  for (let i = 0; i < 3; i++) {
    oscillators[i].amp(0, 0.05); // fade out over 50ms
  }
}

function draw() {
  background(0);
  push();
  translate(width, 0);
  scale(-1, 1);
  // mirror

  image(video, 0, 0, width, height);

  pop();

  // Find left and right hands (only use high-confidence detections)
  let leftHand = null;
  let rightHand = null;
  for (let hand of hands) {
    if (hand.confidence < 0.7) continue;
    if (hand.handedness === "Left") leftHand = hand;
    if (hand.handedness === "Right") rightHand = hand;
  }

  // Left hand: count fingers to select chord
  if (leftHand) {
    fingerCount = countFingers(leftHand);
    chordName = chordMap[fingerCount] || "";
    currentChord = chords[chordName] || null;
  } else {
    fingerCount = 0;
    chordName = "";
    currentChord = null;
  }

  // Right hand: open = play, closed fist = stop
  let triggered = false;
  if (rightHand) {
    let rightFingers = countFingers(rightHand);
    triggered = rightFingers >= 2; // open hand = play
  }

  if (triggered && currentChord && !isPlaying) {
    playChord(currentChord);
    isPlaying = true;
  } else if (triggered && isPlaying && currentChord) {
    // Update chord if changed while still triggered
    for (let i = 0; i < 3; i++) {
      oscillators[i].freq(currentChord[i]);
    }
  } else if (!triggered && isPlaying) {
    stopChord();
    isPlaying = false;
  }

  // Display UI
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text("Fingers: " + fingerCount, 20, 20);
  text("Chord: " + (chordName || "—"), 20, 50);

  if (isPlaying) {
    fill(0, 255, 100);
    text("♪ Playing", 20, 80);
  }

  if (!audioStarted) {
    fill(255, 255, 0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("Click anywhere to enable audio", width / 2, height / 2);
    textAlign(LEFT, TOP);
  }

  // Chord guide
  textSize(14);
  fill(200);
  text("1 finger = Am", 20, height - 120);
  text("2 fingers = Em", 20, height - 100);
  text("3 fingers = C", 20, height - 80);
  text("4 fingers = G", 20, height - 60);
  text("5 fingers = F", 20, height - 40);
}
