import {node} from "./hvacDevice.mjs";
import {arrayFragmentBuilder, obj2xml, xml2obj} from "./xmltools.mjs";
import axios from "axios";
import {BulkParser} from "./bulkUtils.mjs";
import {createHash} from "crypto"
import {c2f_map, f2c_map} from "./tempUtils.mjs";

export class MitsubishiController {
    constructor(host) {
        this.host = host
        this.endpoint = this.host + "/servlet/MIMEReceiveServlet"
        this.id = createHash("sha256").update(host).digest("hex")
        this.model = "unknown"
        this.prefix = "mitsubishi/" + node + "/"
        this.object_id_prefix = "mits_hvac" + "_" + node + "_ctrlr01"
        this.data = {}
        this.update_interval = null

        // this.init()
        // console.log(obj2xml())
        // this.sendCommand(this.getMnetCommand(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"]))
        // this.sendCommand(this.getSetbackControlCommand(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"]))
    }

    async init() {
        await this.sendCommand(this.getMnetListCommand())
        await this.sendCommand(this.getMnetCommand(Array.from(Object.keys(this.data.groupData))))
        Array.from(Object.keys(this.data.groupData)).forEach(group => {
            this.populateFromBulk(group)
        })
        if (this.update_interval) clearInterval(this.update_interval)
        this.update_interval = setInterval(() => this.updateAll(), 5 * 60 * 1000)
        // console.log(this.data)
    }

    populateFromBulk(group) {
        let bulkString = this.data.groupData[group].bulk
        let parser = new BulkParser(bulkString)
        this.data.groupData[group].fromBulk = {...parser.data}
        const c2f = c => (c * 9 / 5) + 32
        this.data.groupData[group].inlet_temp_fahrenheit = c2f(parseFloat(this.data.groupData[group].fromBulk.inlet_temp)).toFixed(1)
        this.data.groupData[group].set_temp_fahrenheit = c2f_map[this.data.groupData[group].fromBulk.set_temp]
        const {fan_speed_status, fan_auto_status} = this.data.groupData[group].fromBulk
        let available_fan_speeds
        switch (fan_speed_status) {
            case "3STAGES":
                available_fan_speeds = ["HIGH", "MID2", "LOW"]
                break;
            case "4STAGES":
                available_fan_speeds = ["HIGH", "MID2", "MID1", "LOW"]
                break;
            default:
                available_fan_speeds = ["HIGH", "LOW"]
                break;
        }
        if (fan_auto_status === "ENABLE") available_fan_speeds.push("AUTO")
        this.data.groupData[group].available_fan_speeds = available_fan_speeds

        const {air_stage_status, air_auto_status, swing_status} = this.data.groupData[group].fromBulk
        let available_air_directions
        if (air_stage_status === "5STAGES"){
            available_air_directions = ["VERTICAL", "MID2", "MID1", "MID0", "HORIZONTAL"]
        } else {
            available_air_directions = ["VERTICAL", "MID2", "MID1", "HORIZONTAL"]
        }
        if (air_auto_status === "ENABLE") {
            available_air_directions.push("AUTO")
        }
        if (swing_status === "ENABLE") {
            available_air_directions.push("SWING")
        }
        this.data.groupData[group].available_air_directions = available_air_directions

        const {fan_mode_status, dry_mode_status} = this.data.groupData[group].fromBulk

        let available_modes = ["COOL", "HEAT"]

        if (fan_mode_status === "ENABLE") {
            available_modes.push("FAN")
        }
        if (dry_mode_status === "ENABLE") {
            available_modes.push("DRY")
        }
        this.data.groupData[group].available_modes = available_modes

        let available_modes_homeassistant = ["off"]

        for (let mode of available_modes) {
            if (mode === "COOL") available_modes_homeassistant.push("cool")
            if (mode === "HEAT") available_modes_homeassistant.push("heat")
            if (mode === "FAN") available_modes_homeassistant.push("fan_only")
            if (mode === "DRY") available_modes_homeassistant.push("dry")
        }

        this.data.groupData[group].available_modes_homeassistant = available_modes_homeassistant

        let current_mode = this.data.groupData[group].fromBulk.mode
        let current_drive = this.data.groupData[group].fromBulk.drive

        let  current_mode_homeassistant

        if (current_drive === "OFF") current_mode_homeassistant = "off"
        else {
            switch (current_mode) {
                case "COOL":
                    current_mode_homeassistant = "cool"
                    break;
                case "HEAT":
                    current_mode_homeassistant = "heat"
                    break;
                case "DRY":
                    current_mode_homeassistant = "dry"
                    break;
                case "FAN":
                    current_mode_homeassistant = "fan_only"
                    break;
            }
        }
        this.data.groupData[group].current_mode_homeassistant = current_mode_homeassistant



        // console.log(this.data.groupData[group].fromBulk)


    }

