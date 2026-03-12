let arrows = [];

let lineLength = 300; // Довжина лінії (n)
let duration = 3;     // Тривалість руху в секундах (x)
let startX = 50;      // Початкова координата X
let y = 200;          // Координата Y (висота лінії)



function setup() {
  createCanvas(windowWidth, windowHeight);

  arrows = generateRandomArrows(10);
}

function draw() {
  let w = windowWidth;
  let h = windowHeight;
  background(0);

  fill(0, 0);
  stroke(255);

  ellipse(mouseX, mouseY, 50, 50);

  translate(w / 2, h / 2);
  // point(0, 0);

  let x = 0;
  for (let arrowType of arrows) {
    drawTypedArrow(x, 0, 40, arrowType);
    x += 50;
  }

   stroke(200);

}

let ARROW_TYPE = {
  UP: 0,
  DOWN: 1,
  RIGHT: 2,
  LEFT: 3,
};

function generateRandomArrows(count) {
  let tempArray = [];
  for (let i = 0; i < count; i++) {
    tempArray.push(
      random([
        ARROW_TYPE.UP,
        ARROW_TYPE.DOWN,
        ARROW_TYPE.LEFT,
        ARROW_TYPE.RIGHT,
      ]),
    );
  }
  return tempArray;
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
