'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

const timeout = 200;

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
			command_report_parser: report => (
				report['Current Value'] === 'on/enable'
				|| report['Current Value'] > 0),
			pollInterval: 'poll_interval',
		},
	}
});

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];
	const handleKeyReport = (report) => {
		console.log('Handling report', node.device_data);
		const capability = 'onoff';
		const value = report['Current Value'] > 0;
		module.exports.nodes[token].state[capability] = value;
		module.exports.realtime(node.device_data, capability, value);
	};

	if (node) {
		// Basic Report
		node.instance.CommandClass.COMMAND_CLASS_BASIC.on('report', (command, report) => {
			if (command.name === 'BASIC_REPORT') {
				setTimeout(() => handleKeyReport(report), timeout);
			}
		});
	}
});
