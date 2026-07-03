class PlayerPet {
  constructor(petId, player) {
    this.petId = petId;
    this.x = player?.x || 0;
    this.y = player?.y || 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = player?.angle || 0;
    this.phase = Math.random() * Math.PI * 2;
    this.side = Math.random() < 0.5 ? -1 : 1;
  }

  update(player) {
    if (!player) return;
    const skin = window.JorPetSkins?.getPet?.(this.petId);
    const radius = window.JorPetSkins?.getPetRadius?.(player.radius) || Math.max(6, player.radius * 0.45);
    const motion = skin?.motion || '';
    const followDistance = player.radius + radius * (motion === 'float' ? 1.95 : 1.7);
    const sideOffset = radius * (motion === 'snap' ? 0.82 : 1.05) * this.side;
    const backX = Math.cos(player.angle + Math.PI);
    const backY = Math.sin(player.angle + Math.PI);
    const sideX = Math.cos(player.angle + Math.PI * 0.5);
    const sideY = Math.sin(player.angle + Math.PI * 0.5);
    const bob = motion === 'bounce' ? Math.abs(Math.sin(this.phase * 1.35)) * radius * 0.42 : motion === 'float' ? Math.sin(this.phase * 0.8) * radius * 0.32 : 0;
    const tx = player.x + backX * followDistance + sideX * sideOffset + sideX * bob;
    const ty = player.y + backY * followDistance + sideY * sideOffset + sideY * bob;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const baseCatchup = motion === 'snap' ? 0.095 : motion === 'float' ? 0.058 : motion === 'puff' || motion === 'chomp' ? 0.07 : 0.075;
    const catchup = Math.min(motion === 'snap' ? 0.28 : 0.22, baseCatchup + dist / Math.max(220, player.radius * 6));
    this.vx += dx * catchup * 0.12;
    this.vy += dy * catchup * 0.12;
    const friction = motion === 'float' ? 0.84 : motion === 'snap' ? 0.72 : 0.78;
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx;
    this.y += this.vy;
    if (dist > player.radius * 8 + 180) {
      this.x = tx;
      this.y = ty;
      this.vx = 0;
      this.vy = 0;
    }
    const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
    let diff = targetAngle - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += diff * (motion === 'float' ? 0.08 : motion === 'snap' ? 0.18 : 0.12);
    this.phase += (motion === 'snap' ? 0.105 : motion === 'float' ? 0.055 : 0.075) + Math.min(0.04, dist * 0.0008);
  }

  draw(player) {
    if (!player || !window.JorPetSkins?.drawPet) return;
    const radius = window.JorPetSkins.getPetRadius(player.radius);
    ctx.save();
    ctx.translate(this.x, this.y);
    window.JorPetSkins.drawPet(ctx, this.petId, radius, this.phase, this.angle);
    ctx.restore();
  }
}
