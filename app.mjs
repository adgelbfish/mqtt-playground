import mqtt from "mqtt"
import "dotenv/config"

import {client as mqttClient} from "./mqttClient.mjs";
import {HvacDevice} from "./hvacDevice.mjs";
import {MitsubishiController} from "./mitsubishiController.mjs";

console.log("starting")
/*

/!*mqttClient.subscribe("/#", (topic, message) => {
    console.log({topic, message})
})
mqttClient.subscribe("homeassistant/#", (topic, message) => {
    console.log({topic, message})
})
mqttClient.subscribe("mitsubishi/#", (topic, message) => {
    console.log({topic, message})
})*!/
// mqttClient.subscribe("mitsubishi/testobject001/mode/set", (topic, message) => {
//     console.log({topic, message})
// }).then("subscribed to mitsubishi testobject set")

// const tPrefix = "mitsubishi/testobject001/"

// mqttClient.send("homeassistant/climate/testnode001/testobject001/config",{})

// mqttClient.send("homeassistant/climate/testnode001/testobject001/config", {
//     // availability_topic: "mitsubishi/testobject001/availability",
//     current_temperature_topic: "mitsubishi/testobject001/current_temperature",
//     device: {
//         model: "HVAC",
//         manufacturer: "Mitsubishi HVAC Java Connector",
//         identifiers: "mitsubishi_hvac_controller_01_node_001_testobject001",
//         name: "Test 001 mitsubishi device"
//     },
//     fan_mode_command_topic: tPrefix + "fan_mode/set",
//     fan_mode_state_topic: tPrefix + "fan_mode/state",
//     fan_modes: ["auto", "low", "med", "high", "custom"],
//     initial: 71,
//     icon: "mdi:climate_mini_split",
//     max_temp: 85,
//     min_temp: 55,
//     mode_command_topic: "mitsubishi/testobject001/mode/set",
//     mode_state_topic: tPrefix + "mode/state",
//     modes: ["auto", "off", "cool", "heat", "dry", "fan_only", "heat_cool"],
//     name: "Test Mitsubishi Object 001",
//     object_id: "mits_hvac" + "_node001" + "_ctrlr01" + "_testobject001",
//     optimistic: true,
//     power_command_topic: tPrefix + "power/set",
//     precision: 0.1,
//     swing_mode_command_topic: tPrefix + "swing_mode/set",
//     swing_mode_state_topic: tPrefix + "swing_mode/state",
//     swing_modes: ["vertical", "mid-vertical", "mid-horizontal", "horizontal", "swing"],
//     temperature_command_topic: tPrefix + "temperature/set",
//     temperature_state_topic: tPrefix + "temperature/state",
//     temperature_high_command_topic: tPrefix + "temperature_high/set",
//     temperature_high_state_topic: tPrefix + "temperature_high/state",
//     temperature_low_command_topic: tPrefix + "temperature_low/set",
//     temperature_low_state_topic: tPrefix + "temperature_low/state",
//     temperature_unit: "F",
//     temp_step: 1,
//     unique_id: "mitsubishi_hvac_controller_01_node_001_testobject001",
//     origin: {
//         name: "Mitsubishi HVAC MQTT Interface",
//         sw_version: "0.0.0-alpha",
//         // support_url: "mailto:adg@adgelb.fish"
//     },
// }, {retain: true})
*/
const controller = new MitsubishiController(process.env.MITSUBISHI_HOST)
await controller.init()

const devices = []

for (let group of Object.keys(controller.data.groupData)) {
    devices.push(new HvacDevice(controller, group, mqttClient))
}
// new HvacDevice(controller, "test12345678", mqttClient)

