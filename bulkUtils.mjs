const ITEM_MAP = {
    0: "CHK_OFF",
    1: "CHK_ON"
}

const SIGN_MAP = {
    0: "OFF",
    1: "ON",
    2: "RESET"
}

const STATUS_MAP = {
    0: "DISABLE",
    1: "ENABLE"
}


const SCHEDULE_MAP = {
    0: "OFF",
    1: "ON"
}

export class BulkParser {
    constructor(bulkString) {
        this.data = {
            drive: null
        }

        this.arrayOfHexStrings = this.bulk2hexStringArray(bulkString)
        this.init()
    }

    init() {
        this.updateDrive()
        this.updateMode()
        this.updateSetTemp()
        this.updateInletTemp()
        this.updateAirDirection()
        this.updateFanSpeed()
        this.updateRemoteControlPermission()
        this.updateDriveItem()
        this.updateModeItem()
        this.updateSetTempItem()
        this.updateFilterItem()
        this.updateVentilation()
        this.updateFilterSign()
        this.updateErrorSign()
        this.updateModel()
        this.updateModeStatus()
        this.updateMidTempStatus()
        this.updateMaxSaveValue()
        this.updateSchedule()
        this.updateIcKind()
        this.updateAutoModeStatus()
        this.updateDryModeStatus()
        this.updateFanSpeedStatus()
        this.updateAirDirectionStatus()
        this.updateSwingStatus()
        this.updateVentilationStatus()
        this.updateBypassStatus()
        this.updateLcAutoStatus()
        this.updateHeatRecoveryStatus()
        this.updateCoolMin()
        this.updateCoolMax()
        this.updateHeatMin()
        this.updateHeatMax()
        this.updateAutoMin()
        this.updateAutoMax()
        this.updateTurnOff()
        this.updateTempLimit()
        this.updateTempDetail()
        this.updateFanModeStatus()
        this.updateAirStageStatus()
        this.updateAirAutoStatus()
        this.updateFanAutoStatus()
    }

    bulk2hexStringArray = (bulkString) => {
        return bulkString.match(/(..)/g)
    }

    updateDrive() {
        const DRIVE_STRINGS = [
            "OFF",
            "ON",
            "TESTRUN",
            "ON",
            "ON",
            "OFF"
        ]

        let drHexStr = this.arrayOfHexStrings[1]
        this.data.drive = DRIVE_STRINGS[parseInt(drHexStr, 16)]
    }

    updateMode() {
        const MODE_MAP = {
            0: "FAN",
            1: "COOL",
            2: "HEAT",
            3: "DRY",
            4: "AUTO",
            5: "BAHP",
            6: "AUTOCOOL",
            7: "AUTOHEAT",
            8: "VENTILATE",
            9: "PANECOOL",
            10: "PANEHEAT",
            11: "OUTCOOL",
            12: "DEFLOST",
            128: "HEATRECOVERY",
            129: "BYPASS",
            130: "LC_AUTO"
        }

        let hexStr = this.arrayOfHexStrings[2]
        this.data.mode = MODE_MAP[parseInt(hexStr, 16)]
    }

    updateSetTemp() {
        let left = parseInt(this.arrayOfHexStrings[3], 16)
        let right = parseInt(this.arrayOfHexStrings[4], 16)
        if (right <= 0 || right >= 10) {
            this.data.set_temp = left.toString()
        } else {
            this.data.set_temp = left.toString() + "." + right.toString()
        }
    }

    updateInletTemp() {
        let num = parseInt(this.arrayOfHexStrings[5] + this.arrayOfHexStrings[6], 16)
        this.data.inlet_temp = (num / 10).toFixed(1)
    }

    updateAirDirection() {
        const AIR_DIRECTION_MAP = {
            0: "SWING",
            1: "VERTICAL",
            2: "MID2",
            3: "MID1",
            4: "HORIZONTAL",
            5: "MID0",
            6: "AUTO"
        }
        this.data.air_direction = AIR_DIRECTION_MAP[parseInt(this.arrayOfHexStrings[7], 16)]
    }

    updateFanSpeed() {
        const FAN_SPEED_MAP = {
            0: "LOW",
            1: "MID2",
            2: "MID1",
            3: "HIGH",
            6: "AUTO"
        }

        this.data.fan_speed = FAN_SPEED_MAP[parseInt(this.arrayOfHexStrings[8], 16)]
    }


    updateRemoteControlPermission() {
        const REMOTE_CONTROL_PERMISSION_MAP = {
            0: "PERMIT",
            1: "PROHIBIT"
        }
        this.data.remote_control_permission = REMOTE_CONTROL_PERMISSION_MAP[parseInt(this.arrayOfHexStrings[9], 16)]
    }

    updateDriveItem() {
        this.data.drive_item = ITEM_MAP[parseInt(this.arrayOfHexStrings[10], 16)]
    }

    updateModeItem() {
        this.data.mode_item = ITEM_MAP[parseInt(this.arrayOfHexStrings[11], 16)]
    }

    updateSetTempItem() {
        this.data.set_temp_item = ITEM_MAP[parseInt(this.arrayOfHexStrings[12], 16)]
    }

    updateFilterItem() {
        this.data.filter_item = ITEM_MAP[parseInt(this.arrayOfHexStrings[13], 16)]
    }

    updateVentilation() {
        const VENTILATION_MAP = {
            0: "OFF",
            1: "LOW",
            2: "HIGH",
            3: "NONE"
        }

        this.data.ventilation = VENTILATION_MAP[parseInt(this.arrayOfHexStrings[14], 16)]
    }

    updateFilterSign() {
        this.data.filter_sign = SIGN_MAP[parseInt(this.arrayOfHexStrings[15], 16)]
    }

