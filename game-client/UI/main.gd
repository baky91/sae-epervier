extends Control

const QRCode = preload("res://addons/qr_code/qr_code.gd")

@export var _qr_rect: QRCodeRect

func _ready():
	_qr_rect.data = "localhost:3000"
