// Define HTML elements
const board = document.getElementById("game-board");
const instructionText = document.getElementById("instruction-text");
const logo = document.getElementById("logo");
const score = document.getElementById("score");
const highScoreText = document.getElementById("highScore");
const lastScoresList = document.querySelector(".last-scores ol"); // Añadido para mostrar las últimas puntuaciones

// Define game variables
const gridSize = 20;
let snake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
]; // Inicia con dos segmentos
let food = generateFood();
let direction = "right";
let gameInterval;
let foodMoveInterval; // Intervalo para mover la comida
let specialItemInterval; // Intervalo para generar los items especiales
let gameSpeedDelay = 200;
let gameStarted = false;
let playerName = ""; // Nombre del jugador
let currentScore = 0; // Puntaje inicial
let specialItem = null; // Item especial (dorado o púrpura)
let specialItemTimeout; // Timeout para controlar la duración del item especial

// Cargar puntuación máxima desde localStorage
let highScore = localStorage.getItem("highScore")
  ? parseInt(localStorage.getItem("highScore"))
  : 0;
highScoreText.textContent = highScore.toString().padStart(3, "0");

// Mostrar el elemento de puntuación máxima al inicio
highScoreText.style.display = "block";

// Cargar y mostrar las últimas 10 puntuaciones desde localStorage
function loadLastScores() {
  const lastScores = JSON.parse(localStorage.getItem("lastScores")) || [];
  lastScoresList.innerHTML = lastScores
    .map(
      (score) => `<li class="score-item">
        <span class="score-name">${score.name}</span>
        <span class="score-value">${score.value}</span>
      </li>
      `
    )
    .join("");
}

// Draw game map, snake, food, and special items
function draw() {
  board.innerHTML = ""; // Limpia el tablero antes de dibujar
  drawSnake();
  drawFood();
  drawSpecialItem(); // Asegúrate de que también se dibuje el ítem especial
  updateScore();
}

// Draw snake
function drawSnake() {
  snake.forEach((segment, index) => {
    let snakeElement;

    if (index === 0) {
      // La cabeza de la serpiente
      snakeElement = createGameElement("div", "snake snake-head");
    } else if (index === snake.length - 1) {
      // La cola de la serpiente
      snakeElement = createGameElement("div", "snake snake-tail");
    } else {
      // Cuerpo de la serpiente
      snakeElement = createGameElement("div", "snake snake-body");
    }

    setPosition(snakeElement, segment);
    board.appendChild(snakeElement);
  });
}

