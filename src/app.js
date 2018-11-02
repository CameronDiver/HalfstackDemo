const _ = require('lodash');
const panel = require('rpi-ws281x-native');

const ledCount = 8 * 32;
const pixelData = new Uint32Array(ledCount);

panel.init(ledCount);

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

setInterval(() => {

	let i = 0;
	_.times(ledCount, () => {
		pixelData[i] = 0x0;
		i += 1;
	});

	panel.render(pixelData);
}, 1000);
