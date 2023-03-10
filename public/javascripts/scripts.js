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

'use strict'

window.addEventListener('load', function () {
  const canvas = document.getElementById('background-canvas')
  const context = canvas.getContext('2d')

  // Sets the size of the canvas background
  canvas.width = 1280
  canvas.height = 720

  // Overrides the context values
  context.lineWidth = 3
  context.fillStyle = 'white'
  context.strokeStyle = 'white'

  /**
   * The Player Class
   */
  class Player {
    constructor(game) {
      this.game = game
      this.collisionX = this.game.width * 0.5
      this.collisionY = this.game.height * 0.5
      this.collisionRadius = 30

      this.speedModifier = 5
      this.speedX = 0
      this.speedY = 0
      this.dx = 0
      this.dy = 0
    }

    draw(context) {
      context.beginPath()
      context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2)

      // Wraps the hit box to affect the transparency with globalAlpha
      // Only applies globalAlpha to the player, not the whole game
      context.save()
      context.globalAlpha = 0.5
      context.fill()
      context.restore()
      context.stroke()

      context.beginPath()
      context.moveTo(this.collisionX, this.collisionY)
      context.lineTo(this.game.mouse.x, this.game.mouse.y)
      context.stroke()
    }

    update() {
      this.dx = this.game.mouse.x - this.collisionX
      this.dy = this.game.mouse.y - this.collisionY
      const distance = Math.hypot(this.dy, this.dx)

      if (distance > this.speedModifier) {
        this.speedX = this.dx / distance || 0
        this.speedY = this.dy / distance || 0
      } else {
        this.speedX = 0
        this.speedY = 0
      }

      this.collisionX += this.speedX * this.speedModifier
      this.collisionY += this.speedY * this.speedModifier
    }
  }

  /**
   * The Game Class
   */
  class Game {
    constructor(canvas) {
      this.canvas = canvas
      this.width = this.canvas.width
      this.height = this.canvas.height
      this.player = new Player(this)

      // Mouse Controller Object
      this.mouse = {
        x: this.width * 0.5,
        y: this.height * 0.5,
        pressed: false,
      }

      // Mouse Event Listeners
      this.canvas.addEventListener('mousedown', (event) => {
        this.mouse.x = event.offsetX
        this.mouse.y = event.offsetY
        this.mouse.pressed = true
      })

      this.canvas.addEventListener('mouseup', (event) => {
        this.mouse.x = event.offsetX
        this.mouse.y = event.offsetY
        this.mouse.pressed = false
      })

      this.canvas.addEventListener('mousemove', (event) => {
        if (this.mouse.pressed) {
          this.mouse.x = event.offsetX
          this.mouse.y = event.offsetY
        }
      })
    }

    render(context) {
      this.player.draw(context)
      this.player.update()
    }
  }

  // Must be defined because 
  const game = new Game(canvas)

  /**
   * The Animate function
   */
  function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height)

    game.render(context)
    requestAnimationFrame(animate)
  }

  animate()
})