// Create a snake, food, or special item cube/div
function createGameElement(tag, className) {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

// Set the position of snake, food, or special item
function setPosition(element, position) {
  element.style.gridColumn = position.x;
  element.style.gridRow = position.y;
}

// Draw food function
function drawFood() {
  if (gameStarted) {
    const foodElement = createGameElement("div", "food");
    setPosition(foodElement, food);
    board.appendChild(foodElement);
  }
}

// Draw special item function (gold or purple)
function drawSpecialItem() {
  if (specialItem) {
    // Solo dibuja si hay un ítem especial activo
    const specialElement = createGameElement(
      "div",
      `special-item ${specialItem.type}`
    );
    setPosition(specialElement, specialItem.position);
    board.appendChild(specialElement);
  }
}

// Generate food
function generateFood() {
  let x, y;
  do {
    x = Math.floor(Math.random() * gridSize) + 1;
    y = Math.floor(Math.random() * gridSize) + 1;
  } while (isFoodOnSnake(x, y)); // Verificar que la comida no aparezca en el cuerpo de la serpiente

  return { x, y };
}

// Generate special item (gold or purple)
function generateSpecialItem() {
  // Randomly decide whether to generate a special item
  if (Math.random() > 0.5) {
    const itemType = Math.random() > 0.5 ? "gold" : "purple"; // Elegir entre dorado o púrpura
    const position = generateFood(); // Usar la misma función para obtener una posición válida

    specialItem = { type: itemType, position };

    // Eliminar el item especial después de 3 segundos
    specialItemTimeout = setTimeout(() => {
      specialItem = null;
      draw();
    }, 3000);
  }
}

// Verificar si la comida está en la posición de la serpiente
function isFoodOnSnake(x, y) {
  return snake.some((segment) => segment.x === x && segment.y === y);
}

// Mover la comida a una nueva posición aleatoria cada cierto tiempo
function moveFoodRandomly() {
  foodMoveInterval = setInterval(() => {
    food = generateFood();
    draw(); // Redibujar la comida en su nueva posición
  }, 5000); // Cada 5 segundos (ajusta este valor según lo que prefieras)
}

// Generar items especiales cada 15 segundos
function generateSpecialItemInterval() {
  specialItemInterval = setInterval(() => {
    generateSpecialItem();
    draw(); // Redibujar el tablero para mostrar el item especial
  }, 5000); // Cada 15 segundos
}

// Moving the snake
function move() {
  const head = { ...snake[0] };
  switch (direction) {
    case "up":
      head.y--;
      break;
    case "down":
      head.y++;
      break;
    case "left":
      head.x--;
      break;
    case "right":
      head.x++;
      break;
  }

  snake.unshift(head);

  // Si la serpiente come la comida
  if (head.x === food.x && head.y === food.y) {
    food = generateFood();
    increaseSpeed();
    currentScore++; // Incrementar el puntaje al comer comida
    updateScore(); // Actualizar la visualización del puntaje
    clearInterval(gameInterval); // Clear past interval
    gameInterval = setInterval(() => {
      move();
      checkCollision();
      draw();
    }, gameSpeedDelay);
  }
  // Si la serpiente come un item especial
  else if (
    specialItem &&
    head.x === specialItem.position.x &&
    head.y === specialItem.position.y
  ) {
    if (specialItem.type === "gold") {
      // Sumar 3 segmentos
      for (let i = 0; i < 3; i++) {
        snake.push({ ...snake[snake.length - 1] });
        currentScore++;
      }
    } else if (specialItem.type === "purple") {
      // Restar 7 segmentos
      snake.length = Math.max(2, snake.length - 3); // Asegurar que la serpiente tenga al menos 2 segmentos
    }
    currentScore--;
    specialItem = null; // Eliminar el item después de ser comido
    clearTimeout(specialItemTimeout); // Limpiar el timeout del item especial
    draw(); // Redibujar el tablero
  } else {
    snake.pop(); // Mover la serpiente quitando el último segmento si no come nada
  }
}

// Start game function
function startGame() {
  if (!playerName) {
    playerName = prompt("What's the name of your snake?");
    if (!playerName) {
      playerName = "Anonymous"; // Nombre por defecto si el usuario no ingresa ninguno
    }
  }

  gameStarted = true; // Keep track of a running game
  instructionText.style.display = "none";
  logo.style.display = "none";
  currentScore = 0; // Reiniciar el puntaje a 0

  // Iniciar el movimiento aleatorio de la comida
  moveFoodRandomly();

  // Iniciar la generación de items especiales
  generateSpecialItemInterval();

  gameInterval = setInterval(() => {
    move();
    checkCollision();
    draw();
  }, gameSpeedDelay);
}

// Keypress event listener
function handleKeyPress(event) {
  if (
    (!gameStarted && event.code === "Space") ||
    (!gameStarted && event.key === " ")
  ) {
    startGame();
  } else {
    switch (event.key) {
      case "ArrowUp":
        direction = "up";
        break;
      case "ArrowDown":
        direction = "down";
        break;
      case "ArrowLeft":
        direction = "left";
        break;
      case "ArrowRight":
        direction = "right";
        break;
    }
  }
}

document.addEventListener("keydown", handleKeyPress);

function increaseSpeed() {
  if (gameSpeedDelay > 150) {
    gameSpeedDelay -= 5;
  } else if (gameSpeedDelay > 100) {
    gameSpeedDelay -= 3;
  } else if (gameSpeedDelay > 50) {
    gameSpeedDelay -= 2;
  } else if (gameSpeedDelay > 25) {
    gameSpeedDelay -= 1;
  }
}

function checkCollision() {
  const head = snake[0];

  if (head.x < 1 || head.x > gridSize || head.y < 1 || head.y > gridSize) {
    resetGame();
  }

  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      resetGame();
    }
  }
}

function resetGame() {
  updateHighScore();
  saveScoreToHistory(); // Guardar la puntuación actual en el historial
  stopGame();
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
  ]; // Serpiente de 2 segmentos
  food = generateFood();
  direction = "right";
  gameSpeedDelay = 200;
  //currentScore = 0; // Reiniciar el puntaje a 0
  updateScore(); // Mostrar el puntaje actualizado
}

function updateScore() {
  score.textContent = currentScore.toString().padStart(3, "0");
}

function stopGame() {
  clearInterval(gameInterval);
  clearInterval(foodMoveInterval); // Detener el movimiento de la comida
  clearInterval(specialItemInterval); // Detener la generación de items especiales
  gameStarted = false;
  instructionText.style.display = "block";
  logo.style.display = "block";
}

function updateHighScore() {
  if (currentScore > highScore) {
    highScore = currentScore;
    highScoreText.textContent = highScore.toString().padStart(3, "0");

    // Guardar la nueva puntuación máxima en localStorage
    localStorage.setItem("highScore", highScore);
  }
  highScoreText.style.display = "block";
}

// Guardar la puntuación actual en el historial
function saveScoreToHistory() {
  const lastScores = JSON.parse(localStorage.getItem("lastScores")) || [];

  // Agregar la nueva puntuación al historial
  lastScores.push({ name: playerName, value: currentScore });

  // Ordenar por puntuación de mayor a menor y mantener solo las 10 mejores puntuaciones
  lastScores.sort((a, b) => b.value - a.value);
  if (lastScores.length > 10) {
    lastScores.length = 10; // Eliminar los registros con menor puntuación
  }

  // Guardar el historial actualizado en localStorage
  localStorage.setItem("lastScores", JSON.stringify(lastScores));

  // Actualizar la lista en la interfaz
  loadLastScores();
}

// Cargar y mostrar las últimas 10 puntuaciones al cargar la página
window.addEventListener("load", () => {
  loadLastScores();
});
