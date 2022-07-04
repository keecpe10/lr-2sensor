
/**
  * Enumeration of ReadADC.
  */
enum LineRobotReadADC {
    //% block="ADC 0"
    ADC0 = 132,
    //% block="ADC 1"
    ADC1 = 196,
    //% block="ADC 2"
    ADC2 = 148,
    //% block="ADC 3"
    ADC3 = 212,
    //% block="ADC 4"
    ADC4 = 164,
    //% block="ADC 5"
    ADC5 = 228,
    //% block="ADC 6"
    ADC6 = 180,
    //% block="ADC 7"
    ADC7 = 244
}

enum LineRobotButton {
    //% block="A"
    A,
    //% block="B"
    B
}

enum LineRobotTurnDirec {
    //% block="ซ้าย"
    Left,
    //% block="ขวา"
    Right
}



/**
 * Custom blocks /f23c monster /f2d6 นักบินอวกาศ /f2dd
 */
//% weight=100 color=#2FE7F0 icon="\uf0fb"
namespace LR2Sensor {

    let sensorsRead: number[] = []
    let valSensorsMin: number[] = []
    let valSensorsMax: number[] = []
    let Sensors: LineRobotReadADC[] = [LineRobotReadADC.ADC0, LineRobotReadADC.ADC1, LineRobotReadADC.ADC2, LineRobotReadADC.ADC3, LineRobotReadADC.ADC4, LineRobotReadADC.ADC5, LineRobotReadADC.ADC6, LineRobotReadADC.ADC7]
    let numSensors = 2
    let error = 0
    let lastError = 0
    let last_positionValue = 0
    let state = false
    let last_state = false

    let speedTurn = 800;

    /**ตั้งค่าเริ่มต้นการใช้งาน 
        */
    //% blockId="LineRobot_ตั้งค่าเริ่มต้น" block="ตั้งค่าเริ่มต้น"
    //% weight=100
    export function InitStart(): void {
        for (let n = 0; n < numSensors; n++) {
            valSensorsMin[n] = 4095
            valSensorsMax[n] = 0
        }
    }

    
    /**ReadADC for read analog sensor, Select ADC channel 0-7. 
      *
      */
    //% blockId="LineRobot_readADC" block="Read %LineRobotReadADC"
    //% weight=60
    function ReadADC(ReadADC: LineRobotReadADC): number {
        let ADCValue: number;

        pins.i2cWriteNumber(
            72,
            ReadADC,
            NumberFormat.UInt8LE,
            false
        )
        return ReadADC = pins.i2cReadNumber(72, NumberFormat.UInt16BE, false)
    }

    /** ความเร็วมอเตอร์ มอเตอร์1,มอเตอร์2   
      * @param left_speed percent of maximum left_speed, eg: 0
      * @param right_speed percent of maximum right_speed, eg: 0
      */
    //% blockId="LineRobot_set_motors" block="set_motors | left_speed %left_speed | right_speed %right_speed"
    //% Speed.min=0 Speed.max=800
    //% weight=50
    export function set_motors(left_speed: number, right_speed: number): void {
        //left_speed = Math.map(left_speed, 0, 1000, 0, 620)
        //right_speed = Math.map(right_speed, 0, 1000, 0, 620)
        //Forward
        if (right_speed >= 0 && left_speed >= 0) {
            pins.digitalWritePin(DigitalPin.P13, 1)
            pins.analogWritePin(AnalogPin.P14, left_speed)
            pins.digitalWritePin(DigitalPin.P15, 0)
            pins.analogWritePin(AnalogPin.P16, right_speed)
        }
        if (right_speed >= 0 && left_speed < 0) {
            left_speed = -left_speed
            pins.digitalWritePin(DigitalPin.P13, 0)
            pins.analogWritePin(AnalogPin.P14, left_speed)
            pins.digitalWritePin(DigitalPin.P15, 0)
            pins.analogWritePin(AnalogPin.P16, right_speed)
        }
        if (right_speed < 0 && left_speed >= 0) {
            right_speed = -right_speed
            pins.digitalWritePin(DigitalPin.P13, 1)
            pins.analogWritePin(AnalogPin.P14, left_speed)
            pins.digitalWritePin(DigitalPin.P15, 1)
            pins.analogWritePin(AnalogPin.P16, right_speed)
        }
    }

    function readSensors() {
        for (let z = 0; z < numSensors; z++) {
            sensorsRead[z] = ReadADC(Sensors[z])
        }
    }

    //% blockId="LineRobot_caribrateSensors" block="caribrateSensors"
    //% weight=90
    function caribrateSensors(): void {
        readSensors()
        for (let x = 0; x < numSensors; x++) {
            if (sensorsRead[x] < valSensorsMin[x]) {
                valSensorsMin[x] = sensorsRead[x]
            }
            if (sensorsRead[x] > valSensorsMax[x]) {
                valSensorsMax[x] = sensorsRead[x]
            }
        }
    }

