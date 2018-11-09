const _ = require('lodash')
const { pipeline } = require('stream')
const LedMatrix = require('cd-rpi-rgb-led-matrix/index')
const { interpolateRgb } = require('d3-interpolate')
const { rgb } = require('d3-color')
const mic = require('mic')
const renderStream = require('audio-render')

// Extra library
const generate3PointGradient= (options) => {
  return _.times(
    options.canvas.width, (i) =>
      interpolateRgb(options.vertical.right, options.vertical.left)(i / options.canvas.width + options.vertical.offset)
  ).map((coloumColor) =>
    _.times(options.canvas.width / 2, (j) =>
      rgb(interpolateRgb(coloumColor, options.horizontal.right)(j * 2 / options.canvas.width + options.horizontal.offset))))
}

// DEFINITIONS
const matrixDefinition = {
  coloums: 32,
  rows: 32,
  birghtness: 70,
  panelsConnected:4,
  gpioMapper: 'adafruit-hat',
  pixelMapper: ''
}

const fftDefinition = {
  minDecibels: -100,
  maxDecibels: -30,
  resolution: 5
}

const gradientDefinition = {
  vertical: {
    right: "red",
    left: "white",
    offset: 0
  },
  horizontal: {
    right: "blue",
    offset: 0.45
  }
}

// INSTANTIATION
const matrix = new LedMatrix(
  matrixDefinition.coloums,
  matrixDefinition.rows,
  matrixDefinition.panelsConnected,
  1,
  matrixDefinition.brightness,
  matrixDefinition.gpioMapper,
  matrixDefinition.pixelMapper
)

const renderer = renderStream({
  canvas: matrix,
  channels: 1,
  fftSize: matrix.getWidth() * fftDefinition.resolution,
  frequencyBinCount: matrix.getWidth(),
  minDecibels: fftDefinition.minDecibels,
  maxDecibels: fftDefinition.maxDecibels
})

const microphone = mic({
  rate: 16000,
  channels: 1,
  device: 'default:CARD=Device'
})

const matrixColors = generate3PointGradient(
  _.extend(gradientDefinition, {
    canvas: {
      height: matrix.getHeight(),
      width: matrix.getWidth()
    }
  })
)

renderer.on('render', function (canvas) {
  const height =  canvas.getHeight() / 2 - 1
  const width = canvas.getWidth()

  canvas.clear()

  for (const [i, data] of this.getFrequencyData().entries()) {
    const decibels = ((data - renderer.minDecibels)/(renderer.maxDecibels - renderer.minDecibels)) * height;

    let j = 0;
    while (j < decibels) {
      const { r, g, b } = matrixColors[i % width][j % height]
      canvas.setPixel(i, j + height, r, g, b)
      canvas.setPixel(i, height - j, r, g, b)
      ++j
    }
  }

  canvas.update()
})

// TEARDOWN
process.on('exit', () => {
  matrix.clear()
  matrix.update()
})

// MAIN
pipeline(
  microphone.getAudioStream(),
  renderer
)

// RUN
microphone.start()
