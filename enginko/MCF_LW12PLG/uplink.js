// see documentation https://www.enginko.com/support/doku.php?id=data_frame_format#note1


/* example "110000" "11011001" "1001000" "11110101" */

/* example "11000" "0110" "11001" "10010" "00111" "10101" */
function parseDate(dateBytes) {
    let d = {
        dateBytes: dateBytes.reverse(),
        tst: dateBytes[0] & 0,
        year: 2000 + (dateBytes[0] >> 1),  //7bit in first byt so shift)
        month: (!!(dateBytes[0] & (1 << 0)) << 3) + (dateBytes[1] >> 5),
        dom: dateBytes[1] - ((dateBytes[1] >> 5) << 5),
        hour: dateBytes[2] >> 2,
        min: dateBytes[2] - ((dateBytes[2] >> 2) << 2) + (dateBytes[3] >> 5),
        sec: dateBytes[3] - ((dateBytes[3] >> 5) << 5)
    };
    return (new Date(d.year, d.month - 1, d.dom, d.hour, d.min, d.sec)).toISOString();
}

function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}


function decodeMeter(bytes) {
// * date             -> date of measurement. See @parseDate
// * activeEnergy     -> cumulative active energy in Wh
//     * reactiveEnergy   -> cumulative reactive energy in VARh
//     * apparentEnergy   -> cumulative apparent energy in VAh
//     * activePower      -> active power in W
//     * reactivePower    -> reactive power in VAR
//     * apparentPower    -> apparent power in VA
//     * voltage          -> voltage in dV RMS
//     * current          -> current in mA RMS
//     * period           -> period in micro seconds
//     * fequency           -> period in Hz => 1/period
//     * activation       -> running time in seconds
    if (bytes.length === 20) {
        return {
            isMeter: 1,
            date: parseDate([...bytes].slice(0, 4)),
            activeEnergy: [...bytes].slice(4, 8).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            reactiveEnergy: [...bytes].slice(8, 12).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            apparentEnergy: [...bytes].slice(12, 16).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            runningTime: [...bytes].slice(16, 20).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
        }
    } else {
        return {
            isMeter: 1,
            moreInfo: 1,
            date: parseDate([...bytes].slice(0, 4)),
            activeEnergy: [...bytes].slice(4, 8).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            reactiveEnergy: [...bytes].slice(8, 12).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            apparentEnergy: [...bytes].slice(12, 16).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),

            activePower: [...bytes].slice(16, 18).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            reactivePower: [...bytes].slice(18, 20).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            apparentPower: [...bytes].slice(20, 22).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            voltage: [...bytes].slice(22, 24).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            current: [...bytes].slice(24, 26).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            period: [...bytes].slice(26, 28).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
            runningTime: [...bytes].slice(28, 32).reduce(function (carry, val, idx) {
                return carry + Math.pow(2, idx * 8) * val
            }, 0),
        }
    }
}

function decodeIO(bytes) {
    // Uplink ID	1 byte	0A	Input/output
    // Date/Time	4 byte	XX XX XX XX	Date and time (as for Note1)
    // Inputs	4 byte (u32 LSB)	XX XX XX XX	Bit mask of the inputs
    // Outputs	4 byte (u32 LSB)	XX XX XX XX	Bit mask of the outputs
    // Events	4 byte (u32 LSB)	XX XX XX XX	Bit mask of input events

    return {
        isIO: 1,
        date: parseDate([...bytes].slice(0, 4)),
        inputs_bin: dec2bin([...bytes].slice(4, 8).reduce(function (carry, val, idx) {
            return carry + Math.pow(2, idx * 8) * val
        }, 0)).padStart(32,'0'),
        outputs_bin: dec2bin([...bytes].slice(8, 12).reduce(function (carry, val, idx) {
            return carry + Math.pow(2, idx * 8) * val
        }, 0)).padStart(32,'0'),
        events: [...bytes].slice(12, 16).reduce(function (carry, val, idx) {
            return carry + Math.pow(2, idx * 8) * val
        }, 0),
    }
}

function decodeTimeSync(bytes) {
    return {
        isTimeSync: 1
    }
}

function decodeUplink(input) {
    let data;
    switch (input.bytes[0]) {
        case 1:
            // [1,9,151,207,45,0,2,56,7,2,0]  010997cf2d000238070200
            data = decodeTimeSync(input.bytes.slice(1))
            break;
        case 9:
            //EXAMPLE 091D5DD930000000000000000000000000A8F24900
            data = decodeMeter(input.bytes.slice(1))
            break;
        case 10:
            //EXAMPLE 0AF271A230010000000100000001000000
            data = decodeIO(input.bytes.slice(1))
            break;
        default:
            data = {bytes: input.bytes};
    }

    return {
        data: data,
        warnings: [],
        errors: []
    };
}
