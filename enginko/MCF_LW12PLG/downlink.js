// see documentation https://www.enginko.com/support/doku.php?id=data_frame_format#note1


/* example "110000" "11011001" "1001000" "11110101" */

/* example "11000" "0110" "11001" "10010" "00111" "10101" */

function bytes2date(dateBytes) {
    let d = {
        dateBytes: dateBytes.reverse(),
        year: 2000 + (dateBytes[0] >> 1),  //7bit in first byt so shift)
        month: ((dateBytes[0] - ((dateBytes[0] >> 1) << 1)) << 3) + (dateBytes[1] >> 5),
        dom: dateBytes[1] - ((dateBytes[1] >> 5) << 5),
        hour: dateBytes[2] >> 3,
        min: ((dateBytes[2] - ((dateBytes[2] >> 3) << 3))<<3) + (dateBytes[3] >> 5),
        sec: (dateBytes[3] - ((dateBytes[3] >> 5) << 5))*2
    };
    // return d;
    // console.log(d.year,d.month,d.dom,d.hour,d.min,d.sec);
    return (new Date(d.year, d.month - 1, d.dom, d.hour, d.min, d.sec)).toISOString();
}




function date2Bytes(date) {
    date = date===undefined ? (new Date()) :date;
    // console.log(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds());
    let byteArray = [0, 0, 0, 0];
    byteArray[0] = ((date.getFullYear() - 2000) << 1) + ((date.getMonth() + 1) >> 3);
    byteArray[1] = ((date.getMonth() + 1) << 5) - ((((date.getMonth() + 1) >> 3) << 3) << 5) + date.getDate();
    byteArray[2] = ((date.getHours()) << 3) + ((date.getMinutes()) >> 3);
    byteArray[3] = ((date.getMinutes()) - (((date.getMinutes()) >> 3) << 3)) + Math.floor(date.getSeconds()/2);
    // console.log(byteArray);
    return byteArray.reverse();
}
// date2Bytes(new Date(2024, 8, 9, 12, 48,12));
// 2024 8 9 12 48 12 ->
//
// [6, 102, 41, 49]
// // "00110001" "00101001" "01100110" "00000110"
// // "0011000 1001 01001 01100 110000 00110
// bytes2date([6, 102, 41, 49]);



function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}

function bytesToNumber(bytes) {
    return bytes.reduce(function (carry, val, idx) {
        return carry + Math.pow(2, idx * 8) * val
    }, 0);
}

function unsigned4ToByteArray(intVal) {
    let byteArray = [0, 0, 0, 0];
    for (let index = 0; index < byteArray.length; index++) {
        let byte = intVal & 0xff;
        byteArray [index] = byte;
        intVal = (intVal - byte) / 256;
    }
    return byteArray;
}


function switchReturnPayload(O0_state) {
    let dateBytes = date2Bytes();
    let byteArray = [10,
        dateBytes[0], dateBytes[1], dateBytes[2], dateBytes[3],
        0, 0, 0, (O0_state ? 1 : 0),
        0, 0, 0, (O0_state ? 1 : 0),
        0, 0, 0, 0
    ];
    return byteArray
}

function switchPayloadOut1(state) {
    // switch on 04 00 01  witch off 04 00 00
    let byteArray = [
        4, 0, (state ? 1 : 0), 0, 0, 0, (state ? 0 : 1), 0, 0, 0
    ];
    return byteArray
}
// switch on Out1
//  04 00 01000000 00000000 -> works tested BAABAAAAAAAAAA==
// switch off Out1
//  04 00 00000000 01000000 -> works tested BAAAAAAAAQAAAA==
// switch on all
//  04 00 00000000 ffffffff -> works tested
// switch off all
//  04 00 ffffffff 00000000 -> works tested switches only available so answer is 01000000



function requestMeterInfo() {
    return [ 4, 2, 0];
}
//  04 02 00 -> works tested

function requestReboot() {
    return [ 4, 255, 1];
}
//  04 ff 01 -> works tested
function requestTimeSync() {
    return [ 4, 255, 187];
}
//  04 ff bb -> works tested




function returnTimeSync(syncId){
    let dateByteArray = date2Bytes();
    let byteArray=[];
    byteArray[0]= 0;
    byteArray[1]= syncId[0];
    byteArray[2]= syncId[1];
    byteArray[3]= syncId[2];
    byteArray[4]= syncId[3];
    byteArray[5]= dateByteArray[0];
    byteArray[6]= dateByteArray[1];
    byteArray[7]= dateByteArray[2];
    byteArray[8]= dateByteArray[3];
    return byteArray;
}
// let syncId = [140,130,14,46];
// returnTimeSync([140,130,14,46]);

function encodeDownlink(inputJson) {
    if (inputJson.switchOut1 !== undefined) {
        return {
            bytes: switchPayloadOut1(inputJson.switchOut1),
            fPort: 2,
            warnings: [],
            errors: []
        };
    }
    if (inputJson.requestMeterInfo !== undefined) {
        return {
            bytes: requestMeterInfo(),
            fPort: 2,
            warnings: [],
            errors: []
        };
    }
    if (inputJson.reboot !== undefined) {
        return {
            bytes: requestReboot(),
            fPort: 2,
            warnings: [],
            errors: []
        };
    }
    if (inputJson.returnTimeRequest !== undefined) {
        return {
            bytes: returnTimeSync(inputJson.timeSyncId),
            fPort: 2,
            warnings: [],
            errors: []
        };
    }
    return {
        bytes: inputJson.bytes,
        fPort: 2,
        warnings: [],
        errors: []
    };
}

function decodeDownlink(input) {
    return {
        data: {
            bytes: input.bytes
        },
        warnings: [],
        errors: []
    }
}

//
// 04 00 0100 0000 0000 0000
// 04 00 0000 0000 0000 0000
//
// 0A F271 A230 0100 0000 0100 0000 0100 0000

// request meter
// 04 02 00


// // set time 00 8c820e2e 096b2931


// ON / OFF
// curl --location --header 'Authorization: Bearer NNSXS.' --header 'Content-Type: application/json' --header 'User-Agent: CnpView $VERSION / $SERVER' --request POST --data '{"downlinks":[{
// "frm_payload":"BAABAAAAAAAAAA==",
//     "f_port":2,
//     "priority":"NORMAL"
// }]
// }' 'https://eu1.cloud.thethings.network/api/v3/as/applications/gerhardhof/webhooks/...../down/push'
//
//
// curl --location --header 'Authorization: Bearer NNSXS.' --header 'Content-Type: application/json' --header 'User-Agent: CnpView $VERSION / $SERVER' --request POST --data '{"downlinks":[{
// "frm_payload":"BAAAAAAAAQAAAA==",
//     "f_port":2,
//     "priority":"NORMAL"
// }]
// }' 'https://eu1.cloud.thethings.network/api/v3/as/applications/gerhardhof/webhooks/...../down/push'



encodeDownlink({"returnTimeRequest":1, "timeSyncId": [110,155,14,46]});
[0,110,155,14,46,10,110,41,49 ]