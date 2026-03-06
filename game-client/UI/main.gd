extends Control

const QRCode = preload("res://addons/qr_code/qr_code.gd")
const PLAYER_CARD = preload("res://UI/player_card.tscn")

@onready var label_counter_players: Label = $MarginContainer/HBoxContainer/MiddleContainer/VBoxContainer/MarginContainer/HBoxContainer/PanelContainer/LabelCounterPlayers
@onready var grid_players: GridContainer = $MarginContainer/HBoxContainer/MiddleContainer/VBoxContainer/MarginContainer2/ScrollContainer/GridPlayers

@export var _qr_rect: QRCodeRect
var counter_players = 0

func _ready():
	_qr_rect.data = "localhost:3000"
	
	for i in range(1, 101):
		var new_card = PLAYER_CARD.instantiate()
		new_card.name = "Player" + str(i)
		new_card.set_text(str(i), "Joueur" + str(i))
		add_player_counter()
		
		grid_players.add_child(new_card)

func add_player_counter():
	counter_players += 1
	label_counter_players.text = str(counter_players)
	
func remove_player_counter():
	counter_players -= 1
	label_counter_players.text = str(counter_players)
