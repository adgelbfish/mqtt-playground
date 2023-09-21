import crypto from "crypto"

const COMMAND = "command"
const STATE = "state"
export const node = "node001"

export class HvacDevice {
    constructor(mitsubishiController, deviceId, mqttClient) {
        this.controller = mitsubishiController
        this._mqtt_client = mqttClient
        this.mitsubishiGroupId = deviceId
        this.controllerPrefix = mitsubishiController.prefix
        this.controllerObjectidPrefix = mitsubishiController.object_id_prefix
        this.available = true
        this.model = "HVAC"
        this.manufacturer = "Mitsubishi HVAC Java Connector"
        this.identifier = crypto.createHash("md5").update(mitsubishiController.id + deviceId).digest("hex")
        this.device_name = "mitsubishi " + mitsubishiController.data.groupData[deviceId].name
        this.fan_modes = this.controller.data.groupData[deviceId].available_fan_speeds
        this.initial_set_temp = this.controller.data.groupData[deviceId].set_temp_fahrenheit
        this.icon = "mdi:climate_mini_split"
        this.max_temp = 85
        this.min_temp = 55
        this.modes = mitsubishiController.data.groupData[deviceId].available_modes_homeassistant
        // this.modes = ["heat_cool", "off", "cool", "heat", "dry", "fan_only"]
        this.name = mitsubishiController.data.groupData[deviceId].name
        this.objectId = "mits_hvac_" + mitsubishiController.id +  deviceId
        this.optimistic = false
        this.precision = 0.1
        this.swing_modes = this.controller.data.groupData[deviceId].available_air_directions
        this.temperature_unit = "F"
        this.temp_step = 1
        this.unique_id = this.identifier
        this.origin_name = "Mitsubishi HVAC MQTT Interface"
        this.origin_sw_version = "0.0.0-alpha"
        this._update_fields = ["availability", "power", "current_temperature", "fan_mode", "mode", "swing_mode", "temperature", "temperature_high", "temperature_low"]
        // this.localDB = {
        //     availability: "online",
        //     power: "ON",
        //     current_temperature: "71.1",
        //     fan_mode: "high",
        //     mode: "fan",
        //     swing_mode: "vertical",
        //     temperature: 70,
        //     temperature_high:75,
        //     temperature_low:65
        // }

        this.temperature_range = false //this.localDB["mode"] === "heat_cool"

        this._state_updates_map = {
            availability: () => this.get_availability(),
            current_temperature: () => this.get_current_temperature(),
            fan_mode: () => this.get_current_fan_mode(),
            mode: () => this.get_current_mode(),
            swing_mode: () => this.get_current_swing_mode(),
            temperature: () => this.get_current_temperature_setting(),
            temperature_high: () => this.get_current_temperature_high_setting(),
            temperature_low: () => this.get_current_temperature_low_setting(),
        }
        this._receive_commands_map = {
            power: (data) => this.set_power(data),
            fan_mode: (data) => this.set_fan_mode(data),
            mode: (data) => this.set_mode(data),
            swing_mode: (data) => this.set_swing_mode(data),
            temperature: (data) => this.set_temperature(data),
            temperature_high: (data) => this.set_temperature_high(data),
            temperature_low: (data) => this.set_temperature_low(data),
        }
        this.setup_listeners()

        this.send_config()

        this.send_all_updates()

        setInterval(() => this.send_all_updates(), 10 * 1000)
    }


    async set_power(data) {
        await this.controller.setDrive(this.mitsubishiGroupId, data)
        this.send_all_updates()
    }

    async set_mode(data) {
        // this.localDB["mode"] = data
        // this.temperature_range = this.localDB["mode"] === "heat_cool"
        await this.controller.setModeHomeAssistant(this.mitsubishiGroupId, data)

        this.send_config()
        this.send_update("mode")
        this.send_all_updates()
    }

    async set_swing_mode(data) {
        await this.controller.setAirDirection(this.mitsubishiGroupId, data)
        // this.localDB["swing_mode"] = data
        this.send_update("swing_mode")
        this.send_all_updates()
    }

    async set_temperature(data) {
        await this.controller.setTemperature(this.mitsubishiGroupId, data)
        this.send_update("temperature")
        this.send_all_updates()
    }

    set_temperature_high(data) {
        this.localDB["temperature_high"] = data
        this.send_update("temperature_high")
    }

    set_temperature_low(data) {
        this.localDB["temperature_low"] = data
        this.send_update("temperature_low")
    }

    async set_fan_mode(data) {
        await this.controller.setFanMode(this.mitsubishiGroupId, data)

        // this.localDB["fan_mode"] = data
        this.send_update("fan_mode")
    }

    get_availability() {
        return "online"
    }

    get_current_temperature() {
        return this.controller.data.groupData[this.mitsubishiGroupId].inlet_temp_fahrenheit
    }

