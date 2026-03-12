// ===================================================================================================================================
// arrows
// ===================================================================================================================================

const ARROW_TYPE = {
  UP: 0,
  DOWN: 1,
  RIGHT: 2,
  LEFT: 3,
};
const ARROW_STATE = {
  UNPRESSED: 0,
  PASSED: 1,
  FAILED: 2,
};
class Arrow {
  type = 0;
  state = 0;

  constructor(type) {
    this.type = type;
    this.state = ARROW_STATE.UNPRESSED;
  }
}
function generateRandomArrows(count) {
  let tempArray = [];
  for (let i = 0; i < count; i++) {
    const rnd_type = random([
      ARROW_TYPE.UP,
      ARROW_TYPE.DOWN,
      ARROW_TYPE.LEFT,
      ARROW_TYPE.RIGHT,
    ]);

    tempArray.push(new Arrow(rnd_type));
  }
  return tempArray;
}
// ===================================================================================================================================
// temporary message
// ===================================================================================================================================
let CURRENT_NOTE;
class TextNotify {
  constructor(msg, durationSec, color) {
    this.msg = msg;
    this.duration = durationSec * 1000;
    this.startTime = millis();
    this.isFinished = false;
    this.fadeTime = 500;
    this.color = color;

    const offset = 20; 
    this.offsetX = random(-offset, offset);
    this.offsetY = random(-offset, offset);
  }

  update() {
    let elapsed = millis() - this.startTime;
    if (elapsed > this.duration) {
      this.isFinished = true;
    }
  }

  display() {
    let elapsed = millis() - this.startTime;
    let alpha = 255;

    if (elapsed < this.fadeTime) {
      alpha = map(elapsed, 0, this.fadeTime, 0, 255);
    } else if (elapsed > this.duration - this.fadeTime) {
      alpha = map(
        elapsed,
        this.duration - this.fadeTime,
        this.duration,
        255,
        0,
      );
    }

    push();
    strokeWeight(0);
    if (this.color) {
      fill(this.color);
      stroke(this.color);
    }
    textAlign(CENTER, CENTER);
    textSize(25);
    text(this.msg, 250 + this.offsetX, 150 + this.offsetY);
    pop();
  }
}
function showBeatMessage(msg, color) {
  CURRENT_NOTE = new TextNotify(msg, 0.5, color);
}

// ===================================================================================================================================
// rhythm interval - core of game
// contains logic of arrows and BEAT check
// logic for score and combo
// ===================================================================================================================================
let SCORE = 0;
let COMBO = 1;
function comboFail() {
  COMBO = 1;
}
function addComboScore(score) {
  SCORE += score * COMBO;
}

const PERFECT_THRESHOLD = 100;
const GREAT_THRESHOLD = 200;
const OK_THRESHOLD = 300;

class RhytmInterval {
  duration = 3000;
  beatTimingFraction = 0.75;
  memorizedTimestamp = 0; // we save current time so that we can check whether BEAT was pressed in-time
  timeoutId = 0;
  checkTries = [];
  onDestroy = null;
  difficulty = 3; // varies from 3 to 9 ?
  BEATchecked = false;
  arrows = [];
  currentArrowIdx = 0;
  arrowsFinished = false;

  start(time, difficulty = 3, duration, callback) {
    this.memorizedTimestamp = time;
    this.difficulty = difficulty;
    this.onDestroy = callback;
    this.duration = duration;
    this.arrows = generateRandomArrows(this.difficulty);
  }

  checkBeat(time) {
    const idealBEAT =
      this.memorizedTimestamp + this.duration * this.beatTimingFraction;

    const offBEATDiff = idealBEAT - time;

    // if offBEATDiff > 0 - it means player pressed later
    // if < 0 - pressed earlier
    if (Math.abs(offBEATDiff) < PERFECT_THRESHOLD) {
      showBeatMessage("Perfect!", "cyan");
      COMBO += 5;
    } else if (Math.abs(offBEATDiff) < GREAT_THRESHOLD) {
      COMBO += 3;
      showBeatMessage("Great!", "green");
    } else if (Math.abs(offBEATDiff) < OK_THRESHOLD) {
      showBeatMessage("Ok!", "yellow");
      COMBO += 1;
    } else {
      showBeatMessage("bruh", "red");
      comboFail();
    }
    // every Beat add score of 1000
    addComboScore(1000);

    this.checkTries.push({
      ratio: (time - this.memorizedTimestamp) / this.duration,
      diff: offBEATDiff,
    });
    this.BEATchecked = true;
  }

  checkArrow(type) {
    const currentArrow = this.arrows[this.currentArrowIdx];
    currentArrow.state =
      currentArrow.type === type ? ARROW_STATE.PASSED : ARROW_STATE.FAILED;

    if (currentArrow.state === ARROW_STATE.PASSED) {
      addComboScore(100);
      COMBO++;
      showBeatMessage("hit!", "green");
    } else {
      showBeatMessage("miss!", "red");
      comboFail();
    }

    this.currentArrowIdx++;
    if (this.currentArrowIdx === this.arrows.length) {
      this.arrowsFinished = true;
    }
  }
}
// ===================================================================================================================================
// setup and draw logic for all visuals
// ===================================================================================================================================
const LINE_START_X = 50;
const LINE_Y = 200;
const LINE_LEN = 300;
let CURRENT_TIME = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupIntervalCreation();
}

