LR2Sensor.InitStart()
LR2Sensor.ButtonWaite(LineRobotButton.A)
basic.showIcon(IconNames.Tortoise)
LR2Sensor.SaveValueSensors()
LR2Sensor.ButtonWaite(LineRobotButton.B)
basic.showIcon(IconNames.Butterfly)
basic.forever(function () {
    LR2Sensor.FollowerLine(500, 0.09, 2.3)
})
