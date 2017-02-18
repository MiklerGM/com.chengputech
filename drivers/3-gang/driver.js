'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	optional: true,
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
	}
});

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];

	if (node) {
		node.instance.CommandClass['COMMAND_CLASS_BASIC'].on('report', (command, report) => {
			if (command.name === 'BASIC_REPORT') {
				// node.state.onoff = report['Current Value'] > 0;
				setTimeout(() => {
					node.instance.CommandClass.COMMAND_CLASS_SWITCH_BINARY.SWITCH_BINARY_GET();
				}, 200);
			}
		});
	}
});