    getSystemDataCommand() {
        const map = {
            "Packet.DatabaseManager.SystemData.@_Version": "meta.mitsubishi_version",
            "Packet.DatabaseManager.SystemData.@_TempUnit": "temp_unit",
            "Packet.DatabaseManager.SystemData.@_Model": "meta.mitsubishi_model",
            "Packet.DatabaseManager.SystemData.@_FilterSign": "meta.sysdata_filter_sign",
            "Packet.DatabaseManager.SystemData.@_ShortName": "meta.sysdata_short_name",
            "Packet.DatabaseManager.SystemData.@_DateFormat": "date_format",
        }
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    SystemData: {
                        $Version: "*",
                        $TempUnit: "*",
                        $Model: "*",
                        $FilterSign: "*",
                        $ShortName: "*",
                        $DateFormat: "*",
                    }
                }
            },
            replyMap: map
        }
    }

    getAreaGroupListCommand() {
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    ControlGroup: {
                        AreaGroupList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getAreaListCommand() {
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    ControlGroup: {
                        AreaList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getMnetGroupListCommand() {
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    ControlGroup: {
                        MnetGroupList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getMnetListCommand() {
        const map = {
            "Packet.DatabaseManager.ControlGroup.MnetList.MnetRecord[@_Group].@_GroupNameWeb": "groupData[].name",
        }
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    ControlGroup: {
                        MnetList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getDdcInfoListCommand() {
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    ControlGroup: {
                        DdcInfoList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getViewInfoListCommand() {
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    ControlGroup: {
                        ViewInfoList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getMcListCommand() {
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    ControlGroup: {
                        McList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getMcNameListCommand() {
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    ControlGroup: {
                        McNameList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getFunctionListCommand() {
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: {
                    FunctionControl: {
                        FunctionList: {}
                    }
                }
            },
            replyMap: map
        }
    }

    getMnetCommand(groups) {
        const groupsMnet = groups.map(group => {
            return {
                $Group: group,
                $Bulk: "*",
                $EnergyControl: "*",
                $RacSW: "*"
            }
        })
        const groupsXml = arrayFragmentBuilder(groupsMnet, "Mnet")
        const map = {
            "Packet.DatabaseManager.Mnet[@_Group].@_Bulk": "groupData[].bulk",
        }
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: groupsXml
            },
            replyMap: map
        }
    }

    setMnetSingleCommand(group, drive, mode, set_temp, air_direction, fan_speed, remote_controller, error_sign, filter_sign) {
        let map = {}
        let mnetSettings = {}
        if (drive) mnetSettings["$Drive"] = drive
        if (mode) mnetSettings["$Mode"] = mode
        if (set_temp) mnetSettings["$SetTemp"] = set_temp
        if (air_direction) mnetSettings["$AirDirection"] = air_direction
        if (fan_speed) mnetSettings["$FanSpeed"] = fan_speed
        if (remote_controller) mnetSettings["$RemoteController"] = remote_controller
        if (error_sign) mnetSettings["$ErrorSign"] = error_sign
        if (filter_sign) mnetSettings["$FilterSign"] = filter_sign
        return {
            command: {
                Command: "setRequest",
                DatabaseManager: {
                    Mnet: {
                        "$Group": group,
                        ...mnetSettings
                    }
                }
            },
            replyMap: map
        }
    }

    async sendSettingUpdate(group, drive, mode, set_temp, air_direction, fan_speed, remote_controller, error_sign, filter_sign) {
        await this.sendCommand(this.setMnetSingleCommand(group, drive, mode, set_temp, air_direction, fan_speed, remote_controller, error_sign, filter_sign))
        await this.updateAll()
    }

    async setDrive(group, drive) {
        drive = drive.toUpperCase()
        return this.sendSettingUpdate(group, drive)
    }
    async setTemperature(group, temperature) {
        let celcius = f2c_map[temperature]
        return this.sendSettingUpdate(group, null, null, celcius)
    }
    async setAirDirection(group, airDirection) {
        return this.sendSettingUpdate(group, null, null, null, airDirection)
    }
    async setFanMode(group, fanMode) {
        return this.sendSettingUpdate(group, null, null, null, null, fanMode)
    }

    async updateAll() {
        await waitms(parseInt(process.env.WAIT_MS) || 1000)
        await this.sendCommand(this.getMnetCommand(Array.from(Object.keys(this.data.groupData))))
        Array.from(Object.keys(this.data.groupData)).forEach(group => {
            this.populateFromBulk(group)
        })
    }

    async setModeHomeAssistant(group, mode) {
        if (mode === "off") {
            return this.sendSettingUpdate(group, "OFF")
        } else {
            switch (mode) {
                case "cool":
                    return this.sendSettingUpdate(group, "ON", "COOL")
                    break;
                case "heat":
                    return this.sendSettingUpdate(group, "ON", "HEAT")
                    break
                case "fan_only":
                    return this.sendSettingUpdate(group, "ON", "FAN")
                    break
                case "dry":
                    return this.sendSettingUpdate(group, "ON", "DRY")
                    break
            }
        }
    }


    getSetbackControlCommand(groups) {
        const groupsSetbackControl = groups.map(group => {
            return {
                $Group: group,
                $State: "*",
                $Hold: "*",
                $SetTempMax: "*",
                $SetTempMin: "*",
                $PreMode: "*",
                $PreSetTemp: "*",
                $PreDriveItem: "*",
                $PreModeItem: "*",
                $PreSetTempItem: "*",
            }
        })
        const groupsSetbackControlXML = arrayFragmentBuilder(groupsSetbackControl, "SetbackControl")
        const map = {}
        return {
            command: {
                Command: "getRequest",
                DatabaseManager: groupsSetbackControlXML
            },
            replyMap: map
        }
    }


    getFromPath(obj, path) {
        let pathFragments = path.split(".")
        let data = obj
        // console.log({data})
        while (pathFragments.length > 0) {
            let fragment = pathFragments.shift()
            // console.log({fragment})
            data = data[fragment.split("[")[0]]
            if (typeof data === "string") {
                if (pathFragments.length > 0) console.log("invalid path")
                return data
            } else if (Array.isArray(data)) {
                let retObj = {}
                let k = fragment.split("[")[1].split("]")[0]
                for (let e of data) {
                    let id = e[k]
                    retObj[id] = this.getFromPath(e, pathFragments.join("."))
                }
                // console.log({retObj})
                return retObj
            }
        }
        // throw "error retrieving from path " + path
    }

    handleResponse(obj, replyMap) {
        // console.log(JSON.stringify({replyMap}))
        for (let k of Object.keys(replyMap)) {
            // console.log(k)
            let v = this.getFromPath(obj, k)
            this.update(replyMap[k], v)
        }
        // console.log(JSON.stringify({data: this.data}))
    }

    processBulk(group) {

    }

    update(pathToFollowFromRootToUpdate, dataForTheUpdate, rootToUpdate = this.data) {
        // console.log({pathToFollowFromRootToUpdate,dataForTheUpdate, rootToUpdate})
        let currentUpdateRoot = rootToUpdate
        let individualPathToUpdateFragments = pathToFollowFromRootToUpdate.split(".")
        while (individualPathToUpdateFragments.length > 0) {
            let currentPathToUpdateFragment = individualPathToUpdateFragments.shift()
            if (currentPathToUpdateFragment.split("[").length > 1) {
                let currentPathToUpdateFragmentCleaned = currentPathToUpdateFragment.split("[")[0]
                if (typeof currentUpdateRoot[currentPathToUpdateFragmentCleaned] !== "object") {
                    if (currentUpdateRoot[currentPathToUpdateFragmentCleaned] !== undefined) console.log("mismatched type on update, expected undefined but got " + currentUpdateRoot[currentPathToUpdateFragmentCleaned])
                    currentUpdateRoot[currentPathToUpdateFragmentCleaned] = {}
                }
                currentUpdateRoot = currentUpdateRoot[currentPathToUpdateFragmentCleaned]
                for (let k of Object.keys(dataForTheUpdate)) {
                    if (typeof currentUpdateRoot[k] !== "object") {
                        if (currentUpdateRoot[k] === undefined) {
                            currentUpdateRoot[k] = {}
                        } else {
                            console.log("expected undefined found:" + currentUpdateRoot[k])
                        }
                    }
                    this.update(individualPathToUpdateFragments.join("."), dataForTheUpdate[k], currentUpdateRoot[k])
                }
                return
            } else {
                if (individualPathToUpdateFragments.length === 0) {
                    currentUpdateRoot[currentPathToUpdateFragment] = dataForTheUpdate
                } else {
                    if (typeof currentUpdateRoot[currentPathToUpdateFragment] !== "object") {
                        if (currentUpdateRoot[currentPathToUpdateFragment] !== undefined) throw "mismatched type on update, expected undefined but got " + currentUpdateRoot[currentPathToUpdateFragment]
                        currentUpdateRoot[currentPathToUpdateFragment] = {}
                    }
                    currentUpdateRoot = currentUpdateRoot[currentPathToUpdateFragment]
                }
            }
        }


    }

    updateData(path, value) {
        let fragments = path.split(".")
        let pathFragments = fragments.slice(0, -1)
        let parentObj = this.data
        if (pathFragments.length > 0) {
            for (let pf of pathFragments) {
                if (typeof parentObj[pf] !== "object") {
                    parentObj[pf] = {}
                }
                parentObj = parentObj[pf]
            }
        }
        parentObj[fragments.pop()] = value
        // console.log(this.data)
    }

    sendCommand({command, replyMap}) {
        const xmlBody = obj2xml(command)
        // console.log(xmlBody)
        const config = {
            headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(xmlBody)
            }
        }
        return axiosPostMax(this.endpoint, xmlBody, config)
            .then(res => this.handleResponse(xml2obj(res.data), replyMap))
            .catch(err => console.log(err.data))
    }


}


const waitms = ms => new Promise(resolve => setTimeout(resolve, ms))

const concurrentMax = (fn, max) => {
    let current = 0
    const fnm = async (...args) => {
        if (current < max) {
            current ++
            const retval = await fn(...args)
            current --
            return retval
        } else {
            await waitms(10)
            return await fnm(...args)
        }
    }
    return fnm
}

const axiosPostMax = concurrentMax(axios.post, 5)
