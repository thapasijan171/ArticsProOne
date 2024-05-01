
function round_button(fn, x, y, content, gap=10, text_size=30, border_radius = 10,
    border_thickness=3, font="Comic Sans MS", fill='#eee', text_color='white',
    fill_hover='#ccc', text_hover='#ddd', fill_down='#aaa', text_down='#bbb',
    border='black', text_border='black')
{
    this.fn = fn;
    this.x = x;
    this.y = y;
    this.content = content;
    this.gap = gap;
    this.text_size = text_size;
    this.border_radius = border_radius;
    this.border_thickness = border_thickness;
    this.font = font;
    this.fill = fill;
    this.text_color = text_color;
    this.fill_hover = fill_hover;
    this.text_hover = text_hover;
    this.fill_down = fill_down;
    this.text_down = text_down;
    this.border = border;
    this.text_border = text_border;

    this.intersect = function(x, y) {
      var retry = this.content
      var box_width = ctx.measureText(retry).width
      return (x >= this.x - box_width / 2 - this.gap &&
          x <= this.x - box_width / 2 + box_width + this.gap &&
          y >= this.y && y <= this.y + this.text_size + this.gap)
    }

    this.draw = function(elapsed) {
      ctx.textAlign = "center";
      ctx.font = this.text_size + "px " + this.font;
      var retry = this.content
      var box_width = ctx.measureText(retry).width

      temp_fill = this.fill
      temp_text_color = this.text_color

      if(this.intersect(mouse.x, mouse.y))
      {
          temp_fill = this.fill_hover
          temp_text_color = this.text_hover
          if(mouse.down) {
              temp_fill = this.fill_down
              temp_text_color = this.text_down
          }
      }
      ctx.fillStyle = temp_fill;
      fillRoundRect(this.x - box_width / 2 - this.gap, this.y,
          box_width + this.gap * 2, this.text_size + this.gap, this.border_radius)
      ctx.strokeStyle = this.border
      roundRect(this.x - box_width / 2 - this.gap, this.y,
          box_width + this.gap * 2, this.text_size + this.gap, this.border_radius, this.border_thickness)
      ctx.fillStyle = temp_text_color
      ctx.fillText(retry, this.x, this.y + this.text_size)
      ctx.strokeStyle = this.text_border
      ctx.lineWidth = 1
      ctx.strokeText(retry, this.x, this.y + this.text_size)
    }
}

