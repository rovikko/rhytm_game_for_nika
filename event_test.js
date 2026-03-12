let duration = 3; // Інтервал у секундах (x)
let lastCycle = -1;

function setup() {
  createCanvas(400, 200);
  
  // 1. Слухаємо подію (наприклад, на рівні window)
  window.addEventListener('cycleReset', (e) => {
    console.log("Подія спрацювала! Час:", e.detail.time);
  });
}

function draw() {
  background(220);

  // 2. Визначаємо поточний номер циклу
  let currentCycle = Math.floor(millis() / (duration * 1000));

  // 3. Якщо номер циклу змінився — диспатчимо подію
  if (currentCycle > lastCycle) {
    const event = new CustomEvent('cycleReset', {
      detail: { time: nf(millis() / 1000, 1, 2) }
    });
    window.dispatchEvent(event);
    
    lastCycle = currentCycle; // Оновлюємо стан
  }

  // Візуалізація таймера
  text(`Цикл: ${currentCycle}`, 20, 20);
}