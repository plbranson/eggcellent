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
  context.strokeStyle = 'white';

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
      this.spriteWidth = 255;
      this.spriteHeight = 255;

      this.width = this.spriteWidth;
      this.height = this.spriteHeight;

      this.frameX = 0;
      this.frameY;

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

      // Checks for collisions with obstacles
      this.game.obstacles.forEach(obstacle => {
        // [distance < sumOfRadii, distance, sumOfRadii, dx, dy]
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
      this.collisionRadius = 60;
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

  /**
   * The Game Class
   */
  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.topMargin = 260;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.player = new Player(this);

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
    }

    render(context) {
      this.obstacles.forEach(obstacle => obstacle.draw(context));
      this.player.draw(context);
      this.player.update();

      // // Renders the draw method for all the obstacles
      // this.obstacles.forEach(obstacle => obstacle.draw(context));
    }

    checkCollision(lhs, rhs) {
      const dx = lhs.collisionX - rhs.collisionX;
      const dy = lhs.collisionY - rhs.collisionY;
      const distance = Math.hypot(dy, dx);
      const sumOfRadii = lhs.collisionRadius + rhs.collisionRadius;
      return [distance < sumOfRadii, distance, sumOfRadii, dx, dy];
    }

    init() {
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

        const margin = testObstacle.collisionRadius * 2;
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

  /**
   * The Animate function
   */
  function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    game.render(context);
    requestAnimationFrame(animate);
  }

  animate();
});
