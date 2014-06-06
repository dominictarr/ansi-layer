var bresenham = require('bresenham')

function min(a, b) {
  if(null == a) return b
  if(null == b) return a
  return Math.min(a, b)
}

var Layer = module.exports = function (w, h) {
  w = w || 80
  h = h || 40
  var array = new Array(w*h), layer
  return layer = {
    put: function (ch, x, y) {
      array[c = x + y*w] = ch
      c++
    },
    width: w,
    height: h,
    cursor: function (x, y) {
      c = x+y*w
      return layer
    },
    write: function (word, opts) {
      var i = 0
      for(s in word) {
        if(word[s] === '\n')
          //by default,
          //a new line should wrap the
          //string to under where that string started.
          //usually, that is what you want.
          c += w - s
        else
          array[c++] = word[s]
      }
      return this
    },
    toString: function () {
      var s = ''
      var l = array.length
      for(var i = 0; i < l; i++) {
        s += array[i] || ' '
        if(!((i+1) % w))
          s += '\n'
      }
      return s
    },
    fill: function (ch, X, Y, W, H) {
      X = X || 0
      Y = Y || 0
      W = min(W, w - X) //so it can't go outside the bounds
      H = min(H, h - Y)
      var l = W*H
      c = X + Y*w
      while(l--) {
        array[c++] = ch
        if(!(l%W))
          c += w - W
      }
      return this
    },
    charAt: function (x, y) {
      return array[x + y*w]
    },
    move: function (x, y) {
      return layer.cursor(x, y)
    },
    line: function (ch, x, y) {
      //current position

      var _x = c % w
      var _y = (c - _x)/w

      bresenham(_x, _y, x, y, function (x, y) {
        layer.put(ch, x, y)
      })

      /*
      while(_x != x || _y != y) {
        this.move(_x, _y)
        this.put(ch, _x, _y)
        _x += x < _x ? -1 : x > _x ? 1 : 0
        _y += y < _y ? -1 : y > _y ? 1 : 0
      }
      */
      return this
    }
  }
}

function Combine (layers, w, h) {
  var layer = Layer(w, h)

  layer.charAt = function (x, y) {
    var c
    for(var l in layers)
      if(c = layers[l].charAt(x, y))
        return c
  }

  layer.flatten = function (x, y) {
    for(var i = 0; i < w; i++) {
      for(var j = 0; j < h; j++)
        layer.put(layer.charAt(i, j), i, j)
    }
    return this
  }

  var toString = layer.toString
  layer.toString = function (x, y) {
    layer.flatten()
    return toString.call(layer)
  }

  return layer
}


if(!module.parent) {
  require('ansi-recover')({cursor: false})

  var render = require('quickansi')(process.stdout)

  var w = process.stdout.columns - 10
  var h = process.stdout.rows - 10

  var l1 = Layer(w, h)
  var l2 = Layer(w, h)
  var l3 = Layer(w, h)

  function random () {
    l3.fill(' ')
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (v) {
      l3.put(v, ~~(Math.random()*w), ~~(Math.random()*h))
    })
  }

  var lines = '@#$%*+'.split('')
  function randomLine () {
    if(Math.random() < 0.1)
      l2.fill(undefined)
    l2.move(~~(Math.random()*w), ~~(Math.random()*h))
    l2.line(
      lines[~~(Math.random()*6)],
      ~~(Math.random()*w),
      ~~(Math.random()*h)
    )
  }

  l1.fill('+', 3, 3, 10, 10)
  l1.put('!', 5, 5)
  l1.put('\\', 6, 6)
  l1.put('?', 7, 7)
  l1.cursor(2, 8).write('hello,\nokay!')

  random()

  randomLine()

  var layers = Combine([l1, l2, l3], w, h)
  render(layers.flatten().toString())
  //render(l2.toString())
  setInterval(function () {
    random()
    randomLine()
    render(layers.flatten().toString())
  }, 500)
}
