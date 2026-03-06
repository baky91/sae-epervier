class_name MainUI extends Control

const QRCode = preload("res://addons/qr_code/qr_code.gd")
const PLAYER_CARD = preload("res://UI/player_card.tscn")

@onready var label_code: Label = $MarginContainer/HBoxContainer/LeftContainer/VBoxContainer/MarginContainer/PanelCode/VBoxContainer/LabelCode
@onready var label_url: Label = $MarginContainer/HBoxContainer/LeftContainer/VBoxContainer/MarginContainer3/PanelLien/VBoxContainer/LabelURL
@onready var label_counter_players: Label = $MarginContainer/HBoxContainer/MiddleContainer/VBoxContainer/MarginContainer/HBoxContainer/PanelContainer/LabelCounterPlayers
@onready var grid_players: GridContainer = $MarginContainer/HBoxContainer/MiddleContainer/VBoxContainer/MarginContainer2/ScrollContainer/GridPlayers
@onready var button_start: Button = $MarginContainer/HBoxContainer/MiddleContainer/VBoxContainer/MarginContainer3/ButtonStart

@export var _qr_rect: QRCodeRect
var hostCode: String
var counter_players = 0

func _ready():
	ServerSocket.room_created.connect(_on_room_created)
	ServerSocket.player_connected.connect(_on_player_connected)
	ServerSocket.player_left.connect(_on_player_left)
	button_start.pressed.connect(_button_start_pressed)
	
	_qr_rect.data = "localhost:3000"
	
	#for i in range(1, 101):
		#var new_card = PLAYER_CARD.instantiate()
		#new_card.name = "Player" + str(i)
		#new_card.set_text(str(i), "Joueur" + str(i))
		#add_player_counter()
		#
		#grid_players.add_child(new_card)

func _on_room_created(code: String, url_to_join: String):
	hostCode = code
	label_code.text = hostCode
	label_url.text += hostCode
	print(url_to_join)
	
func _on_player_connected(id: int, p_name: String):
	var new_card = PLAYER_CARD.instantiate()
	new_card.name = str(id)
	new_card.set_text(id, p_name)
	add_player_counter()
	grid_players.add_child(new_card)
	
func _on_player_left(id: int):
	var player_line = grid_players.get_node(str(id))
	player_line.queue_free()
	remove_player_counter()

func _button_start_pressed():
	var data_to_send = {
		"type": "game_start",
		"data": {
			"message": "Game " + hostCode +" has started."
		}
	}
	ServerSocket.send_message_to_server(data_to_send)
	
	get_tree().change_scene_to_file("res://World/arena.tscn")

func add_player_counter():
	counter_players += 1
	label_counter_players.text = str(counter_players)
	
func remove_player_counter():
	counter_players -= 1
	label_counter_players.text = str(counter_players)
	
