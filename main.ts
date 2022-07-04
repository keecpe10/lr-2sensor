LR2Sensor.InitStart()
LR2Sensor.SetValueSensors(SensorsNumber.L, 0, 0)
LR2Sensor.SetValueSensors(SensorsNumber.R, 0, 0)
LR2Sensor.ButtonWaite(LineRobotButton.A)
basic.showIcon(IconNames.Butterfly)
basic.forever(function () {
    LR2Sensor.FollowerLine(500, 0.09, 2.3)
})
