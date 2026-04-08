let video;
let bodyPose;
let poses = [];

function preload() {
  bodyPose = ml5.bodyPose("BlazePose");
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  bodyPose.detectStart(video, gotPoses);
}

function gotPoses(result) {
  poses = result;
}

function draw() {
  background(0);
  push();
  translate(width, 0);
  scale(-1, 1);
  //mirror

  image(video, 0, 0, width, height);
  let isColor = false;

  if (poses.length > 0) {
    let pose = poses[0];

    let nose = pose.keypoints.find((k) => k.name === "nose");
    let leftWrist = pose.keypoints.find((k) => k.name === "left_wrist");
    let rightWrist = pose.keypoints.find((k) => k.name === "right_wrist");
    //body detection(nose, leftwrist, rightwrist)
    fill(255, 0, 0);
    noStroke();

    if (leftWrist) {
      circle(leftWrist.x, leftWrist.y, 20);
    }
    if (rightWrist) {
      circle(rightWrist.x, rightWrist.y, 20);
    }
    //hot the detection visualize(position, color, scale)

    if ((leftWrist && nose && leftWrist.y < nose.y) || (rightWrist && nose && rightWrist.y < nose.y)) {
      isColor = true;
    }
  }

  if (!isColor) {
    filter(GRAY);
  }
  pop();
}
