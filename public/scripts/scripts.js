/*
 *  Copyright 2023 Patrick L. Branson
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

'use strict';

window.addEventListener('load', function () {
  const canvas = document.getElementById('background-canvas');
  const context = canvas.getContext('2d');

  // Sets the size of the canvas background
  canvas.width = 1280;
  canvas.height = 720;

  // Overrides the context values
  context.lineWidth = 3;
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.strokeStyle = 'black';
  context.font = '40px Helvetica';

  /**
   * The Player Class
   */
  class Player {
    constructor(game) {
      this.game = game;
      this.collisionX = this.game.width * 0.5;
      this.collisionY = this.game.height * 0.5;
      this.collisionRadius = 30;

      this.speedModifier = 5;
      this.speedX = 0;
      this.speedY = 0;
      this.dx = 0;
      this.dy = 0;

      this.spriteX;
      this.spriteY;
      this.spriteWidth = 256;
      this.spriteHeight = 256;

      this.width = this.spriteWidth;
      this.height = this.spriteHeight;

      this.frameX = 0;
      this.frameY = 0;

      this.bullImage = document.getElementById('bull');
    }

    draw(context) {
      // Draws the images of the Bull (Player)
      context.drawImage(
        this.bullImage,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.width,
        this.height,
      );

      if (this.game.debug) {
        context.beginPath();
        context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);

        // Wraps the hit box to affect the transparency with globalAlpha
        // Only applies globalAlpha to the player, not the whole game
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();

        context.beginPath();
        context.moveTo(this.collisionX, this.collisionY);
        context.lineTo(this.game.mouse.x, this.game.mouse.y);
        context.stroke();
      }
    }

    update() {
      this.dx = this.game.mouse.x - this.collisionX;
      this.dy = this.game.mouse.y - this.collisionY;
      const distance = Math.hypot(this.dy, this.dx);

      // The Bull (Sprite) Animation
      const angle = Math.atan2(this.dy, this.dx);
      if (angle < -2.74 || angle > 2.74) {
        this.frameY = 6;
      } else if (angle < -1.96) {
        this.frameY = 7;
      } else if (angle < -1.17) {
        this.frameY = 0;
      } else if (angle < -0.39) {
        this.frameY = 1;
      } else if (angle < 0.39) {
        this.frameY = 2;
      } else if (angle < 1.17) {
        this.frameY = 3;
      } else if (angle < 1.96) {
        this.frameY = 4;
      } else if (angle < 2.74) {
        this.frameY = 5;
      }

      if (distance > this.speedModifier) {
        this.speedX = this.dx / distance || 0;
        this.speedY = this.dy / distance || 0;
      } else {
        this.speedX = 0;
        this.speedY = 0;
      }

      this.collisionX += this.speedX * this.speedModifier;
      this.collisionY += this.speedY * this.speedModifier;
      this.spriteX = this.collisionX - this.width * 0.5;
      this.spriteY = this.collisionY - this.height * 0.5 - 100;

      // Horizontal boundaries
      if (this.collisionX < this.collisionRadius) {
        this.collisionX = this.collisionRadius;
      } else if (this.collisionX > this.game.width - this.collisionRadius) {
        this.collisionX = this.game.width - this.collisionRadius;
      }

      // Vertical Boundaries
      if (this.collisionY < this.game.topMargin + this.collisionRadius) {
        this.collisionY = this.game.topMargin + this.collisionRadius;
      } else if (this.collisionY > this.game.height - this.collisionRadius) {
        this.collisionY = this.game.height - this.collisionRadius;
      }

      // Checks for collisions with obstacles
      this.game.obstacles.forEach(obstacle => {
        let [collision, distance, sumOfRadii, dx, dy] = this.game.checkCollision(this, obstacle);

        if (collision) {
          const unitVectorX = dx / distance;
          const unitVectorY = dy / distance;
          this.collisionX = obstacle.collisionX + (sumOfRadii + 1) * unitVectorX;
          this.collisionY = obstacle.collisionY + (sumOfRadii + 1) * unitVectorY;
        }
      });
    }
  }

  /**
   * The Obstacle class
   */
  class Obstacle {
    constructor(game) {
      this.game = game;
      this.spriteWidth = 250;
      this.spriteHeight = 250;
      this.collisionRadius = 40;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;

      // The Frame X and Frame Y refers to the spreadsheet images of the obstacle sprites.
      // It is a 4 by 3 image image spreadsheet.
      this.frameX = Math.floor(Math.random() * 4);
      this.frameY = Math.floor(Math.random() * 3);

      this.obstaclesImage = document.getElementById('obstacles');
      this.collisionX = Math.random() * this.game.width;
      this.collisionY = Math.random() * this.game.height;
      this.spriteX = this.collisionX - this.width * 0.5;
      this.spriteY = this.collisionY - this.height * 0.5 - 70;
    }

    draw(context) {
      // Draws the obstacles
      context.drawImage(
        this.obstaclesImage,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteWidth,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.width,
        this.height,
      );

      if (this.game.debug) {
        context.beginPath();
        context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);

        // Wraps the hit box to affect the transparency with globalAlpha
        // Only applies globalAlpha to the player, not the whole game
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    update() {}
  }

  /**
   * The Egg Class
   */
  class Egg {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 40;
      this.margin = this.collisionRadius * 2;

      this.collisionX = Math.random() * (this.game.width - this.margin * 2);
      this.collisionY = this.game.topMargin + Math.random() * (this.game.height - this.game.topMargin - this.margin);

      this.eggImage = document.getElementById('egg');

      this.spriteX;
      this.spriteY;
      this.spriteWidth = 110;
      this.spriteHeight = 135;

      this.width = this.spriteWidth;
      this.height = this.spriteHeight;

      this.hatchTimer = 0;
      this.hatchInterval = 10000;
      this.markedForDeletion = false;
    }

    draw(context) {
      context.drawImage(this.eggImage, this.spriteX, this.spriteY);

      if (this.game.debug) {
        context.beginPath();
        context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);

        // Wraps the hit box to affect the transparency with globalAlpha
        // Only applies globalAlpha to the player, not the whole game
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();

        // Shows the Egg hatch timer
        const displayTimer = (this.hatchTimer * 0.001).toFixed(0);
        context.fillText(displayTimer, this.collisionX, this.collisionY - this.collisionRadius * 2.5);
      }
    }

    update(deltaTime) {
      this.spriteX = this.collisionX - this.width * 0.5;
      this.spriteY = this.collisionY - this.height * 0.5 - 30;

      // Collisions
      let collisionObjects = [this.game.player, ...this.game.obstacles, ...this.game.enemies];
      collisionObjects.forEach(object => {
        let [collision, distance, sumOfRadii, dx, dy] = this.game.checkCollision(this, object);

        if (collision) {
          const unitVectorX = dx / distance;
          const unitVectorY = dy / distance;
          this.collisionX = object.collisionX + (sumOfRadii + 1) * unitVectorX;
          this.collisionY = object.collisionY + (sumOfRadii + 1) * unitVectorY;
        }
      });

      // Hatching
      if (this.hatchTimer > this.hatchInterval || this.collisionY < this.game.topMargin) {
        this.game.hatchlings.push(new Larva(this.game, this.collisionX, this.collisionY));
        this.markedForDeletion = true;
        this.game.removeGameObjects();
      } else {
        this.hatchTimer += deltaTime;
      }
    }
  }

  class Larva {
    constructor(game, x, y) {
      this.game = game;
      this.collisionX = x;
      this.collisionY = y;
      this.collisionRadius = 30;

      this.spriteX;
      this.spriteY;
      this.spriteWidth = 150;
      this.spriteHeight = 150;

      this.speedY = 1 + Math.random();

      this.width = this.spriteWidth;
      this.height = this.spriteHeight;

      this.markedForDeletion = false;

      this.frameX = 0;
      this.frameY = Math.floor(Math.random() * 2);

      this.larvaImage = document.getElementById('larva');
    }

    draw(context) {
      context.drawImage(
        this.larvaImage,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.width,
        this.height,
      );

      if (this.game.debug) {
        context.beginPath();
        context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);

        // Wraps the hit box to affect the transparency with globalAlpha
        // Only applies globalAlpha to the player, not the whole game
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    update() {
      this.collisionY -= this.speedY;
      this.spriteX = this.collisionX - this.width * 0.5;
      this.spriteY = this.collisionY - this.height * 0.5 - 50;

      // Moved to Safety
      if (this.collisionY < this.game.topMargin) {
        this.markedForDeletion = true;
        this.game.removeGameObjects();
        this.game.score++;

        for (let i = 0; i < 3; i++) {
          this.game.particles.push(new Firefly(this.game, this.collisionX, this.collisionY, `yellow`));
        }
      }

      // Collision with objects & Player
      let collisionObjects = [this.game.player, ...this.game.obstacles];
      collisionObjects.forEach(object => {
        let [collision, distance, sumOfRadii, dx, dy] = this.game.checkCollision(this, object);

        if (collision) {
          const unitVectorX = dx / distance;
          const unitVectorY = dy / distance;
          this.collisionX = object.collisionX + (sumOfRadii + 1) * unitVectorX;
          this.collisionY = object.collisionY + (sumOfRadii + 1) * unitVectorY;
        }
      });

      // Collision with Enemies
      this.game.enemies.forEach(enemy => {
        if (this.game.checkCollision(this, enemy)[0]) {
          this.markedForDeletion = true;
          this.game.removeGameObjects();
          this.game.lostHatchlings++;

          for (let i = 0; i < 5; i++) {
            this.game.particles.push(new Spark(this.game, this.collisionX, this.collisionY, `red`));
          }
        }
      });
    }
  }

  class Enemy {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 30;

      this.speedX = Math.random() * 3 + 0.5;

      this.spriteX;
      this.spriteY;
      this.spriteWidth = 140;
      this.spriteHeight = 260;

      this.width = this.spriteWidth;
      this.height = this.spriteHeight;

      this.collisionX = this.game.width + this.width + Math.random() * this.game.width * 0.5;
      this.collisionY = this.game.topMargin + Math.random() * (this.game.height - this.game.topMargin);

      this.toadImage = document.getElementById('toad');
    }

    draw(context) {
      context.drawImage(this.toadImage, this.spriteX, this.spriteY);

      if (this.game.debug) {
        context.beginPath();
        context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);

        // Wraps the hit box to affect the transparency with globalAlpha
        // Only applies globalAlpha to the player, not the whole game
        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    update() {
      this.spriteX = this.collisionX - this.width * 0.5;
      this.spriteY = this.collisionY - this.height + 40;

      this.collisionX -= this.speedX;
      if (this.spriteX + this.width < 0) {
        this.collisionX = this.game.width + this.width + Math.random() * this.game.width * 0.5;
        this.collisionY = this.game.topMargin + Math.random() * (this.game.height - this.game.topMargin);
      }

      let collisionObjects = [this.game.player, ...this.game.obstacles];
      collisionObjects.forEach(object => {
        let [collision, distance, sumOfRadii, dx, dy] = this.game.checkCollision(this, object);

        if (collision) {
          const unitVectorX = dx / distance;
          const unitVectorY = dy / distance;
          this.collisionX = object.collisionX + (sumOfRadii + 1) * unitVectorX;
          this.collisionY = object.collisionY + (sumOfRadii + 1) * unitVectorY;
        }
      });
    }
  }

  /**
   * The Particle Class
   */
  class Particle {
    constructor(game, x, y, color) {
      this.game = game;
      this.color = color;
      this.collisionX = x;
      this.collisionY = y;
      this.angle = 0;
      this.markedForDeletion = false;
      this.va = Math.random() * 0.1 + 0.01;
      this.speedX = Math.random() * 6 - 3;
      this.speedY = Math.random() * 2 + 0.5;
      this.radius = Math.floor(Math.random() * 10 + 5);
    }

    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.beginPath();
      context.arc(this.collisionX, this.collisionY, this.radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
    }
  }

  /**
   * The Spark Class. This is when the enemy eats the larva
   */
  class Spark extends Particle {
    update() {
      this.angle += this.va * 0.5;
      this.collisionX -= Math.cos(this.angle) * this.speedX;
      this.collisionY -= Math.sin(this.angle) * this.speedY;
      
      if (this.radius > 0.1) {
        this.radius -= 0.05;
      }

      if (this.radius < 0.2) {
        this.markedForDeletion = true;
        this.game.removeGameObjects();
      }
    }
  }

  /**
   * The Firefly Class. This is when the larva makes it to the safety of the forest.
   */
  class Firefly extends Particle {
    update() {
      this.angle += this.va;
      this.collisionX += Math.cos(this.angle) * this.speedX;
      this.collisionY -= this.speedY;
      if (this.collisionY < 0 - this.radius) {
        this.markedForDeletion = true;
        this.game.removeGameObjects();
      }
    }
  }

  /**
   * The Game Class
   */
  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.topMargin = 260;

      this.debug = false;

      this.fps = 70;
      this.timer = 0;
      this.interval = 1000 / this.fps;

      this.eggTimer = 0;
      this.eggInterval = 1000;

      this.gameObjects = [];

      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.player = new Player(this);

      this.score = 0;

      this.particles = [];

      // The game eggs
      this.eggs = [];
      this.maximumNumberOfEggs = 10;

      // The game hatchlings
      this.hatchlings = [];
      this.lostHatchlings = 0;

      // The game enemies
      this.enemies = [];

      // The game obstacles
      this.obstacles = [];
      this.numberOfObstacles = 10;

      // Mouse Controller Object
      this.mouse = {
        x: this.width * 0.5,
        y: this.height * 0.5,
        pressed: false,
      };

      // Mouse Event Listeners
      this.canvas.addEventListener('mousedown', event => {
        this.mouse.x = event.offsetX;
        this.mouse.y = event.offsetY;
        this.mouse.pressed = true;
      });

      this.canvas.addEventListener('mouseup', event => {
        this.mouse.x = event.offsetX;
        this.mouse.y = event.offsetY;
        this.mouse.pressed = false;
      });

      this.canvas.addEventListener('mousemove', event => {
        if (this.mouse.pressed) {
          this.mouse.x = event.offsetX;
          this.mouse.y = event.offsetY;
        }
      });

      window.addEventListener('keydown', event => {
        if (event.key == 'D' || event.key == 'd') {
          this.debug = !this.debug;
        }
      });
    }

    render(context, deltaTime) {
      if (this.timer > this.interval) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        this.gameObjects = [
          this.player,
          ...this.eggs,
          ...this.obstacles,
          ...this.enemies,
          ...this.hatchlings,
          ...this.particles,
        ];

        // Sort by vertical position
        this.gameObjects.sort((lhs, rhs) => {
          return lhs.collisionY - rhs.collisionY;
        });

        // Animate the next frame
        this.gameObjects.forEach(object => {
          object.draw(context);
          object.update(deltaTime);
        });

        this.timer = 0;
      }

      this.timer += deltaTime;

      // Adds eggs periodically
      if (this.eggTimer > this.eggInterval && this.eggs.length < this.maximumNumberOfEggs) {
        this.addEgg();
        this.eggTimer = 0;
      } else {
        this.eggTimer += deltaTime;
      }

      // Draw status text
      context.save();
      context.textAlign = 'left';
      context.fillText('Score: ' + this.score, 25, 50);

      if (this.debug) {
        context.fillText('Lost Hatchlings: ' + this.lostHatchlings, 25, 100);
      }

      context.restore();
    }

    checkCollision(lhs, rhs) {
      const dx = lhs.collisionX - rhs.collisionX;
      const dy = lhs.collisionY - rhs.collisionY;
      const distance = Math.hypot(dy, dx);
      const sumOfRadii = lhs.collisionRadius + rhs.collisionRadius;
      return [distance < sumOfRadii, distance, sumOfRadii, dx, dy];
    }

    addEgg() {
      this.eggs.push(new Egg(this));
    }

    addEnemy() {
      this.enemies.push(new Enemy(this));
    }

    removeGameObjects() {
      this.eggs = this.eggs.filter(object => !object.markedForDeletion);
      this.hatchlings = this.hatchlings.filter(object => !object.markedForDeletion);
      this.particles = this.particles.filter(object => !object.markedForDeletion);
    }

    init() {
      for (let i = 0; i < 3; i++) {
        this.addEnemy();
      }

      // Brute force way to make sure no Obstacles do not overlap.
      let attempts = 0; // The attempts counter prevents an infinite loop because the upper bound is 500
      while (this.obstacles.length < this.numberOfObstacles && attempts < 500) {
        let testObstacle = new Obstacle(this);

        // The overlap flag
        let overlap = false;

        // Detects if there are any collisions between the previous obstacles
        this.obstacles.forEach(obstacle => {
          const dx = testObstacle.collisionX - obstacle.collisionX;
          const dy = testObstacle.collisionY - obstacle.collisionY;
          const distance = Math.hypot(dy, dx);
          const distanceBuffer = 100;
          const sumOfRadii = testObstacle.collisionRadius + obstacle.collisionRadius + distanceBuffer;

          if (distance < sumOfRadii) {
            overlap = true;
          }
        });

        const margin = testObstacle.collisionRadius * 3;
        if (
          !overlap &&
          testObstacle.spriteX > 0 &&
          testObstacle.spriteX < this.width - testObstacle.width &&
          testObstacle.collisionY > this.topMargin + margin &&
          testObstacle.collisionY < this.height - margin
        ) {
          this.obstacles.push(testObstacle);
        }

        ++attempts;
      }
    }
  }

  // Must be defined because it is called in the animation function
  const game = new Game(canvas);
  game.init();

  let lastTime = 0;

  /**
   * The Animate function
   */
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    game.render(context, deltaTime);
    requestAnimationFrame(animate);
  }

  animate(0);
});
