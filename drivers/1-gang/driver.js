'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		onoff: {
			command_class: 'COMMAND_CLASS_SWITCH_BINARY',
			command_get: 'SWITCH_BINARY_GET',
			command_set: 'SWITCH_BINARY_SET',
			command_set_parser: value => ({
				'Target Value': (value > 0) ? 'on/enable' : 'off/disable',
				Duration: 'Instantly',
			}),
			command_report: 'SWITCH_BINARY_REPORT',
			command_report_parser: report => {
				console.log('[GDEBUG]');
				console.log(`Report JSON: ${JSON.stringify(report)}`);
				const result = report['Current Value'] === 'on/enable'
				|| report['Current Value'] > 0;
				console.log(`Result code: '${result}'`);
				console.log('[GDEBUG]');
				return result;
			},
			pollInterval: 'poll_interval',
		},
	},
	settings: {
		led_behaviour: {
			index: 1,
			size: 1,
		},
	},
});

// let singlePress = false;
let basicSet = false;

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];

	if (node) {
		console.log('Starting Node if');
		node.instance.CommandClass['COMMAND_CLASS_BASIC'].on('report', (command, report) => {
			// if (!report || !report.hasOwnProperty("Value") || !command || !command.hasOwnProperty("name")) return;
			console.log(JSON.stringify(node.state));
			console.log('Get some COMMAND_CLASS_BASIC');
			console.log(JSON.stringify(command));
			console.log(JSON.stringify(report));
			if (command.name === 'BASIC_REPORT') {
				console.log('Setting new state');
				// node.state.onoff = report['Current Value'] > 0;
				// console.log(JSON.stringify(node));
				setTimeout(() => {
					console.log('');
					console.log('Requesting SWITCH_BINARY_GET');
					node.instance.CommandClass.COMMAND_CLASS_SWITCH_BINARY.SWITCH_BINARY_GET();
				}, 200);
			}
		});
	}
});
		// Single press causes an applicationUpdate frame.
//		node.instance.on('applicationUpdate', () => {
			// Read out Binary Switch CC after 0,5 seconds on left button
//			setTimeout(() => {
//				if (basicSet === false) {
//					setTimeout(() => {
//						node.instance.CommandClass.COMMAND_CLASS_SWITCH_BINARY.SWITCH_BINARY_GET();
//					}, 400);
//				}
//			}, 100);
/*
// set singlePress for 200 mS
singlePress = true;
setTimeout( function() {
	singlePress = false;
}, 200);
});

// Trigger on BASIC_SET
node.instance.CommandClass['COMMAND_CLASS_BASIC'].on('report', (command, report) => {


if (command.name === "BASIC_SET") {

	// set basicSet for 200 mS
	basicSet = true;
	setTimeout( function() {
		basicSet = false;
	}, 200);

	// Single press registered
	if (singlePress === true) {
		// Trigger Single click on flow card
		if (report.Value === 255) {
			Homey.manager('flow').triggerDevice('TZ66D_s2_single_on', null, null, node.device_data);
		}

		// Trigger Sinlge click off flow card
		else
		if (report.Value === 0) {
			Homey.manager('flow').triggerDevice('TZ66D_s2_single_off', null, null, node.device_data);
		}
	}

	// Double press registered
	else
	if (singlePress === false) {
		// Trigger Double click on flow card
		if (report.Value === 255) {
			Homey.manager('flow').triggerDevice('TZ66D_s2_double_on', null, null, node.device_data);
		}

		// Trigger Double click off flow card
		else
		if (report.Value === 0) {
			Homey.manager('flow').triggerDevice('TZ66D_s2_double_off', null, null, node.device_data);
		}
	}
}

*/
		// });
//	}
// });