    updateErrorSign() {
        this.data.error_sign = SIGN_MAP[parseInt(this.arrayOfHexStrings[16], 16)]
    }

    updateModel() {
        const MODEL_MAP = {
            1: "FU",
            2: "LC",
            3: "OC",
            4: "BC",
            5: "IU",
            6: "OS",
            18: "TU",
            7: "SC",
            8: "GW",
            9: "TR",
            10: "AN",
            11: "KA",
            12: "MA",
            13: "IDC",
            14: "MC",
            15: "CDC",
            16: "VDC",
            31: "IC",
            32: "DDC",
            33: "RC",
            34: "KIC",
            35: "AIC",
            36: "GR",
            37: "OCi",
            38: "BS",
            39: "SC",
            40: "IC",
            41: "ME",
            42: "CR",
            43: "SR",
            44: "ST",
            50: "DC",
            51: "MCt",
            52: "MCp",
            96: "NOUSE",
            97: "TMP",
            98: "??",
            99: "NONE"
        }

        this.data.model = MODEL_MAP[parseInt(this.arrayOfHexStrings[17], 16)]
    }

    updateModeStatus() {
        this.data.mode_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[18], 16)]
    }

    updateMidTempStatus() {
        this.data.mid_temp_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[19], 16)]
    }

    updateMaxSaveValue() {
        this.data.max_save_value = parseInt(this.arrayOfHexStrings[20], 16) > 0 ? "100" : "0"
    }

    updateSchedule() {
        const
            SCHEDULE_MAP = {
                0: "OFF",
                1: "ON"
            }

        this.data.schedule = SCHEDULE_MAP[parseInt(this.arrayOfHexStrings[21], 16)]
    }

    updateIcKind() {
        const
            IC_KIND_MAP = {
                0: "COOL",
                1: "NORMAL"
            }

        this.data.ic_kind = IC_KIND_MAP[parseInt(this.arrayOfHexStrings[22], 16)]
    }

    updateAutoModeStatus() {
        this.data.auto_mode_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[23], 16)]
    }

    updateDryModeStatus() {
        this.data.dry_mode_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[24], 16)]
    }

    updateFanSpeedStatus() {
        const
            FAN_SPEED_STATUS_MAP = {
                0: "2STAGES",
                1: "4STAGES",
                2: "NONE",
                3: "3STAGES"
            }
        this.data.fan_speed_status = FAN_SPEED_STATUS_MAP[parseInt(this.arrayOfHexStrings[25], 16)]
    }

    updateAirDirectionStatus() {
        this.data.air_direction_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[26], 16)]
    }

    updateSwingStatus() {
        this.data.swing_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[27], 16)]
    }

    updateVentilationStatus() {
        this.data.swing_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[28], 16)]
    }

    updateBypassStatus() {
        this.data.bypass_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[29], 16)]
    }

    updateLcAutoStatus() {
        this.data.lc_auto_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[30], 16)]
    }

    updateHeatRecoveryStatus() {
        this.data.heat_recovery_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[31], 16)]
    }

    get_min_max_value(a, b) {
        let [x, y] = a.split("")
        return parseInt(x, 16).toString() + parseInt(y, 16).toString() + "." + parseInt(b, 16).toString()
    }

    updateCoolMin() {
        let a = this.arrayOfHexStrings[32]
        let [b, z] = this.arrayOfHexStrings[38].split("")
        this.data.cool_min = this.get_min_max_value(a, b)
    }
    updateCoolMax() {
        let a = this.arrayOfHexStrings[34]
        let [b, z] = this.arrayOfHexStrings[39].split("")
        this.data.cool_max = this.get_min_max_value(a, b)
    }
    updateHeatMin() {
        let a = this.arrayOfHexStrings[35]
        let [z, b] = this.arrayOfHexStrings[39].split("")
        this.data.heat_min = this.get_min_max_value(a, b)
    }
    updateHeatMax() {
        let a = this.arrayOfHexStrings[33]
        let [z, b] = this.arrayOfHexStrings[38].split("")
        this.data.heat_max = this.get_min_max_value(a, b)
    }
    updateAutoMin() {
        let a = this.arrayOfHexStrings[36]
        let [b, z] = this.arrayOfHexStrings[40].split("")
        this.data.auto_min = this.get_min_max_value(a, b)
    }
    updateAutoMax() {
        let a = this.arrayOfHexStrings[37]
        let [z, b] = this.arrayOfHexStrings[40].split("")
        this.data.auto_max = this.get_min_max_value(a, b)
    }

    updateTurnOff() {
        this.data.turn_off = SCHEDULE_MAP[parseInt(this.arrayOfHexStrings[41], 16)]
    }

    updateTempLimit() {
        this.data.temp_limit = STATUS_MAP[parseInt(this.arrayOfHexStrings[42], 16)]
    }
    updateTempDetail() {
        this.data.temp_detail = STATUS_MAP[parseInt(this.arrayOfHexStrings[43], 16)]
    }
    updateFanModeStatus() {
        this.data.fan_mode_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[44], 16)]
    }

    updateAirStageStatus() {
        const AIR_STAGE_STATUS_MAP = {
            0: "4STAGES",
            1: "5STAGES"
        }
        this.data.air_stage_status = AIR_STAGE_STATUS_MAP[parseInt(this.arrayOfHexStrings[45], 16)]
    }


    updateAirAutoStatus() {
        this.data.air_auto_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[46], 16)]
    }
    updateFanAutoStatus() {
        this.data.fan_auto_status = STATUS_MAP[parseInt(this.arrayOfHexStrings[47], 16)]
    }
}

