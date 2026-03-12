class Game {
  started = false;

  start() {
    this.started = true;
  }
}

let ARROW_TYPE = {
  UP: 0,
  DOWN: 1,
  RIGHT: 2,
  LEFT: 3,
};
let ARROW_STATE = {
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

class TextNotify {
  constructor(msg, durationSec) {
    this.msg = msg;
    this.duration = durationSec * 1000;
    this.startTime = millis();
    this.isFinished = false;
    this.fadeTime = 500;
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
    // fill(0, alpha);
    // noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    text(this.msg, 250, 150);
    pop();
  }
}

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

    console.log("started interval");

    // this.timeoutId = setTimeout(() => {
    //   console.log(
    //     "interval started at ",
    //     this.memorizedTimestamp,
    //     "and died after",
    //     this.duration,
    //     "millis",
    //   );

    //   this.onDestroy();
    // }, this.duration - 50);

    this.arrows = generateRandomArrows(this.difficulty);
  }

  checkBeat(time) {
    console.log((time - this.memorizedTimestamp) / this.duration);

    const idealBEAT =
      this.memorizedTimestamp + this.duration * this.beatTimingFraction;

    const offBEATDiff = idealBEAT - time;
    console.log("idealBEAT", idealBEAT);
    console.log("currentTime", time);
    console.log("offBEATDiff", offBEATDiff);
    // if offBEATDiff > 0 - it means player pressed later
    // if < 0 - pressed earlier

    const threshold = 100; // 100ms, 0.1 seconds
    if (Math.abs(offBEATDiff) < threshold) {
      console.log("perfect");
    } else {
      console.log("not perfect");
    }

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
      SCORE += 100 * COMBO;
      COMBO++;
    } else {
      comboFail();
    }

    this.currentArrowIdx++;
    if (this.currentArrowIdx === this.arrows.length) {
      this.arrowsFinished = true;
    }
  }

  destroy() {
    // clearTimeout(this.timeoutId);
    // this.onDestroy();
  }
}

const startX = 50;
const lineY = 200;
const lineLength = 300;

let game = new Game();

let SCORE = 0;
let COMBO = 1;

function comboFail() {
  COMBO = 1;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}
let CURRENT_TIME = 0;

let currentNote;

function draw() {
  background(0);
  noFill();
  stroke(255);
  CURRENT_TIME = millis();

  if (currentInterval) {
    // interval drawing
    // ------------------------------------------------------------
    let duration = currentInterval.duration;

    line(startX, lineY, startX + lineLength, lineY);

    // ideal BEAT marker
    strokeWeight(5);
    point(startX + lineLength * currentInterval.beatTimingFraction, lineY);

    // debug
    for (const tri of currentInterval.checkTries) {
      push();
      if (Math.abs(tri.diff) < 100) {
        stroke("cyan");
        currentNote = new TextNotify("Perfect!", 0.5);
      } else if (Math.abs(tri.diff) < 200) {
        stroke(0, 255, 0);
        currentNote = new TextNotify("Great!", 0.5);
      } else if (Math.abs(tri.diff) < 300) {
        stroke("yellow");
        currentNote = new TextNotify("Ok!", 0.5);
      } else {
        stroke("red");
        currentNote = new TextNotify("bruh...", 0.5);
      }
      point(startX + lineLength * tri.ratio, lineY);
      pop();
    }

    strokeWeight(1);

    let elapsed =
      (CURRENT_TIME - currentInterval.memorizedTimestamp) % duration;
    let progress = elapsed / duration;
    let currentX = startX + progress * lineLength;
    ellipse(currentX, lineY, 20, 20);
    // ------------------------------------------------------------

    // arrows
    let x = 0;
    for (let arr of currentInterval.arrows) {
      push();
      if (arr.state === ARROW_STATE.FAILED) {
        fill(255, 0, 0);
      }
      if (arr.state === ARROW_STATE.PASSED) {
        fill(0, 255, 0);
      }
      drawTypedArrow(startX + x, lineY + 50, 40, arr.type);
      pop();
      x += 50;
    }
    // ------------------------------------------------------------

    // level label
    fill(255);
    const label = `LEVEL ${currentInterval.difficulty}`;
    textSize(30);
    text(label, startX, 350); // TODO: 150px ?
    const score = `SCORE ${SCORE}`;
    textSize(20);
    text(score, startX, 100);
    const combo = `${COMBO}x`;
    textSize(20);
    text(combo, startX + 350, 200);

    // ------------------------------------------------------------

    if (currentNote && !currentNote.isFinished) {
      currentNote.update();
      currentNote.display();
    }
  } else {
  }

  // ellipse(50, 50, 50);
}

let currentInterval = null;
const DURATION = 3500;
let DIFFICULTY = 3;
let INTERVAL_STARTED = false;
let intervalId = 0;

let INTERVAL_COUNT = 1;

function setupIntervalCreation() {
  const intervalLogic = () => {
    if (currentInterval) {
      currentInterval.destroy();
      currentInterval = null;
    }

    currentInterval = new RhytmInterval();
    currentInterval.start(CURRENT_TIME, DIFFICULTY, DURATION, () => {
      // need this ?
      console.log("cleared currentInterval");
      currentInterval.destroy();
      currentInterval = null;
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
  intervalId = setInterval(intervalLogic, DURATION);

  INTERVAL_STARTED = true;
}

// function createInterval() {
//   currentInterval.start(CURRENT_TIME, 3, () => {
//     console.log("cleared currentInterval");
//   });
// }

function keyPressed(event) {
  console.log(event);
  if (event.code === "Space") {
    if (!INTERVAL_STARTED) {
      setupIntervalCreation();
    }

    if (currentInterval && !currentInterval.BEATchecked) {
      if (!currentInterval.arrowsFinished) {
        console.log("cannot BEAT");
      } else {
        currentInterval.checkBeat(CURRENT_TIME);
        // currentInterval.destroy();
      }
    }
  }
  if (currentInterval && !currentInterval.arrowsFinished) {
    console.log("process arrow");
    if (event.code === "ArrowUp") {
      currentInterval.checkArrow(ARROW_TYPE.UP);
    }
    if (event.code === "ArrowDown") {
      currentInterval.checkArrow(ARROW_TYPE.DOWN);
    }
    if (event.code === "ArrowLeft") {
      currentInterval.checkArrow(ARROW_TYPE.LEFT);
    }
    if (event.code === "ArrowRight") {
      currentInterval.checkArrow(ARROW_TYPE.RIGHT);
    }
  }
}

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
  // RIGHT (2) — no roration

  drawArrowShape(size);
  pop();
}