function draw() {
  background(0);
  noFill();
  stroke(255);
  CURRENT_TIME = millis();

  if (CURRENT_INTERVAL) {
    // interval drawing
    // ------------------------------------------------------------
    let duration = CURRENT_INTERVAL.duration;

    line(LINE_START_X, LINE_Y, LINE_START_X + LINE_LEN, LINE_Y);

    // ideal BEAT marker
    strokeWeight(5);
    point(
      LINE_START_X + LINE_LEN * CURRENT_INTERVAL.beatTimingFraction,
      LINE_Y,
    );

    // BEAT accuracy point display
    for (const tri of CURRENT_INTERVAL.checkTries) {
      push();
      if (Math.abs(tri.diff) < 100) {
        stroke("cyan");
      } else if (Math.abs(tri.diff) < 200) {
        stroke(0, 255, 0);
      } else if (Math.abs(tri.diff) < 300) {
        stroke("yellow");
      } else {
        stroke("red");
      }
      point(LINE_START_X + LINE_LEN * tri.ratio, LINE_Y);
      pop();
    }

    strokeWeight(1);

    let elapsed =
      (CURRENT_TIME - CURRENT_INTERVAL.memorizedTimestamp) % duration;
    let progress = elapsed / duration;
    let currentX = LINE_START_X + progress * LINE_LEN;
    push();
    if (!CURRENT_INTERVAL.arrowsFinished) {
      stroke(150);
    } else {
      strokeWeight(2);
    }
    ellipse(currentX, LINE_Y, 20, 20);
    pop();
    // ------------------------------------------------------------

    // arrows
    let x = 0;
    for (let arr of CURRENT_INTERVAL.arrows) {
      push();
      if (arr.state === ARROW_STATE.FAILED) {
        fill(255, 0, 0);
      }
      if (arr.state === ARROW_STATE.PASSED) {
        fill(0, 255, 0);
      }
      drawTypedArrow(LINE_START_X + x, LINE_Y + 50, 40, arr.type);
      pop();
      x += 50;
    }
    // ------------------------------------------------------------

    // level label
    fill(255);
    const label = `LEVEL ${CURRENT_INTERVAL.difficulty}`;
    textSize(30);
    text(label, LINE_START_X, 350); // TODO: 150px ?
    const score = `SCORE ${SCORE}`;
    textSize(20);
    text(score, LINE_START_X, 100);
    const combo = `${COMBO}x`;
    textSize(20);
    text(combo, LINE_START_X + 350, 200);

    // ------------------------------------------------------------
    // temrorary message
    if (CURRENT_NOTE && !CURRENT_NOTE.isFinished) {
      CURRENT_NOTE.update();
      CURRENT_NOTE.display();
    }
  }
}
// ===================================================================================================================================
// logic related to interval re-instantiation
// ===================================================================================================================================
let CURRENT_INTERVAL = null;
const DURATION = 3500;
let DIFFICULTY = 3;
let INTERVAL_STARTED = false;
let INTERVAL_COUNT = 1;
let setIntervalId = 0;

function setupIntervalCreation() {
  const intervalLogic = () => {
    if (CURRENT_INTERVAL) {
      if (!CURRENT_INTERVAL.BEATchecked) {
        comboFail();
        showBeatMessage("beat missed!", "red");
      }
      CURRENT_INTERVAL = null;
    }

    CURRENT_INTERVAL = new RhytmInterval();
    CURRENT_INTERVAL.start(CURRENT_TIME, DIFFICULTY, DURATION, () => {
      // TODO: need this ?
      CURRENT_INTERVAL = null;
    });
    INTERVAL_COUNT++;

    console.log(INTERVAL_COUNT, DIFFICULTY);

    if (INTERVAL_COUNT % 3 === 0) {
      console.log("diff up");
      DIFFICULTY++;
      DIFFICULTY = DIFFICULTY >= 9 ? 9 : DIFFICULTY;
    }
  };

  intervalLogic();
  setIntervalId = setInterval(intervalLogic, DURATION);

  INTERVAL_STARTED = true;
}

// ===================================================================================================================================
// keys hanlers
// ===================================================================================================================================
function keyPressed(event) {
  console.log(event);
  if (event.code === "Space") {
    if (CURRENT_INTERVAL && !CURRENT_INTERVAL.BEATchecked) {
      if (!CURRENT_INTERVAL.arrowsFinished) {
        showBeatMessage("press arrows first!");
      } else {
        CURRENT_INTERVAL.checkBeat(CURRENT_TIME);
      }
    }
  }
  if (CURRENT_INTERVAL && !CURRENT_INTERVAL.arrowsFinished) {
    if (event.code === "ArrowUp") {
      CURRENT_INTERVAL.checkArrow(ARROW_TYPE.UP);
    }
    if (event.code === "ArrowDown") {
      CURRENT_INTERVAL.checkArrow(ARROW_TYPE.DOWN);
    }
    if (event.code === "ArrowLeft") {
      CURRENT_INTERVAL.checkArrow(ARROW_TYPE.LEFT);
    }
    if (event.code === "ArrowRight") {
      CURRENT_INTERVAL.checkArrow(ARROW_TYPE.RIGHT);
    }
  }
}
// ===================================================================================================================================

function drawArrowShape(size) {
  beginShape();
  vertex(-size / 2, -size / 4);
  vertex(0, -size / 4);
  vertex(0, -size / 2);
  vertex(size / 2, 0);
  vertex(0, size / 2);
  vertex(0, size / 4);
  vertex(-size / 2, size / 4);
  endShape(CLOSE);
}

function drawTypedArrow(x, y, size, type) {
  push();
  translate(x, y);

  if (type === ARROW_TYPE.UP) rotate(-HALF_PI);
  else if (type === ARROW_TYPE.DOWN) rotate(HALF_PI);
  else if (type === ARROW_TYPE.LEFT) rotate(PI);
  // RIGHT (2) — no rotation

  drawArrowShape(size);
  pop();
}
