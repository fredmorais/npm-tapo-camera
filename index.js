const crypto = require('crypto')
const utf8 = require('utf8')
const axios = require('axios')
const https = require('https')

function Tapo() {

    this.setup = async (host, user, password, cloudPassword = '', timeout = 10000) => {

        this.host = host
        this.user = user
        this.password = password
        this.cloudPassword = cloudPassword

        this.stok = false
        this.userID = false

        this.hashedPassword = crypto.createHash('md5').update(utf8.encode(password)).digest('hex').toUpperCase()
        this.hashedCloudPassword = crypto.createHash('md5').update(utf8.encode(cloudPassword)).digest('hex').toUpperCase()
        
        await this.refreshStok()

        this.api = axios.create({
            baseURL: `https://${this.host}/stok=${this.stok}/ds`,
            timeout: timeout,
            headers: {
                Host: this.host,
                Referer: `https://${this.host}`,
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'User-Agent': 'Tapo CameraClient Android',
                Connection: 'close',
                requestByApp: 'true',
                'Content-Type': 'application/json; charset=UTF-8',
            },
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        })

        // this.presets = this.isSupportingPresets()
        // if not this.presets:
        //     this.presets = {}
    }

    this.ensureAuthenticated = () => {
        return (this.stok ? true : this.refreshStok())
    }

    this.refreshStok = async () => {
        const res = await axios.post(`https://${this.host}`, {
            method: 'login',
            params: {
                hashed: true,
                password: this.hashedPassword,
                username: this.user
            }, 
        }, {
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        }).catch(error => error)

        if (this.responseIsOK(res)) {
            this.stok = res.data.result.stok
            return this.stok
        }

        throw new Error('Invalid authentication data')
    }

    this.responseIsOK = (res) => {
        if (res.status != 200) {
            throw new Error(`Error in communication. Status code: ${res.status}`)
        }
        
        try {
            return res.data['error_code'] == 0
        } catch(error) {
            throw new Error(`Unexpected response: ${error}`)
        }
    }

    this.getErrorMessage = code => {
        const errors = {
            '-40401': 'Invalid stok value',
            '-64324': 'Privacy mode is ON, not able to execute',
            '-64302': 'Preset ID not found',
            '-64321': 'Preset ID was deleted so no longer exists',
            '-40106': 'Parameter to get/do does not exist',
            '-40105': 'Method does not exist',
            '-40101': 'Parameter to set does not exist',
        }
        if (errors[code.toString()]) {
            return errors[code.toString()]
        } else {
            return code.toString
        }
    }

    this.performRequest = async (data, loginRetry = false) => {
        this.ensureAuthenticated()

        const res = await this.api.post('/', data).catch(error => error)

        if (this.responseIsOK(res)) {
            return res.data
        } else {
            if (res.data && res.data.error_code && res.data.error_code == -40401 && !loginRetry) {
                await this.refreshStok()
                return this.performRequest(data, true)
            } else {
                throw new Error(`Error: ${this.getErrorMessage(res.data.error_code)} Response: ${JSON.stringify(data)}`)
            }

        }
    }

    this.getInfo = async () => {
        const res = await this.performRequest({
            method: 'get', 
            device_info: { name: ['basic_info'] },
            motion_detection: { name: ['motion_det'] },
            lens_mask: { name: ['lens_mask_info'] },
            OSD: { name: ['date', 'week', 'font'], 'table': ['label_info'] },
            msg_alarm: { name: ['chn1_msg_alarm_info'] },
            led: { name: ['config'] },
            target_track: { name: ['target_track_info'] },
            audio_capability: { name: ['device_speaker', 'device_microphone'] },
            cet: { name: ['vhttpd'] },
            device_info: { name: ['basic_info'] },
            system: { name: ['clock_status'] },
            motor: { name: ['capability'] },
            preset: { name: ['preset'] },
            image: { name: ['switch'] }
        })

        var presets = []
        for (let i = 0; i < res.preset.preset.id.length; i++) {
            presets.push({
                id: parseInt(res.preset.preset.id[i]),
                name: res.preset.preset.name[i],
                read_only: res.preset.preset.read_only[i] == '0' ? false : true,
                pan: parseFloat(res.preset.preset.position_pan[i]),
                tilt: parseFloat(res.preset.preset.position_tilt[i])
            })
        }

        return {
            info: res.device_info.basic_info,
            motionDetection: {
                enhanced: res.motion_detection.motion_det.enhanced == 'off' ? false : true,
                sensitivity: res.motion_detection.motion_det.sensitivity,
                digital_sensitivity: parseInt(res.motion_detection.motion_det.digital_sensitivity),
                enhanced: res.motion_detection.motion_det.enabled == 'off' ? false : true
            },
            lensMask: res.lens_mask.lens_mask_info.enabled == 'off' ? false : true,
            osd: res['OSD'],
            msg_alarm: res.msg_alarm.chn1_msg_alarm_info,
            led: res.led.config.enabled == 'off' ? false : true,
            target_track: res.target_track.target_track_info.enabled == 'off' ? false : true,
            speaker: res.audio_capability.device_speaker,
            microphone: res.audio_capability.device_microphone,
            clock: {
                timestamp: res.system.clock_status.seconds_from_1970,
                local_time: res.system.clock_status.local_time
            },
            motor: res.motor.capability,
            presets: presets,
            image: res.image.switch
        }
    }

    this.set = async (controls) => {
        var request = {
            method: 'set'
        }

        const characteristics = {
            osd(value) {
                return { OSD: {
                    date: {
                        enabled: value.date.enabled ? 'on' : 'off',
                        x_coor: value.date.x,
                        y_coor: value.date.y,
                    },
                    week: {
                        enabled: value.week.enabled ? 'on' : 'off',
                        x_coor: value.week.x,
                        y_coor: value.week.y,
                    },
                    font: {
                        color: 'white',
                        color_type: 'auto',
                        display: 'ntnb',
                        size: 'auto',
                    },
                    label_info_1: {
                        enabled: value.label1.enabled ? 'on' : 'off',
                        x_coor: value.label1.x,
                        y_coor: value.label1.y,
                    },
                }}
            },
            privacyMode(value) {
                return { lens_mask: { lens_mask_info: { enabled: value ? 'on' : 'off'} } }
            },
            alarm(value) {
                return { msg_alarm: { chn1_msg_alarm_info: {
                    alarm_type: '0',
                    enabled: value.enabled ? 'on' : 'off',
                    light_type: '0',
                    alarm_mode: value.alarm,
                }} }
            },
            led(value) {
                return { led: { config: { enabled: value ? 'on' : 'off' } } }
            },
            dayNightMode(value) {
                return { image: { common: { inf_type: value } } }
            },
            motionDetection(value) {
                return { motion_detection: { motion_det : { enabled : value ? 'on' : 'off' } } }
            },
            autoTrackTarget(value) {
                return { target_track: { target_track_info: { enabled: value ? 'on' : 'off' } } }
            },
            lensDistortionCorrection(value) {
                return { method: set, image: { switch: { ldc : value ? 'on' : 'off' } } }
            },
            imageFlipVertical(value) {
                return { image: { switch: { flip_type: value ? 'center' : 'off' } } }
            }
        }

        for (var key of Object.keys(controls)) {
            request = { ...request, ...characteristics[key](controls[key]) }
        }

        return await this.performRequest(request)
    }

    this.do = async (controls) => {
        var request = {
            method: 'do'
        }

        const characteristics = {
            moveMotor(value) {
                return { motor: { move: { x_coord: value.x, y_coord: value.y } } }
            },
            moveMotorStep(value) {
                return { motor: { movestep: { direction : value } } }
            },
            calibrateMotor() {
                return { motor: { manual_cali: '' } }
            },
            format() {
                return { harddisk_manage: { format_hd: '1' } }
            },
            reboot() {
                return { harddisk_manage: { format_hd: '1' } }
            },
            savePreset(value) {
                return { preset: { name: value, save_ptz: '1' } }
            },
            deletePreset(value) {
                return { preset: { remove_preset: { id: [value] } } }
            },
            setPreset(value) {
                return { preset: { goto_preset: { id: value } } }
            }
        }

        for (var key of Object.keys(controls)) {
            request = { ...request, ...characteristics[key](controls[key]) }
        }

        return await this.performRequest(request)
    }

}


module.exports = new Tapo()