//define function for line object
function line(x1, y1, x2, y2, thickness, color) {
  this.draw = function(elapsed) {
    //Draw death line
    ctx.strokeStyle = color
    ctx.lineWidth = thickness
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

//define a game manager
function manager(ball_shooter, game_grid)
{
  this.ball_shooter = ball_shooter
  this.game_grid = game_grid
  this.rows_added = 0
  this.color_marks = [3, 7, 12]
  this.reload = 0.5
  this.expand = 10
  this.min_expand = 7
  this.acceleration = 0.5
  this.wait = 0
  this.shots = 0
  this.lose = false
  this.win = false
  this.lose_height = 14
  this.cycle = false
  this.score = 0
  this.rows_to_victory = 100000
  this.pop_score_fn = function (pop) {return Math.floor(pop ** 1.5)}
  this.extra_score_fn = function (extra) {return extra}
  this.kill_frame = false

  this.prev_mouse_down = 0

  var death_height = (this.game_grid.ball_size + this.game_grid.gap) * (this.lose_height - 1) - game_grid.gap
  this.death_line = new line(0, death_height, game_width, death_height, 1, 'red')
  add_object(this.death_line, -1)

  this.fullscreen = function() {
      ball_shooter.delay_down = false
      this.kill_frame = true
      mouse.down = 0
      mouse.prev_down = 0
      fixed = !fixed;
      if(!(document.querySelector('meta[name="viewport"]'))) {
        var meta = document.createElement('meta')
        meta.name = 'viewport'
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
      if(fixed) {
        document.querySelector('meta[name="viewport"]').setAttribute("content",
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no");
      }
      else {
        document.querySelector('meta[name="viewport"]').setAttribute("content", "");
      }
      if( !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
        if(fixed) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
          } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
          }
        }
        else {
          if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
          } else {
            document.webkitCancelFullScreen();
          }
        }
      } else  {
        rescale()

      }
  }

  this.full_button = new round_button(this.fullscreen, game_width/2 + 75,
      game_height - 40, "full", gap=10, text_size=20, border_radius = 5)
  add_button(this.full_button, layer=-8)

  this.remove_self = function() {
    remove_object(this.death_line.id)
    remove_object(this.id)
    remove_button(this.full_button.id)
  }

  this.draw = function(elapsed) {
    if(this.kill_frame) {
      ball_shooter.delay_down = false
      this.kill_frame = false
      rescale()
    }

    //If a ball has been fired and is in motion
    if(this.ball_shooter.fired != null)
    {
      [hitGrid, loc] = this.game_grid.intersect_grid(this.ball_shooter.fired);
      //If ball has been added to the grid
      if(hitGrid)
      {
        var pop = this.game_grid.insert_ball(this.ball_shooter.fired, loc[0], loc[1])
        if (pop > 0)
        {
          //verify the grid after removing balls
          var extra = this.game_grid.verify_grid()

          this.score += this.pop_score_fn(pop) + this.extra_score_fn(extra);
        }

        this.shots += 1
        this.ball_shooter.fired = null;
        this.ball_shooter.load(get_color);
        this.cycle = true
      }
    }

    //reload the ball shooter if elapsed time
    if (this.cycle)
    {
      this.wait += elapsed;
      if (this.wait >= this.reload)
      {
        this.cycle = false;
        if(this.shots >= this.expand)
        {
          this.rows_added++
          this.shots = 0;
          this.expand -= this.acceleration;
          if (this.expand < this.min_expand) {
            this.expand = this.min_expand;
          }

          for(var index = 0;index < this.color_marks.length; index++)
          {
            if(this.rows_added == this.color_marks[index])
            {
              game_colors.push(add_colors[index])
            }
          }

          if (this.rows_to_victory > 0) {
            this.game_grid.add_row(get_color)
            this.rows_to_victory -= 1
          }
          else {
            add_colors = this.game_grid.get_all_colors()
          }
        }
        this.wait = 0
        if (game_grid.height() >= this.lose_height) {
          this.lose = true;
          this.ball_shooter.lost = true;
        }
        if (this.rows_to_victory == 0 && this.game_grid.size() == 0 ) {
          this.lose = true
          this.ball_shooter.lost = true;
          this.win = true
        }
      }
    }
    ctx.strokeStyle = 'black'

    if(this.lose) {
      if (this.win) {
        var scoreText = "Score: " + this.score
        ctx.font = "65px Comic Sans";
        var loseWidth = ctx.measureText("You Win").width
        ctx.font = "40px Comic Sans";
        var w = Math.max(loseWidth, ctx.measureText(scoreText).width)
        ctx.fillStyle = "#5874a0"
        ctx.globalAlpha = 0.88
        fillRoundRect(game_width / 2 - w / 2 - 10, game_height / 2 - 100, w + 20, 175, 10)
        ctx.globalAlpha = 1
        ctx.fillStyle = "black"
        roundRect(game_width / 2 - w / 2 - 10, game_height / 2 - 100, w + 20, 175, 10)
        ctx.lineWidth = 3
        ctx.font = "65px Comic Sans MS";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("You Win", game_width/2, game_height/2 - 25);
        ctx.strokeText("You Win", game_width/2, game_height/2 - 25);
        ctx.lineWidth = 2
        ctx.font = "40px Comic Sans";
        ctx.fillText(scoreText, game_width / 2, game_height/2 + 15)
        ctx.strokeText(scoreText, game_width / 2, game_height/2 + 15)

        if(draw_button(game_width / 2, game_height / 2 + 25, 'retry'))
        {
            reset();
        }
      }
      else {

        var scoreText = "Score: " + this.score
        ctx.font = "65px Comic Sans";
        var loseWidth = ctx.measureText("You Lose").width
        ctx.font = "40px Comic Sans";
        var w = Math.max(loseWidth, ctx.measureText(scoreText).width)
        ctx.fillStyle = "#5874a0"
        ctx.globalAlpha = 0.88
        fillRoundRect(game_width / 2 - w / 2 - 10, game_height / 2 - 100, w + 20, 175, 10)
        ctx.globalAlpha = 1
        ctx.fillStyle = "black"
        roundRect(game_width / 2 - w / 2 - 10, game_height / 2 - 100, w + 20, 175, 10)
        ctx.lineWidth = 3
        ctx.font = "65px Comic Sans";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("You Lose", game_width/2, game_height/2 - 25);
        ctx.strokeText("You Lose", game_width/2, game_height/2 - 25);
        ctx.lineWidth = 2
        ctx.font = "40px Comic Sans";
        ctx.fillText(scoreText, game_width / 2, game_height/2 + 15)
        ctx.strokeText(scoreText, game_width / 2, game_height/2 + 15)

        if(draw_button(game_width / 2, game_height / 2 + 25, 'retry'))
        {
            reset();
        }
      }
    }
    else {
      ctx.lineWidth = 1
      ctx.font = "25px Comic Sans MS";
      ctx.fillStyle = "white";
      ctx.textAlign = "left"
      var scoreText = "Score: " + this.score
      ctx.fillText(scoreText, game_width - ctx.measureText(scoreText).width - 10, game_height - 10)
      ctx.strokeText(scoreText, game_width - ctx.measureText(scoreText).width - 10, game_height - 10)
      if (this.rows_to_victory > 0) {
        var nextRow = "Next: " + Math.ceil(this.expand - this.shots)
        ctx.fillText(nextRow, 10, game_height - 10)
        ctx.strokeText(nextRow, 10, game_height - 10)
      }
    }
    this.prev_mouse_down = mouse.down
  }
}