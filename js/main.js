$(document).ready(function () {
  //background

  var width, height, wrapper, canvas, ctx, target, inView = true;
  var points = [];
  var targetTween;

  var animatingTarget;

  var peakWidth = 0;
  var peakHeight = 0;

  var pointOffset = 64;

  // Main
  initCanvas();

  addListeners();

  function initCanvas() {
    wrapper = document.getElementById('wrapper');

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    resize();
  }

  function makeGrid() {
    //clean grid
    // remove tweens
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      p.circle.destroy();
      p.circle = null;
      p.closest = null;
      TweenLite.killTweensOf(p);
      p = null;
    }

    // arrange points
    points = [];
    for (var x = 0; x < width; x = x + pointOffset) {
      for (var y = 0; y < height; y = y + pointOffset) {
        var px = x + Math.random() * pointOffset;
        var py = y + Math.random() * pointOffset;
        var point = new Point(px, py, px, py);
        points.push(point);
      }
    }

    // for each point find the 5 closest points
    for (var i = 0; i < points.length; i++) {
      var p1 = points[i];
      for (var j = 0; j < points.length; j++) {
        var p2 = points[j];
        if (!(p1 == p2)) {
          var placed = false;
          for (var k = 0; k < 5; k++) {
            if (!placed) {
              if (p1.closest[k] == undefined) {
                p1.closest[k] = p2;
                placed = true;
              }
            }
          }

          for (var k = 0; k < 5; k++) {
            if (!placed) {
              if (getDistance(p1, p2) < getDistance(p1, p1.closest[k])) {
                p1.closest[k] = p2;
                placed = true;
              }
            }
          }
        }
      }
    }
    initAnimation();
  }

  // Event handling
  function addListeners() {
    window.addEventListener('scroll', scrollCheck);
    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);
  }

  function mouseMove(e) {
    var posx = posy = 0;
    if (e.pageX || e.pageY) {
      posx = e.pageX - wrapper.offsetLeft;
      posy = e.pageY - wrapper.offsetTop;
    }
    target.x = posx;
    target.y = posy;
  }

  function scrollCheck() {
    //if(document.body.scrollTop > height) inView = false;
    //else animate = true;
    inView = true;
  }

  function resize() {
    width = wrapper.offsetWidth;
    height = wrapper.offsetHeight;
    target = { x: width / 2, y: height / 2 };
    peakWidth = Math.max(width, peakWidth);
    peakHeight = Math.max(width, peakHeight);

    canvas.width = width;
    canvas.height = height;

    makeGrid();
    if (width < 768) {
      wrapper.removeEventListener('mousemove', mouseMove);
      animatingTarget = true;
      animateTarget();
    }
    else {
      if (targetTween) {
        targetTween.kill();
        targetTween = null;
      }
      wrapper.addEventListener('mousemove', mouseMove);
      animatingTarget = false;
    }
  }

  function animateTarget() {
    if (animatingTarget) {
      var bodyScrollTop = document.body.scrollTop;
      var viewportHeight = window.innerHeight;
      var sectionY = wrapper.offsetTop;
      var offsetTop = bodyScrollTop - sectionY;

      var minY = offsetTop + pointOffset;
      var maxY = offsetTop + viewportHeight - pointOffset;

      var randomX = Math.random() * width;
      var randomY = Math.random() * height;

      if (randomY < minY) {
        randomY = minY;
      }
      else if (randomY > maxY) {
        randomY = maxY;
      }

      targetTween = TweenLite.to(target, 1, { x: randomX, y: randomY, onComplete: animateTarget });
    }
  }

  // animation
  function initAnimation() {
    animate();
    //for (var i in points) {
    //  shiftPoint(points[i]);
    //}
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var numPoints = points.length;
    for (var i = 0; i < numPoints; i++) {
      var point = points[i];
      var distance = Math.abs(getDistance(target, point));

      //var alpha = 1 / (distance * 100 / maxDistance);
      //if(alpha < 0.1){
      //  alpha = 0;
      //}

      //point.active = point.circle.active = alpha;

      //detect points in range
      if (distance < 4000) {
        point.active = 0.4;
        point.circle.active = 0.6;
      } else if (distance < 20000) {
        point.active = 0.1;
        point.circle.active = 0.3;
      } else if (distance < 40000) {
        point.active = 0.02;
        point.circle.active = 0.1;
      } else {
        point.active = 0;
        point.circle.active = 0;
      }
      if (point.active > 0 && !point.animating) {
        shiftPoint(point);
      }
      point.draw();
    }
    requestAnimationFrame(animate);
  }

  function shiftPoint(p) {
    p.animating = true;
    TweenLite.to(p, 1 + Math.random(), {
      x: p.originX - 50 + Math.random() * 100,
      y: p.originY - 50 + Math.random() * 100, ease: Circ.easeInOut,
      onComplete: function () {
        p.animating = false;
      }
    });
  }

  function Circle(rad, color) {
    var _this = this;

    // constructor
    (function () {
      _this.radius = rad || null;
      _this.color = color || null;
    })();

    this.destroy = function () {
      _this.radius = null;
      _this.color = null;
    }
  }

  function Point(x, y, originX, originY) {
    var _this = this;

    // constructor
    (function () {
      _this.animating = false;
      _this.active = 0;
      _this.x = x || null;
      _this.y = y || null;
      _this.originX = originX || null;
      _this.originY = originY || null;
      _this.closest = [];
      _this.circle = new Circle(2 + Math.random() * 2, 'rgba(255,255,255,0.3)')
    })();

    this.draw = function () {
      if (!_this.active) return;
      //lines
      var numPoints = _this.closest.length;
      for (var i = 0; i < numPoints; i++) {
        var point = _this.closest[i];
        ctx.beginPath();
        ctx.moveTo(_this.x, _this.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = 'rgba(74,246,38,' + _this.active + ')';
        ctx.stroke();
      }
      //circle
      ctx.beginPath();
      ctx.arc(_this.x, _this.y, _this.circle.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(74,246,38,' + _this.circle.active + ')';
      ctx.fill();
    };

  }

  // Util
  function getDistance(p1, p2) {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  }
});