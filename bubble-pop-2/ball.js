

var left = 0
var right = 480

//function to make a ball
function ball(x_start, y_start, color, speedx, speedy, radius)
{
   //Save values for ball
   this.x = x_start
   this.y = y_start
   this.speedx = speedx
   this.speedy = speedy
   this.color = color
   this.radius = radius
   this.dying = false;
   this.time = 0;
   this.death_timer = 0;
   this.full = this.radius;
   this.arc = Math.PI * 2;

   //Check if two circles intersect
   this.intersect = function (circle)
   {
       dx = this.x - circle.x
       dy = this.y - circle.y
       rsum = this.radius + circle.radius
       return dx * dx + dy * dy <= rsum * rsum
   }

   this.die = function(time, fall_speed = 0)
   {
       this.dying = true;
       this.death_timer = time;
       this.time = time;
       this.speedy = fall_speed;
   }

   this.is_dead = function ()
   {
     return this.dying && this.time <= 0
   }

   this.draw = function (elapsed)
   {
       if (this.dying) {
           this.time -= elapsed;
           this.radius = Math.max(0, this.full * this.time / this.death_timer);

           if(this.time <= 0) {
               remove_object(this.id)
               return
           }
       }

       //Calculate movement across the x and y axis
       var dx = this.speedx * elapsed
       var dy = this.speedy * elapsed

       //If ball goes off the screen switch direction.
       if (dx + this.x + this.radius / 2 > right - this.radius ||
               dx + this.x - this.radius / 2 < this.radius + left) {
           this.speedx = -this.speedx
           dx = -dx
       }

       //Move object based on dx and dy
       this.x += dx
       this.y += dy

       //Draw ball at its current location
       ctx.beginPath()
       ctx.arc(this.x, this.y, this.radius, 0, this.arc)
       ctx.fillStyle = this.color
       ctx.fill()
       ctx.closePath()
   }
}