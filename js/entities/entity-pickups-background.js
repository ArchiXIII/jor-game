class Particle {
      constructor(x, y, radius, color, alpha = 1) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.alpha = alpha;
        this.vx = (Math.random() - 0.5) * 1.4;
        this.vy = (Math.random() - 0.5) * 1.4;
      }


      update() {
        this.x += this.vx;
        this.y += this.vy;

        const bounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 80);

        if (this.x < bounds.left - 20) this.x = bounds.right + 20;
        if (this.x > bounds.right + 20) this.x = bounds.left - 20;
        if (this.y < bounds.top - 20) this.y = bounds.bottom + 20;
        if (this.y > bounds.bottom + 20) this.y = bounds.top - 20;
      }



      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class BackgroundGlow {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseRadius = randomRange(120, 300);
        this.radiusX = this.baseRadius * randomRange(0.75, 1.45);
        this.radiusY = this.baseRadius * randomRange(0.5, 1.1);
        this.driftX = randomRange(-0.18, 0.18);
        this.driftY = randomRange(-0.12, 0.12);
        this.phase = Math.random() * Math.PI * 2;
        this.speed = randomRange(0.004, 0.014);
        this.alphaBase = randomRange(0.10, 0.20);
        this.alphaWave = randomRange(0.05, 0.12);
        this.hue = [165, 178, 192, 286, 304][Math.floor(Math.random() * 5)];
        this.sprite = this.createSprite();
      }

      createSprite() {
        const spriteRadiusX = Math.max(48, Math.round(this.radiusX / 24) * 24);
        const spriteRadiusY = Math.max(36, Math.round(this.radiusY / 24) * 24);
        const spriteRadius = Math.max(spriteRadiusX, spriteRadiusY);
        const pad = Math.ceil(spriteRadius * 0.42);
        const width = spriteRadiusX * 2 + pad * 2;
        const height = spriteRadiusY * 2 + pad * 2;
        const cx = width * 0.5;
        const cy = height * 0.5;
        const key = `bg-glow:${this.hue}:${spriteRadiusX}:${spriteRadiusY}`;

        return getCachedEffectSprite(key, width, height, (spriteCtx) => {
          const gradient = spriteCtx.createRadialGradient(cx, cy, 0, cx, cy, spriteRadius);
          gradient.addColorStop(0, `hsla(${this.hue}, 96%, 76%, 1)`);
          gradient.addColorStop(0.42, `hsla(${this.hue}, 94%, 68%, 0.72)`);
          gradient.addColorStop(0.76, `hsla(${this.hue}, 92%, 58%, 0.18)`);
          gradient.addColorStop(1, `hsla(${this.hue}, 90%, 55%, 0)`);

          spriteCtx.fillStyle = gradient;
          spriteCtx.beginPath();
          spriteCtx.ellipse(cx, cy, spriteRadiusX, spriteRadiusY, 0, 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.globalAlpha = 0.18;
          spriteCtx.fillStyle = gradient;
          spriteCtx.beginPath();
          spriteCtx.ellipse(cx, cy, spriteRadiusX * 1.06, spriteRadiusY * 1.06, 0, 0, Math.PI * 2);
          spriteCtx.fill();
          spriteCtx.globalAlpha = 1;
        });
      }

      update() {
        this.phase += this.speed;
        this.x += this.driftX;
        this.y += this.driftY;

        const bounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 260);

        if (this.x < bounds.left - this.radiusX) this.x = bounds.right + this.radiusX;
        if (this.x > bounds.right + this.radiusX) this.x = bounds.left - this.radiusX;
        if (this.y < bounds.top - this.radiusY) this.y = bounds.bottom + this.radiusY;
        if (this.y > bounds.bottom + this.radiusY) this.y = bounds.top - this.radiusY;
      }

      draw() {
        const alpha = this.alphaBase + Math.sin(this.phase) * this.alphaWave;
        const quality = typeof performanceQuality === 'number' ? performanceQuality : 1;
        const detail = typeof renderDetailScale === 'number' ? renderDetailScale : 1;
        const touchScale = typeof hasTouchControls === 'function' && hasTouchControls() ? 0.58 : 0.9;
        const alphaScale = touchScale * detail * clamp((quality - 0.55) / 0.45, 0.28, 1);
        if (alphaScale <= 0.04) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha) * alphaScale;
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.phase * 0.6) * 0.5);
        drawSpriteCentered(this.sprite, 0, 0);
        ctx.restore();
      }
    }

    class BackgroundBubble {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = randomRange(9, 28);
        this.vx = randomRange(-0.24, 0.24);
        this.vy = randomRange(-0.65, -0.18);
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = randomRange(0.01, 0.03);
        this.alpha = randomRange(0.14, 0.30);
        this.sprite = this.createSprite();
      }

      createSprite() {
        this.spriteRadius = Math.max(8, Math.round(this.radius / 4) * 4);
        const pad = Math.ceil(this.spriteRadius * 1.3);
        const size = this.spriteRadius * 2 + pad * 2;
        const c = size * 0.5;
        const key = `bg-bubble:${this.spriteRadius}`;

        return getCachedEffectSprite(key, size, size, (spriteCtx) => {
          spriteCtx.strokeStyle = 'rgba(225, 252, 255, 0.98)';
          spriteCtx.lineWidth = 1.4;
          spriteCtx.beginPath();
          spriteCtx.arc(c, c, this.spriteRadius, 0, Math.PI * 2);
          spriteCtx.stroke();

          spriteCtx.fillStyle = 'rgba(190, 255, 244, 0.22)';
          spriteCtx.beginPath();
          spriteCtx.arc(c, c, this.spriteRadius * 0.94, 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.globalAlpha = 0.22;
          spriteCtx.strokeStyle = 'rgba(180, 255, 245, 0.5)';
          spriteCtx.beginPath();
          spriteCtx.arc(c, c, this.spriteRadius * 1.06, 0, Math.PI * 2);
          spriteCtx.stroke();
          spriteCtx.globalAlpha = 1;

          spriteCtx.fillStyle = 'rgba(255,255,255,0.98)';
          spriteCtx.beginPath();
          spriteCtx.arc(c - this.spriteRadius * 0.28, c - this.spriteRadius * 0.34, Math.max(1.5, this.spriteRadius * 0.16), 0, Math.PI * 2);
          spriteCtx.fill();
        });
      }

      update() {
        this.phase += this.phaseSpeed;
        this.x += this.vx + Math.sin(this.phase) * 0.12;
        this.y += this.vy;

        const bounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 120);

        if (this.y < bounds.top - this.radius * 3) {
          this.y = bounds.bottom + this.radius * 3;
          this.x = randomRange(bounds.left, bounds.right);
        }

        if (this.x < bounds.left - this.radius * 2) this.x = bounds.right + this.radius * 2;
        if (this.x > bounds.right + this.radius * 2) this.x = bounds.left - this.radius * 2;
      }

      draw() {
        const wobble = 1 + Math.sin(this.phase) * 0.08;
        const size = this.sprite.width * (this.radius / this.spriteRadius) * wobble;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        drawSpriteCentered(this.sprite, this.x, this.y, size, size);
        ctx.restore();
      }
    }

    class BackgroundBloom {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = randomRange(28, 58);
        this.phase = Math.random() * Math.PI * 2;
        this.speed = randomRange(0.01, 0.026);
        this.alphaBase = randomRange(0.08, 0.18);
        this.alphaWave = randomRange(0.08, 0.16);
        this.vx = randomRange(-0.24, 0.24);
        this.vy = randomRange(-0.16, 0.16);
        this.sprite = this.createSprite();
      }

      createSprite() {
        this.spriteRadius = Math.max(24, Math.round(this.radius / 6) * 6);
        const pad = Math.ceil(this.spriteRadius * 1.5);
        const size = this.spriteRadius * 2 + pad * 2;
        const c = size * 0.5;
        const key = `bg-bloom:${this.spriteRadius}`;
        return getCachedEffectSprite(key, size, size, (spriteCtx) => {
          spriteCtx.fillStyle = 'rgba(168, 255, 248, 0.96)';
          spriteCtx.beginPath();
          spriteCtx.arc(c, c, this.spriteRadius, 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.globalAlpha = 0.22;
          spriteCtx.fillStyle = 'rgba(170, 255, 245, 0.85)';
          spriteCtx.beginPath();
          spriteCtx.arc(c, c, this.spriteRadius * 1.12, 0, Math.PI * 2);
          spriteCtx.fill();
          spriteCtx.globalAlpha = 1;
        });
      }

      update() {
        this.phase += this.speed;
        this.x += this.vx;
        this.y += this.vy;

        const bounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 90);

        if (this.x < bounds.left - this.radius * 2) this.x = bounds.right + this.radius * 2;
        if (this.x > bounds.right + this.radius * 2) this.x = bounds.left - this.radius * 2;
        if (this.y < bounds.top - this.radius * 2) this.y = bounds.bottom + this.radius * 2;
        if (this.y > bounds.bottom + this.radius * 2) this.y = bounds.top - this.radius * 2;
      }

      draw() {
        const alpha = this.alphaBase + (Math.sin(this.phase) * 0.5 + 0.5) * this.alphaWave;
        const quality = typeof performanceQuality === 'number' ? performanceQuality : 1;
        const detail = typeof renderDetailScale === 'number' ? renderDetailScale : 1;
        const touchScale = typeof hasTouchControls === 'function' && hasTouchControls() ? 0.34 : 0.72;
        const alphaScale = touchScale * detail * clamp((quality - 0.62) / 0.38, 0, 1);
        if (alphaScale <= 0.035) return;
        const radius = this.radius * (0.88 + Math.sin(this.phase * 1.3) * 0.08);
        const size = this.sprite.width * (radius / this.spriteRadius);

        ctx.save();
        ctx.globalAlpha = alpha * alphaScale;
        drawSpriteCentered(this.sprite, this.x, this.y, size, size);
        ctx.restore();
      }
    }

    class Food {
      constructor(options = {}) {
        const spawn = randomWorldPosition(24);
        this.x = spawn.x;
        this.y = spawn.y;
        this.radius = 4 + Math.random() * 3;
        this.pulse = Math.random() * Math.PI * 2;
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = randomRange(-0.02, 0.02);
        this.variant = Math.floor(Math.random() * 4);
        this.tintIndex = Math.floor(Math.random() * FOOD_TINT_SETS.length);
        if (!options.deferSprite) {
          const baked = getBakedFoodSprite(this.radius, this.variant, this.tintIndex);
          this.sprite = baked.sprite;
          this.spriteBaseRadius = baked.spriteRadius;
        }
      }

      createSprite() {
        const baked = getBakedFoodSprite(this.radius, this.variant, this.tintIndex);
        this.spriteBaseRadius = baked.spriteRadius;
        return baked.sprite;
      }

      update() {
        this.pulse += 0.05;
        this.spin += this.spinSpeed;
      }

      draw() {
        const radius = this.radius + Math.sin(this.pulse) * 0.7;
        if (!this.sprite) {
          ctx.save();
          ctx.fillStyle = 'rgba(106, 242, 164, 0.84)';
          ctx.beginPath();
          ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }
        const size = this.sprite.width * (radius / Math.max(0.001, this.spriteBaseRadius ?? this.radius));
        ctx.save();
        if (typeof this.fadeOut === 'number') {
          ctx.globalAlpha *= clamp(this.fadeOut, 0, 1);
        }
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin + Math.sin(this.pulse * 0.8) * 0.08);
        drawSpriteCentered(this.sprite, 0, 0, size, size);
        ctx.restore();
      }
    }

    class ShardFood extends Food {
      constructor(x, y) {
        super({ deferSprite: true });
        this.x = x + (Math.random() - 0.5) * 26;
        this.y = y + (Math.random() - 0.5) * 26;
        this.radius = 2.4 + Math.random() * 1.8;
        this.vx = (Math.random() - 0.5) * 2.8;
        this.vy = (Math.random() - 0.5) * 2.8;
        this.life = 500 + Math.random() * 180;
        this.spinSpeed = randomRange(-0.035, 0.035);
        this.variant = Math.floor(Math.random() * 3) + 1;
        this.tintIndex = Math.floor(Math.random() * SHARD_FOOD_TINT_SETS.length);
        const baked = getBakedFoodSprite(this.radius, this.variant, this.tintIndex, true);
        this.sprite = baked.sprite;
        this.spriteBaseRadius = baked.spriteRadius;
      }

      update() {
        super.update();
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.985;
        this.vy *= 0.985;
        this.life -= 1;
      }

      draw() {
        const radius = this.radius + Math.sin(this.pulse) * 0.35;
        const size = this.sprite.width * (radius / Math.max(0.001, this.spriteBaseRadius ?? this.radius));
        drawSpriteCentered(this.sprite, this.x, this.y, size, size);
      }
    }


    class TomatoFood {
      constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.radius = options.radius || 11;
        this.pulse = Math.random() * Math.PI * 2;
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = randomRange(-0.018, 0.018);
        if (!options.deferSprite) {
          const baked = this.createSprite();
          this.sprite = baked;
        }
      }

      createSprite() {
        const spriteRadius = 18;
        const size = 58;
        const c = size * 0.5;
        return getCachedEffectSprite('tomato-food:v1', size, size, (spriteCtx) => {
          spriteCtx.save();
          const glow = spriteCtx.createRadialGradient(c, c, 0, c, c, 25);
          glow.addColorStop(0, 'rgba(255,118,70,0.38)');
          glow.addColorStop(0.58, 'rgba(255,62,42,0.16)');
          glow.addColorStop(1, 'rgba(255,62,42,0)');
          spriteCtx.fillStyle = glow;
          spriteCtx.beginPath();
          spriteCtx.arc(c, c, 25, 0, Math.PI * 2);
          spriteCtx.fill();

          const body = spriteCtx.createRadialGradient(c - 6, c - 8, 2, c, c, spriteRadius);
          body.addColorStop(0, '#ffb05f');
          body.addColorStop(0.22, '#ff4f32');
          body.addColorStop(0.74, '#e71922');
          body.addColorStop(1, '#980713');
          spriteCtx.fillStyle = body;
          spriteCtx.beginPath();
          spriteCtx.ellipse(c + 1, c + 3, 15.8, 16.6, -0.18, 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.strokeStyle = 'rgba(255,245,220,0.65)';
          spriteCtx.lineWidth = 1.2;
          spriteCtx.beginPath();
          spriteCtx.ellipse(c + 1, c + 3, 15.8, 16.6, -0.18, 0, Math.PI * 2);
          spriteCtx.stroke();

          spriteCtx.fillStyle = 'rgba(255,255,255,0.86)';
          spriteCtx.beginPath();
          spriteCtx.ellipse(c + 7, c - 7, 5.3, 3.8, -0.55, 0, Math.PI * 2);
          spriteCtx.fill();

          const leafGradient = spriteCtx.createLinearGradient(c - 10, c - 19, c + 9, c - 8);
          leafGradient.addColorStop(0, '#baff7d');
          leafGradient.addColorStop(0.45, '#38d866');
          leafGradient.addColorStop(1, '#087d3c');
          spriteCtx.fillStyle = leafGradient;
          const leaves = [
            [-0.1, -10, -23, 0.48],
            [0.6, 2, -22, 0.45],
            [-0.9, -5, -17, 0.42],
            [1.25, 8, -16, 0.38]
          ];
          for (let i = 0; i < leaves.length; i++) {
            const leaf = leaves[i];
            spriteCtx.save();
            spriteCtx.translate(c - 1, c - 10);
            spriteCtx.rotate(leaf[0]);
            spriteCtx.beginPath();
            spriteCtx.moveTo(0, 0);
            spriteCtx.quadraticCurveTo(leaf[1] * 0.35, leaf[2] * 0.35, leaf[1], leaf[2]);
            spriteCtx.quadraticCurveTo(leaf[1] * leaf[3], leaf[2] * 0.62, 0, 0);
            spriteCtx.fill();
            spriteCtx.restore();
          }

          spriteCtx.fillStyle = '#ffe27a';
          spriteCtx.beginPath();
          spriteCtx.arc(c - 1, c - 10, 2.4, 0, Math.PI * 2);
          spriteCtx.fill();
          spriteCtx.restore();
        });
      }

      update() {
        this.pulse += 0.07;
        this.spin += this.spinSpeed;
      }

      draw() {
        if (!this.sprite) this.sprite = this.createSprite();
        const pulseScale = 1 + Math.sin(this.pulse) * 0.08;
        const size = this.sprite.width * (this.radius / 18) * pulseScale;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin + Math.sin(this.pulse * 0.7) * 0.06);
        drawSpriteCentered(this.sprite, 0, 0, size, size);
        ctx.restore();
      }
    }
    class DNAOrb {
      constructor(x, y, radius = 6, options = {}) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.pulse = Math.random() * Math.PI * 2;
        if (!options.deferSprite) {
          const baked = getBakedDnaOrbSprite(this.radius);
          this.sprite = baked.sprite;
          this.spriteBaseRadius = baked.spriteRadius;
        }
      }

      createSprite(fillColor, glowColor, highlight = false) {
        const baked = getBakedDnaOrbSprite(this.radius);
        this.spriteBaseRadius = baked.spriteRadius;
        return baked.sprite;
      }

      update() {
        this.pulse += 0.08;
      }

      draw() {
        const radius = this.radius + Math.sin(this.pulse) * 1;
        if (!this.sprite) {
          ctx.save();
          ctx.fillStyle = 'rgba(82, 216, 255, 0.86)';
          ctx.beginPath();
          ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }
        const size = this.sprite.width * (radius / Math.max(0.001, this.spriteBaseRadius ?? this.radius));
        drawSpriteCentered(this.sprite, this.x, this.y, size, size);
      }
    }
