import mqtt from "mqtt";
import {topic2regex} from "./util.mjs";

class MqttClient {
    constructor(host, user, pass) {
        this.host = host
        this.mqttOptions = {username: user, password: pass}
        this.subscriptions = new Map()
        this.client = mqtt.connect("mqtt://" + this.host, this.mqttOptions)
        this.connected = null
        this.client.on("connect", () => {
            this.connected = true
            console.log("(re) connected")
            while (this.errQueue.length > 0) {
                console.log("sending old message")
                let {topic, message, options} = this.errQueue.shift()
                this.send(topic, message, options)
            }
            for (let topic of this.subscriptions.keys()) {
                this.client.subscribe(topic)
            }
        })
        this.client.on("error", () => {
            this.connected = false
            console.log("disconnected")
        })
        this.client.on("message", (topic, message) => this.onMessage(topic, message))
        this.errQueue = []
    }

    send(topic, message, options = {}) {
        this.client.publish(topic, message, {...options}, err => {
            if (err) {
                this.errQueue.push({topic, message, options})
            }
        })
    }

    async subscribe(topic, handler) {
        try {
            new Promise((resolve, reject) => this.client.subscribe(topic, (err, granted) => {
                err ? reject(err) : resolve(granted)
            }))
        } catch (e) {

        }
        this.subscriptions.set(topic, handler)
    }

    onMessage(messageTopic, message) {
        for (let subscriptionTopic of this.subscriptions.keys()) {
            if (topic2regex(subscriptionTopic).test(messageTopic)) {
                let handler = this.subscriptions.get(subscriptionTopic)
                handler(messageTopic, message.toString())
            }
        }
    }
}

export const client = new MqttClient(process.env.MQTT_HOST, process.env.MQTT_USER, process.env.MQTT_PASS)