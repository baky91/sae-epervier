class_name MainUI extends Control

const QRCode = preload("res://addons/qr_code/qr_code.gd")
const PLAYER_CARD = preload("res://UI/player_card.tscn")

@onready var label_code: Label = $MarginContainer/VBoxContainer/HBoxContainer/LeftContainer/VBoxContainer/MarginContainer/PanelCode/VBoxContainer/LabelCode
@onready var label_url: Label = $MarginContainer/VBoxContainer/HBoxContainer/LeftContainer/VBoxContainer/MarginContainer3/PanelLien/VBoxContainer/LabelURL
@onready var label_counter_players: Label = $MarginContainer/VBoxContainer/HBoxContainer/MiddleContainer/VBoxContainer/MarginContainer/HBoxContainer/PanelContainer/LabelCounterPlayers
@onready var grid_players: GridContainer = $MarginContainer/VBoxContainer/HBoxContainer/MiddleContainer/VBoxContainer/MarginContainer2/ScrollContainer/GridPlayers
@onready var button_start: Button = $MarginContainer/VBoxContainer/HBoxContainer/MiddleContainer/VBoxContainer/MarginContainer3/ButtonStart
@export var _qr_rect: QRCodeRect
@onready var h_slider_round_duration: HSlider = $MarginContainer/VBoxContainer/HBoxContainer/RightContainer/VBoxContainer/MarginContainer2/VBoxContainer/HBoxContainer/HSliderRoundDuration
@onready var label_round_duration: Label = $MarginContainer/VBoxContainer/HBoxContainer/RightContainer/VBoxContainer/MarginContainer2/VBoxContainer/HBoxContainer/LabelRoundDuration
@onready var button_option_1: Button = $MarginContainer/VBoxContainer/HBoxContainer/RightContainer/VBoxContainer/MarginContainer3/VBoxContainer/HBoxContainer/ButtonOption1
@onready var button_option_2: Button = $MarginContainer/VBoxContainer/HBoxContainer/RightContainer/VBoxContainer/MarginContainer3/VBoxContainer/HBoxContainer/ButtonOption2
var style_button_left_off = preload("res://UI/styles/btn_left_off.tres")
var style_button_left_on = preload("res://UI/styles/btn_left_on.tres")
var style_button_right_off = preload("res://UI/styles/btn_right_off.tres")
var style_button_right_on = preload("res://UI/styles/btn_right_on.tres")
var empty_style = StyleBoxEmpty.new()
@onready var check_button_auto_nb_round: CheckButton = $MarginContainer/VBoxContainer/HBoxContainer/RightContainer/VBoxContainer/MarginContainer4/VBoxContainer/CheckButton
@onready var h_slider_nb_round: HSlider = $MarginContainer/VBoxContainer/HBoxContainer/RightContainer/VBoxContainer/MarginContainer4/VBoxContainer/HBoxContainer/HSliderNbRound
@onready var label_nb_round: Label = $MarginContainer/VBoxContainer/HBoxContainer/RightContainer/VBoxContainer/MarginContainer4/VBoxContainer/HBoxContainer/LabelNbRound
@onready var check_button_show_names: CheckButton = $MarginContainer/VBoxContainer/HBoxContainer/RightContainer/VBoxContainer/MarginContainer5/VBoxContainer/CheckButton

var hostCode: String
var counter_players = 0
var count_rounds:int

func _ready():
	ServerSocket.room_created.connect(_on_room_created)
	ServerSocket.player_connected.connect(_on_player_connected)
	ServerSocket.player_left.connect(_on_player_left)
	
	set_all_button_styles(button_option_1, style_button_left_on)
	set_all_button_styles(button_option_2, style_button_right_off)
	
	h_slider_nb_round.visible = false
	
	# Restauration dans le cas d'une relance
	if Globals.host_code != "":
		_on_room_created(Globals.host_code, Globals.join_url)
	
	if Globals.time_rounds > 0:
		h_slider_round_duration.value = Globals.time_rounds
	
	if Globals.count_rounds > 0:
		h_slider_nb_round.value = Globals.count_rounds
	
	update()

func _on_room_created(code: String, url_to_join: String):
	hostCode = code
	
	Globals.host_code = code
	Globals.join_url = url_to_join
	
	label_code.text = hostCode
	_qr_rect.data = url_to_join.to_upper()
	label_url.text = url_to_join
	
func _on_player_connected(id: int, p_name: String):
	var new_card = PLAYER_CARD.instantiate()
	new_card.name = str(id)
	new_card.set_text(id, p_name)
	new_card.remove_player_on_lobby.connect(_on_player_left)
	add_player_counter()
	grid_players.add_child(new_card)
	
	# Trier les cartes de joueurs par ID
	var new_index = 0
	for child in grid_players.get_children():
		if child != new_card and not child.is_queued_for_deletion() and child.name.is_valid_int():
			var child_id = child.name.to_int()
			if id > child_id:
				new_index += 1
	grid_players.move_child(new_card, new_index)
	
	update()
	
func _on_player_left(id: int):
	var player_line = grid_players.get_node(str(id))
	if player_line:
		player_line.queue_free()
		remove_player_counter()

func _on_button_start_pressed():
	Globals.time_rounds = int(h_slider_round_duration.value)
	Globals.count_rounds = int(h_slider_nb_round.value)

	var data_to_send = {
		"type": "GAME_START",
		"id": 0,
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
	
func _on_h_slider_round_duration_value_changed(value: float) -> void:
	label_round_duration.text = str(int(value)) + "s"

func set_all_button_styles(btn: Button, style):
	btn.add_theme_stylebox_override("normal", style)
	btn.add_theme_stylebox_override("hover", style)
	btn.add_theme_stylebox_override("pressed", style)
	btn.add_theme_stylebox_override("focus", style)

func _on_button_option_1_pressed() -> void:
	set_all_button_styles(button_option_1, style_button_left_on)
	set_all_button_styles(button_option_2, style_button_right_off)

func _on_button_option_2_pressed() -> void:
	set_all_button_styles(button_option_1, style_button_left_off)
	set_all_button_styles(button_option_2, style_button_right_on)


func _on_check_button_toggled(toggled_on: bool) -> void:
	h_slider_nb_round.visible = !toggled_on

	if toggled_on:
		update()

func _on_h_slider_nb_round_value_changed(value: float) -> void:
	label_nb_round.text = str(int(value))

func calculate_auto_rounds(player_count: int) -> int:
	if player_count <= 1:
		return 3
	
	var rounds = ceil(log(player_count) / log(2)) + 2
	
	return clamp(int(rounds), 3, 12)

func update():
	count_rounds = calculate_auto_rounds(counter_players)
	# Affichage du nombre de manches
	label_nb_round.text = str(count_rounds)
	h_slider_nb_round.value = count_rounds
	
	# Affichage de la durée maximale de chaque manche
	label_round_duration.text = str(int(h_slider_round_duration.value)) + "s"

func _on_check_button_show_names_toggled(toggled_on: bool) -> void:
	Globals.show_names = toggled_on
