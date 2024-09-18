// https://resource.milesight.com/milesight/iot/document/uc11-series-communication-protocol-en.pdf

function toHexString(byteArray) {
    return Array.from(byteArray, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}


function decodeDevInfo(data) {
    data.result.isDevInfo = 1;
    switch (data.rest[1]) {
        case 1: // protocol version
            data.result.protocol = "V" + data.rest[2];
            data.rest = data.rest.slice(3);
            break;
        case 8: // sn
            data.result.sn = toHexString(data.rest.slice(2, 8));
            data.rest = data.rest.slice(8);
            break;
        case 9: // hardware version
            data.result.hv = "V" + data.rest[2] + "." + data.rest[3];
            data.rest = data.rest.slice(4);
            break;
        case 10: // software version
            data.result.sv = "V" + data.rest[2] + "." + data.rest[3];
            data.rest = data.rest.slice(4);
            break;
        default:
            data.invalidDevInfo = toHexString(data.rest);
            data.rest = [];  //remove unknown
    }
    return data;
}

function decodeDI(data) {
    let id = data.rest[0] - 0;
    data.result.DI = data.rest[0] - 0;
    switch (data.rest[1]) {
        case 0:
            data.result["DI" + id + "_state"] = data.rest[2] === 0 ? 'low' : 'high';
            data.result["DI" + id + "_state_raw"] = toHexString(data.rest.slice(0, 3))
            data.rest = data.rest.slice(3);
            break;
        case 200:
            data.result["DI" + id + "_count"] = Number("0x" + toHexString(data.rest.slice(2, 6)));
            data.result["DI" + id + "_count_raw"] = toHexString(data.rest.slice(0, 5));
            data.rest = data.rest.slice(5);
            break;
    }
    return data;
}

function decodeDO(data) {
    let id = data.rest[0] - 8;
    switch (data.rest[1]) {
        case 1:
            data.result["DO" + id + "_state"] = data.rest[2] === 0 ? 'low' : 'high';
            data.result["DO" + id + "_raw"] = toHexString(data.rest.slice(0, 3));
            data.rest = data.rest.slice(3);
            break;
    }
    return data;
}

function decodeAI(data) {
    let id = data.rest[0] - 16;
    switch (data.rest[1]) {
        case 2:
            data.result["AI" + id + "_raw"] = toHexString(data.rest.slice(0, 10))
            data.result["AI" + id + "_current"] = Number("0x" + toHexString(data.rest.slice(2, 4).reverse()));
            data.result["AI" + id + "_min"] = Number("0x" + toHexString(data.rest.slice(4, 6).reverse()));
            data.result["AI" + id + "_max"] = Number("0x" + toHexString(data.rest.slice(6, 8).reverse()));
            data.result["AI" + id + "_avg"] = Number("0x" + toHexString(data.rest.slice(8, 10).reverse()));
            data.rest = data.rest.slice(10);
            break;
    }
    return data;
}

function decodeBlock(data) {
    switch (data.rest[0]) {
        case 1: //DI1
        case 2: //DI2
            // 01 00 00 09 01 01
            data = decodeDI(data)
            break;
        case 9: //DO1
        case 10: //DO2
            // 01 00 00 09 01 01
            data = decodeDO(data)
            break;
        case 17: //AI1
        case 18: //AI2
            //11 02 c302 c302 c302 c302
            //12 02 0000 0000 0000 0000
            data = decodeAI(data)
            break;
        // case 255:
        //     //EXAMPLE ff 08 64 12 a4 30 44 14
        //     data = decodeDevInfo(data)
        //     break;
        default:
            data.invalidChannel = toHexString(data.rest);
            data.rest = [];  //remove unknown
    }
    return data;
}


function decodeUplink(input) {
    let data_ = input.bytes;
    let data = {
        result: {
            deviceType: "ursalink#UC1122",
            // data_: toHexString(data_)
        },
        rest: input.bytes === undefined ? [] : input.bytes
    };
    while (data.rest.length > 0) {
        data = decodeBlock(data);
    }

    return {
        data: data.result,
        warnings: [],
        errors: []
    };
}