'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

const listOfCapabilities = ['onoff.0', 'onoff.1', 'onoff.2', 'onoff.3'];
const deviceName = '3-gang';
const timeout = 200;

const triggerDeviceFlow = (node, capability, idx, result) => {
	console.log('trigger', capability, idx, result);
	if (node
		&& node.hasOwnProperty('state')
		&& node.state.hasOwnProperty(capability)) {
		Homey.manager('flow').triggerDevice(`${deviceName}_i${idx}_${result ? 'on' : 'off'}`, null, null, node.device_data);
		Homey.manager('flow').triggerDevice(`${deviceName}_i${idx}_switch`, null, null, node.device_data);
	}
	return true;
};
const setParser = value => ({
	'Target Value': (value > 0) ? 'on/enable' : 'off/disable',
	Duration: 'Instantly',
});

const onoffCapability = (id) => {
	console.log('onoffCap:', id);
	const onoff = {
		optional: true,
		command_class: 'COMMAND_CLASS_SWITCH_BINARY',
		command_get: 'SWITCH_BINARY_GET',
		command_set: 'SWITCH_BINARY_SET',
		command_set_parser: setParser,
		command_report: 'SWITCH_BINARY_REPORT',
		pollInterval: 'poll_interval',
	};
	if (id === 0) { // Basic switch for all groups
		onoff.command_report_parser = (report, node) => {
			const result = report['Current Value'] === 'on/enable'
				|| report['Current Value'] > 0;
			listOfCapabilities.map((feature, idx) => // Toggle every device
				triggerDeviceFlow(node, feature, idx, result));
			return result;
		};
	} else { // Multichannel groups present
		onoff.multiChannelNodeId = id;
		onoff.command_report_parser = (report, node) => {
			const result = report['Current Value'] === 'on/enable'
				|| report['Current Value'] > 0;
			triggerDeviceFlow(node, `onoff.${id}`, id, result);
			return result;
		};
		console.log(onoff);
	}
	return onoff;
};

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		'onoff.0': onoffCapability(0),
		'onoff.1': onoffCapability(1),
		'onoff.2': onoffCapability(2),
		'onoff.3': onoffCapability(3),
	},
});

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];
	const handleKeyReport = (ch, report) => {
		console.log('Handling report', node.device_data);
		const capability = `onoff.${ch}`;
		const value = report['Current Value'] > 0;
		module.exports.nodes[token].state[capability] = value;
		module.exports.realtime(node.device_data, capability, value);
	};

	if (node) {
		// MultiChannelNodes report processing
		if (node.instance.hasOwnProperty('MultiChannelNodes')
			&& node.instance.MultiChannelNodes !== 'undefined') {
			[1, 2, 3].map(ch => {
				if (node.instance.MultiChannelNodes.hasOwnProperty(ch)
					&& typeof node.instance.MultiChannelNodes[ch] !== 'undefined') {
					node.instance.MultiChannelNodes[ch]
						.CommandClass.COMMAND_CLASS_BASIC.on('report',
							(command, report) => (
								setTimeout(() => handleKeyReport(ch, report), timeout)
							)
						);
				}
				return true;
			});
		}

		// Basic Report
		node.instance.CommandClass.COMMAND_CLASS_BASIC.on('report', (command, report) => {
			console.log('Instance', node.instance);
			console.log('Command', command);
			console.log('State', node.state);
			if (command.name === 'BASIC_REPORT') {
				setTimeout(() => handleKeyReport(0, report), timeout);
			}
		});
	}
});

listOfCapabilities.map((feature, idx) => {
	['on', 'off'].map(newState => {
		Homey.manager('flow').on(`action.${deviceName}_turn_i${idx}_${newState}`,
			(callback, args) => {
				const node = module.exports.nodes[args.device.token];
				if (node
					&& node.hasOwnProperty('instance')
					&& node.instance.hasOwnProperty('CommandClass')) {

					const command = setParser(newState === 'on' ? 255 : 0);
					setTimeout(() => {
						if (idx === 0) { // Switch_All
							node.instance.CommandClass
								.COMMAND_CLASS_SWITCH_BINARY.SWITCH_BINARY_SET(command);
						} else { // MultiChannelNode
							node.instance.MultiChannelNodes[idx].CommandClass
								.COMMAND_CLASS_SWITCH_BINARY.SWITCH_BINARY_SET(command);
						}
					}, timeout);
				}
				callback(null, true);
			});
		return true;
	});

	Homey.manager('flow').on(`condition.${deviceName}_i${idx}`,
		(callback, args) => {
			console.log('Condition', args);
			const node = module.exports.nodes[args.device.token];

			if (node
				&& node.hasOwnProperty('state')
				&& node.state.hasOwnProperty(feature)) {
				callback(null, node.state[feature]);
			}
		});
	return true;
});