    get_current_fan_mode() {
        return this.controller.data.groupData[this.mitsubishiGroupId].fromBulk.fan_speed
        // return this.localDB["fan_mode"]
    }

    get_current_mode() {
        return this.controller.data.groupData[this.mitsubishiGroupId].current_mode_homeassistant

        // return this.localDB["mode"]
    }

    get_current_swing_mode() {
        return this.controller.data.groupData[this.mitsubishiGroupId].fromBulk.air_direction

        // return this.localDB["swing_mode"]
    }

    get_current_temperature_setting() {
        return this.controller.data.groupData[this.mitsubishiGroupId].set_temp_fahrenheit

        // return this.localDB["temperature"]
    }

    get_current_temperature_high_setting() {
        return 77//this.localDB["temperature_high"]
    }

    get_current_temperature_low_setting() {
        return 66//this.localDB["temperature_low"]
    }

    setup_listeners() {
        for (let field of Object.keys(this._receive_commands_map)) {
            let topic = this._get_topic(field, COMMAND)
            this._mqtt_client.subscribe(topic, (topic, data) => this._receive_commands_map[field](data))
        }
    }

    send_update(field) {
        if (field in this._state_updates_map) {
            let value = this._state_updates_map[field]()
            let topic = this._get_topic(field, STATE)
            // console.log({field, value})
            this._mqtt_client.send(topic, value.toString())
        }
    }

    send_all_updates() {
        for (let field of Object.keys(this._state_updates_map)) {
            this.send_update(field)
        }
    }

    _get_topic(method, command_or_state) {
        return this.controllerPrefix + `${this.unique_id}/${method}/${command_or_state === COMMAND ? "set" : "state"}`
    }

    get_discovery_topic() {
        return "homeassistant/climate/" + node + "/" + this.unique_id + "/config"
    }

    _generate_config() {
        let additionalConfig = {
            availability_topic: "availability" in this._state_updates_map ? this._get_topic("availability", STATE) : undefined,
            fan_mode_command_topic: "fan_mode" in this._receive_commands_map ? this._get_topic("fan_mode", COMMAND) : undefined,
            fan_mode_state_topic: "fan_mode" in this._state_updates_map ? this._get_topic("fan_mode", STATE) : undefined,
            mode_command_topic: "mode" in this._receive_commands_map ? this._get_topic("mode", COMMAND) : undefined,
            mode_state_topic: "mode" in this._state_updates_map ? this._get_topic("mode", STATE) : undefined,
            power_command_topic: "power" in this._receive_commands_map ? this._get_topic("power", COMMAND) : undefined,
            swing_mode_command_topic: "swing_mode" in this._receive_commands_map ? this._get_topic("swing_mode", COMMAND) : undefined,
            swing_mode_state_topic: "swing_mode" in this._state_updates_map ? this._get_topic("swing_mode", STATE) : undefined,
            temperature_command_topic: "temperature" in this._receive_commands_map && !this.temperature_range ? this._get_topic("temperature", COMMAND) : undefined,
            temperature_state_topic: "temperature" in this._state_updates_map && !this.temperature_range ? this._get_topic("temperature", STATE) : undefined,
            temperature_high_command_topic: "temperature_high" in this._receive_commands_map && this.temperature_range ? this._get_topic("temperature_high", COMMAND) : undefined,
            temperature_high_state_topic: "temperature_high" in this._state_updates_map && this.temperature_range ? this._get_topic("temperature_high", STATE) : undefined,
            temperature_low_command_topic: "temperature_low" in this._receive_commands_map && this.temperature_range ? this._get_topic("temperature_low", COMMAND) : undefined,
            temperature_low_state_topic: "temperature_low" in this._state_updates_map && this.temperature_range ? this._get_topic("temperature_low", STATE) : undefined,
        }
        let config = {
            current_temperature_topic: this._get_topic("current_temperature", STATE),
            device: {
                model: "HVAC",
                manufacturer: "Mitsubishi HVAC Java Connector",
                identifiers: this.identifier,
                name: this.name
            },
            fan_modes: this.fan_modes,
            max_temp: this.max_temp,
            min_temp: this.min_temp,
            modes: this.modes,
            name: this.name,
            objectId: this.objectId,
            optimistic: false,
            precision: 0.1,
            swing_modes: this.swing_modes,
            temperature_unit: "F",
            temp_step: 1,
            unique_id: this.unique_id,
            origin: {
                name: "Mitsubishi HVAC MQTT Interface",
                sw_version: "0.0.0-alpha"
            },
            ...additionalConfig
        }
        return config
    }

    send_config() {
        let config = this._generate_config()
        let discovery_topic = this.get_discovery_topic()
        this._mqtt_client.send(discovery_topic, JSON.stringify(config))
    }

}