    function readCalibrated() {
        readSensors()
        for (let y = 0; y < numSensors; y++) {
            let calmin = 0
            let calmax = 0
            let denominator = 0
            calmax = valSensorsMax[y]
            calmin = valSensorsMin[y]
            denominator = calmax - calmin
            let calVal = 0
            if (denominator != 0) {
                calVal = (sensorsRead[y] - calmin) * 1000 / denominator
            }
            if (calVal < 0) {
                calVal = 0
            } else if (calVal > 1000) {
                calVal = 1000
            }
            sensorsRead[y] = calVal
        }
    }

    //% blockId="LineRobot_readLine" block="readLine"
    //% weight=80
    function readLine(): number {
        let on_line = 0
        let last_value = 0
        let avg = 0
        let sum = 0
        readCalibrated()
        avg = 0
        sum = 0
        for (let k = 0; k < numSensors; k++) {
            let valReadLine = sensorsRead[k]
            if (valReadLine > 200) {
                on_line = 1
            }
            if (valReadLine > 50) {
                avg = avg + valReadLine * (k * 1000)
                sum = sum + valReadLine
            }
        }

        if (on_line == 0) {
            if (last_value < (numSensors - 1) * 1000 / 2) {
                return 0
            } else {
                return (numSensors - 1) * 1000
            }
        }
        last_value = avg / sum
        return last_value
    }

    //% blockId="LineRobot_computePID" block="computePID | line %line  | kp %kp | kd %kd"
    //% weight=100
    function computePID(line: number, kp: number, kd: number): number {
        let power_diff = 0
        error = line - (numSensors - 1) * 1000 / 2
        power_diff = kp * error + kd * (error - lastError)

        lastError = error
        return power_diff
    }

    function track_line(track_speed: number, track_kp: number, track_kd: number) {
        let power_difference = 0
        let positionValue = readLine()
        if (positionValue != 0) {
            last_positionValue = positionValue
        }
        if (positionValue == 0 && last_positionValue < (numSensors - 1) * 1000 / 2) {
            set_motors(speedTurn, 0)
            return
        }
        if (positionValue == 0 && last_positionValue > (numSensors - 1) * 1000 / 2) {
            set_motors(0, speedTurn)
            return
        }
        power_difference = computePID(positionValue, track_kp, track_kd)
        if (power_difference > track_speed) {
            power_difference = track_speed
        }
        if (power_difference < 0 - track_speed) {
            power_difference = 0 - track_speed
        }
        if (power_difference < 0) {
            set_motors(track_speed, track_speed + power_difference)
        } else {
            set_motors(track_speed - power_difference, track_speed)
        }
    }

    /** รอการกดปุ่ม  
              */
    //% blockId="LineRobot_รอการกดปุ่ม" block="รอการกดปุ่ม | %button"
    //% weight=75
    export function ButtonWaite(button: LineRobotButton): void {
        if (button == LineRobotButton.A) {
            while (!(input.buttonIsPressed(Button.A))) {
                basic.showArrow(ArrowNames.West)
            }
        }
        if (button == LineRobotButton.B) {
            while (!(input.buttonIsPressed(Button.B))) {
                basic.showArrow(ArrowNames.East)
            }
        }
    }

    //% blockId="LineRobot_เปรียบเทียบค่าเซ็นเซอร์" block="บันทึกค่าเซ็นเซอร์"
    //% weight=99
    export function SaveValueSensors(): void {
        for (let i = 0; i < 150; i++) {
            caribrateSensors()
            basic.pause(25)
        }

        basic.pause(100)
    }

    /**วิ่งตามเส้นตลอด
  * @param speed percent of maximum speed, eg: 800
  */
    //% help=math/map weight=10 blockGap=8
    //% blockId=LineRobot_วิ่งตามเส้นตลอด block="วิ่งตามเส้นตลอด ด้วยความเร็ว %speed|KP %kp|KD %kd"
    //% speed.min=0 speed.max=800
    //% inlineInputMode=inline
    export function FollowerLine(speed: number, kp: number, kd: number): void {
        while (true) {
            track_line(speed, kp, kd)
        }
    }

    /**วิ่งตามเส้นตามเวลาที่กำหนด 
      * @param speed percent of maximum speed, eg: 800
      */
    //% help=math/map weight=10 blockGap=8
    //% blockId=LineRobot_วิ่งตามเส้น block="วิ่งตามเส้น ด้วยความเร็ว %speed| จับเวลา %time|(ms) KP %kp|KD %kd"
    //% speed.min=0 speed.max=800
    //% inlineInputMode=inline
    export function FollowerLineTimes(speed: number, time: number, kp: number, kd: number): void {
        let previousMillis = input.runningTime()
        while (input.runningTime() - previousMillis < time) {
            track_line(speed, kp, kd)
        }
    }

    /** หยุดมอเตอร์ มอเตอร์1,มอเตอร์2   
          */
    //% blockId="LineRobot_หยุดมอเตอร์" block="หยุดมอเตอร์"
    //% weight=50
    export function StopAll(): void {
        while (true) {
            pins.digitalWritePin(DigitalPin.P13, 1)
            pins.analogWritePin(AnalogPin.P14, 0)
            pins.digitalWritePin(DigitalPin.P15, 1)
            pins.analogWritePin(AnalogPin.P16, 0)
        }
    }

}
