import {XMLParser} from "fast-xml-parser";

export const obj2xml = obj => {
    let header = '<?xml version="1.0" encoding="UTF-8"?>'
    let body = walker(obj, "Packet")
    return header + "\r\n" + body
}

const walker = (obj, key) => {
    if (typeof obj === "object") {
        const innerKeys = Array.from(Object.keys(obj))
        const attributes = innerKeys.filter(k => k.startsWith("$"))
        const subelements = innerKeys.filter(k => !k.startsWith("$"))
        let builder = '<' + key
        if (attributes.length > 0) {
            for (let attribute of attributes) {
                builder += "\r\n"
                builder += `${attribute.replace("$", "")}="${obj[attribute]}"`
            }
        }
        if (subelements.length > 0) {
            builder += '>\r\n'
            for (let subelement of subelements) {
                // console.log({subelement})
                builder += walker(obj[subelement], subelement)
            }
            builder += "\r\n" + "</" + key + ">"
        } else {
            builder += "/>"
        }
        return builder
    } else {
        let builder =  "<" + key + ">\r\n" + obj + "\r\n</" + key + ">"
        return builder
    }
}

export const arrayFragmentBuilder = (arr, nodesName) => {
    let builder = ""
    for (let obj of arr) {
        let item =  walker(obj, nodesName)
        builder += item + "\r\n"
    }
    return builder
}

export const xml2obj = (xml) => {
    const options = {
        ignoreAttributes : false
    };
    const parser = new XMLParser(options);
    let jsonObj = parser.parse(xml);
    return jsonObj
}